"use strict";
/* AGORA · Utilities: DOM helpers, dates, colour maths */
// Supabase settings live in js/config.js. In the frontend phase SUPABASE_ENABLED is false and sb stays null.
const SUPABASE_URL=AGORA_CONFIG.SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY=AGORA_CONFIG.SUPABASE_PUBLISHABLE_KEY;
let sb=null;
/* ---------- utilities ---------- */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function hash(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
const pad=n=>String(n).padStart(2,"0");
function isoDate(d){return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())}
function parseISO(s){const[y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d)}
function addDays(iso,n){const d=parseISO(iso);d.setDate(d.getDate()+n);return isoDate(d)}
const todayISO=()=>isoDate(new Date());
const uid=()=>Math.random().toString(36).slice(2,10);
const DOW=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function dayLabel(iso){const t=todayISO();if(iso===t)return"Today";if(iso===addDays(t,1))return"Tomorrow";const d=parseISO(iso);return DOW[d.getDay()]+" "+d.getDate()+" "+MON[d.getMonth()]}
function hm(h){const H=Math.floor(h),M=Math.round((h-H)*60);return pad(H)+":"+pad(M)}
function toH(t){const[a,b]=t.split(":").map(Number);return a+(b||0)/60}
function toast(msg){const el=document.createElement("div");el.className="toast";el.textContent=msg;$("#toastslot").replaceChildren(el);setTimeout(()=>el.remove(),2800)}

/* ---------- colour ---------- */
function hexRgb(h){h=h.replace("#","");if(h.length===3)h=h.split("").map(c=>c+c).join("");const n=parseInt(h,16);return[(n>>16)&255,(n>>8)&255,n&255]}
function rgbHex(r,g,b){return"#"+[r,g,b].map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,"0")).join("")}
function hsl(hex){let[r,g,b]=hexRgb(hex).map(v=>v/255);const mx=Math.max(r,g,b),mn=Math.min(r,g,b);let h=0,s=0;const l=(mx+mn)/2;if(mx!==mn){const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h*=60}return{h,s,l}}
function mix(hex,with_,t){const a=hexRgb(hex),b=hexRgb(with_);return rgbHex(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t)}
function cdist(a,b){const x=hexRgb(a),y=hexRgb(b);return Math.hypot(x[0]-y[0],x[1]-y[1],x[2]-y[2])}
const NAMED=[["Black","#1d1c1b"],["Charcoal","#3b3a39"],["Grey","#8d8b88"],["Light grey","#c9c7c3"],["White","#f7f5f0"],["Ivory","#efe8d8"],["Cream","#e9dcc3"],["Beige","#d6c3a3"],["Camel","#b98b56"],["Brown","#6e4b33"],["Chocolate","#4a3226"],["Navy","#1f2a44"],["Denim blue","#4a6585"],["Light blue","#a9c2dc"],["Sky blue","#79a7d3"],["Olive","#6b6b3e"],["Khaki","#a39c73"],["Sage","#a7b49a"],["Forest green","#2f4a37"],["Burgundy","#6b1f2a"],["Red","#b8312f"],["Terracotta","#b5583a"],["Rust","#9c4a26"],["Orange","#e07a2d"],["Mustard","#c9a23a"],["Yellow","#e8cf5a"],["Pink","#e6a9b5"],["Blush","#e9c8c0"],["Lavender","#b7a7d1"],["Purple","#5d3f7a"],["Teal","#2f6f73"]];
function colorName(hex){let best=NAMED[0],bd=1e9;for(const n of NAMED){const d=cdist(hex,n[1]);if(d<bd){bd=d;best=n}}return best[0]}
function isNeutral(hex){const{h,s,l}=hsl(hex);if(s<.16||l<.13||l>.93)return true;if(h>=15&&h<=50&&s<.6)return true;if(h>=195&&h<=235&&l<.45)return true;if(h>=55&&h<=100&&s<.4&&l<.5)return true;return false}
function isWarmNeutral(hex){const{h,s,l}=hsl(hex);return(h>=15&&h<=50&&s>=.12&&s<.65)||(s<.12&&l>.75)}
function loadImg(src){return new Promise((res,rej)=>{const im=new Image();im.crossOrigin="anonymous";im.onload=()=>res(im);im.onerror=()=>rej(new Error("Could not load this clothing photo."));im.src=src})}
