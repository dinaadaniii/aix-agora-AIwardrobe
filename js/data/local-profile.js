"use strict";
/* ---------- local profile: frontend phase, no login, data stays in this browser ---------- */
const LOCAL_KEY="agora.localUser";
const BACKUP_FORMAT={app:"agora",version:1};

async function startLocal(){
    let u=null;
    const last=LS.get(LOCAL_KEY);
    if(last)u=await DB.get(last);
    if(!u){const all=await DB.all();u=all.find(x=>x&&!x._cloudUid)||null}
    if(u)activateLocalUser(u);else openLocalWelcome();
}

function activateLocalUser(u){
    u.items=u.items||[];u.schedule=u.schedule||{};u.history=u.history||[];u.prefs=u.prefs||{};u.city=u.city||"ansan";
    S.user=u;S.seen.clear();S.occ=null;S.openSwap=null;S.decisionStart=Date.now();
    LS.set(LOCAL_KEY,u.username);
    $("#overlay").innerHTML="";
    route();
    migrateCutouts();
}

function genderOptions(sel){
    return [["female","Female"],["male","Male"]].map(([v,l])=>`<option value="${v}" ${sel===v?"selected":""}>${l}</option>`).join("");
}

function openLocalWelcome(){
    const ov=$("#overlay");
    ov.innerHTML=`<div class="scrim" id="auth-scrim"><form class="sheet auth-sheet" id="local-form">
        <div><div class="eyebrow">AGORA · personal wardrobe</div><h2>Welcome to AGORA</h2>
        <p style="margin:4px 0;color:var(--muted)">Your wardrobe is saved in this browser. No account needed. Next, add photos of a few tops, bottoms and shoes.</p></div>
        <label class="field">Your name<input id="local-name" maxlength="24" autocomplete="nickname" placeholder="e.g. Imran" required></label>
        <label class="field">Mannequin and looks<select id="local-gender">${genderOptions("female")}</select></label>
        <div class="auth-actions" id="auth-actions" style="grid-template-columns:1fr"><button class="btn terra" type="submit">Start</button></div>
        <p class="auth-status" id="auth-status"></p>
    </form></div>`;
    $("#local-form").onsubmit=async e=>{
        e.preventDefault();
        const name=$("#local-name").value.trim()||"Guest",g=$("#local-gender").value;
        const u=newUser(name,false,g);
        await DB.put(u);
        activateLocalUser(u);
        location.hash="#closet";
        toast(`Welcome, ${name}. Add your first pieces to get outfit ideas.`);
    };
    setTimeout(()=>{const el=$("#local-name");if(el)el.focus()},50);
}

function openLocalProfile(){
    const u=S.user;if(!u){openLocalWelcome();return}
    const ov=$("#overlay");
    ov.innerHTML=`<div class="scrim" id="auth-scrim"><div class="sheet auth-sheet" role="dialog" aria-labelledby="lp-title">
        <div><div class="eyebrow">Your AGORA profile</div><h2 id="lp-title">${esc(u.username)}</h2>
        <p style="margin:4px 0;color:var(--muted)">${u.items.length} item${u.items.length===1?"":"s"} · saved in this browser only. Export a backup before clearing browser data or switching devices.</p></div>
        <label class="field">Name<input id="lp-name" maxlength="24" value="${esc(u.username)}"></label>
        <label class="field">Mannequin and looks<select id="lp-gender">${genderOptions(u.gender)}</select></label>
        <div class="auth-actions" id="auth-actions">
            <button class="btn terra" id="lp-save" type="button">Save</button>
            <button class="btn ghost" id="lp-close" type="button">Back</button>
            <button class="btn ghost" id="lp-export" type="button">Export backup</button>
            <label class="btn ghost" for="lp-import-file" style="justify-content:center">Import backup</label>
            <button class="btn ghost" id="lp-reset" type="button">Delete all data</button>
        </div>
        <input type="file" id="lp-import-file" accept="application/json,.json" class="vh">
        <p class="auth-status" id="auth-status"></p>
    </div></div>`;
    const close=()=>{ov.innerHTML=""};
    $("#auth-scrim").onclick=e=>{if(e.target.id==="auth-scrim")close()};
    $("#lp-close").onclick=close;
    $("#lp-save").onclick=async()=>{
        const name=$("#lp-name").value.trim()||u.username,g=$("#lp-gender").value;
        if(name!==u.username){
            if(await DB.get(name)){authMessage("Another profile in this browser already uses that name.",true);return}
            await DB.del(u.username);u.username=name;LS.set(LOCAL_KEY,name);
        }
        const genderChanged=g!==u.gender;u.gender=g;
        if(genderChanged)S.seen.clear();
        await save();close();render();toast("Profile saved.");
    };
    $("#lp-export").onclick=()=>{
        const data=Object.assign({},BACKUP_FORMAT,{exportedAt:new Date().toISOString(),user:u});
        const blob=new Blob([JSON.stringify(data)],{type:"application/json"});
        const a=document.createElement("a");
        a.href=URL.createObjectURL(blob);
        a.download=`agora-backup-${todayISO()}.json`;
        document.body.appendChild(a);a.click();a.remove();
        setTimeout(()=>URL.revokeObjectURL(a.href),1000);
        authMessage("Backup downloaded.");
    };
    $("#lp-import-file").onchange=async e=>{
        const f=e.target.files[0];e.target.value="";if(!f)return;
        try{
            const data=JSON.parse(await f.text());
            if(!data||data.app!=="agora"||!data.user||!Array.isArray(data.user.items))throw new Error("This file is not an AGORA backup.");
            if(!confirm(`Replace the current wardrobe (${u.items.length} items) with the backup from ${String(data.exportedAt||"").slice(0,10)||"this file"} (${data.user.items.length} items)?`))return;
            const nu=data.user;delete nu._cloudUid;
            if(nu.username!==u.username)await DB.del(u.username);
            await DB.put(nu);activateLocalUser(nu);toast("Backup imported.");
        }catch(err){authMessage(err.message||"Could not read that file.",true)}
    };
    $("#lp-reset").onclick=async()=>{
        if(!confirm("Delete your whole wardrobe, plans and history from this browser? This can't be undone unless you exported a backup."))return;
        await DB.del(u.username);
        try{localStorage.removeItem(LOCAL_KEY)}catch(e){}
        S.user=null;openLocalWelcome();
    };
}
