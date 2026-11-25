"use strict";
/* AGORA · Supabase accounts and cloud wardrobe (off in the frontend phase) */
/* ---------- Supabase accounts and cloud wardrobe ---------- */
const CLOUD_BUCKET="agora-clothes";
function dataUrlBlob(dataUrl){
    const parts=dataUrl.split(","),mime=(parts[0].match(/data:(.*?);base64/)||[])[1]||"image/jpeg";
    const raw=atob(parts[1]),bytes=new Uint8Array(raw.length);
    for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
    return new Blob([bytes],{type:mime});
}
async function uploadCloudPhoto(dataUrl,path){
    const blob=dataUrlBlob(dataUrl);
    const {error}=await sb.storage.from(CLOUD_BUCKET).upload(path,blob,{upsert:true,contentType:blob.type||"image/jpeg"});
    if(error)throw error;
    return path;
}
async function signedPhoto(path){
    if(!path)return null;
    const {data,error}=await sb.storage.from(CLOUD_BUCKET).createSignedUrl(path,604800);
    if(error)throw error;
    return data.signedUrl;
}
async function cloudSave(user){
    const uid=user._cloudUid;

    let modelImagePath=user._cloudModelImagePath||null;
    if(user.modelImage&&user.modelImage.startsWith("data:")){
        modelImagePath=`${uid}/model/model-reference`;
        await uploadCloudPhoto(user.modelImage,modelImagePath);
        user._cloudModelImagePath=modelImagePath;
    }

    const profileData={
        schedule:user.schedule||{},
        history:user.history||[],
        prefs:user.prefs||{},
        feedback:user.feedback||[],
        modelImagePath,
        tryOnResults:(user.tryOnResults||[]).map(r=>({id:r.id,path:r.path,createdAt:r.createdAt,garments:r.garments||[]}))
    };

    const {error:profileError}=await sb.from("profiles").upsert({
        id:uid,
        username:user.username,
        gender:user.gender||"female",
        height_cm:user.height_cm??null,
        weight_kg:user.weight_kg??null,
        city:user.city||"ansan",
        user_data:profileData
    },{onConflict:"id"});

    if(profileError)throw profileError;

    const rows=[];

    for(const it of (user.items||[]).filter(x=>!x.sample&&x.img)){
        const version=it.pv||0;

        let imagePath=it._cloudImagePath||null;
        let cutPath=it.cut?(it._cloudCutoutPath||null):null;

        if(it.img.startsWith("data:")){
            imagePath=`${uid}/${it.id}/${version}-main.jpg`;
            await uploadCloudPhoto(it.img,imagePath);
        }

        if(it.cut&&it.cut.startsWith("data:")){
            cutPath=`${uid}/${it.id}/${version}-cut.png`;
            await uploadCloudPhoto(it.cut,cutPath);
        }

        if(!imagePath){
            throw new Error(`Photo for ${it.name} is not ready for cloud storage.`);
        }

        it._cloudImagePath=imagePath;
        it._cloudCutoutPath=cutPath;

        const itemData={...it};

        delete itemData.img;
        delete itemData.cut;
        delete itemData._cloudImagePath;
        delete itemData._cloudCutoutPath;
        delete itemData.blob;

        rows.push({
            user_id:uid,
            local_id:String(it.id),
            name:it.name,
            type:it.type,
            color:it.color||null,
            pattern:it.pattern||null,
            tags:it.tags||[],
            image_path:imagePath,
            cutout_path:cutPath,
            keep_bg:!!it.keepBg,
            item_data:itemData
        });
    }

    const {data:existing,error:readError}=await sb
        .from("wardrobe_items")
        .select("id,local_id,image_path,cutout_path")
        .eq("user_id",uid);

    if(readError)throw readError;

    const keep=new Set(rows.map(r=>r.local_id));
    const stale=(existing||[]).filter(r=>!keep.has(r.local_id));

    if(stale.length){
        const paths=stale.flatMap(r=>[
            r.image_path,
            r.cutout_path
        ].filter(Boolean));

        if(paths.length){
            const {error}=await sb.storage
                .from(CLOUD_BUCKET)
                .remove(paths);

            if(error)console.warn("Could not remove old photo files",error);
        }

        const {error}=await sb
            .from("wardrobe_items")
            .delete()
            .in("id",stale.map(r=>r.id));

        if(error)throw error;
    }

    if(rows.length){
        const {error}=await sb
            .from("wardrobe_items")
            .upsert(rows,{onConflict:"user_id,local_id"});

        if(error)throw error;
    }
}
async function activateCloudUser(authUser){

    const {data:profile,error:profileError}=await sb
        .from("profiles")
        .select("*")
        .eq("id",authUser.id)
        .maybeSingle();

    if(profileError)throw profileError;

    const meta=authUser.user_metadata||{};

    const username=
        (profile&&profile.username)||
        meta.username||
        (authUser.email||"AGORA user").split("@")[0];

    if(!profile){

        const {error}=await sb.from("profiles").upsert({
            id:authUser.id,
            username,
            gender:meta.gender||"female",
            height_cm:meta.height_cm?Number(meta.height_cm):null,
            weight_kg:meta.weight_kg?Number(meta.weight_kg):null,
            city:"ansan",
            user_data:{}
        },{onConflict:"id"});

        if(error)throw error;
    }

    const {data:records,error:wardrobeError}=await sb
        .from("wardrobe_items")
        .select("*")
        .eq("user_id",authUser.id)
        .order("created_at");

    if(wardrobeError)throw wardrobeError;

    const items=[];

    for(const row of (records||[])){

        const it={
            ...(row.item_data||{}),
            id:row.local_id||row.id,
            name:row.name,
            type:row.type,
            color:row.color||"#c9c1b6",
            pattern:row.pattern||"solid",
            tags:row.tags||[],
            keepBg:!!row.keep_bg,
            _cloudImagePath:row.image_path,
            _cloudCutoutPath:row.cutout_path
        };

        it.img=await signedPhoto(row.image_path);
        it.cut=row.cutout_path
            ?await signedPhoto(row.cutout_path)
            :null;

        items.push(it);
    }

    // Restore an existing browser-only wardrobe if it belongs
    // to this same display-name account.
    let importedLegacy=0;

    const legacy=await DB.get(username);

    if(
        legacy &&
        String(legacy.username||"").toLowerCase()===
        String(username).toLowerCase() &&
        (!legacy._cloudUid||legacy._cloudUid===authUser.id)
    ){

        const seenIds=new Set(items.map(x=>String(x.id)));

        for(const old of (legacy.items||[])){

            if(
                !old.img ||
                old.sample&&!old.img ||
                seenIds.has(String(old.id))
            )continue;

            items.push({...old,sample:false});
            seenIds.add(String(old.id));
            importedLegacy++;
        }
    }

    const data=(profile&&profile.user_data)||{};
    const modelImage=data.modelImagePath?await signedPhoto(data.modelImagePath):null;
    const tryOnResults=await Promise.all((data.tryOnResults||[]).map(async r=>{
        try{return {...r,url:await signedPhoto(r.path)}}catch(err){console.warn('Could not restore saved AI try-on image',err);return {...r,url:null}}
    }));

    const user={
        username,
        email:authUser.email||"",

        gender:
            (profile&&profile.gender)||
            meta.gender||
            "female",

        height_cm:
            profile?.height_cm ??
            (meta.height_cm?Number(meta.height_cm):null),

        weight_kg:
            profile?.weight_kg ??
            (meta.weight_kg?Number(meta.weight_kg):null),

        city:(profile&&profile.city)||"ansan",

        items,

        schedule:data.schedule||legacy?.schedule||{},
        history:data.history||legacy?.history||[],
        prefs:data.prefs||legacy?.prefs||{},
        feedback:data.feedback||legacy?.feedback||[],
        modelImage,
        tryOnResults,
        _cloudModelImagePath:data.modelImagePath||null,

        created:authUser.created_at
            ?new Date(authUser.created_at).getTime()
            :Date.now(),

        _cloudUid:authUser.id
    };

    S.user=user;
    S.seen.clear();
    S.occ=null;
    S.openSwap=null;
    S.decisionStart=Date.now();

    await DB.put(user);

    if(importedLegacy){
        try{
            await cloudSave(user);

            toast(
                `Restored ${importedLegacy} saved clothing item${importedLegacy===1?"":"s"} from this browser to your account.`
            );

        }catch(err){

            console.warn("Legacy wardrobe import needs retry",err);

            toast(
                `Restored ${importedLegacy} local clothing item${importedLegacy===1?"":"s"}; cloud upload will retry when you save.`
            );
        }
    }

    try{
        LS.set("agora.last",authUser.id);
    }catch(e){}

    $("#overlay").innerHTML="";

    render();

    migrateCutouts();
}
function authMessage(message,isError=false){const el=$("#auth-status");if(el){el.textContent=message;el.classList.toggle("error",!!isError)}}
async function authBusy(fn){
    const buttons=$$("#auth-actions button");buttons.forEach(b=>b.disabled=true);
    try{await fn()}catch(err){console.error(err);authMessage(err.message||"Something went wrong. Please try again.",true)}
    finally{buttons.forEach(b=>b.disabled=false)}
}
async function openLogin(){
    if(!sb){openLocalProfile();return}

    const ov=$("#overlay");

    // ACCOUNT PROFILE EDITOR
    if(S.user){

        ov.innerHTML=`
    <div class="scrim" id="auth-scrim">

        <div class="sheet auth-sheet">

            <div>
                <div class="eyebrow">Your AGORA account</div>

                <h2>${esc(S.user.username)}</h2>

                <p style="margin:4px 0;color:var(--muted)">
                    ${esc(S.user.email||"")}
                </p>
            </div>

            <p style="margin:0">
                Update your personal model profile.
            </p>

            <label class="field">
                Display name
                <input
                    id="profile-name"
                    maxlength="24"
                    value="${esc(S.user.username)}"
                >
            </label>

            <label class="field">
                Model preference

                <select id="profile-gender">
                    <option value="female" ${S.user.gender==="female"?"selected":""}>
                        Female
                    </option>

                    <option value="male" ${S.user.gender==="male"?"selected":""}>
                        Male
                    </option>
                </select>
            </label>

            <div class="row2">

                <label class="field">
                    Height (cm)

                    <input
                        id="profile-height"
                        type="number"
                        min="100"
                        max="230"
                        step="0.1"
                        value="${S.user.height_cm??""}"
                        placeholder="e.g. 165"
                        required
                    >
                </label>

                <label class="field">
                    Weight (kg)

                    <input
                        id="profile-weight"
                        type="number"
                        min="25"
                        max="300"
                        step="0.1"
                        value="${S.user.weight_kg??""}"
                        placeholder="e.g. 60"
                        required
                    >
                </label>

            </div>

            <div class="auth-actions" id="auth-actions">

                <button
                    class="btn terra"
                    id="auth-save-profile"
                    type="button"
                >
                    Save profile
                </button>

                <button
                    class="btn ghost"
                    id="auth-logout"
                    type="button"
                >
                    Log out
                </button>

            </div>

            <button
                class="btn ghost"
                id="auth-close"
                type="button"
            >
                Back
            </button>

            <p class="auth-status" id="auth-status"></p>

        </div>
    </div>`;

        $("#auth-close").onclick=()=>{
            ov.innerHTML="";
        };

        $("#auth-scrim").onclick=e=>{
            if(e.target.id==="auth-scrim"){
                ov.innerHTML="";
            }
        };

        $("#auth-save-profile").onclick=()=>authBusy(async()=>{

            const username=$("#profile-name").value.trim();
            const gender=$("#profile-gender").value;

            const height=Number($("#profile-height").value);
            const weight=Number($("#profile-weight").value);

            if(!username){
                authMessage("Please enter your display name.",true);
                return;
            }

            if(
                !Number.isFinite(height)||
                height<100||
                height>230
            ){
                authMessage("Please enter a valid height between 100 and 230 cm.",true);
                return;
            }

            if(
                !Number.isFinite(weight)||
                weight<25||
                weight>300
            ){
                authMessage("Please enter a valid weight between 25 and 300 kg.",true);
                return;
            }

            S.user.username=username;
            S.user.gender=gender;
            S.user.height_cm=height;
            S.user.weight_kg=weight;

            const profileData={
                schedule:S.user.schedule||{},
                history:S.user.history||[],
                prefs:S.user.prefs||{},
                feedback:S.user.feedback||[],
                modelImagePath:S.user._cloudModelImagePath||null
            };

            const {error}=await sb.from("profiles").upsert({

                id:S.user._cloudUid,
                username:S.user.username,
                gender:S.user.gender,
                height_cm:S.user.height_cm,
                weight_kg:S.user.weight_kg,
                city:S.user.city||"ansan",
                user_data:profileData

            },{onConflict:"id"});

            if(error)throw error;

            await DB.put(S.user);

            ov.innerHTML="";

            render();

            toast("Your profile has been saved.");

        });

        $("#auth-logout").onclick=()=>authBusy(async()=>{

            const {error}=await sb.auth.signOut();

            if(error)throw error;

            S.user=null;

            ov.innerHTML="";

            await openLogin();

        });

        return;
    }

    // LOGIN AND REGISTRATION
    ov.innerHTML=`

<div class="scrim" id="auth-scrim">

    <form class="sheet auth-sheet" id="auth-form">

        <div>
            <div class="eyebrow">AGORA · personal wardrobe</div>

            <h2>Welcome to AGORA</h2>

            <p style="margin:4px 0;color:var(--muted)">
                Create an account or log in to access your own wardrobe on different devices.
            </p>
        </div>

        <label class="field">
            Email address

            <input
                id="auth-email"
                type="email"
                autocomplete="email"
                placeholder="you@example.com"
                required
            >
        </label>

        <label class="field">
            Password

            <input
                id="auth-password"
                type="password"
                autocomplete="current-password"
                minlength="6"
                placeholder="At least 6 characters"
                required
            >
        </label>

        <div id="auth-new-fields" style="display:grid;gap:10px">

            <label class="field">
                Display name

                <input
                    id="auth-name"
                    maxlength="24"
                    placeholder="Your name"
                >
            </label>

            <label class="field">
                Model preference

                <select id="auth-gender">
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                </select>
            </label>

            <div class="row2">

                <label class="field">
                    Height (cm)

                    <input
                        id="auth-height"
                        type="number"
                        min="100"
                        max="230"
                        step="0.1"
                        placeholder="e.g. 165"
                    >
                </label>

                <label class="field">
                    Weight (kg)

                    <input
                        id="auth-weight"
                        type="number"
                        min="25"
                        max="300"
                        step="0.1"
                        placeholder="e.g. 60"
                    >
                </label>

            </div>

        </div>

        <div class="auth-actions" id="auth-actions">

            <button
                class="btn terra"
                id="auth-register"
                type="button"
            >
                Create account
            </button>

            <button
                class="btn ghost"
                id="auth-login"
                type="button"
            >
                Log in
            </button>

        </div>

        <p class="auth-status" id="auth-status">
            Your clothing photos are stored privately.
        </p>

        <p style="margin:0;font-size:12px;color:var(--muted)">
            Your password is handled by Supabase Authentication.
            AGORA never stores your password in its wardrobe database.
        </p>

    </form>
</div>`;

    $("#auth-scrim").onclick=e=>{
        if(e.target.id==="auth-scrim"){
            e.preventDefault();
        }
    };

    $("#auth-form").onsubmit=e=>e.preventDefault();

    // CREATE ACCOUNT
    $("#auth-register").onclick=()=>authBusy(async()=>{

        const email=$("#auth-email").value.trim();
        const password=$("#auth-password").value;

        const name=
            $("#auth-name").value.trim()||
            email.split("@")[0];

        const gender=$("#auth-gender").value;

        const height=Number($("#auth-height").value);
        const weight=Number($("#auth-weight").value);

        if(password.length<6){
            authMessage("Please use a password with at least 6 characters.",true);
            return;
        }

        if(
            !Number.isFinite(height)||
            height<100||
            height>230
        ){
            authMessage("Please enter a valid height between 100 and 230 cm.",true);
            return;
        }

        if(
            !Number.isFinite(weight)||
            weight<25||
            weight>300
        ){
            authMessage("Please enter a valid weight between 25 and 300 kg.",true);
            return;
        }

        const {data,error}=await sb.auth.signUp({

            email,
            password,

            options:{
                data:{
                    username:name,
                    gender,
                    height_cm:height,
                    weight_kg:weight
                }
            }

        });

        if(error)throw error;

        if(data.session&&data.user){

            await activateCloudUser(data.user);

        }else{

            authMessage(
                "Account created. Check your email and confirm your address, then log in here."
            );

        }

    });

    // LOG IN
    $("#auth-login").onclick=()=>authBusy(async()=>{

        const email=$("#auth-email").value.trim();
        const password=$("#auth-password").value;

        const {data,error}=await sb.auth.signInWithPassword({
            email,
            password
        });

        if(error)throw error;

        await activateCloudUser(data.user);

    });

}
$("#userchip").onclick=openLogin;
