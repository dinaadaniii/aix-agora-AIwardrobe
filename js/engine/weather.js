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
    const w={iso,city:c.name,tmin,tmax,hum,wind,rains,rainP:rains?Math.max(rainP0,.6):Math.min(rainP0,.3),rainStart:rs,rainEnd:rs+rd,cond:snow?"Snow":clouds,hourly};
    WXCACHE[key]=w;return w;
}
