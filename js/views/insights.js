"use strict";
/* AGORA · Gap analysis and wear journal */
/* ---------- GAP ANALYSIS ---------- */
const STAPLES=[["Navy blazer","blazer","#26314d"],["Black wide trousers","trousers","#1f1e1d"],["White oxford shirt","shirt","#f4f1ea"],["Camel wool coat","coat","#b98b56"],["Beige trench coat","trench","#cdb48a"],["Dark straight jeans","jeans","#2d3a52","denim"],["White leather sneakers","sneakers","#f2efe9"],["Black loafers","loafers","#1c1b1a"],["Brown leather boots","boots","#5b3b28"],["Grey crewneck knit","knit","#9a9894","knit"],["Cream cardigan","cardigan","#e9dcc3","knit"],["Black short padding","padding","#1d1d1d","quilt"],["Plain white tee","tee","#f5f3ee"],["Charcoal turtleneck","turtleneck","#3a3836","knit"],["Brown midi skirt","midiskirt","#6e4b33"],["Running shoes","runners","#9aa3ad"],["Training joggers","joggers","#2b2b2b"],["Ivory blouse with bow","blouse","#efe8d8"],["Flare jeans","flarejeans","#4a6585","denim"],["Striped long-sleeve tee","longsleeve","#f1ece2","stripe"],["Midi dress","dress","#a7b49a"],["Compact umbrella","umbrella","#2a2826"]];
const PASS=85;const coreKey=o=>[o.inner,o.top,o.bottom,o.dress,o.outer].map(x=>x?x.id:"-").join("|");const art=n=>/s$/.test(n.split(" ").pop())?"":/^[aeiou]/i.test(n)?"an ":"a ";
function renderGaps(){
    const u=S.user,days=[0,1,2,3,4,5,6].map(i=>addDays(todayISO(),i));
    const feelsOf=d=>buildCtx(u,d,"class","any").feels;const sorted=days.slice().sort((a,b)=>feelsOf(a)-feelsOf(b));
    const scen=[...new Set([S.date,sorted[0]])];
    $("#covday").textContent=dayLabel(S.date).toLowerCase();
    const weekItems=wardrobeItems();const canDress=weekItems.some(i=>T(i).cat==="top")&&weekItems.some(i=>T(i).cat==="bottom");
    // baseline
    const base={};let todayCount=0;const todaySet=new Set();
    for(const d of scen)for(const o of OCCASIONS){const ctx=buildCtx(u,d,o.k,"any");const list=canDress?generate(wardrobeItems(),ctx):[];const good=list.filter(x=>x.score>=PASS);base[d+o.k]=new Set(good.map(coreKey)).size;if(d===S.date){todayCount+=0;good.forEach(g=>todaySet.add(coreKey(g)))}}
    $("#gapstitle").textContent=`${u.items.length} pieces → ${todaySet.size} strong looks for ${dayLabel(S.date).toLowerCase()}`;
    $("#gapssub").textContent=`Every combination of what you own is scored for each occasion at ${dayLabel(S.date).toLowerCase()}'s forecast and this week's coldest day (${dayLabel(sorted[0]).toLowerCase()}). A look counts when it scores ${PASS}+ out of 100; shoe swaps of the same outfit count once.`;
    $("#covtable").innerHTML=`<tr><th>Occasion</th><th class="n">Looks</th><th></th></tr>`+OCCASIONS.map(o=>{const n=base[S.date+o.k]||0;return`<tr><td>${esc(o.label)}</td><td class="n">${n}</td><td><span class="pill ${n===0?"none":n<4?"thin":"ok"}">${n===0?"gap":n<4?"thin":"covered"}</span></td></tr>`}).join("");
    // staples
    const rainyDays=days.filter(d=>{const c=buildCtx(u,d,"class","any");return c.rain||c.wx.rainP>=.5}).length;
    const owned=s=>u.items.some(i=>i.type===s[1]&&cdist(i.color,s[2])<60);
    const res=[];
    const wearsFem=u.gender!=="male";for(const s of STAPLES){if(owned(s)||(FEM.includes(s[1])&&!wearsFem))continue;const it={id:"staple_"+s[1]+s[2],name:s[0],type:s[1],color:s[2],pattern:s[3]||"solid",sample:true};
        if(s[1]==="umbrella"){if(!u.items.some(i=>i.type==="umbrella"))res.push({it,n:rainyDays,special:`Covers ${rainyDays} rainy day${rainyDays===1?"":"s"} in the next week`,opens:[]});continue}
        if(!canDress&&!["top","bottom"].includes(T(it).cat)){res.push({it,n:0,opens:[]});continue}
        const items=u.items.concat([it]);const keys=new Set(),opens=new Set();
        for(const d of scen)for(const o of OCCASIONS){const ctx=buildCtx(u,d,o.k,"any");const g=generate(items.filter(x=>!x.sample&&x.img),ctx,it).filter(x=>x.score>=PASS);g.forEach(x=>keys.add(coreKey(x)));if(g.length&&!(base[d+o.k]))opens.add(o.label)}
        res.push({it,n:keys.size,opens:[...opens]});}
    res.sort((a,b)=>b.n-a.n);
    const top=res.filter(r=>r.n>0).slice(0,7);
    $("#staples").innerHTML=top.length?top.map(r=>`<div class="staple"><div class="th">${flatSVG(r.it)}</div><div><h3>${esc(r.it.name)}</h3><p>${r.special?esc(r.special):`Adding ${art(r.it.name)}${esc(r.it.name.toLowerCase())} unlocks ${r.n} new outfit combination${r.n===1?"":"s"} with your current pieces.`}${r.opens.length?` Fills your gap for ${esc(r.opens.slice(0,3).join(", ").toLowerCase())}.`:""}</p></div><div class="big num">+${r.n}<small>${r.special?"days":"looks"}</small></div></div>`).join("")+`<p class="note">AGORA suggests a few versatile staples, not more shopping. In our week 9 model (simulated data), every extra closet item added about 0.04 minutes to decision time, so each staple here has to earn its place.</p>`
        :`<p class="note">No single staple adds a strong new look right now. Your closet already covers this week well.</p>`;
}

/* ---------- JOURNAL ---------- */
function renderJournal(){
    const u=S.user,h=u.history||[];const rated=h.filter(x=>x.feedback);
    const avg=h.length?h.reduce((a,x)=>a+x.decisionSec,0)/h.length:0;
    $("#jtiles").innerHTML=`<div class="tile"><b class="num">${h.length}</b><span>Looks worn</span></div><div class="tile"><b class="num">${h.length?Math.floor(avg/60)+":"+pad(Math.round(avg%60)):"–"}</b><span>Avg. decision time</span></div><div class="tile"><b class="num">${rated.length?Math.round(rated.filter(x=>x.feedback==="right").length/rated.length*100)+"%":"–"}</b><span>Felt right</span></div><div class="tile"><b class="num">10:00+</b><span>Before AGORA (persona)</span></div>`;
    const byId=Object.fromEntries(u.items.map(i=>[i.id,i]));
    $("#jlist").innerHTML=h.length?h.map(x=>{const its=x.items.map(id=>byId[id]).filter(Boolean);return`<div class="jrow"><div class="dots">${its.slice(0,5).map(i=>`<span class="th">${thumb(i)}</span>`).join("")}</div><div><p>${esc(dayLabel(x.date))} · ${esc(x.occ==="calendar"?"From calendar":(OCC[x.occ]||{label:x.occ}).label)}${x.vibe!=="any"?" · "+esc(x.vibe):""}</p><small class="num">${esc(its.map(i=>i.name).join(", "))} · feels ${Math.round(x.feels)}°${x.rain?" · rain":""} · decided in ${Math.floor(x.decisionSec/60)}:${pad(x.decisionSec%60)}</small></div><div class="fb"><button class="btn ghost small right" data-fb="${x.id}|right" aria-pressed="${x.feedback==="right"}">Felt right</button><button class="btn ghost small regret" data-fb="${x.id}|regret" aria-pressed="${x.feedback==="regret"}">Regretted it</button></div></div>`}).join("")
        :`<div class="empty"><h3>Nothing logged yet</h3><p>Press "Wear this look" on Today. AGORA records the look and how long you took to choose.</p></div>`;
    for(const b of $$("[data-fb]"))b.onclick=async()=>{const[id,fb]=b.dataset.fb.split("|");const x=h.find(y=>y.id===id);const prev=x.feedback;x.feedback=prev===fb?null:fb;u.prefs=u.prefs||{};
        const delta=(v)=>v==="right"?1:v==="regret"?-1:0;for(const iid of x.items)u.prefs[iid]=clamp((u.prefs[iid]||0)-delta(prev)+delta(x.feedback),-3,3);await save();renderJournal()};
}
function historyCSV(){const u=S.user,byId=Object.fromEntries(u.items.map(i=>[i.id,i]));const rows=[["date","occasion","vibe","feels_like_c","rain","decision_time_sec","fit_score","items","feedback"]];
    for(const x of u.history||[])rows.push([x.date,x.occ,x.vibe,x.feels,x.rain?1:0,x.decisionSec,x.score,x.items.map(id=>byId[id]?byId[id].name:"").join("; "),x.feedback||""]);
    return rows.map(r=>r.map(v=>/[",\n]/.test(String(v))?'"'+String(v).replace(/"/g,'""')+'"':v).join(",")).join("\n")}
