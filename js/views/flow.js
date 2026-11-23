"use strict";
/* AGORA · Today as a guided flow: hello (weather) → where are you headed → one look at a time */
const REDUCE=matchMedia("(prefers-reduced-motion: reduce)").matches;
const OCC_PHOTOS={class:["street",2],cafe:["flat",6],shopping:["rack",4],picnic:["flat",3],date:["street",1],dinner:["street",0],smart:["rack",2],formal:["rack",1],athletic:["flat",5]};

function wxIcon(wx,small){
    const c=(wx&&wx.cond)||"",k=c==="Snow"?"snow":wx&&wx.rains||/rain|drizzle|thunder|shower/i.test(c)?"rain":/cloud|fog/i.test(c)?"cloud":"sun";
    const sz=small?18:120;
    const sun=`<g class="wi-sun"><circle cx="40" cy="40" r="14" fill="#FFCE1F"/><g class="wi-rays" stroke="#FFCE1F" stroke-width="4" stroke-linecap="round">${[0,45,90,135,180,225,270,315].map(a=>`<line x1="40" y1="12" x2="40" y2="4" transform="rotate(${a} 40 40)"/>`).join("")}</g></g>`;
    const cloud=`<path class="wi-cloud" d="M22 62h38a12 12 0 0 0 0-24 18 18 0 0 0-34-4A14 14 0 0 0 22 62z" fill="#F4EEE4"/>`;
    const drops=`<g class="wi-drops" stroke="#8FC3FF" stroke-width="3.5" stroke-linecap="round"><line x1="30" y1="68" x2="27" y2="76"/><line x1="42" y1="68" x2="39" y2="76"/><line x1="54" y1="68" x2="51" y2="76"/></g>`;
    const flakes=`<g class="wi-drops" fill="#F4EEE4"><circle cx="30" cy="72" r="3"/><circle cx="42" cy="75" r="3"/><circle cx="54" cy="72" r="3"/></g>`;
    const body=k==="sun"?sun:k==="cloud"?`<g transform="translate(14 -8) scale(.8)">${sun}</g>${cloud}`:k==="rain"?cloud+drops:cloud+flakes;
    return`<svg class="wi wi-${k}" width="${sz}" height="${sz}" viewBox="0 0 80 84" aria-hidden="true">${body}</svg>`;
}

function greeting(iso){
    if(iso!==todayISO())return`Planning ${DOW[parseISO(iso).getDay()]==="Sat"||DOW[parseISO(iso).getDay()]==="Sun"?"the weekend":dayLabel(iso).toLowerCase()}`;
    const h=new Date().getHours();
    return h<5?"Up late":h<12?"Good morning":h<18?"Good afternoon":"Good evening";
}
function insight(ctx){
    const w=ctx.wx;
    if(ctx.rain)return`${w.cond==="Snow"?"Snow":"Rain"} from ${pad(w.rainStart)}:00 to ${pad(Math.min(24,w.rainEnd))}:00. Your looks include an umbrella.`;
    if(ctx.eveNeeded)return`It drops to feels ${Math.round(ctx.eve.feels)}° by ${pad(ctx.eve.h)}:00, so every look comes with a layer for tonight.`;
    if(ctx.feels<3)return"Properly cold out there. Time for your warmest layers.";
    if(ctx.feels<10)return"Chilly. A real jacket is a good idea.";
    if(ctx.feels>27)return"A hot one. Keep it light and breathable.";
    if(w.rainP>=.4)return`${Math.round(w.rainP*100)}% chance of rain. Shoes that cope with puddles help.`;
    return`Comfortable, around ${Math.round(ctx.feels)}° while you’re out.`;
}
function closetReady(){const cats=new Set(wardrobeItems().map(i=>T(i).cat));return(cats.has("top")&&cats.has("bottom"))||cats.has("dress")}

function setFlow(step){if(S.flow===step)return;S.flow=step;S.lookIdx=0;render();const el=$("#f-"+step);if(el)el.scrollIntoView({block:"start",behavior:REDUCE?"auto":"smooth"});scrollTo({top:0,behavior:REDUCE?"auto":"smooth"})}

function renderFlow(ctx){
    const u=S.user,iso=S.date,wx=ctx.wx,evs=dayPlans(u,iso),ready=closetReady();
    if(!ready&&S.flow!=="hello")S.flow="hello";
    const steps={hello:$("#f-hello"),occ:$("#f-occ"),looks:$("#f-looks")};
    for(const[k,el]of Object.entries(steps)){
        const show=k===S.flow;
        if(show&&el.hidden){el.hidden=false;el.classList.remove("enter");void el.offsetWidth;el.classList.add("enter")}
        else if(!show)el.hidden=true;
    }
    $("#flow").dataset.step=S.flow;
    // backdrop photo for the first two screens follows the weather
    const bgSet=ctx.rain?["rain",0]:ctx.feels<6?["street",3]:["street",2];
    $("#flow-bg").style.backgroundImage=`url(${PH(PHOTOS[bgSet[0]][bgSet[1]],1600)})`;

    if(S.flow==="hello"){
        const now=iso===todayISO()?new Date().getHours():12,cur=wx.hourly[now];
        const days=[0,1,2,3,4,5,6].map(i=>addDays(todayISO(),i));
        steps.hello.innerHTML=`
<p class="f-date">${esc(parseISO(iso).toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"}))} · ${esc(wx.city)}</p>
<h1 class="f-greet"><span>${esc(greeting(iso))},</span><span class="f-name">${esc(u.username)}.</span></h1>
<div class="f-wx">
  ${wxIcon(wx)}
  <div class="f-temp num">${Math.round(cur.t)}°</div>
  <div class="f-wxtext"><b>${esc(wx.cond)}</b><span>Feels ${Math.round(cur.feels)}° ${iso===todayISO()?"now":"at noon"} · high ${Math.round(wx.tmax)}°, low ${Math.round(wx.tmin)}°</span></div>
</div>
<p class="f-insight">${esc(insight(ctx))}</p>
${evs.length?`<p class="f-plans">${evs.length} plan${evs.length>1?"s":""} today: ${esc(evs.slice(0,2).map(e=>e.start+" "+e.title).join(", "))}${evs.length>2?"…":""}</p>`:""}
${ready?`<div class="f-cta"><button class="btn terra big" id="go-dress" type="button">Get dressed</button><button class="btn ghost" id="go-detail" type="button">Full forecast</button></div>`
:`<div class="f-cta f-empty"><p>First, show AGORA what’s in your closet: a top, a bottom or a dress, and shoes.</p><button class="btn terra big" id="go-add" type="button">Add my first pieces</button></div>`}
<div class="f-days" role="group" aria-label="Choose a day">${days.map(d=>{const w=dayWeather(d,u.city),dd=parseISO(d);return`<button type="button" class="f-day" data-d="${d}" aria-pressed="${d===iso}"><span>${d===todayISO()?"Today":DOW[dd.getDay()]}</span>${wxIcon(w,true)}<b class="num">${Math.round(w.tmax)}°</b></button>`}).join("")}</div>`;
        const go=$("#go-dress");if(go)go.onclick=()=>setFlow("occ");
        const det=$("#go-detail");if(det)det.onclick=openDrawer;
        const add=$("#go-add");if(add)add.onclick=()=>{location.hash="#closet";setTimeout(()=>openAddSheet(),150)};
        for(const b of $$(".f-day",steps.hello))b.onclick=()=>{S.date=b.dataset.d;S.seen.clear();S.occ=null;S.openSwap=null;S.decisionStart=Date.now();render()};
    }
    if(S.flow==="occ"){
        const cards=OCCASIONS.map((o,i)=>{const[set,k]=OCC_PHOTOS[o.k]||["flat",0];return`<button type="button" class="occard" data-o="${o.k}" style="--i:${i+1};--img:url(${PH(PHOTOS[set][k%PHOTOS[set].length],600)})" aria-pressed="${S.occ===o.k}"><span>${esc(o.label)}</span></button>`});
        if(evs.length)cards.unshift(`<button type="button" class="occard cal" data-o="day" style="--i:0" aria-pressed="${S.occ==="day"}"><small>From your calendar</small><span>My day</span><em>${esc(evs.slice(0,3).map(e=>e.start+" "+e.title).join(" · "))}</em></button>`);
        steps.occ.innerHTML=`
<button type="button" class="backlink" id="occ-back">‹ Back</button>
<h1 class="f-q">Where are you headed${iso===todayISO()?" today":""}?</h1>
<p class="f-sub">Pick one. AGORA builds looks for it from your closet and the ${Math.round(ctx.feels)}° forecast.</p>
<div class="occgrid">${cards.join("")}</div>
<details class="vibe-pick"${S.vibe!=="any"?" open":""}><summary>Add a vibe <span>(optional)</span></summary>
<div class="chips">${VIBES.map(v=>`<button type="button" class="chip" data-vb="${v[0]}" aria-pressed="${S.vibe===v[0]}">${v[1]}</button>`).join("")}</div></details>`;
        $("#occ-back").onclick=()=>setFlow("hello");
        for(const b of $$(".occard",steps.occ))b.onclick=()=>{S.occ=b.dataset.o;S.seen.clear();S.openSwap=null;S.openDet.clear();S.decisionStart=Date.now();setFlow("looks")};
        for(const b of $$("[data-vb]",steps.occ))b.onclick=()=>{S.vibe=b.dataset.vb;for(const x of $$("[data-vb]",steps.occ))x.setAttribute("aria-pressed",x===b)};
    }
}

/* carousel: one look at a time, arrows + swipe + keyboard */
function wireLooksUI(ctx,keep){
    if(!keep){S.lookIdx=0;S.openDet.clear()}
    const box=$("#looks"),cards=$$(".look",box),dots=$("#ldots"),prev=$("#cprev"),next=$("#cnext");
    const back=$("#flow-back");if(back)back.onclick=()=>setFlow("occ");
    const wxb=$("#looks-wx");if(wxb)wxb.onclick=openDrawer;
    dots.innerHTML=cards.length>1?cards.map((_,i)=>`<span class="${i===S.lookIdx?"on":""}"></span>`).join(""):"";
    prev.hidden=next.hidden=cards.length<2;
    const go=i=>{i=Math.max(0,Math.min(cards.length-1,i));const c=cards[i];if(!c)return;const br=box.getBoundingClientRect(),cr=c.getBoundingClientRect();box.scrollBy({left:(cr.left+cr.width/2)-(br.left+br.width/2),behavior:REDUCE?"auto":"smooth"})};
    prev.onclick=()=>go(S.lookIdx-1);next.onclick=()=>go(S.lookIdx+1);
    const sync=()=>{const br=box.getBoundingClientRect(),mid=br.left+br.width/2;let best=0,bd=1e9;cards.forEach((c,i)=>{const r=c.getBoundingClientRect(),d=Math.abs(r.left+r.width/2-mid);if(d<bd){bd=d;best=i}});
        S.lookIdx=best;cards.forEach((c,i)=>c.classList.toggle("current",i===best));$$("span",dots).forEach((d,i)=>d.classList.toggle("on",i===best));prev.disabled=best===0;next.disabled=best===cards.length-1};
    box.onscroll=()=>{cancelAnimationFrame(box._r);box._r=requestAnimationFrame(sync)};
    box.onkeydown=e=>{if(e.key==="ArrowRight"){e.preventDefault();go(S.lookIdx+1)}if(e.key==="ArrowLeft"){e.preventDefault();go(S.lookIdx-1)}};
    box.tabIndex=0;box.setAttribute("aria-label","Looks, use left and right arrows to browse");
    requestAnimationFrame(()=>{if(keep)go(S.lookIdx);sync()});
}

/* details drawer: forecast, plans, every occasion and vibe */
function openDrawer(){const d=$("#drawer");d.hidden=false;void d.offsetWidth;d.classList.add("open");document.body.classList.add("noscroll");setTimeout(()=>$("#drawer-close").focus(),50)}
function closeDrawer(){const d=$("#drawer");if(!d||d.hidden)return;d.classList.remove("open");document.body.classList.remove("noscroll");setTimeout(()=>{d.hidden=true},REDUCE?0:260)}
document.addEventListener("click",e=>{if(e.target&&(e.target.id==="drawer-scrim"||e.target.id==="drawer-close"))closeDrawer()});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeDrawer()});
