"use strict";
/* AGORA · AI features through our own /api/gemini function (Gemini, free tier).
   If the function or its key isn't there (e.g. on a plain local server), every AI button stays hidden
   and the app works exactly as before. */
const AI={
    ready:false,notes:new Map(),
    async check(){
        try{const r=await fetch("/api/gemini",{cache:"no-store"});if(!r.ok)throw new Error(String(r.status));const j=await r.json();this.ready=!!j.configured}
        catch(e){this.ready=false}
        S.caps.images=this.ready;
        if(this.ready)S.caps.sample={json:(prompt,opts)=>this.tag(opts&&opts.images&&opts.images[0])};
        document.documentElement.classList.toggle("ai-on",this.ready);
        if(this.ready&&S.user&&S.view==="today"&&S.flow==="looks")render();
        return this.ready;
    },
    async post(body){
        let r;
        try{r=await fetch("/api/gemini",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)})}
        catch(e){const err=new Error("offline");err.code="ai_unavailable";throw err}
        const j=await r.json().catch(()=>({}));
        if(!r.ok){const err=new Error(j.error||"ai_unavailable");err.code=j.error==="rate_limited"?"rate_limited":j.error==="not_configured"?"images_unavailable":"ai_unavailable";throw err}
        return j;
    },
    async shrink(blob,max=512){
        const bmp=await createImageBitmap(blob);const k=Math.min(1,max/Math.max(bmp.width,bmp.height));
        const c=document.createElement("canvas");c.width=Math.round(bmp.width*k);c.height=Math.round(bmp.height*k);
        const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,c.width,c.height);x.drawImage(bmp,0,0,c.width,c.height);
        return c.toDataURL("image/jpeg",.82).split(",")[1];
    },
    async tag(blob){
        if(!blob){const e=new Error("no image");e.code="images_unavailable";throw e}
        const image=await this.shrink(blob);
        return this.post({mode:"tag",image,types:Object.keys(TYPES),patterns:PATTERNS,tags:STYLE_TAGS});
    },
    async note(o,ctx){
        if(this.notes.has(o.key))return this.notes.get(o.key);
        const pieces=[o.outer,o.top,o.inner,o.dress,o.waist,o.bottom,o.shoes,...(o.acc||[])].filter(Boolean).map(p=>({name:p.name,type:T(p).label}));
        const occasion=S.occ==="day"?"a day of plans: "+dayPlans(S.user,ctx.iso).map(e=>e.title).join(", "):(OCC[S.occ]||OCC.class).label;
        const j=await this.post({mode:"note",occasion,feels:ctx.feels,rain:!!ctx.rain,vibe:S.vibe,pieces});
        this.notes.set(o.key,j.note);return j.note;
    },
};

/* "Ask the AI stylist" inside each look's details */
function wireAINotes(ctx){
    if(!AI.ready)return;
    for(const card of $$("#looks .look")){
        const i=+card.dataset.i,o=S.shown[i],det=$(".lookdet",card);if(!o||!det||$(".ainote",det))continue;
        const cached=AI.notes.get(o.key);
        const box=document.createElement("div");box.className="ainote";
        box.innerHTML=cached?`<p><b>AI stylist</b>${esc(cached)}</p>`:`<button type="button" class="aibtn">✦ Ask the AI stylist</button>`;
        det.prepend(box);
        const btn=$(".aibtn",box);if(!btn)continue;
        btn.onclick=async()=>{btn.disabled=true;btn.textContent="Thinking…";
            try{const n=await AI.note(o,ctx);box.innerHTML=`<p><b>AI stylist</b>${esc(n)}</p>`}
            catch(e){btn.disabled=false;btn.textContent=e.code==="rate_limited"?"AI is busy. Try again in a minute.":"AI isn't available right now. Try again."}};
    }
}
