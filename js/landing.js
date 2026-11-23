"use strict";
/* AGORA · landing page demo: the real recommender re-dresses a sample closet as the weather changes */
(function(){
    const fig=$("#demo-fig"),out=$("#demo-out"),temp=$("#demo-temp"),rain=$("#demo-rain");
    if(!fig||typeof generate!=="function")return;
    const iso=todayISO(),CITY="seoul";
    S.user={username:"demo",gender:"female",city:CITY,items:sampleItems("female"),schedule:{},history:[],prefs:{}};

    function demoDay(high,wet){
        const hourly=[];
        for(let h=0;h<24;h++){
            const t=high-5+5*Math.cos((h-15)*Math.PI/12);
            const isWet=wet&&h>=13&&h<=19;
            hourly.push({h,t,hum:wet?85:55,wet:isWet,feels:t-(isWet?2.5:1),code:isWet?63:2,prob:isWet?90:10,wind:3});
        }
        const ts=hourly.map(x=>x.t);
        return{iso,city:"Seoul",live:true,tmin:Math.min(...ts),tmax:Math.max(...ts),hum:wet?85:55,wind:3,rains:wet,rainP:wet?.9:.1,
            rainStart:wet?13:-1,rainEnd:wet?20:-1,cond:wet?(high<=1?"Snow":"Rain"):"Partly cloudy",hourly};
    }
    function occ(){const r=document.querySelector('input[name="demo-occ"]:checked');return r?r.value:"class"}
    const pieceName=it=>it&&it.name;

    let timer=0;
    function update(){
        const high=+temp.value,wet=rain.checked;
        $("#demo-temp-label").textContent=high+"°C";
        $("#demo-temp-big").textContent=high;
        document.documentElement.style.setProperty("--demo-warmth",String((high+8)/40));
        clearTimeout(timer);
        timer=setTimeout(()=>{
            LIVEWX[CITY]={at:Date.now(),days:{[iso]:demoDay(high,wet)}};
            const ctx=buildCtx(S.user,iso,occ(),"any");
            const list=generate(S.user.items,ctx);
            const o=list[0];
            if(!o){fig.innerHTML="";out.innerHTML="<p>No outfit fits this weather in the sample closet.</p>";return}
            fig.innerHTML=mannequinSVG(o,0,{gender:"female"});
            dressPending();
            const pieces=[o.outer,o.top||o.dress,o.inner,o.bottom&&o.bottom!==o.dress?o.bottom:null,o.shoes,...(o.acc||[])].filter(Boolean);
            const notes=[];
            if(ctx.rain)notes.push((o.acc||[]).some(a=>a.type==="umbrella")?"Rain during your plans, so the umbrella comes along.":"Rain during your plans: bring an umbrella.");
            if(ctx.eveNeeded&&o.outer)notes.push(`It drops to feels ${Math.round(ctx.eve.feels)}° by evening, so the ${o.outer.name.toLowerCase()} stays on.`);
            if(!notes.length)notes.push(`Feels about ${Math.round(ctx.feels)}° while you’re out.`);
            out.innerHTML=`<p class="demo-pieces">${pieces.map(p=>`<span>${esc(pieceName(p))}</span>`).join("")}</p><p class="demo-note">${esc(notes.join(" "))}</p>`;
        },60);
    }
    temp.addEventListener("input",update);
    rain.addEventListener("change",update);
    for(const r of document.querySelectorAll('input[name="demo-occ"]'))r.addEventListener("change",update);
    update();
})();
