"use strict";
/* AGORA · Routing and boot */
/* ---------- routing & boot ---------- */
function route(){const v=(location.hash||"#today").slice(1);setView(["today","favourites","closet","week","calendar","tryon"].includes(v)?v:"today")}
window.addEventListener("hashchange",route);
function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement("script");s.src=src;s.onload=res;s.onerror=()=>rej(new Error("Could not load "+src));document.head.appendChild(s)})}
(async function boot(){
    await DB.open();
    const lab=$(".ai-model-lab");if(lab)lab.hidden=!(AGORA_CONFIG.SUPABASE_ENABLED&&AGORA_CONFIG.AI_TRYON_ENABLED);
    if(!AGORA_CONFIG.SUPABASE_ENABLED){await startLocal();AI.check();}
    else try{
        await loadScript(AGORA_CONFIG.SUPABASE_JS_CDN);
        sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
        const {data,error}=await sb.auth.getSession();
        if(error)throw error;
        if(data.session&&data.session.user)await activateCloudUser(data.session.user);
        else await openLogin();
    }catch(err){
        console.error("AGORA startup failed:",err);
        await openLogin();
        authMessage("Could not connect to Supabase. Check the SQL setup and internet connection: "+(err.message||"unknown error"),true);
    }
    try{if(window.claude&&claude.use){claude.use("sample").then(async s=>{if(!s)return;S.caps.sample=s;try{const l=await s.limits();S.caps.images=!!(l&&l.images)}catch(e){}}).catch(()=>{});claude.use("downloads").then(d=>{S.caps.downloads=d}).catch(()=>{})}}catch(e){}
})();
