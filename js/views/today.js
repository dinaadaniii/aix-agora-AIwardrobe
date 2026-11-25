"use strict";
/* AGORA · Today view */
/* ---------- TODAY ---------- */
const ICON={
    cold:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 2v20M4.9 6.5l14.2 11M19.1 6.5L4.9 17.5"/></svg>`,
    rain:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 12a9 9 0 0118 0z"/><path d="M12 12v7a2 2 0 01-4 0"/></svg>`,
    refresh:`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 11a8 8 0 10-2.3 5.7M20 4v7h-7"/></svg>`,
};
function renderToday(){
    const u=S.user,iso=S.date,evs=dayPlans(u,iso);
    if(!S.occ||(S.occ==="day"&&!evs.length))S.occ=evs.length?"day":"class";
    const ctx=buildCtx(u,iso,S.occ,S.vibe),wx=ctx.wx;
    const now=iso===todayISO()?new Date().getHours():12,cur=wx.hourly[now];
    // weather card
    const days=[0,1,2,3,4,5,6].map(i=>addDays(todayISO(),i));
    const hours=[6,9,12,15,18,21].map(h=>wx.hourly[h]);
    $("#wxcard").innerHTML=`
<div class="wx-top"><span class="eyebrow">${esc(dayLabel(iso))} · weather</span>
  <select id="citysel" aria-label="City">${Object.entries(CITIES).map(([k,c])=>`<option value="${k}" ${k===u.city?"selected":""}>${c.name}</option>`).join("")}</select></div>
<div class="days">${days.map(d=>{const w=dayWeather(d,u.city);const dd=parseISO(d);return`<button class="day" data-d="${d}" aria-pressed="${d===iso}"><span>${d===todayISO()?"Today":DOW[dd.getDay()]}</span><b class="num">${Math.round(w.tmax)}°</b><span class="dot ${dayPlans(u,d).length?"":"off"}"></span></button>`}).join("")}</div>
<div class="wx-main"><div class="wx-temp num">${Math.round(cur.t)}<sup>°C</sup></div>
  <div class="wx-meta"><span>${esc(wx.cond)} · ${iso===todayISO()?"now":"at noon"}</span><span>Feels like ${Math.round(cur.feels)}°</span><span class="num">H ${Math.round(wx.tmax)}° · L ${Math.round(wx.tmin)}°</span></div></div>
<div class="wx-stats"><div><b class="num">${Math.round(cur.hum)}%</b><span>Humidity</span></div><div><b class="num">${Math.round(wx.rainP*100)}%</b><span>Rain chance</span></div><div><b class="num">${wx.wind.toFixed(1)} m/s</b><span>Wind</span></div></div>
<div class="hours">${hours.map(h=>`<div class="hour ${h.h>=Math.floor(ctx.s)&&h.h<=ctx.e?"inwin":""}"><span>${pad(h.h)}h</span><b class="num">${Math.round(h.t)}°</b><span class="rd">${h.wet?"rain":""}</span></div>`).join("")}</div>
${ctx.eveNeeded?`<div class="alert cold">${ICON.cold}<div><b>Colder tonight.</b> Feels ${Math.round(ctx.eve.feels)}° by ${pad(ctx.eve.h)}:00${ctx.feels-ctx.eve.feels>=1?`, ${Math.round(ctx.maxF-ctx.eve.feels)}° below the day's peak`:""}. Each look below names the outer layer to bring.</div></div>`:""}
${ctx.rain||wx.rainP>=.5?`<div class="alert rain">${ICON.rain}<div><b>${wx.rains?`${wx.cond==="Snow"?"Snow":"Rain"} from ${pad(wx.rainStart)}:00 to ${pad(Math.min(24,wx.rainEnd))}:00.`:`${Math.round(wx.rainP*100)}% chance of rain.`}</b> ${ctx.rain?"Umbrella is part of every look; suede is scored down.":"It falls outside your plans, but pack an umbrella to be safe."}</div></div>`:""}
<div class="src">${weatherSourceNote(wx)}</div>`;
    $("#citysel").onchange=async e=>{u.city=e.target.value;await save();S.seen.clear();render()};
    for(const b of $$(".day",$("#wxcard")))b.onclick=()=>{S.date=b.dataset.d;S.seen.clear();S.occ=null;S.openSwap=null;S.decisionStart=Date.now();S.flow="hello";closeDrawer();render()};
    // schedule
    $("#schedcard").innerHTML=`<div class="wx-top"><span class="eyebrow">Calendar · ${esc(dayLabel(iso))}</span><a class="linkbtn" href="#week">Edit plans</a></div>
${evs.length?`<ul>${evs.slice().sort((a,b)=>a.start.localeCompare(b.start)).map(e=>`<li><time>${e.start}</time><span>${esc(e.title)}</span><span class="tag">${esc((OCC[e.occ]||OCC.cafe).label)}</span></li>`).join("")}</ul>`:`<p style="margin:8px 0 0;font-size:14px;color:var(--muted)">No plans on this day. Pick an occasion, or add plans on the Week page.</p>`}`;
    // picker
    const occChips=(evs.length?[`<button class="chip cal" data-o="day" aria-pressed="${S.occ==="day"}">Whole day, from calendar</button>`]:[]).concat(OCCASIONS.map(o=>`<button class="chip" data-o="${o.k}" aria-pressed="${S.occ===o.k}">${esc(o.label)}</button>`)).join("");
    $("#pickcard").innerHTML=`<h3>Occasion</h3><div class="chips" id="occchips">${occChips}</div><h3>Vibe</h3><div class="chips" id="vibechips">${VIBES.map(v=>`<button class="chip" data-v="${v[0]}" aria-pressed="${S.vibe===v[0]}">${v[1]}</button>`).join("")}</div>`;
    // compact bar shown above the looks on phones: weather summary + occasions
    const occLabelNow=S.occ==="day"?"Your day":(OCC[S.occ]||OCC.class).label;
    $("#mctx").innerHTML=`<button type="button" class="mwx" id="mwx" aria-label="Weather details for ${esc(dayLabel(iso))}"><b class="num">${Math.round(cur.t)}°</b><span>${esc(iso===todayISO()?"Now":"Noon")} · ${esc(wx.cond)} · H ${Math.round(wx.tmax)}° L ${Math.round(wx.tmin)}° · ${esc(wx.city)}${ctx.rain?" · umbrella":""}</span><span class="mwx-more">${esc(dayLabel(iso))} ▾</span></button>
<div class="chips mocc" role="group" aria-label="Occasion">${occChips}</div>`;
    $("#mwx").onclick=()=>$("#wxcard").scrollIntoView({behavior:"smooth",block:"start"});
    for(const b of $$("#occchips .chip, .mocc .chip"))b.onclick=()=>{S.occ=b.dataset.o;S.seen.clear();S.openSwap=null;S.flow="looks";closeDrawer();render()};
    for(const b of $$("#vibechips .chip"))b.onclick=()=>{S.vibe=b.dataset.v;S.seen.clear();S.openSwap=null;render()};
    if(!closetReady()&&S.flow!=="hello")S.flow="hello";
    if(S.flow==="looks")renderLooks(ctx);
    renderFlow(ctx);
}
function renderLooks(ctx,keep){
    const u=S.user;const head=$("#lookshead"),box=$("#looks");
    const label=S.occ==="day"?"your day":(OCC[S.occ]||OCC.class).label.toLowerCase();
    head.innerHTML=`<button type="button" class="backlink" id="flow-back">‹ Change plan</button><button type="button" class="wxchip" id="looks-wx">${wxIcon(ctx.wx,true)}<b class="num">${Math.round(ctx.feels)}°</b> feels · ${esc(ctx.wx.cond)}</button><h2>Looks for <em>${esc(label)}</em></h2><span class="viewtog" role="group" aria-label="Look view"><button data-vw="fig" aria-pressed="${S.lookView==="fig"}">Mannequin</button><button data-vw="flat" aria-pressed="${S.lookView==="flat"}">Flat lay</button></span><span class="timer num" id="timer">Deciding 0:00</span><button class="btn ghost small" id="refresh">${ICON.refresh} Refresh</button><div class="sub">${esc(dayLabel(ctx.iso))} · ${Math.round(ctx.feels)}° feels-like ${hm(ctx.s)}–${hm(Math.min(ctx.e,23))}${S.vibe!=="any"?" · "+esc(VIBES.find(v=>v[0]===S.vibe)[1]):""} · only pieces from your closet</div>`;
    const realItems=wardrobeItems();const cats=new Set(realItems.map(i=>T(i).cat));
    if(!((cats.has("top")&&cats.has("bottom"))||cats.has("dress"))){
        const has=k=>k==="top"?(cats.has("top")||cats.has("dress")):k==="bottom"?(cats.has("bottom")||cats.has("dress")):cats.has(k);
        const steps=[["top","A top"],["bottom","A bottom, or a dress"],["shoes","Shoes (recommended)"]];
        box.innerHTML=`<div class="empty"><h3>Your closet needs a few pieces first</h3><p>AGORA builds every look from what you own. Photograph each piece flat on a plain background.</p>
<ul class="startlist">${steps.map(([k,l])=>`<li class="${has(k)?"done":""}"><span aria-hidden="true">${has(k)?"✓":""}</span>${l}${has(k)?'<span class="vh"> added</span>':""}</li>`).join("")}</ul>
<div class="chips"><button class="btn terra" id="emptyadd">+ Add clothing</button></div></div>`;
        $("#emptyadd").onclick=()=>openAddSheet();
        $("#refresh").disabled=true;return;
    }
    if(!keep){S.list=generate(wardrobeItems(),ctx);let pick=pickDiverse(S.list,3,S.seen);let wrapped=false;
        if(pick.length<3&&S.seen.size){S.seen.clear();pick=pickDiverse(S.list,3,S.seen);wrapped=true}
        S.shown=pick;pick.forEach(p=>S.seen.add(p.key));if(wrapped)toast("That's every strong look for this. Starting again from the best.")}
    $("#refresh").onclick=()=>{S.openSwap=null;renderLooks(ctx)};
    for(const b of $$(".viewtog button",head))b.onclick=()=>{S.lookView=b.dataset.vw;LS.set("agora.view",S.lookView);renderLooks(ctx,true)};
    const wornToday=(u.history||[]).filter(h=>h.date===ctx.iso);
    box.innerHTML=S.shown.map((o,i)=>lookCard(o,i,ctx,wornToday)).join("")||`<div class="empty"><h3>No look fits yet</h3><p>Try another occasion or add shoes and an outer layer.</p></div>`;
    for(const b of $$(".piece",box))b.onclick=()=>{const k=b.dataset.card+":"+b.dataset.slot;S.openSwap=S.openSwap===k?null:k;renderLooks(ctx,true)};
    for(const b of $$(".swapopt",box))b.onclick=()=>{const i=+b.dataset.card,slot=b.dataset.slot,id=b.dataset.id;const realItems=wardrobeItems();const o=withSwap(S.shown[i],slot,id==="none"?null:realItems.find(x=>x.id===id));o.acc=pickAcc(o,ctx,realItems.filter(x=>T(x).cat==="acc"));o.sc=scoreOutfit(o,ctx);o.score=o.sc.score;o.key=okey(o);S.shown[i]=o;S.openSwap=null;renderLooks(ctx,true)};
    for(const b of $$(".wear",box))b.onclick=()=>wear(+b.dataset.card,ctx);

    for (const b of $$('.feedback-btn', box)) {
        b.onclick = async () => {
            const i=+b.dataset.card, rating=b.dataset.feedback, o=S.shown[i];
            if(!o)return;
            const existing=(S.user.feedback||[]).find(f=>f.id===feedbackId(o,ctx));
            if(rating==='like'&&existing?.rating==='like'){
                await removeOutfitFeedback(i,ctx);
                return;
            }
            if(rating==='like'){
                await saveOutfitFeedback(i,'like',null,ctx);
            }else{
                S.feedbackReasonCard=S.feedbackReasonCard===i?null:i;
                renderLooks(ctx,true);
            }
        };
    }
    for (const b of $$('.feedback-reason[data-feedback-reason]', box)) {
        b.onclick=()=>saveOutfitFeedback(+b.dataset.card,'dislike',b.dataset.feedbackReason,ctx);
    }
    for(const b of $$('.feedback-clear',box))b.onclick=()=>removeOutfitFeedback(+b.dataset.feedbackClear,ctx);
    for(const b of $$(".detbtn",box))b.onclick=()=>{const i=+b.dataset.det,card=b.closest(".look"),open=!card.classList.contains("open");card.classList.toggle("open",open);b.setAttribute("aria-expanded",open);if(open)S.openDet.add(i);else S.openDet.delete(i)};
    wireLooksUI(ctx,keep);
    wireAINotes(ctx);
    dressPending();
}

const FEEDBACK_REASONS = [
    ["not-my-style", "Not my style"],
    ["dislike-colours", "Dislike colours"],
    ["too-warm", "Too warm"],
    ["too-cold", "Too cold"],
    ["unsuitable-occasion", "Unsuitable occasion"]
];

function snapshotFeedbackFeatures(o){
    return [o.inner,o.top,o.bottom,o.dress,o.outer,o.shoes,o.waist,...(o.acc||[])].filter(Boolean).map(item=>({
        id:String(item.id),name:String(item.name||''),type:String(item.type||''),
        category:String(T(item).cat||''),color:String(colorName(item.color)||''),
        pattern:String(item.pattern||'solid'),tags:(pTags(item)||[]).map(x=>String(x).toLowerCase()).slice(0,8)
    }));
}
function feedbackId(o,ctx){return[ctx.iso,S.occ||'class',S.vibe||'any',o.key].join('|')}
async function saveOutfitFeedback(i,rating,reason,ctx){
    const u=S.user,o=S.shown[i];if(!u||!o)return;
    u.feedback=Array.isArray(u.feedback)?u.feedback:[];
    const id=feedbackId(o,ctx),features=snapshotFeedbackFeatures(o);
    const record={
        id,rating,reason:reason||null,outfitKey:o.key,
        itemIds:features.map(x=>x.id),features,
        occasion:S.occ||'class',vibe:S.vibe||'any',
        temperature:Math.round(ctx.feels*10)/10,rain:!!ctx.rain,
        date:ctx.iso,timestamp:Date.now(),version:2
    };
    const existingIndex=u.feedback.findIndex(f=>f.id===id);
    if(existingIndex>=0)u.feedback[existingIndex]=record;else u.feedback.push(record);
    // Keep a bounded history while retaining recent preference signals.
    if(u.feedback.length>200)u.feedback=u.feedback.slice(-200);
    u.favourites=Array.isArray(u.favourites)?u.favourites:[];
    if(rating==='like'){
        const slotIds={inner:o.inner?.id||null,top:o.top?.id||null,bottom:o.bottom?.id||null,dress:o.dress?.id||null,outer:o.outer?.id||null,shoes:o.shoes?.id||null,waist:o.waist?.id||null,acc:(o.acc||[]).map(x=>x.id)};
        const fav={id,feedbackId:id,outfitKey:o.key,slotIds,itemIds:features.map(x=>x.id),features,occasion:S.occ||'class',vibe:S.vibe||'any',temperature:Math.round(ctx.feels*10)/10,rain:!!ctx.rain,date:ctx.iso,savedAt:Date.now()};
        const fi=u.favourites.findIndex(f=>f.feedbackId===id);if(fi>=0)u.favourites[fi]=fav;else u.favourites.push(fav);
    }else u.favourites=u.favourites.filter(f=>f.feedbackId!==id);
    await save();S.feedbackReasonCard=null;
    toast(rating==='like'?'Saved. AGORA will learn from this look.':'Thanks. AGORA will use this reason to improve similar recommendations.');
    S.seen.clear();
    renderLooks(ctx,true);
}
async function removeOutfitFeedback(i,ctx){
    const u=S.user,o=S.shown[i];if(!u||!o)return;
    const id=feedbackId(o,ctx);u.feedback=(u.feedback||[]).filter(f=>f.id!==id);
    u.favourites=(u.favourites||[]).filter(f=>f.feedbackId!==id);
    S.feedbackReasonCard=null;await save();S.seen.clear();
    toast('Feedback removed. AGORA will no longer use this vote.');
    renderLooks(ctx,true);
}

function fitPct(sc){return clamp(Math.round(sc),40,99)}
function lookCard(o,i,ctx,worn){
    const u=S.user,realItems=wardrobeItems(),Wd=wearable(realItems);const ev=eveningOuter(o,ctx,realItems);
    const umb=ctx.rain?(realItems.find(x=>x.type==="umbrella")||true):null;
    const host=o.top||o.dress,layerOK=host?Wd.some(x=>(LAYER[o.dress?"dress":host.type]||[]).includes(x.type)&&x!==o.top):false;
    const dressPants=o.dress&&Wd.some(x=>DRESS_BOTTOMS.includes(x.type));
    const st=styleFor(o,ctx);const slots=[["outer",o.outer],["top",o.top],["inner",o.inner],["dress",o.dress],["waist",o.waist],["bottom",o.bottom],["shoes",o.shoes]].filter(([k,it])=>it||(k==="outer"&&!ctx.athletic)||(k==="inner"&&layerOK&&!(o.dress&&o.bottom))||(k==="bottom"&&dressPants&&!o.inner));
    const EMPTY={outer:"No outer",inner:"Add a layer under",bottom:"Add pants under"};
    const pieces=slots.map(([k,it])=>`<li><button class="piece" data-card="${i}" data-slot="${k}" aria-expanded="${S.openSwap===i+":"+k}" title="Swap ${k==="inner"?"under-layer":k}">${it?`<span class="th">${thumb(it)}</span><span>${esc(it.name)}${k==="inner"?" <i style='color:var(--muted);font-style:normal'>(under)</i>":k==="waist"?" <i style='color:var(--muted);font-style:normal'>(at waist)</i>":""}</span>`:`<span class="th" style="font-size:16px;color:var(--muted)">+</span><span style="color:var(--muted)">${EMPTY[k]}</span>`}</button></li>`).join("")+(o.acc||[]).map(a=>`<li><span class="piece" style="cursor:default"><span class="th">${thumb(a)}</span><span>${esc(a.name)}</span></span></li>`).join("");
    let tray="";
    if(S.openSwap&&S.openSwap.startsWith(i+":")){const slot=S.openSwap.split(":")[1];let cands;
        if(slot==="inner"){const ok=LAYER[o.dress?"dress":host.type]||[];cands=Wd.filter(x=>T(x).cat==="top"&&ok.includes(x.type)&&x!==o.top)}
        else if(slot==="waist")cands=Wd.filter(x=>x.type==="shirt"&&x!==o.top&&x!==o.inner);
        else if(slot==="bottom"&&o.dress)cands=Wd.filter(x=>DRESS_BOTTOMS.includes(x.type));
        else{const cat=slot==="dress"?"dress":slot;cands=Wd.filter(x=>T(x).cat===cat)}
        cands=cands.filter(x=>x.id!==(o[slot]&&o[slot].id));
        const alts=cands.map(x=>({x,s:scoreOutfit(withSwap(o,slot,x),ctx).score}));
        if(["outer","inner","waist"].includes(slot)||(slot==="bottom"&&o.dress))if(o[slot])alts.push({x:null,s:scoreOutfit(withSwap(o,slot,null),ctx).score});
        alts.sort((a,b)=>b.s-a.s);const none={outer:"No outer",inner:"No layer",bottom:"No pants",waist:"Untie"}[slot];
        tray=`<div class="swaptray"><p>${slot==="inner"?"Layer something underneath":"Swap one piece, keep the rest"}. Fit score after the change:</p><div class="swaplist">${alts.slice(0,8).map(a=>`<button class="swapopt" data-card="${i}" data-slot="${slot}" data-id="${a.x?a.x.id:"none"}"><span class="th">${a.x?thumb(a.x):"–"}</span>${a.x?esc(a.x.name.split(" ").slice(-2).join(" ")):none}<i class="num">${fitPct(a.s)}</i></button>`).join("")||"<p>Nothing that fits here in your closet yet.</p>"}</div></div>`}
    const why=reasons(o,ctx);const trend=o.sc.tr[0];
    let extra="";
    if(ev&&ev.bring)extra+=`<div class="extra cold"><span class="th">${thumb(ev.bring)}</span><span><b>Bring for tonight:</b> ${esc(ev.bring.name)}. Feels ${Math.round(ev.ef)}° at ${pad(ev.h)}:00${ev.swap?", warmer than the layer you start with":""}.</span></div>`;
    else if(ev&&ev.keep)extra+=`<div class="extra cold"><span class="th">${thumb(ev.keep)}</span><span><b>Keep it on tonight.</b> Your ${esc(ev.keep.name.toLowerCase())} covers ${Math.round(ev.ef)}° at ${pad(ev.h)}:00.</span></div>`;
    else if(ev&&ev.none)extra+=`<div class="extra cold"><span>${ICON.cold}</span><span><b>Feels ${Math.round(ev.ef)}° tonight.</b> You have no outerwear saved yet. Add a jacket or padding to your closet.</span></div>`;
    if(umb)extra+=`<div class="extra rain"><span class="th">${umb===true?ICON.rain:thumb(umb)}</span><span><b>Umbrella:</b> ${umb===true?"bring one. There's none in your closet yet.":esc(umb.name)+"."} Rain ${pad(ctx.wx.rainStart)}:00–${pad(Math.min(24,ctx.wx.rainEnd))}:00.</span></div>`;
    const isWorn=worn.some(h=>h.key===o.key);

    const feedbackList = u.feedback || [];
    const currentFeedback = feedbackList.find(
        f => f.id === feedbackId(o, ctx)
    );

    const showReason = S.feedbackReasonCard === i;

    const nm=x=>T(x).label.toLowerCase();
    const core=o.dress&&o.bottom?`${nm(o.dress)} over ${nm(o.bottom)}`:o.inner?`${nm(host)} over ${nm(o.inner)}`:host?(o.bottom?`${nm(host)} & ${nm(o.bottom)}`:nm(host)):"look";
    const title=o.outer?`${nm(o.outer)}, ${core}`:core;
    const flat=[o.outer,o.top,o.inner,o.dress,o.waist,o.bottom,o.shoes,...(o.acc||[])].filter(Boolean);
    return`<article class="look ${S.openDet.has(i)||(S.openSwap&&S.openSwap.startsWith(i+":"))?"open":""}" data-i="${i}"><div class="alcove">${S.lookView==="flat"?`<div class="flatlay">${flat.map(p=>`<figure>${thumb(p)}<figcaption>${esc(p===o.inner?"Under":p===o.waist?"At waist":T(p).label)}</figcaption></figure>`).join("")}</div>`:mannequinSVG(o,i,{style:st,umbrella:umb,label:"Look "+(i+1)+": "+[o.outer,o.top,o.inner,o.dress,o.bottom,o.shoes].filter(Boolean).map(x=>x.name).join(", ")})}${o.waist&&S.lookView!=="flat"?`<span class="waistinset" title="Tied at the waist">${thumb(o.waist)}<i>tied at waist</i></span>`:""}<span class="badge">Look ${i+1}</span><span class="fit num" title="Fit score: weather, occasion, vibe and trend">${fitPct(o.score)} fit</span></div>
   <div class="lookbody"><h3>${esc(title.charAt(0).toUpperCase()+title.slice(1))}</h3><div class="lookdet" id="det-${i}"><ul class="pieces">${pieces}</ul>${tray}
   <ul class="why">${why.map(w=>`<li>${esc(w)}</li>`).join("")}${trend?`<li class="t">${esc(trend)}</li>`:""}${styleNotes(o,st).length?`<li class="s"><span><b style="font-weight:500">How to wear it:</b> ${esc(styleNotes(o,st).join(" "))}</span></li>`:""}</ul>${extra}</div>
   <div class="lookfoot">
    ${isWorn
        ? `<span class="worn">✓ Saved for ${esc(dayLabel(ctx.iso).toLowerCase())}</span>`
        : `<button class="btn wear" data-card="${i}">Wear this look</button>`
    }

    <button type="button"
        class="feedback-btn ${currentFeedback?.rating === "like" ? "selected" : ""}"
        data-feedback="like"
        data-card="${i}"
        aria-pressed="${currentFeedback?.rating === "like" ? "true" : "false"}">
        👍 Like
    </button>

    <button type="button"
        class="feedback-btn ${currentFeedback?.rating === "dislike" ? "selected" : ""}"
        data-feedback="dislike"
        data-card="${i}"
        aria-pressed="${currentFeedback?.rating === "dislike" ? "true" : "false"}">
        👎 Dislike
    </button>

    <button type="button"
        class="detbtn"
        data-det="${i}"
        aria-expanded="${S.openDet.has(i) || !!(S.openSwap && S.openSwap.startsWith(i + ":"))}"
        aria-controls="det-${i}">
        Pieces &amp; why
    </button>
</div>

${showReason ? `
    <div class="feedback-reasons">
        <p>Why didn't you like this outfit?</p>
        ${FEEDBACK_REASONS.map(([value, label]) => `
            <button type="button" class="feedback-reason" data-feedback-reason="${value}" data-card="${i}">${label}</button>
        `).join("")}
        ${currentFeedback?.rating === "dislike" ? `<button type="button" class="feedback-reason feedback-clear" data-feedback-clear="${i}">Remove my feedback</button>` : ""}
    </div>
` : ""}

${currentFeedback ? `
    <p class="feedback-saved">
        ${currentFeedback.rating === "like"
        ? "✓ You liked this outfit"
        : "✓ Feedback saved: " +
        (FEEDBACK_REASONS.find(r => r[0] === currentFeedback.reason)?.[1] || "Disliked")
    }
    </p>
` : ""}

</div></article>`;
}
async function wear(i,ctx){
    const o=S.shown[i],u=S.user,secs=Math.round((Date.now()-S.decisionStart)/1000);
    const outfitItems=[o.inner,o.top,o.bottom,o.dress,o.outer,o.shoes,o.waist,...(o.acc||[])].filter(Boolean);
    const itemIds=outfitItems.map(x=>x.id);
    const outfitName=outfitItems.map(x=>x.name).join(" + ")||"Recommended outfit";
    u.history=u.history||[];
    u.history.unshift({id:uid(),date:ctx.iso,ts:Date.now(),occ:S.occ==="day"?"calendar":S.occ,vibe:S.vibe,key:o.key,items:itemIds,feels:Math.round(ctx.feels*10)/10,rain:ctx.rain,score:Math.round(o.score),decisionSec:secs,feedback:null});

    // Save the chosen Today recommendation as the outfit planned for this date.
    // Keep ordinary calendar events, but replace any previous outfit selection for this date.
    u.schedule=u.schedule||{};
    const dayPlans=u.schedule[ctx.iso]||[];
    u.schedule[ctx.iso]=dayPlans.filter(e=>e.kind!=="outfit");
    u.schedule[ctx.iso].push({
        id:uid(),
        kind:"outfit",
        title:"Wear this look",
        outfitName,
        start:"00:00",
        end:"23:59",
        occ:S.occ==="day"?"calendar":(S.occ||"cafe"),
        items:itemIds,
        score:Math.round(o.score),
        vibe:S.vibe,
        savedAt:Date.now()
    });

    await save();
    toast(`Outfit saved to your Calendar for ${dayLabel(ctx.iso)}.`);
    S.decisionStart=Date.now();
    renderLooks(ctx,true);
}
setInterval(()=>{const el=$("#timer");if(el){const s=Math.round((Date.now()-S.decisionStart)/1000);el.textContent=`Deciding ${Math.floor(s/60)}:${pad(s%60)}`}},1000);
