"use strict";
/* AGORA · Week and month calendar views */
/* ---------- WEEK & CALENDAR ---------- */
function renderWeek(){
    const u=S.user,days=[0,1,2,3,4,5,6].map(i=>addDays(todayISO(),i));
    $("#evday").innerHTML=days.map(d=>`<option value="${d}">${dayLabel(d)}</option>`).join("");
    if(!$("#evocc").options.length)$("#evocc").innerHTML=OCCASIONS.map(o=>`<option value="${o.k}">${o.label}</option>`).join("");
    const weekItems=wardrobeItems();const canDress=weekItems.some(i=>T(i).cat==="top")&&weekItems.some(i=>T(i).cat==="bottom");
    $("#weekgrid").innerHTML=days.map(d=>{const w=dayWeather(d,u.city),evs=dayPlans(u,d).slice().sort((a,b)=>a.start.localeCompare(b.start));
        let mini="";if(canDress){const ctx=buildCtx(u,d,evs.length?"day":"class","any");const top=generate(wardrobeItems(),ctx)[0];if(top){const ev=eveningOuter(top,ctx,wardrobeItems());mini=`<div class="mini"><div class="alc">${`<div class="flatlay">${[top.outer,top.top||top.dress,top.bottom,top.shoes].filter(Boolean).map(p=>`<figure>${thumb(p)}<figcaption>${esc(p.name)}</figcaption></figure>`).join("")}</div>`}</div><div style="font-size:13px;display:grid;gap:4px"><b style="font-weight:500">${esc([top.outer,top.top||top.dress,top.bottom].filter(Boolean).map(x=>x.name).join(" · "))}</b><span style="color:var(--muted)">${esc(top.shoes?top.shoes.name:"")}</span>${ev&&ev.bring?`<span style="color:var(--terracotta)">Tonight: bring ${esc(ev.bring.name.toLowerCase())}</span>`:""}${ctx.rain?`<span style="color:var(--rain)">Umbrella</span>`:""}<button class="linkbtn" data-open="${d}" style="justify-self:start">Open three looks</button></div></div>`}}
        return`<div class="wday"><header><h3>${esc(dayLabel(d))}</h3><span class="wxl num">${Math.round(w.tmin)}°/${Math.round(w.tmax)}° · ${esc(w.cond)} · ${Math.round(w.hum)}%</span></header>
  ${evs.length?`<ul>${evs.map(e=>`<li><time>${e.start}</time><span>${esc(e.title)}</span><span class="tag">${esc((OCC[e.occ]||OCC.cafe).label)}</span><button aria-label="Remove ${esc(e.title)}" data-rm="${d}|${e.id}">×</button></li>`).join("")}</ul>`:`<span style="font-size:13px;color:var(--muted)">No plans. Top look assumes going to class.</span>`}${mini}</div>`}).join("");
    for(const b of $$("[data-rm]"))b.onclick=async()=>{const[d,id]=b.dataset.rm.split("|");u.schedule[d]=(u.schedule[d]||[]).filter(e=>e.id!==id);await save();renderWeek()};
    dressPending();
    for(const b of $$("[data-open]"))b.onclick=()=>{S.date=b.dataset.open;S.occ=null;S.seen.clear();S.decisionStart=Date.now();location.hash="today"};
}
$("#evtitle").addEventListener("input",e=>{$("#evocc").value=guessOcc(e.target.value)});
$("#evform").addEventListener("submit",async e=>{e.preventDefault();const u=S.user,d=$("#evday").value;let st=$("#evstart").value,en=$("#evend").value;if(en<=st)en=hm(Math.min(23.5,toH(st)+1.5));
    (u.schedule[d]=u.schedule[d]||[]).push({id:uid(),title:$("#evtitle").value.trim(),start:st,end:en,occ:$("#evocc").value});await save();$("#evtitle").value="";toast("Plan added.");renderWeek()});
$("#icsfile").addEventListener("change",async e=>{const f=e.target.files[0];if(!f)return;const txt=await f.text();const n=importICS(txt);await save();e.target.value="";toast(n?`Imported ${n} plan${n>1?"s":""} for the next 30 days.`:"No events in the next 30 days were found in that file.");render()});
function importICS(txt){
    const lines=txt.replace(/\r?\n[ \t]/g,"").split(/\r?\n/);let ev=null,n=0;const u=S.user,lim=addDays(todayISO(),30),t0=todayISO();
    const pd=v=>{const m=v.match(/(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))?(Z)?/);if(!m)return null;let d=m[6]?new Date(Date.UTC(+m[1],m[2]-1,+m[3],+(m[4]||9),+(m[5]||0))):new Date(+m[1],m[2]-1,+m[3],+(m[4]||9),+(m[5]||0));return d};
    for(const l of lines){if(l==="BEGIN:VEVENT")ev={};else if(l==="END:VEVENT"&&ev){if(ev.s&&ev.t){const d=isoDate(ev.s);if(d>=t0&&d<=lim){const e=ev.e||new Date(ev.s.getTime()+36e5);const list=(u.schedule[d]=u.schedule[d]||[]);if(!list.some(x=>x.title===ev.t&&x.start===pad(ev.s.getHours())+":"+pad(ev.s.getMinutes()))){list.push({id:uid(),title:ev.t.slice(0,60),start:pad(ev.s.getHours())+":"+pad(ev.s.getMinutes()),end:isoDate(e)===d?pad(e.getHours())+":"+pad(e.getMinutes()):"23:00",occ:guessOcc(ev.t)});n++}}}ev=null}
    else if(ev){const i=l.indexOf(":");if(i<0)continue;const k=l.slice(0,i).split(";")[0],v=l.slice(i+1);if(k==="DTSTART")ev.s=pd(v);if(k==="DTEND")ev.e=pd(v);if(k==="SUMMARY")ev.t=v.replace(/\\,/g,",").replace(/\\n/g," ")}}
    return n;
}

/* ---------- MONTH CALENDAR ---------- */
let calendarMonth=new Date(new Date().getFullYear(),new Date().getMonth(),1);
let calendarSelected=todayISO();
function renderCalendar(){
    const y=calendarMonth.getFullYear(),m=calendarMonth.getMonth();
    $("#cal-title").textContent=calendarMonth.toLocaleDateString(undefined,{month:"long",year:"numeric"});
    const first=new Date(y,m,1),offset=first.getDay(),start=new Date(y,m,1-offset);
    const days=Array.from({length:42},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return isoDate(d)});
    const heads=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    $("#calendar-grid").innerHTML=heads.map(x=>`<div class="calendar-dow">${x}</div>`).join("")+days.map(d=>{
        const evs=(S.user.schedule[d]||[]).slice().sort((a,b)=>a.start.localeCompare(b.start));
        const dt=parseISO(d),outside=dt.getMonth()!==m;
        return `<button type="button" class="calendar-day ${outside?'outside':''} ${d===todayISO()?'today':''} ${d===calendarSelected?'selected':''}" data-caldate="${d}"><b>${dt.getDate()}</b>${evs.filter(e=>e.kind==="outfit").slice(0,1).map(e=>`<span class="calendar-event-dot">👗 Outfit saved</span>`).join('')}${evs.filter(e=>e.kind!=="outfit").slice(0,2).map(e=>`<span class="calendar-event-dot">${esc(e.start)} ${esc(e.title)}</span>`).join('')}${evs.filter(e=>e.kind!=="outfit").length>2?`<span class="calendar-event-dot">+${evs.filter(e=>e.kind!=="outfit").length-2} more</span>`:''}</button>`;
    }).join("");
    for(const b of $$("[data-caldate]"))b.onclick=()=>{calendarSelected=b.dataset.caldate;renderCalendar()};
    const selected=parseISO(calendarSelected);$("#cal-day-title").textContent=selected.toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric",year:"numeric"});
    const events=(S.user.schedule[calendarSelected]||[]).slice().sort((a,b)=>(a.start||"").localeCompare(b.start||""));
    const outfitEvent=events.find(e=>e.kind==="outfit");
    const regularEvents=events.filter(e=>e.kind!=="outfit");
    const itemById=Object.fromEntries((S.user.items||[]).map(it=>[String(it.id),it]));
    const outfitPieces=outfitEvent?(outfitEvent.items||[]).map(id=>itemById[String(id)]).filter(Boolean):[];
    const outfitMarkup=outfitEvent?`<div class="calendar-outfit">
        <div class="calendar-outfit-head"><div><div class="eyebrow">Planned outfit</div><h3>${esc(outfitEvent.outfitName||outfitEvent.title||"Wear this look")}</h3></div><span class="tag">${outfitEvent.score?esc(outfitEvent.score+" fit"):"Saved from Today"}</span></div>
        ${outfitPieces.length?`<div class="calendar-outfit-pieces">${outfitPieces.map(it=>`<div class="calendar-outfit-piece"><span class="th">${thumb(it)}</span><span>${esc(it.name)}</span></div>`).join("")}</div>`:`<p class="note">This outfit is saved, but one or more wardrobe items are no longer available.</p>`}
        <button class="btn ghost small" id="cal-remove-outfit" type="button">Remove planned outfit</button>
    </div>`:"";
    const eventsMarkup=regularEvents.length?`<ul class="sched">${regularEvents.map(e=>`<li><b class="num">${esc(e.start||"")}–${esc(e.end||"")}</b><span>${esc(e.title)}</span><span class="tag">${esc((OCC[e.occ]||OCC.cafe).label)}</span></li>`).join('')}</ul>`:"";
    $("#cal-events").innerHTML=(outfitMarkup||eventsMarkup)?outfitMarkup+eventsMarkup:`<p class="note">No plans or outfits saved for this day. Choose “Wear this look” on Today to add an outfit here.</p>`;
    const removeOutfit=$("#cal-remove-outfit");
    if(removeOutfit)removeOutfit.onclick=async()=>{
        S.user.schedule[calendarSelected]=(S.user.schedule[calendarSelected]||[]).filter(e=>e.kind!=="outfit");
        await save();
        toast("Planned outfit removed from Calendar.");
        renderCalendar();
    };
    $("#cal-open-today").onclick=()=>{S.date=calendarSelected;location.hash="today"};
    $("#cal-prev").onclick=()=>{calendarMonth=new Date(y,m-1,1);renderCalendar()};
    $("#cal-next").onclick=()=>{calendarMonth=new Date(y,m+1,1);renderCalendar()};
}
