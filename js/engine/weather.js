"use strict";
/* AGORA · Weather: Gyeonggi climate model (to be replaced by Open-Meteo in M1) */
/* ---------- weather dataset (Gyeonggi climatology, deterministic per date) ---------- */
const CITIES={ansan:{name:"Ansan",off:.3},suwon:{name:"Suwon",off:0},seoul:{name:"Seoul",off:.4},icheon:{name:"Icheon",off:-.6},paju:{name:"Paju",off:-1.2},yangpyeong:{name:"Yangpyeong",off:-1},dongducheon:{name:"Dongducheon",off:-1}};
const CLIM=[[2,-7,62,.18],[5,-4.5,60,.18],[11,.5,60,.24],[18,6.5,60,.27],[23.5,12,65,.3],[27.5,17.5,72,.35],[29.5,22,80,.52],[30.5,22.5,78,.45],[26.5,16.5,73,.3],[20.5,8.5,68,.2],[12,1.5,66,.24],[4.5,-4.5,64,.2]];
function clim(date){const m=date.getMonth(),dim=new Date(date.getFullYear(),m+1,0).getDate(),f=(date.getDate()-.5)/dim-.5,m2=f<0?(m+11)%12:(m+1)%12,w=Math.abs(f);return CLIM[m].map((v,i)=>v*(1-w)+CLIM[m2][i]*w)}
function anomaly(date){const day=Math.floor(date.getTime()/864e5);let a=0;for(let k=0;k<3;k++){const r=rng(hash("gg"+k));const per=3+r()*6,ph=r()*6.28,amp=1+r()*1.5;a+=amp*Math.sin(day*2*Math.PI/per+ph)}return a}
function windChill(t,ms){const v=ms*3.6;if(t>10||v<4.8)return t;const p=Math.pow(v,.16);return 13.12+.6215*t-11.37*p+.3965*t*p}
const WXCACHE={};
function dayWeather(iso,cityKey){
    const live=liveDay(iso,cityKey);if(live)return live;
    const key=iso+cityKey;if(WXCACHE[key])return WXCACHE[key];
    const date=parseISO(iso),c=CITIES[cityKey]||CITIES.suwon,[tx,tn,hu,rp]=clim(date),r=rng(hash(iso+"w"));
    const range=(tx-tn)*(.85+r()*.3);let tmax=tx+anomaly(date)+c.off;
    const rainP0=clamp(rp+(r()-.5)*.45,.03,.9);const rains=r()<rainP0;if(rains)tmax-=1.5;const tmin=tmax-range;
    const rs=rains?Math.floor(6+r()*13):-1,rd=rains?2+Math.floor(r()*7):0;
    const hum=clamp(hu+(rains?12:0)+(r()-.5)*12,25,98),wind=1.5+r()*3.5+([0,1,2,11].includes(date.getMonth())?1.5:0);
    const clouds=rains?"Rain":["Clear","Clear","Partly cloudy","Partly cloudy","Cloudy"][Math.floor(r()*5)];
    const hourly=[];
    for(let h=0;h<24;h++){
        let p;if(h>=6&&h<=15)p=(1-Math.cos(Math.PI*(h-6)/9))/2;else if(h>15)p=(1+Math.cos(Math.PI*(h-15)/15))/2;else p=(1+Math.cos(Math.PI*(h+9)/15))/2;
        const wet=rains&&h>=rs&&h<rs+rd;let t=tmin+(tmax-tmin)*p-(wet?1.5:0);
        const hh=clamp(hum+(1-p)*9-p*9+(wet?8:0),20,100);
        hourly.push({h,t,hum:hh,wet,feels:windChill(t,wind)});
    }
    const snow=rains&&hourly.filter(x=>x.wet).some(x=>x.t<1);
    const w={iso,city:c.name,live:false,tmin,tmax,hum,wind,rains,rainP:rains?Math.max(rainP0,.6):Math.min(rainP0,.3),rainStart:rs,rainEnd:rs+rd,cond:snow?"Snow":clouds,hourly};
    WXCACHE[key]=w;return w;
}

/* ---------- live forecast: Open-Meteo (free, no key), cached per city; the climate model above is the fallback ---------- */
const CITY_GEO={ansan:[37.3219,126.8309],suwon:[37.2636,127.0286],seoul:[37.5665,126.978],icheon:[37.2792,127.4425],paju:[37.7599,126.7802],yangpyeong:[37.4917,127.4875],dongducheon:[37.9036,127.0606]};
const LIVEWX={};          // city -> {at, days:{iso: day}}
const LIVEWX_LOADING={};  // city -> true while a request is in flight
const LIVEWX_TRIED={};    // city -> time of the last request, so a failure is retried at most every 10 minutes
const LIVEWX_TTL=3*36e5;  // refetch after 3 hours
const LIVEWX_MAX_AGE=24*36e5; // a cached forecast older than this is not used
const WMO_LABEL=c=>c===0||c===1?"Clear":c===2?"Partly cloudy":c===3?"Cloudy":c===45||c===48?"Fog":c>=51&&c<=57?"Drizzle":(c>=61&&c<=67)||(c>=80&&c<=82)?"Rain":(c>=71&&c<=77)||c===85||c===86?"Snow":c>=95?"Thunderstorm":"Cloudy";
const WMO_SNOW=c=>(c>=71&&c<=77)||c===85||c===86;

function liveDay(iso,city){
    let rec=LIVEWX[city];
    if(!rec){rec=LIVEWX[city]=readLiveCache(city)||null}
    const stale=!rec||Date.now()-rec.at>LIVEWX_TTL;
    if(stale&&!LIVEWX_LOADING[city]&&Date.now()-(LIVEWX_TRIED[city]||0)>10*6e4&&typeof fetch==="function")loadLiveWeather(city);
    if(!rec||Date.now()-rec.at>LIVEWX_MAX_AGE)return null;
    return rec.days[iso]||null;
}
function readLiveCache(city){
    try{const raw=JSON.parse(LS.get("agora.wx."+city)||"null");if(!raw||!raw.at||!raw.hourly)return null;return{at:raw.at,days:liveDays(raw.hourly,city)}}catch(e){return null}
}
async function loadLiveWeather(city){
    const geo=CITY_GEO[city];if(!geo)return;
    LIVEWX_LOADING[city]=true;LIVEWX_TRIED[city]=Date.now();
    try{
        const q=new URLSearchParams({latitude:geo[0],longitude:geo[1],timezone:"Asia/Seoul",forecast_days:"16",wind_speed_unit:"ms",
            hourly:"temperature_2m,apparent_temperature,relative_humidity_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m"});
        const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),8000);
        const r=await fetch("https://api.open-meteo.com/v1/forecast?"+q,{signal:ctl.signal});clearTimeout(timer);
        if(!r.ok)throw new Error("HTTP "+r.status);
        const data=await r.json();if(!data.hourly||!Array.isArray(data.hourly.time))throw new Error("No hourly data");
        const at=Date.now();
        LIVEWX[city]={at,days:liveDays(data.hourly,city)};
        try{LS.set("agora.wx."+city,JSON.stringify({at,hourly:data.hourly}))}catch(e){}
        if(typeof S!=="undefined"&&S.user&&S.user.city===city&&typeof render==="function")render();
    }catch(err){
        console.warn("AGORA: live weather unavailable, using the climate model.",err.message||err);
        if(!LIVEWX[city])LIVEWX[city]={at:0,days:{}};
    }finally{LIVEWX_LOADING[city]=false}
}
function liveDays(H,city){
    const byDay={},c=CITIES[city]||CITIES.suwon;
    H.time.forEach((t,i)=>{const iso=t.slice(0,10),h=+t.slice(11,13);(byDay[iso]=byDay[iso]||[])[h]=i});
    const out={};
    for(const[iso,idx]of Object.entries(byDay)){
        if(idx.length<24||idx.some(x=>x===undefined))continue;
        const v=(k,i)=>{const a=H[k];const x=a?a[i]:null;return typeof x==="number"?x:null};
        if(idx.some(i=>v("temperature_2m",i)===null))continue;
        const hourly=idx.map((i,h)=>{
            const t=v("temperature_2m",i),code=v("weather_code",i)??3,prob=v("precipitation_probability",i)??0,pr=v("precipitation",i)??0;
            const wet=pr>=.1||(code>=51&&prob>=50);
            return{h,t,hum:v("relative_humidity_2m",i)??60,wet,feels:v("apparent_temperature",i)??t,code,prob,wind:v("wind_speed_10m",i)??2};
        });
        const day=hourly.filter(x=>x.h>=6),wetH=hourly.filter(x=>x.wet);
        const rains=wetH.some(x=>x.h>=6);
        const temps=hourly.map(x=>x.t),mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
        const codes=hourly.filter(x=>x.h>=9&&x.h<=18).map(x=>x.code);
        const mode=codes.sort((a,b)=>codes.filter(x=>x===b).length-codes.filter(x=>x===a).length)[0];
        const snow=wetH.some(x=>WMO_SNOW(x.code));
        const firstWet=rains?wetH.find(x=>x.h>=6).h:-1,lastWet=rains?wetH[wetH.length-1].h:-1;
        out[iso]={iso,city:c.name,live:true,tmin:Math.min(...temps),tmax:Math.max(...temps),hum:mean(hourly.map(x=>x.hum)),wind:mean(day.map(x=>x.wind)),
            rains,rainP:Math.max(0,...day.map(x=>x.prob))/100,rainStart:firstWet,rainEnd:lastWet+1,
            cond:snow?"Snow":rains?"Rain":WMO_LABEL(mode),hourly};
    }
    return out;
}
function weatherSourceNote(wx){
    if(wx.live){const rec=LIVEWX[Object.keys(CITY_GEO).find(k=>CITIES[k].name===wx.city)];const at=rec&&rec.at?new Date(rec.at):null;
        return`Live forecast from <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a>${at?` · updated ${pad(at.getHours())}:${pad(at.getMinutes())}`:""}. Feels-like includes wind and humidity.`}
    return`Estimated from Gyeonggi climate data${CITY_GEO[Object.keys(CITIES).find(k=>CITIES[k].name===wx.city)]?" (live forecast unavailable right now, or this day is beyond the 16-day forecast)":""}. Not a live forecast.`;
}
