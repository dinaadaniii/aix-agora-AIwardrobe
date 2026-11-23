"use strict";
/* AGORA · Closet view, photo processing, uploads */
/* ---------- CLOSET ---------- */
let closetFilter="all";
function renderCloset(){
    const addButton=$("#addbtn");
    if(addButton)addButton.onclick=()=>openAddSheet();
    const u=S.user,visibleItems=wardrobeItems();$("#closettitle").textContent=`${visibleItems.length} uploaded pieces, saved for ${u.username}`;
    $("#closetfilter").innerHTML=[["all","All"],...CATS].map(([k,l])=>`<button class="chip" data-k="${k}" aria-pressed="${closetFilter===k}">${l}<span class="num" style="opacity:.6"> ${k==="all"?visibleItems.length:visibleItems.filter(i=>T(i).cat===k).length}</span></button>`).join("");
    for(const b of $$("#closetfilter .chip"))b.onclick=()=>{closetFilter=b.dataset.k;renderCloset()};
    const grid=$("#closetgrid");
    if(!visibleItems.length){grid.innerHTML=`<div class="empty"><h3>Your closet is waiting for your photos</h3><p>Upload real photos of your own clothes. AGORA will use only those uploaded pieces for your closet and outfit recommendations.</p><div class="chips"><button class="btn terra" id="cadd">+ Add clothing</button></div></div>`;$("#cadd").onclick=()=>openAddSheet();return}
    grid.innerHTML=CATS.filter(([k])=>closetFilter==="all"||closetFilter===k).map(([k,l])=>{const its=visibleItems.filter(i=>T(i).cat===k);if(!its.length)return"";
        return`<div class="catsec"><h2>${l} <small class="num">${its.length}</small></h2><div class="closet">${its.map(it=>`<div class="item"><div class="ph">${thumb(it)}${u.gender==="male"&&FEM.includes(it.type)?`<span class="fem">not used in male looks</span>`:""}</div><div class="meta"><b>${esc(it.name)}</b><span><i class="sw" style="background:${it.color}"></i>${esc(colorName(it.color))} · ${esc(T(it).label)}</span></div><div class="acts"><button data-e="${it.id}">Edit</button><button data-x="${it.id}">Remove</button></div></div>`).join("")}</div></div>`}).join("");
    for(const b of $$("[data-e]",grid))b.onclick=()=>openItemSheet(u.items.find(x=>x.id===b.dataset.e));
    for(const b of $$("[data-x]",grid))b.onclick=()=>{const it=u.items.find(x=>x.id===b.dataset.x);confirmSheet(`Remove ${it.name}?`,"It disappears from your closet and from future looks.","Remove",async()=>{u.items=u.items.filter(x=>x.id!==it.id);await save();render()})};
}

/* photo processing: resize, cut the garment out of its background, read its colour */
function cutout(src){
    const k0=Math.min(1,520/Math.max(src.width,src.height)),W=Math.max(1,Math.round(src.width*k0)),H=Math.max(1,Math.round(src.height*k0)),N=W*H;
    const c=document.createElement("canvas");c.width=W;c.height=H;const x=c.getContext("2d",{willReadFrequently:true});x.drawImage(src,0,0,W,H);
    const id=x.getImageData(0,0,W,H),d=id.data;
    const rs=[],gs=[],bs=[];const pb=i=>{rs.push(d[i*4]);gs.push(d[i*4+1]);bs.push(d[i*4+2])};
    for(let i=0;i<W;i+=2){pb(i);pb((H-1)*W+i)}for(let j=0;j<H;j+=2){pb(j*W);pb(j*W+W-1)}
    const med=a=>{const b=a.slice().sort((p,q)=>p-q);return b[b.length>>1]};const bg=[med(rs),med(gs),med(bs)];
    const dB=i=>{const k=i*4,r=d[k]-bg[0],g=d[k+1]-bg[1],b=d[k+2]-bg[2];return Math.sqrt(r*r+g*g+b*b)};
    const dP=(i,j)=>{const a=i*4,b=j*4,r=d[a]-d[b],g=d[a+1]-d[b+1],bl=d[a+2]-d[b+2];return Math.sqrt(r*r+g*g+bl*bl)};
    let sd=0;for(let i=0;i<rs.length;i++){const r=rs[i]-bg[0],g=gs[i]-bg[1],b=bs[i]-bg[2];sd+=Math.min(80,Math.sqrt(r*r+g*g+b*b))}sd/=rs.length;
    const q=new Int32Array(N);let qh=0,qt=0,mask,TT;
    const nbs=(p,px,py)=>[px>0?p-1:-1,px<W-1?p+1:-1,py>0?p-W:-1,py<H-1?p+W:-1];
    const Gm=new Uint8Array(N);for(let i=0;i<N;i++){const px=i%W;let gm=0;if(px<W-1)gm=dP(i,i+1);if(i+W<N)gm=Math.max(gm,dP(i,i+W));Gm[i]=gm>255?255:gm}
    const flood=tt=>{const m=new Uint8Array(N);qh=qt=0;const lim=Math.min(9,tt*.5);
        const seed=i=>{if(!m[i]&&dB(i)<tt*1.4){m[i]=1;q[qt++]=i}};
        for(let i=0;i<W;i++){seed(i);seed((H-1)*W+i)}for(let j=0;j<H;j++){seed(j*W);seed(j*W+W-1)}
        while(qh<qt){const p=q[qh++],px=p%W,py=(p/W)|0;for(const n of nbs(p,px,py)){if(n<0||m[n])continue;const v=dB(n);if(Gm[n]>14&&v>tt*.5)continue;if(v<tt||(v<tt*3&&dP(n,p)<lim)){m[n]=1;q[qt++]=n}}}
        let bgc=0;for(let i=0;i<N;i++)bgc+=m[i];return{m,fgf:1-bgc/N}};
    for(const tt of[clamp(24+sd*1.8,24,64),16,10,6]){const r=flood(tt);if(r.fgf>.05&&r.fgf<.92){mask=r.m;TT=tt;break}}
    if(!mask)return null;
    /* enclosed background pockets (e.g. between a sleeve and the body) */
    const seen=new Uint8Array(N);
    for(let i=0;i<N&&TT>=24;i++){if(mask[i]||seen[i]||dB(i)>=TT*.35)continue;qh=qt=0;q[qt++]=i;seen[i]=1;while(qh<qt){const p=q[qh++],px=p%W,py=(p/W)|0;for(const n of nbs(p,px,py))if(n>=0&&!mask[n]&&!seen[n]&&dB(n)<TT*.35){seen[n]=1;q[qt++]=n}}
        if(qt>N*.004)for(let k=0;k<qt;k++)mask[q[k]]=1}
    /* keep the garment (and a second shoe), drop specks */
    const lab=new Int32Array(N),sizes=[0];let nl=0;
    for(let i=0;i<N;i++){if(mask[i]||lab[i])continue;nl++;qh=qt=0;q[qt++]=i;lab[i]=nl;while(qh<qt){const p=q[qh++],px=p%W,py=(p/W)|0;for(const n of nbs(p,px,py))if(n>=0&&!mask[n]&&!lab[n]){lab[n]=nl;q[qt++]=n}}sizes.push(qt)}
    let big=0;for(const z of sizes)if(z>big)big=z;
    let fg=0,x0=W,y0=H,x1=0,y1=0,cr=0,cg=0,cb=0,cn=0;
    for(let i=0;i<N;i++){if(!mask[i]&&sizes[lab[i]]<big*.08)mask[i]=1;if(!mask[i]){fg++;const px=i%W,py=(i/W)|0;if(px<x0)x0=px;if(px>x1)x1=px;if(py<y0)y0=py;if(py>y1)y1=py}}
    if(fg<N*.03||fg>N*.96)return null;
    for(let i=0;i<N;i++){const k=i*4;if(mask[i]){d[k+3]=0;continue}const px=i%W,py=(i/W)|0;let edge=false;for(const n of nbs(i,px,py))if(n<0||mask[n]){edge=true;break}
        if(edge)d[k+3]=150;else{cr+=d[k];cg+=d[k+1];cb+=d[k+2];cn++}}
    x.putImageData(id,0,0);const bw=x1-x0+3,bh=y1-y0+3;const o=document.createElement("canvas");o.width=bw;o.height=bh;o.getContext("2d").drawImage(c,x0-1,y0-1,bw,bh,0,0,bw,bh);
    let out=o.toDataURL("image/webp",.88);if(!out.startsWith("data:image/webp"))out=o.toDataURL("image/png");
    return{src:out,aspect:bh/bw,color:cn?rgbHex(cr/cn,cg/cn,cb/cn):null};
}
async function processPhoto(file){
    const url=URL.createObjectURL(file);let im;try{im=await loadImg(url)}finally{setTimeout(()=>URL.revokeObjectURL(url),1000)}
    const max=720,sc=Math.min(1,max/Math.max(im.width,im.height)),w=Math.round(im.width*sc),h=Math.round(im.height*sc);
    const c=document.createElement("canvas");c.width=w;c.height=h;const x=c.getContext("2d");x.drawImage(im,0,0,w,h);
    const img=c.toDataURL("image/jpeg",.84);let cut=null;try{cut=cutout(c)}catch(e){cut=null}
    let color=cut&&cut.color;if(!color){const p=x.getImageData(Math.floor(w*.4),Math.floor(h*.4),Math.max(1,Math.floor(w*.2)),Math.max(1,Math.floor(h*.2))).data;let r=0,g=0,b=0,n=0;for(let i=0;i<p.length;i+=16){r+=p[i];g+=p[i+1];b+=p[i+2];n++}color=rgbHex(r/n,g/n,b/n)}
    return{img,imgAspect:h/w,cut:cut&&cut.src,cutAspect:cut&&cut.aspect,color,blob:await new Promise(r=>c.toBlob(r,"image/jpeg",.85))};
}
function applyPhoto(it,ph,keepBg){it.cutV=2;it.pv=(it.pv||0)+1;it.img=ph.img;it.imgAspect=ph.imgAspect;it.cut=ph.cut||null;it.cutAspect=ph.cutAspect||null;it.cutTried=true;it.keepBg=!!keepBg||!ph.cut;delete it.swatch;it.sample=false}
async function migrateCutouts(){const u=S.user;const todo=u.items.filter(i=>i.img&&i.cutV!==2);if(!todo.length)return;let n=0;
    for(const it of todo){try{const im=await loadImg(it.img);const c=document.createElement("canvas");c.width=im.width;c.height=im.height;c.getContext("2d").drawImage(im,0,0);it.imgAspect=im.height/im.width;const r=cutout(c);it.cut=r?r.src:null;it.cutAspect=r?r.aspect:null;if(r)n++}catch(e){}it.cutTried=true;it.cutV=2;it.pv=(it.pv||0)+1;delete it.swatch}
    if(S.user===u)await save();else await DB.put(u);if(S.user===u){render();if(n)toast(`Re-prepared ${n} saved photo${n>1?"s":""} for the mannequin.`)}}
function typeOptions(sel){return CATS.map(([k,l])=>`<optgroup label="${l}">${Object.entries(TYPES).filter(([,t])=>t.cat===k).map(([tk,t])=>`<option value="${tk}" ${tk===sel?"selected":""}>${t.label}</option>`).join("")}</optgroup>`).join("")}
function openItemSheet(edit){
    const u=S.user;const it=edit?Object.assign({},edit):{id:uid(),type:"tee",color:"#d6c3a3",pattern:"solid",name:"",added:Date.now()};let photo=null,named=!!edit;
    const ov=$("#overlay");
    ov.innerHTML=`<div class="scrim" id="scrim"><form class="sheet" id="itemform"><div><div class="eyebrow">${edit?"Edit piece":"New piece"}</div><h2>${edit?esc(edit.name):"Add clothing"}</h2></div>
   <div class="drop ${it.img?"has":""}" id="drop"><span id="dropprev">${it.img?`<img src="${it.img}" alt="">`:edit?`<span style="width:120px;height:120px;display:grid;place-items:center">${flatSVG(it)}</span>`:""}</span><div><p style="margin:0">${edit?"Replace the photo (optional).":"Lay the piece flat on a plain surface and photograph it from above."}</p><label class="btn ghost small" for="photo" style="margin-top:8px">Choose photo</label><input type="file" id="photo" accept="image/*" class="vh"><div class="aiout" id="aiout"></div></div></div>
   <div class="row2"><label class="field">Type<select id="ftype">${typeOptions(it.type)}</select></label><label class="field">Name<input id="fname" value="${esc(it.name)}" placeholder="e.g. Grey crewneck knit" maxlength="40"></label></div>
   <div class="row2"><label class="field">Main colour<span style="display:flex;gap:8px;align-items:center"><input type="color" id="fcolor" value="${it.color}"><span id="fcname" style="color:var(--charcoal);font-size:14px">${colorName(it.color)}</span></span></label><label class="field">Fabric look<select id="fpat">${PATTERNS.map(p=>`<option ${p===it.pattern?"selected":""}>${p}</option>`).join("")}</select></label></div>
   <div class="field">Style tags (optional, defaults come from the type)<div class="chips" id="ftags">${STYLE_TAGS.map(t=>`<button type="button" class="chip" data-t="${t}" aria-pressed="${(it.tags||[]).includes(t)}">${t}</button>`).join("")}</div></div>
   <label style="display:flex;gap:8px;align-items:center;font-size:14px" id="kbrow" ${it.img?"":"hidden"}><input type="checkbox" id="fkeep" ${it.keepBg?"checked":""}> Use the full photo on the mannequin (if the dressed piece looks cut wrongly)</label>
   <label style="display:flex;gap:8px;align-items:center;font-size:14px"><input type="checkbox" id="fsuede" ${it.suede?"checked":""}> Suede or delicate (avoid on rainy days)</label>
   <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap"><button type="button" class="btn ghost" id="aitag" hidden title="Sends the photo to Google Gemini to suggest type, name and pattern.">✦ Auto-tag with AI</button><button type="button" class="btn ghost" id="fcancel">Cancel</button><button class="btn terra" type="submit">${edit?"Save changes":"Add to closet"}</button></div></form></div>`;
    const close=()=>ov.innerHTML="";$("#fcancel").onclick=close;$("#scrim").onclick=e=>{if(e.target.id==="scrim")close()};
    const autoName=()=>{if(!named)$("#fname").value=colorName($("#fcolor").value)+" "+TYPES[$("#ftype").value].label.toLowerCase()};
    $("#fname").oninput=()=>named=true;$("#ftype").onchange=autoName;$("#fcolor").oninput=e=>{$("#fcname").textContent=colorName(e.target.value);autoName()};
    for(const b of $$("#ftags .chip"))b.onclick=()=>b.setAttribute("aria-pressed",b.getAttribute("aria-pressed")!=="true");
    if(S.caps.images)$("#aitag").hidden=false;
    $("#photo").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{photo=await processPhoto(f);$("#dropprev").innerHTML=`<img src="${photo.img}" alt="">`;$("#drop").classList.add("has");$("#kbrow").hidden=false;$("#fkeep").checked=!photo.cut;if(!photo.cut)$("#aiout").textContent="The background couldn't be separated, so the photo is used as it is.";$("#fcolor").value=photo.color;$("#fcname").textContent=colorName(photo.color);autoName()}catch(err){toast("That file couldn't be read as an image. Try a JPG or PNG.")}};

    $("#aitag").onclick=async()=>{
        if(!photo){toast("Choose a photo first.");return}const out=$("#aiout");out.textContent="Reading the photo…";$("#aitag").disabled=true;
        try{const r=await S.caps.sample.json(`This is a flat photo of one clothing item for a wardrobe app. Reply with only JSON: {"type": one of ${JSON.stringify(Object.keys(TYPES))}, "name": short name like "Grey crewneck knit", "pattern": one of ${JSON.stringify(PATTERNS)}, "tags": up to 3 of ${JSON.stringify(STYLE_TAGS)}, "suede": boolean}`,{images:[photo.blob],modelTier:"quick"});
            if(r&&TYPES[r.type]){$("#ftype").value=r.type}if(r&&r.name){$("#fname").value=String(r.name).slice(0,40);named=true}if(r&&PATTERNS.includes(r.pattern))$("#fpat").value=r.pattern;
            if(r&&Array.isArray(r.tags))for(const b of $$("#ftags .chip"))b.setAttribute("aria-pressed",r.tags.includes(b.dataset.t));if(r&&typeof r.suede==="boolean")$("#fsuede").checked=r.suede;out.textContent="Tagged by AI. Check and adjust.";
        }catch(e){out.textContent=e&&e.code==="not_granted"?"AI tagging was declined. Tag it by hand.":"AI is busy or offline right now. Tag it by hand.";if(e&&["not_granted","sampling_disabled","images_unavailable"].includes(e.code))$("#aitag").hidden=true}
        $("#aitag").disabled=false};
    if(!edit)autoName();
    $("#itemform").onsubmit=async e=>{e.preventDefault();
        it.type=$("#ftype").value;it.name=$("#fname").value.trim()||colorName($("#fcolor").value)+" "+TYPES[it.type].label.toLowerCase();it.color=$("#fcolor").value;it.pattern=$("#fpat").value;
        it.tags=$$("#ftags .chip").filter(b=>b.getAttribute("aria-pressed")==="true").map(b=>b.dataset.t);it.suede=$("#fsuede").checked;
        if(photo)applyPhoto(it,photo,$("#fkeep").checked);else if(it.img)it.keepBg=$("#fkeep").checked||!it.cut;
        if(edit){Object.assign(edit,it)}else u.items.push(it);
        await save();close();S.seen.clear();toast(edit?"Saved.":`${it.name} added to your closet.`);render()};
}

/* batch add: several photos at once, review as a list, save together */
const BATCH_MAX=20;
function openAddSheet(){
    const u=S.user,rows=[];let busy=false;const ov=$("#overlay");
    ov.innerHTML=`<div class="scrim" id="scrim"><form class="sheet" id="batchform" style="width:min(640px,100%)"><div><div class="eyebrow">New pieces</div><h2>Add clothing</h2></div>
   <div class="drop" id="bdrop"><p style="margin:0">Lay each piece flat on a plain surface and photograph it from above. Pick several photos at once, up to ${BATCH_MAX}, or drop them here.</p>
<label class="btn ghost small" for="bphotos">Choose photos</label><input type="file" id="bphotos" accept="image/*" multiple class="vh"><div class="aiout" id="bstatus"></div></div>
   <div class="batch" id="batch"></div>
   <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;align-items:center"><button type="button" class="btn ghost" id="bai" hidden>✦ Auto-tag all with AI</button><button type="button" class="btn ghost" id="bcancel">Cancel</button><button class="btn terra" type="submit" id="bsave" disabled>Add to closet</button></div></form></div>`;
    const close=()=>{if(!busy)ov.innerHTML=""};$("#bcancel").onclick=close;$("#scrim").onclick=e=>{if(e.target.id==="scrim")close()};
    const status=t=>$("#bstatus").textContent=t;
    const nameFor=r=>colorName(r.color)+" "+TYPES[r.type].label.toLowerCase();
    function draw(){
        $("#batch").innerHTML=rows.map((r,i)=>`<div class="brow" data-i="${i}"><img src="${r.img}" alt="Photo ${i+1}"><div class="bf">
  <select data-k="type" aria-label="Type of piece ${i+1}">${typeOptions(r.type)}</select>
  <span class="cl"><input type="color" data-k="color" value="${r.color}" aria-label="Main colour of piece ${i+1}"><span>${esc(colorName(r.color))}</span></span>
  <input class="wide" data-k="name" value="${esc(r.name)}" maxlength="40" aria-label="Name of piece ${i+1}">
  <span class="st wide">${r.cut?`<label class="kb"><input type="checkbox" data-kb="${i}" ${r.keepBg?"checked":""}> Use the full photo on the mannequin</label>`:"The full photo is used: the piece couldn't be separated from its background."} ${esc(r.note||"")}</span></div>
  <button type="button" class="x" data-rm="${i}" aria-label="Remove photo ${i+1}">×</button></div>`).join("");
        $("#bsave").disabled=!rows.length||busy;$("#bsave").textContent=rows.length>1?`Add ${rows.length} pieces`:"Add to closet";
        $("#bai").hidden=!(S.caps.images&&rows.length);$("#bai").title="Sends the photos to Google Gemini to suggest type, name and pattern.";
        for(const el of $$("#batch [data-k]"))el.oninput=el.onchange=()=>{const r=rows[+el.closest(".brow").dataset.i],k=el.dataset.k;r[k]=el.value;
            if(k==="name")r.named=true;if(k!=="name"&&!r.named){r.name=nameFor(r);el.closest(".brow").querySelector('[data-k="name"]').value=r.name}
            if(k==="color")el.nextElementSibling.textContent=colorName(r.color)};
        for(const b of $$("#batch [data-kb]"))b.onchange=()=>{rows[+b.dataset.kb].keepBg=b.checked;draw()};
        for(const b of $$("#batch [data-rm]"))b.onclick=()=>{rows.splice(+b.dataset.rm,1);draw()};
    }
    async function addFiles(list){
        const files=[...list].filter(f=>/^image\//.test(f.type)||/\.(jpe?g|png|webp|heic|gif)$/i.test(f.name));
        const room=BATCH_MAX-rows.length;if(!files.length){status("Those files aren't images. Choose JPG or PNG photos.");return}
        if(files.length>room)toast(`Only ${room} more fit in one batch. Add the rest after saving.`);
        busy=true;$("#bsave").disabled=true;let failed=0;const take=files.slice(0,Math.max(0,room));
        for(let k=0;k<take.length;k++){status(`Reading photo ${k+1} of ${take.length}…`);
            try{const ph=await processPhoto(take[k]);const prev=rows[rows.length-1];const r={type:prev?prev.type:"tee",color:ph.color,ph,img:ph.img,cut:ph.cut,blob:ph.blob,pattern:"solid",named:false,keepBg:false};r.name=nameFor(r);rows.push(r)}catch(e){failed++}
            draw()}
        busy=false;status(failed?`${failed} file${failed>1?"s":""} couldn't be read. Try JPG or PNG.`:rows.length?"Check each piece's type, then add them all.":"");draw();
    }
    $("#bphotos").onchange=e=>{addFiles(e.target.files);e.target.value=""};
    const dz=$("#bdrop");dz.ondragover=e=>{e.preventDefault();dz.classList.add("drag")};dz.ondragleave=()=>dz.classList.remove("drag");
    dz.ondrop=e=>{e.preventDefault();dz.classList.remove("drag");if(e.dataTransfer&&e.dataTransfer.files.length)addFiles(e.dataTransfer.files)};
    $("#bai").onclick=async()=>{
        busy=true;$("#bai").disabled=true;$("#bsave").disabled=true;let stop=false;
        for(let i=0;i<rows.length&&!stop;i++){const r=rows[i];status(`AI is tagging photo ${i+1} of ${rows.length}…`);
            try{const a=await S.caps.sample.json(`This is a flat photo of one clothing item for a wardrobe app. Reply with only JSON: {"type": one of ${JSON.stringify(Object.keys(TYPES))}, "name": short name like "Grey crewneck knit", "pattern": one of ${JSON.stringify(PATTERNS)}, "tags": up to 3 of ${JSON.stringify(STYLE_TAGS)}, "suede": boolean}`,{images:[r.blob],modelTier:"quick"});
                if(a&&TYPES[a.type])r.type=a.type;if(a&&a.name&&!r.named){r.name=String(a.name).slice(0,40)}if(a&&PATTERNS.includes(a.pattern))r.pattern=a.pattern;
                if(a&&Array.isArray(a.tags))r.tags=a.tags.filter(t=>STYLE_TAGS.includes(t));if(a&&typeof a.suede==="boolean")r.suede=a.suede;r.note="Tagged by AI. Check it.";}
            catch(e){if(e&&["not_granted","sampling_disabled","images_unavailable","rate_limited"].includes(e.code)){stop=true;status(e.code==="rate_limited"?"AI tagging is busy. Tag the rest by hand or try again later.":"AI tagging isn't available. Tag them by hand.");if(e.code!=="rate_limited")S.caps.images=false}else r.note="AI couldn't read this one. Tag it by hand."}
            draw()}
        busy=false;$("#bai").disabled=false;if(!stop)status("Done. Check the types, then add them all.");draw()};
    $("#batchform").onsubmit=async e=>{e.preventDefault();if(busy||!rows.length)return;
        for(const r of rows){const it={id:uid(),name:(r.name||"").trim()||nameFor(r),type:r.type,color:r.color,pattern:r.pattern||"solid",tags:r.tags||[],suede:!!r.suede,added:Date.now()};applyPhoto(it,r.ph,r.keepBg);u.items.push(it)}
        await save();busy=false;ov.innerHTML="";S.seen.clear();toast(rows.length>1?`${rows.length} pieces added to your closet.`:`${rows[0].name} added to your closet.`);render()};
}
function confirmSheet(title,body,cta,fn){const ov=$("#overlay");ov.innerHTML=`<div class="scrim" id="scrim"><div class="sheet" style="width:min(420px,100%)"><h2 style="font-size:24px">${esc(title)}</h2><p style="margin:0;color:var(--ink-soft)">${esc(body)}</p><div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn ghost" id="cno">Cancel</button><button class="btn terra" id="cyes">${esc(cta)}</button></div></div></div>`;$("#cno").onclick=()=>ov.innerHTML="";$("#cyes").onclick=async()=>{ov.innerHTML="";await fn()}}
