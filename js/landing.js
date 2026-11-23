"use strict";
/* AGORA · landing page: photo walls, rotating headline, scroll effects, and a live demo of the real recommender */
(function(){
    const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pick=(set,i)=>PHOTOS[set][i%PHOTOS[set].length];

    /* nav turns solid after the hero starts scrolling */
    const nav=$("#nav");
    const onScroll=()=>nav.classList.toggle("solid",scrollY>40);
    addEventListener("scroll",onScroll,{passive:true});onScroll();

    /* hero photo walls: each column holds its list twice so the drift loops seamlessly */
    for(const col of $$(".hero-wall .col")){
        const ids=PHOTOS[col.dataset.set]||[];
        const html=ids.map(id=>`<img src="${PH(id,500)}" alt="" loading="lazy" decoding="async">`).join("");
        col.innerHTML=html+html;
    }

    /* rotating word in the headline */
    const words=["class","rain","a date","−3°","the gym","brunch","a 9am"];
    const rot=$("#rot");let wi=0;
    if(rot&&!reduce)setInterval(()=>{wi=(wi+1)%words.length;rot.classList.remove("swap");void rot.offsetWidth;rot.textContent=words[wi];rot.classList.add("swap")},2200);

    /* count-up stats when they enter the screen */
    const counters=$$("[data-count]");
    if(!reduce&&"IntersectionObserver" in window){
        const io=new IntersectionObserver(es=>{for(const e of es){if(!e.isIntersecting)continue;io.unobserve(e.target);
            const el=e.target,to=+el.dataset.count,t0=performance.now();
            const step=t=>{const k=Math.min(1,(t-t0)/900);el.textContent=Math.round(to*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(step)};
            el.textContent="0";requestAnimationFrame(step)}},{threshold:.6});
        counters.forEach(c=>io.observe(c));
    }

    /* how it works: the sticky photo follows the step in view */
    const howImg=$("#how-img"),howNum=$("#how-num"),steps=$$(".how-steps li");
    const showStep=li=>{
        steps.forEach(s=>s.classList.toggle("on",s===li));
        const [set,i]=li.dataset.img.split(":"),src=PH(pick(set,+i),1000);
        if(howImg.dataset.src===src)return;
        howImg.dataset.src=src;howNum.textContent=li.dataset.step;
        if(reduce){howImg.src=src;return}
        howImg.classList.add("fade");setTimeout(()=>{howImg.src=src;howImg.onload=()=>howImg.classList.remove("fade")},220);
    };
    if(steps.length){showStep(steps[0]);
        if("IntersectionObserver" in window){const io=new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting)showStep(e.target)},{rootMargin:"-45% 0px -45% 0px"});steps.forEach(s=>io.observe(s))}}

    /* live demo */
    const fig=$("#demo-fig"),out=$("#demo-out"),temp=$("#demo-temp"),rain=$("#demo-rain"),bg=$("#demo-bg");
    if(!fig||typeof generate!=="function")return;
    const iso=todayISO(),CITY="seoul";
    S.user={username:"demo",gender:"female",city:CITY,items:sampleItems("female"),schedule:{},history:[],prefs:{}};
    const OCC_PHOTO={class:["street",2],cafe:["flat",6],date:["street",1],athletic:["rack",1],formal:["rack",0]};

    function demoDay(high,wet){
        const hourly=[];
        for(let h=0;h<24;h++){
            const t=high-4+4*Math.cos((h-15)*Math.PI/12),isWet=wet&&h>=13&&h<=19;
            hourly.push({h,t,hum:wet?85:55,wet:isWet,feels:t-(isWet?2.5:1),code:isWet?63:2,prob:isWet?90:10,wind:3});
        }
        const ts=hourly.map(x=>x.t),snow=wet&&high<=1;
        return{iso,city:"Seoul",live:true,tmin:Math.min(...ts),tmax:Math.max(...ts),hum:wet?85:55,wind:3,rains:wet,rainP:wet?.9:.1,
            rainStart:wet?13:-1,rainEnd:wet?20:-1,cond:snow?"Snow":wet?"Rain":high>=26?"Sunny":high<=2?"Clear and icy":"Partly cloudy",hourly};
    }
    const occ=()=>{const r=document.querySelector('input[name="demo-occ"]:checked');return r?r.value:"class"};
    function setBg(src){
        if(bg.dataset.src===src)return;bg.dataset.src=src;
        if(reduce||!bg.src){bg.src=src;return}
        bg.classList.add("fade");const im=new Image();im.onload=()=>{bg.src=src;bg.classList.remove("fade")};im.src=src;
    }
    let timer=0;
    function update(){
        const high=+temp.value,wet=rain.checked,o2=occ();
        $("#demo-temp-label").textContent=high+"°C";
        $("#demo-temp-big").textContent=high;
        document.documentElement.style.setProperty("--warm",String(Math.max(0,Math.min(1,(high+8)/40))));
        const [set,i]=wet?["rain",high<10?1:0]:OCC_PHOTO[o2];
        setBg(PH(pick(set,i),1100));
        clearTimeout(timer);
        timer=setTimeout(()=>{
            const wx=demoDay(high,wet);
            LIVEWX[CITY]={at:Date.now(),days:{[iso]:wx}};
            const ctx=buildCtx(S.user,iso,o2,"any");
            const o=generate(S.user.items,ctx)[0];
            $("#demo-badge").textContent=`${wx.cond} · feels ${Math.round(ctx.feels)}°`;
            if(!o){fig.innerHTML="";out.innerHTML="<p class='demo-note'>The sample closet has nothing for this. In the app, add more pieces.</p>";return}
            fig.innerHTML=mannequinSVG(o,0,{gender:"female"});
            dressPending();
            const pieces=[o.outer,o.top||o.dress,o.inner,o.bottom&&o.bottom!==o.dress?o.bottom:null,o.shoes,...(o.acc||[])].filter(Boolean);
            const notes=[];
            if(ctx.rain)notes.push((o.acc||[]).some(a=>a.type==="umbrella")?`${wx.cond==="Snow"?"Snow":"Rain"} during your plans, so the umbrella comes along.`:`${wx.cond==="Snow"?"Snow":"Rain"} during your plans: bring an umbrella.`);
            if(ctx.eveNeeded&&o.outer)notes.push(`It drops to feels ${Math.round(ctx.eve.feels)}° tonight, so the ${o.outer.name.toLowerCase()} stays on.`);
            if(!notes.length)notes.push(`Feels about ${Math.round(ctx.feels)}° while you’re out.`);
            const label={class:"class",cafe:"the café",date:"a date",athletic:"the gym",formal:"a formal event"}[o2];
            out.innerHTML=`<h3>Your look for ${esc(label)}</h3><p class="demo-pieces">${pieces.map((p,k)=>`<span style="animation-delay:${k*45}ms"><img src="${srcOf(p).src}" alt="">${esc(p.name)}</span>`).join("")}</p><p class="demo-note">${esc(notes.join(" "))}</p>`;
        },70);
    }
    temp.addEventListener("input",update);
    rain.addEventListener("change",update);
    for(const r of $$('input[name="demo-occ"]'))r.addEventListener("change",update);
    update();
})();
