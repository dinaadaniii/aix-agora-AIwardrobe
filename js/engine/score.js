"use strict";
/* AGORA · Recommendation context and outfit scoring */
/* ---------- context ---------- */
function targetWarmth(feels){return clamp((30-feels)/3+2,1.5,14)}
// A saved outfit is stored in the schedule as {kind:"outfit"}; it is not a plan with hours or an occasion.
function dayPlans(user,iso){return((user.schedule||{})[iso]||[]).filter(e=>e.kind!=="outfit")}
/* ---------- adaptive feedback learning ----------
   Rebuild the preference profile from saved feedback each time context is built.
   This makes learning deterministic: refreshes never add the same vote twice. */
function buildFeedbackLearning(user){
    const records=(user.feedback||[]).slice(-120),now=Date.now();
    const maps={item:{},type:{},color:{},pattern:{},tag:{},occasionType:{},warmth:{}};
    const add=(map,key,value)=>{if(!key)return;map[key]=(map[key]||0)+value};
    for(const f of records){
        if(!f||!['like','dislike'].includes(f.rating))continue;
        const age=Math.max(0,now-(Number(f.timestamp)||now));
        const decay=Math.max(.15,Math.exp(-age/(120*24*60*60*1000)));
        const positive=f.rating==='like',sign=positive?1:-1;
        const reason=f.reason||'';
        const features=Array.isArray(f.features)?f.features:[];
        for(const p of features){
            if(!p)continue;
            add(maps.item,p.id,sign*decay*(positive ? 0.9 : (reason==='not-my-style' ? 0.85 : reason==='dislike-colours' ? 0.35 : 0.25)));
            add(maps.type,p.type,sign*decay*(positive ? 0.22 : (reason==='not-my-style' ? 0.55 : reason==='unsuitable-occasion' ? 0.35 : 0.12)));
            add(maps.color,p.color,sign*decay*(positive ? 0.12 : (reason==='dislike-colours' ? 0.95 : reason==='not-my-style' ? 0.12 : 0.04)));
            add(maps.pattern,p.pattern,sign*decay*(positive ? 0.10 : (reason==='dislike-colours' ? 0.22 : reason==='not-my-style' ? 0.28 : 0.04)));
            if(Array.isArray(p.tags))for(const tag of p.tags.slice(0,8))
                add(maps.tag,String(tag).toLowerCase(),sign*decay*(positive ? 0.20 : (reason==='not-my-style' ? 0.65 : 0.06)));
            if(reason==='unsuitable-occasion')add(maps.occasionType,(f.occasion||'class')+'|'+p.type,-decay*.7);
        }
        // Warmth feedback is contextual: it only influences recommendations in a similar temperature band.
        if(reason==='too-warm'||reason==='too-cold'){
            const band=String(Math.floor((Number(f.temperature)||0)/5)*5);
            add(maps.warmth,band,(reason==='too-cold'?1:-1)*decay*.55);
        }
        // A positive vote gives a small signal for the same occasion/type combination.
        if(positive&&f.occasion)for(const p of features)add(maps.occasionType,f.occasion+'|'+p.type,decay*.10);
    }
    for(const group of Object.values(maps))for(const key of Object.keys(group))group[key]=clamp(group[key],-3,3);
    return maps;
}
function feedbackScoreAdjustment(o,ctx){
    const m=ctx.feedbackLearning;if(!m)return 0;
    const pieces=[o.inner,o.top,o.bottom,o.dress,o.outer,o.shoes,o.waist,...(o.acc||[])].filter(Boolean);
    if(!pieces.length)return 0;
    let total=0;
    for(const p of pieces){
        const color=colorName(p.color),tags=pTags(p)||[];
        let v=(m.item[p.id]||0)*1.15+(m.type[p.type]||0)*.85+(m.color[color]||0)*.55+(m.pattern[p.pattern]||0)*.35;
        for(const tag of tags)v+=(m.tag[String(tag).toLowerCase()]||0)*.35;
        v+=(m.occasionType[(ctx.occKey||'class')+'|'+p.type]||0)*.8;
        total+=v;
    }
    return clamp((total/pieces.length)*3,-10,10);
}
function feedbackWarmthAdjustment(ctx){
    const m=ctx.feedbackLearning;if(!m)return 0;
    const band=String(Math.floor((Number(ctx.feels)||0)/5)*5);
    return clamp(m.warmth[band]||0,-1.5,1.5);
}

function buildCtx(user,iso,occKey,vibe){
    const wx=dayWeather(iso,user.city),evs=dayPlans(user,iso).slice().sort((a,b)=>a.start.localeCompare(b.start));
    let s=9,e=18;
    if(evs.length){s=Math.min(...evs.map(x=>toH(x.start)));e=Math.max(...evs.map(x=>toH(x.end)))}
    if(iso===todayISO()){const now=new Date().getHours()+new Date().getMinutes()/60;if(now>s&&now<e-1)s=Math.floor(now)}
    const hrs=wx.hourly.filter(h=>h.h>=Math.floor(s)&&h.h<=Math.min(23,Math.ceil(e)));
    const feels=hrs.reduce((a,h)=>a+h.feels,0)/hrs.length,maxF=Math.max(...hrs.map(h=>h.feels));
    const rain=hrs.some(h=>h.wet);
    const eveHrs=wx.hourly.filter(h=>h.h>=19&&h.h<=23);const eve=eveHrs.reduce((m,h)=>h.feels<m.feels?h:m,eveHrs[0]);
    const eveNeeded=(maxF-eve.feels>=4)||(eve.feels<13&&maxF-eve.feels>=2);
    let fRange,occTags,occLabel;
    if(occKey==="day"&&evs.length){const os=[...new Set(evs.map(x=>x.occ))].map(k=>OCC[k]||OCC.cafe);
        let lo=Math.max(...os.map(o=>o.f[0])),hi=Math.min(...os.map(o=>o.f[1]));if(lo>hi){const m=(lo+hi)/2;lo=m-.7;hi=m+.7}
        fRange=[lo,hi];occTags=[...new Set(os.flatMap(o=>o.tags))];var occPref=[...new Set(os.flatMap(o=>o.pref))];occLabel=os.map(o=>o.label.toLowerCase()).join(" + ")}
    else{const o=OCC[occKey]||OCC.class;fRange=o.f.slice();occTags=o.tags;var occPref=o.pref;occLabel=o.label.toLowerCase()}
    const v=VIBES.find(x=>x[0]===vibe)?vibe:"any";
    if(v==="smart"){fRange=[fRange[0]+.4,fRange[1]+.6]}if(v==="classy"){fRange=[fRange[0]+.3,fRange[1]+.4]}
    const athletic=occKey==="athletic"||(occKey==="day"&&evs.length&&evs.every(x=>x.occ==="athletic"));
    const feedbackLearning=buildFeedbackLearning(user);
    return{iso,wx,evs,s,e,feels,maxF,rain,eve,eveNeeded,targetW:targetWarmth(feels),fRange,occTags,occPref,occLabel,occKey,vibe:v,athletic,prefs:user.prefs||{},feedbackLearning,feedbackWarmthBias:feedbackWarmthAdjustment({feedbackLearning,feels})};
}

/* ---------- scoring ---------- */
function hueGroups(items){const acc=items.filter(p=>!isNeutral(p.color)).map(p=>hsl(p.color).h);const g=[];for(const h of acc){if(!g.some(x=>Math.min(Math.abs(x-h),360-Math.abs(x-h))<28))g.push(h)}return g}
function scoreOutfit(o,ctx){
    let s=72;const tr=[];const pieces=[o.inner,o.top,o.bottom,o.dress,o.outer,o.shoes].filter(Boolean);
    const W=pW(o.inner)*.8+pW(o.top)+pW(o.bottom)+pW(o.dress)+pW(o.outer)+pW(o.shoes)+(o.acc||[]).reduce((a,x)=>a+pW(x),0);
    const learnedTargetW=ctx.targetW+(ctx.feedbackWarmthBias||0);const diff=W-learnedTargetW;s-=diff<0?(-diff)*7:diff*4.5;
    if(ctx.feels<12&&!o.outer)s-=8;if(o.bottom&&o.bottom.type==="shorts"&&ctx.feels<18)s-=14;if(o.bottom&&o.bottom.type==="miniskirt"&&ctx.feels<12)s-=6;if(ctx.feels>24&&o.outer)s-=14;
    const wts=[[o.top||o.dress,.32],[o.bottom||o.dress,.28],[o.shoes,.2],[o.outer,.2]].filter(x=>x[0]);const tw=wts.reduce((a,x)=>a+x[1],0);
    const F=wts.reduce((a,x)=>a+pF(x[0])*x[1],0)/tw;const[lo,hi]=ctx.fRange;if(F<lo)s-=(lo-F)*13;if(F>hi)s-=(F-hi)*10;
    const fs=pieces.filter(p=>p!==o.inner).map(pF),spread=Math.max(...fs)-Math.min(...fs);if(spread>2.9&&ctx.vibe!=="street")s-=(spread-2.9)*6;
    const has=(p,t)=>p&&pTags(p).includes(t);
    if(ctx.athletic){if(o.inner)s-=6;if(!has(o.shoes,"sporty"))s-=22;if(!has(o.top,"sporty"))s-=10;if(!(has(o.bottom,"sporty")))s-=12;if(o.outer&&!has(o.outer,"sporty")&&o.outer.type!=="padding")s-=8;if(o.dress)s-=30}
    else{if(o.shoes&&o.shoes.type==="runners"&&lo>=1.5)s-=10;if(o.bottom&&o.bottom.type==="joggers"&&lo>=1.5)s-=12;if(o.top&&o.top.type==="sporttop")s-=12}
    let hits=0;for(const p of pieces){const t=pTags(p);if(ctx.vibe!=="any"&&t.includes(ctx.vibe))hits+=1.6;else if(t.some(x=>ctx.occTags.includes(x)))hits+=.7}s+=hits*3;for(const p of pieces)if(ctx.occPref&&ctx.occPref.includes(p.type))s+=2.5;
    const groups=hueGroups(pieces).length;if(groups>2)s-=(groups-2)*10;
    if(groups===2){const a=hueGroups(pieces);const d=Math.min(Math.abs(a[0]-a[1]),360-Math.abs(a[0]-a[1]));if(d>45&&d<150)s-=7}
    const pats=pieces.filter(p=>["stripe","check","print"].includes(p.pattern)).length;if(pats>1)s-=ctx.vibe==="bold"?3:10;
    const L=p=>p?hsl(p.color).l:.5,upper=o.top||o.dress,contrast=Math.abs(L(upper)-L(o.bottom||o.dress));
    const avgL=pieces.reduce((a,p)=>a+L(p),0)/pieces.length;
    if(ctx.vibe==="minimal"){s+=groups===0?6:-groups*4;if(pats)s-=4}
    if(ctx.vibe==="classy"){if(groups===0)s+=4;if(o.outer&&["coat","trench","blazer"].includes(o.outer.type))s+=4}
    if(ctx.vibe==="soft"){if(avgL>.58)s+=6;if(contrast<.3)s+=3;if(avgL<.3)s-=5}
    if(ctx.vibe==="bold"){if(groups>=1||contrast>.55)s+=7;else s-=5}
    if(ctx.vibe==="street"&&o.shoes&&["sneakers","boots"].includes(o.shoes.type))s+=2;
    /* FW26 trend layer */
    const warm=pieces.filter(p=>isWarmNeutral(p.color)).length;
    if(groups===0&&warm>=2){s+=5;tr.push("Tonal beige-and-brown layering, this season's elegant minimalism")}
    const nm=pieces.map(p=>colorName(p.color));
    if(nm.some(n=>["Brown","Chocolate","Camel"].includes(n))&&nm.some(n=>["Navy","Denim blue","Cream","Ivory"].includes(n))){s+=3;tr.push("Brown with navy or cream: FW26's quiet pairing")}
    if(o.outer&&["coat","trench","longpadding"].includes(o.outer.type)&&o.top&&["knit","shirt","turtleneck","cardigan"].includes(o.top.type)){s+=3;tr.push("Layered lengths: a knit or shirt under a longer coat for the day-to-night swing")}
    if(o.bottom&&["trousers","cargo","midiskirt","flarejeans"].includes(o.bottom.type)){s+=2;tr.push("Relaxed, wide silhouette rather than a skinny fit")}
    if(o.shoes&&o.shoes.type==="loafers"&&o.bottom&&["jeans","flarejeans","trousers"].includes(o.bottom.type)){s+=3;tr.push("Loafers with denim or wide trousers")}
    if(o.shoes&&o.shoes.type==="boots"&&(o.dress||(o.bottom&&["midiskirt","miniskirt"].includes(o.bottom.type)))){s+=4;tr.push("Tall boots with a skirt")}
    if(o.outer&&o.outer.type==="blazer"&&((o.bottom&&o.bottom.type==="jeans")||(o.shoes&&o.shoes.type==="sneakers"))){s+=3;tr.push("A blazer dressed down with denim or clean sneakers")}
    if(o.inner){const it=o.inner.type,host=o.top||o.dress,ht=host.type;
        if(it==="shirt"&&["knit","sweatshirt","cardigan"].includes(ht)){s+=4;tr.unshift("Collared shirt peeking out of a knit: easy preppy layering")}
        else if(it==="longsleeve"&&ht==="tee"){const st=o.inner.pattern==="stripe";s+=st?5:3;tr.unshift(st?"Striped long-sleeve under a plain tee, a 2000s-revival layer":"Long-sleeve layered under a short-sleeve tee")}
        else if(it==="turtleneck"){s+=3;tr.unshift("Turtleneck layered under a "+T(host).label.toLowerCase())}
        else if(o.dress){s+=2;tr.unshift("A top layered under the dress")}else s+=1;
        if(cdist(o.inner.color,host.color)<40)s-=5}
    if(o.waist){s+=2+(o.waist.pattern==="check"?3:0)+(ctx.vibe==="street"?2:0);if(ctx.feels<14)s-=8;if(o.outer)s-=6;if(["dinner","smart","formal"].includes(ctx.occKey))s-=10;tr.unshift(`${o.waist.pattern==="check"?"Flannel":"Shirt"} tied at the waist, a 90s street detail`)}
    if(o.dress&&o.bottom){const bt=o.bottom.type;if(bt==="flarejeans"){s+=6;tr.unshift("Midi dress over flare jeans, the 2000s K-drama revival")}else if(bt==="jeans"){s+=3;tr.unshift("A dress layered over jeans")}else s+=1;if(ctx.occKey==="formal")s-=8}
    if(o.outer&&o.outer.pattern==="denim"&&o.bottom&&o.bottom.pattern==="denim"&&Math.abs(L(o.outer)-L(o.bottom))<.14&&ctx.vibe!=="bold")s-=9;
    if(o.shoes&&["derbies","heels","loafers"].includes(o.shoes.type)&&o.bottom&&o.bottom.type==="joggers")s-=14;
    if(o.shoes&&o.shoes.type==="runners"&&((o.outer&&["blazer","coat","trench"].includes(o.outer.type))||(o.bottom&&o.bottom.type==="slacks"))&&ctx.vibe!=="street")s-=9;
    if(o.top&&o.top.type==="hoodie"&&o.shoes&&["derbies","heels"].includes(o.shoes.type))s-=8;
    if(upper&&o.bottom&&!isNeutral(upper.color)&&cdist(upper.color,o.bottom.color)<45)s-=5;
    if(ctx.rain){if(o.shoes&&o.shoes.suede)s-=10;if(o.outer&&o.outer.suede)s-=8;if(o.shoes&&o.shoes.type==="sneakers"&&L(o.shoes)>.85)s-=2;if(o.outer&&o.outer.type==="trench"){s+=4;tr.push("Trench coat for showers")}}
    for(const p of pieces)s+=clamp(ctx.prefs[p.id]||0,-3,3)*1.6;
    s+=feedbackScoreAdjustment(o,ctx);
    return{score:s,W,F,tr,groups,contrast,avgL};
}
function pickAcc(o,ctx,accs){
    const out=[];const pal=[o.top,o.bottom,o.outer,o.dress].filter(Boolean);
    const best=(list)=>list.map(a=>({a,d:hueGroups([...pal,a]).length*40+(isNeutral(a.color)?0:10)})).sort((x,y)=>x.d-y.d)[0]?.a;
    if(ctx.feels<7){const sc=best(accs.filter(a=>a.type==="scarf"));if(sc)out.push(sc)}
    if(ctx.feels<1&&["any","street","casual","sporty"].includes(ctx.vibe)){const b=best(accs.filter(a=>a.type==="beanie"));if(b)out.push(b)}
    if(ctx.athletic&&ctx.feels>18){const c=best(accs.filter(a=>a.type==="cap"));if(c)out.push(c)}
    if(!ctx.athletic&&(["dinner","date","shopping","smart"].includes(ctx.occKey)||["classy"].includes(ctx.vibe))){const b=best(accs.filter(a=>a.type==="bag"));if(b)out.push(b)}
    return out;
}
const okey=o=>[o.inner,o.top,o.bottom,o.dress,o.outer,o.shoes,o.waist].map(x=>x?x.id:"-").join("|");
function generate(items0,ctx,fixed){
    const items=wearable(items0),by=c=>items.filter(i=>T(i).cat===c);
    const tops=by("top"),accs=by("acc");let bottoms=by("bottom"),dresses=by("dress"),outers=[null,...by("outer")],shoes=by("shoes");
    const fc=fixed?T(fixed).cat:null;if(fc==="bottom")bottoms=[fixed];if(fc==="outer")outers=[fixed];if(fc==="shoes")shoes=[fixed];if(fc==="dress")dresses=[fixed];
    const bases=[];
    if(fc!=="dress")for(const t of tops){const inners=tops.filter(i=>i!==t&&(LAYER[t.type]||[]).includes(i.type));for(const inn of[null,...inners]){if(fc==="top"&&t!==fixed&&inn!==fixed)continue;for(const b of bottoms)bases.push({top:t,inner:inn,bottom:b})}}
    const dIn=tops.filter(i=>LAYER.dress.includes(i.type)),dB=bottoms.filter(b=>DRESS_BOTTOMS.includes(b.type));
    for(const d of dresses)for(const inn of[null,...dIn])for(const b of[null,...dB]){if(inn&&b)continue;if(fc==="top"&&inn!==fixed)continue;if(fc==="bottom"&&b!==fixed)continue;bases.push({dress:d,inner:inn,bottom:b})}
    const shoeList=shoes.length?shoes:[null];const res=[];
    for(const base of bases)for(const ou of outers)for(const sh of shoeList){
        const o={top:base.top||null,inner:base.inner||null,bottom:base.bottom||null,dress:base.dress||null,outer:ou,shoes:sh};
        if(fixed&&![o.top,o.inner,o.bottom,o.dress,o.outer,o.shoes].includes(fixed))continue;
        o.acc=pickAcc(o,ctx,accs);const sc=scoreOutfit(o,ctx);o.sc=sc;o.score=sc.score;o.key=okey(o);res.push(o);
    }
    res.sort((a,b)=>b.score-a.score);
    if(!fixed&&ctx.feels>=14&&!ctx.athletic&&!["dinner","smart","formal"].includes(ctx.occKey)){const shirts=tops.filter(t=>t.type==="shirt").slice(0,3),extra=[];
        for(const o of res.slice(0,40)){if(o.outer)continue;for(const sh of shirts){if(sh===o.top||sh===o.inner)continue;const v=Object.assign({},o,{waist:sh});v.sc=scoreOutfit(v,ctx);v.score=v.sc.score;v.key=okey(v);extra.push(v)}}
        res.push(...extra);res.sort((a,b)=>b.score-a.score)}
    return res;
}
function withSwap(o,slot,x){const t=Object.assign({},o,{[slot]:x});
    if(slot==="top"&&t.inner&&(!x||t.inner===x||!(LAYER[x.type]||[]).includes(t.inner.type)))t.inner=null;
    if(slot==="dress"&&!x)t.bottom=t.bottom||null;return t}
function diffCount(a,b){let n=0;for(const k of["inner","top","bottom","dress","outer","shoes","waist"])if((a[k]&&a[k].id)!==(b[k]&&b[k].id))n++;return n}
function pickDiverse(list,n,seen){const out=[];for(const c of list){if(seen&&seen.has(c.key))continue;if(c.score<list[0].score-40)break;if(out.every(o=>diffCount(o,c)>=2))out.push(c);if(out.length===n)break}return out}
function eveningOuter(o,ctx,items){
    if(!ctx.eveNeeded)return null;const ef=ctx.eve.feels,need=targetWarmth(ef);
    const base=pW(o.inner)*.8+pW(o.top)+pW(o.bottom)+pW(o.dress)+(o.acc||[]).reduce((a,x)=>a+pW(x),0);
    if(o.outer&&base+pW(o.outer)>=need-1.2)return{keep:o.outer,ef,h:ctx.eve.h};
    const outs=wearable(items).filter(i=>T(i).cat==="outer");if(!outs.length)return{none:true,ef,h:ctx.eve.h};
    const ectx=Object.assign({},ctx,{feels:ef,targetW:need,rain:false});
    const best=outs.map(ou=>({ou,s:scoreOutfit(Object.assign({},o,{outer:ou}),ectx).score})).sort((a,b)=>b.s-a.s)[0];
    return{bring:best.ou,ef,h:ctx.eve.h,swap:!!o.outer};
}
function reasons(o,ctx){
    const r=[];const d=o.sc.W-ctx.targetW,f=Math.round(ctx.feels);
    const win=`${hm(ctx.s)}–${hm(Math.min(ctx.e,23))}`;
    if(Math.abs(d)<=1.3)r.push(`Right warmth for ${f}° (feels-like) between ${win}.`);
    else if(d<0)r.push(`A little light for ${f}°. Keep the top layer closed.`);
    else r.push(`A touch warm for ${f}°. Open the outer layer at midday.`);
    const g=o.sc.groups;const pal=g===0?(o.sc.avgL>.6?"Light, tonal neutrals":"Neutral palette"):g===1?"One accent colour":"Two-colour contrast";
    const v=ctx.vibe!=="any"?VIBES.find(x=>x[0]===ctx.vibe)[1].toLowerCase()+" ":"";
    r.push(`${pal}, pitched at the right polish for ${v}${ctx.occLabel}.`);
    return r;
}
