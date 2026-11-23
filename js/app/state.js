"use strict";
/* AGORA · App state, save, view switching */
/* ---------- app state ---------- */
const S={flow:"hello",openDet:new Set(),lookIdx:0,lookView:"fig",user:null,view:"today",date:todayISO(),occ:null,vibe:"any",shown:[],seen:new Set(),openSwap:null,decisionStart:Date.now(),list:[],caps:{sample:null,downloads:null,images:false}};
async function save(){
    if(!S.user)return;
    await DB.put(S.user);
    if(S.user._cloudUid){
        try{await cloudSave(S.user)}
        catch(err){console.error("AGORA cloud save failed:",err);toast("Saved on this device, but cloud sync failed: "+(err.message||"Please check your connection and Supabase setup."))}
    }
}
function setView(v){if(v==="calendar"){calendarSelected=S.date||todayISO();const selectedDate=parseISO(calendarSelected);calendarMonth=new Date(selectedDate.getFullYear(),selectedDate.getMonth(),1)}S.view=v;for(const s of $$("main > section"))s.hidden=s.id!=="v-"+v;for(const a of $$("nav.tabs a"))a.toggleAttribute("aria-current",a.dataset.v===v),a.dataset.v===v&&a.setAttribute("aria-current","page");render()}
function render(){
    if(!S.user)return;$("#uname").textContent=S.user.username;$("#uav").textContent=S.user.username[0];
    renderBanner();
    if(S.view==="today")renderToday();if(S.view==="closet")renderCloset();if(S.view==="week")renderWeek();if(S.view==="calendar")renderCalendar();if(S.view==="tryon")renderTryOn();
}
function renderBanner(){
    const u=S.user;const slot=$("#bannerslot");
    slot.innerHTML="";
}
