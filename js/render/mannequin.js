"use strict";
/* AGORA · Mannequin and garment drawing */
/* ---------- drawing: mannequin + garments (viewBox 0 0 240 470) ---------- */
const mir=d=>d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g,(m,x,y)=>(240-parseFloat(x))+","+y);
const both=d=>[d,mir(d)];
const G={
    leg:"M88,238 L119,238 L118,330 L115,426 L101,426 L97,330 Z",
    torso:"M104,76 C96,78 84,81 79,89 L84,128 C88,160 92,186 94,206 C90,220 87,232 87,244 L153,244 C153,232 150,220 146,206 C148,186 152,160 156,128 L161,89 C156,81 144,78 136,76 Z",
    arm:"M80,90 C72,100 70,130 68,168 L63,246 L73,248 L80,170 C84,140 86,118 89,104 Z",
    neck:"M113,54 L127,54 L128,80 L112,80 Z",
    topBody:"M102,75 C93,78 82,81 76,89 L82,128 C86,160 88,196 89,236 L151,236 C152,196 154,160 158,128 L164,89 C158,81 147,78 138,75 C133,84 107,84 102,75 Z",
    bodice:"M102,75 C93,78 82,81 76,89 L82,128 C86,160 89,186 92,206 L148,206 C151,186 154,160 158,128 L164,89 C158,81 147,78 138,75 C133,84 107,84 102,75 Z",
    sleeveLong:"M78,88 C68,99 65,130 63,168 L56,244 L74,247 L81,170 C84,142 86,120 90,105 Z",
    sleeveShort:"M78,88 C70,97 67,112 65,130 L86,134 L90,105 Z",
    sleeveOuter:"M73,87 C62,98 59,130 57,168 L51,248 L75,252 L82,170 C85,142 87,120 91,104 Z",
    sleevePuff:"M71,86 C58,98 55,130 53,168 L47,250 L77,254 L84,170 C87,142 89,120 92,104 Z",
    hood:"M98,82 C90,58 102,36 120,36 C138,36 150,58 142,82 Z",
    turtle:"M110,52 L130,52 L133,80 L107,80 Z",
};
const BOTTOM={
    jeans:"M91,200 L149,200 L152,240 L149,426 L123,426 L120,262 L117,426 L91,426 L88,240 Z",
    trousers:"M91,200 L149,200 L153,240 L160,428 L123,428 L120,262 L117,428 L80,428 L87,240 Z",
    slacks:"M92,200 L148,200 L151,240 L146,426 L123,426 L120,262 L117,426 L94,426 L89,240 Z",
    cargo:"M90,200 L150,200 L154,240 L154,426 L123,426 L120,262 L117,426 L86,426 L86,240 Z",
    joggers:"M90,200 L150,200 L154,240 L144,414 L124,414 L120,262 L116,414 L96,414 L86,240 Z",
    shorts:"M91,200 L149,200 L154,240 L157,292 L123,292 L120,256 L117,292 L83,292 L86,240 Z",
    miniskirt:"M93,200 L147,200 L158,282 L82,282 Z",
    midiskirt:"M93,200 L147,200 L152,250 L156,352 L84,352 L88,250 Z",
    flarejeans:"M91,200 L149,200 L152,240 L146,330 L162,428 L123,428 L120,262 L117,428 L78,428 L94,330 L88,240 Z",
};
const OUTER_LEN={blazer:252,jacket:238,padding:246,windbreaker:242,trench:336,coat:344,longpadding:372};
const panel=(L,puff)=>`M104,73 C93,76 ${puff?74:78},79 ${puff?67:71},88 L${puff?72:76},130 C${puff?72:78},175 ${puff?72:78},${L-30} ${puff?71:77},${L} L117,${L} L116,142 Z`;
const SHOE={
    sneakers:"M92,421 C92,415 98,413 106,413 C114,413 120,415 121,421 L122,431 C122,435 118,437 114,437 L99,437 C94,437 91,435 91,431 Z",
    runners:"M92,420 C92,414 98,412 106,412 C114,412 120,414 121,420 L122,431 C122,435 118,437 114,437 L99,437 C94,437 91,435 91,431 Z",
    loafers:"M93,425 C95,421 117,421 119,425 L121,433 C121,437 117,438 114,438 L99,438 C95,438 92,437 92,433 Z",
    derbies:"M93,424 C95,419 117,419 119,424 L121,433 C121,437 117,438 114,438 L99,438 C95,438 92,437 92,433 Z",
    boots:"M96,384 L118,384 L118,424 L122,431 C122,436 118,438 114,438 L99,438 C94,438 91,436 91,431 L96,422 Z",
    heels:"M95,424 C98,420 116,420 118,424 L121,437 L114,437 L113,431 L101,431 L100,437 L94,437 Z",
};
const FINISH=[{body:"#E6DCCB",edge:"#C9B9A1"},{body:"#C98B69",edge:"#A56C4E"},{body:"#56504B",edge:"#3A3532"}];

function fillDef(it,defs,pfx){
    const id=pfx+"f"+(defs.length);
    if(it.swatch){defs.push(`<pattern id="${id}" patternContentUnits="objectBoundingBox" width="1" height="1"><image href="${it.swatch}" width="1" height="1" preserveAspectRatio="xMidYMid slice"/></pattern>`);return`url(#${id})`}
    const c=it.color,dk=mix(c,"#000000",.22),lt=mix(c,"#ffffff",.18),p=it.pattern||"solid";
    if(p==="stripe"){const s=it.color2||mix(c,"#1f2a44",.85);defs.push(`<pattern id="${id}" patternUnits="userSpaceOnUse" width="8" height="8"><rect width="8" height="8" fill="${c}"/><rect y="5" width="8" height="2.2" fill="${s}"/></pattern>`);return`url(#${id})`}
    if(p==="check"){const s=it.color2||dk;defs.push(`<pattern id="${id}" patternUnits="userSpaceOnUse" width="14" height="14"><rect width="14" height="14" fill="${c}"/><rect width="14" height="4" fill="${s}" opacity=".45"/><rect width="4" height="14" fill="${s}" opacity=".45"/></pattern>`);return`url(#${id})`}
    if(p==="denim"){defs.push(`<pattern id="${id}" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(35)"><rect width="4" height="4" fill="${c}"/><rect width="1.2" height="4" fill="${lt}" opacity=".35"/></pattern>`);return`url(#${id})`}
    if(p==="knit"){defs.push(`<pattern id="${id}" patternUnits="userSpaceOnUse" width="5" height="6"><rect width="5" height="6" fill="${c}"/><path d="M0,0 L2.5,3 L5,0 M0,3 L2.5,6 L5,3" stroke="${dk}" stroke-width=".5" fill="none" opacity=".55"/></pattern>`);return`url(#${id})`}
    if(p==="print"){const s=it.color2||lt;defs.push(`<pattern id="${id}" patternUnits="userSpaceOnUse" width="16" height="16"><rect width="16" height="16" fill="${c}"/><circle cx="4" cy="4" r="2.2" fill="${s}"/><circle cx="12" cy="11" r="1.6" fill="${s}"/></pattern>`);return`url(#${id})`}
    return c;
}
function shape(d,fill,pfx,opt={}){return`<path d="${d}" fill="${fill}"/><path d="${d}" fill="url(#${pfx}sh)" stroke="rgba(30,24,20,.28)" stroke-width=".8" stroke-linejoin="round"/>`}
function detail(d,col,w=1){return`<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`}
function dcol(it){const l=hsl(it.color).l;return l<.3?"rgba(255,255,255,.35)":"rgba(30,24,20,.35)"}

function drawTop(it,defs,pfx){
    const f=fillDef(it,defs,pfx),t=it.type,dc=dcol(it);let s="";
    const short=["tee","blouse","sporttop"].includes(t);
    for(const d of both(short?G.sleeveShort:G.sleeveLong))s+=shape(d,f,pfx);
    s+=shape(G.topBody,f,pfx);
    if(t==="shirt"){s+=detail("M104,76 L111,93 L120,84 L129,93 L136,76",dc)+detail("M120,86 L120,234",dc,.7);for(const y of[112,138,164,190,216])s+=`<circle cx="120" cy="${y}" r="1.4" fill="${dc}"/>`}
    if(["knit","sweatshirt","turtleneck","cardigan","hoodie"].includes(t)){s+=detail("M89,226 L151,226",dc,.8);s+=detail("M57,236 L74,239",dc,.8)+detail(mir("M57,236 L74,239"),dc,.8)}
    if(["knit","sweatshirt"].includes(t))s+=detail("M104,77 C110,87 130,87 136,77",dc);
    if(t==="turtleneck")s+=shape(G.turtle,f,pfx)+detail("M109,60 L131,60",dc,.6);
    if(t==="cardigan"){s+=detail("M104,77 L120,132 L120,236",dc,1.1)+detail(mir("M104,77 L120,132"),dc,1.1);for(const y of[146,172,198,222])s+=`<circle cx="122" cy="${y}" r="1.7" fill="${dc}"/>`}
    if(t==="hoodie")s+=detail("M98,192 L142,192 L148,224 L92,224 Z",dc,.8)+detail("M114,84 L113,112",dc,.9)+detail("M126,84 L127,112",dc,.9);
    if(t==="blouse")s+=detail("M110,82 C116,92 124,92 130,82",dc)+`<path d="M120,90 L110,84 L110,98 Z M120,90 L130,84 L130,98 Z" fill="${dc}"/>`;
    if(t==="tee"||t==="longsleeve"||t==="sporttop")s+=detail("M104,77 C110,86 130,86 136,77",dc,.8);
    if(t==="sporttop")s+=detail("M83,130 L90,232",mix(it.color,"#ffffff",.5),2)+detail(mir("M83,130 L90,232"),mix(it.color,"#ffffff",.5),2);
    return s;
}
function drawHood(it,defs,pfx){return shape(G.hood,fillDef(it,defs,pfx),pfx)}
function drawDress(it,defs,pfx){const f=fillDef(it,defs,pfx),dc=dcol(it);let s="";for(const d of both(G.sleeveShort))s+=shape(d,f,pfx);s+=shape("M92,200 L148,200 L160,352 L80,352 Z",f,pfx)+shape(G.bodice,f,pfx)+detail("M92,206 L148,206",dc,1.2)+detail("M104,77 C110,88 130,88 136,77",dc,.8);return s}
function drawBottom(it,defs,pfx){
    const f=fillDef(it,defs,pfx),t=it.type,d=BOTTOM[t]||BOTTOM.jeans,dc=dcol(it);let s=shape(d,f,pfx);
    s+=detail("M91,208 L149,208",dc,.8);
    if(["jeans","flarejeans","trousers","slacks","cargo","joggers","shorts"].includes(t))s+=detail("M120,204 L120,248",dc,.7);
    if(t==="jeans"||t==="flarejeans")s+=detail("M95,212 C100,222 106,224 111,212",dc,.7)+detail(mir("M95,212 C100,222 106,224 111,212"),dc,.7);
    if(t==="trousers"||t==="slacks")s+=detail(t==="trousers"?"M102,250 L99,426":"M104,250 L105,424",dc,.6)+detail(mir(t==="trousers"?"M102,250 L99,426":"M104,250 L105,424"),dc,.6);
    if(t==="cargo")for(const p of both("M86,300 L104,300 L104,332 L87,332 Z"))s+=detail(p,dc,.8);
    if(t==="joggers")for(const p of both("M96,414 L116,414 L115,426 L98,426 Z"))s+=shape(p,f,pfx);
    if(t==="midiskirt")s+=detail("M130,322 L132,352",dc,.8);
    return s;
}
function drawOuter(it,defs,pfx){
    const f=fillDef(it,defs,pfx),t=it.type,L=OUTER_LEN[t]||250,puff=t==="padding"||t==="longpadding",dc=dcol(it);let s="";
    for(const d of both(puff?G.sleevePuff:G.sleeveOuter))s+=shape(d,f,pfx);
    for(const d of both(panel(L,puff)))s+=shape(d,f,pfx);
    if(["blazer","coat","trench"].includes(t))for(const d of both("M104,73 L113,124 L100,104 Z"))s+=`<path d="${d}" fill="${f}"/><path d="${d}" fill="rgba(0,0,0,.08)" stroke="${dc}" stroke-width=".8"/>`;
    if(t==="blazer")s+=`<circle cx="114" cy="176" r="1.9" fill="${dc}"/><circle cx="114" cy="200" r="1.9" fill="${dc}"/>`+detail("M84,214 L100,214",dc,.8)+detail(mir("M84,214 L100,214"),dc,.8);
    if(t==="coat")s+=`<circle cx="112" cy="172" r="2.2" fill="${dc}"/><circle cx="112" cy="210" r="2.2" fill="${dc}"/><circle cx="112" cy="248" r="2.2" fill="${dc}"/>`;
    if(t==="trench")s+=`<path d="M73,204 L117,204 L117,214 L74,214 Z M123,204 L167,204 L166,214 L123,214 Z" fill="${mix(it.color,"#000",.12)}"/>`+`<circle cx="110" cy="160" r="1.8" fill="${dc}"/><circle cx="110" cy="182" r="1.8" fill="${dc}"/>`;
    if(puff){s+=shape("M103,60 L137,60 L139,82 L101,82 Z",f,pfx);for(let y=110;y<L-6;y+=22){s+=detail(`M${70},${y} L116,${y+2}`,dc,.8)+detail(mir(`M${70},${y} L116,${y+2}`),dc,.8);s+=detail(`M50,${y+20} L80,${y+22}`,dc,.6)+detail(mir(`M50,${y+20} L80,${y+22}`),dc,.6)}}
    if(t==="jacket")s+=detail("M88,120 L106,120 L106,140 L89,140 Z",dc,.8)+detail(mir("M88,120 L106,120 L106,140 L89,140 Z"),dc,.8)+detail("M104,73 L110,96 L97,90",dc,.9)+detail(mir("M104,73 L110,96 L97,90"),dc,.9);
    if(t==="windbreaker")s+=detail("M77,150 L117,150",mix(it.color,"#fff",.45),3)+detail(mir("M77,150 L117,150"),mix(it.color,"#fff",.45),3);
    return s;
}
function drawShoes(it,defs,pfx){
    const f=fillDef(it,defs,pfx),t=it.type,d=SHOE[t]||SHOE.sneakers,dc=dcol(it);let s="";
    for(const p of both(d)){s+=shape(p,f,pfx)}
    if(t==="sneakers"||t==="runners")for(const p of both("M91,431 L122,431 L122,434 C122,436 119,438 115,438 L98,438 C94,438 91,436 91,434 Z"))s+=`<path d="${p}" fill="#F3EFE8" stroke="rgba(30,24,20,.25)" stroke-width=".6"/>`;
    if(t==="runners")for(const p of both("M96,424 L117,419"))s+=detail(p,mix(it.color,"#B5583A",.7),2);
    if(t==="loafers")for(const p of both("M98,428 L114,428"))s+=detail(p,dc,1);
    if(t==="derbies"||t==="sneakers")for(const p of both("M102,418 L110,418 M102,422 L110,422"))s+=detail(p,dc,.7);
    return s;
}
function drawAcc(it,defs,pfx){
    const f=fillDef(it,defs,pfx),t=it.type,dc=dcol(it);
    if(t==="scarf")return shape("M124,86 L139,84 L142,164 L127,166 Z",f,pfx)+shape("M102,66 C110,82 130,82 138,66 L142,80 C133,97 107,97 98,80 Z",f,pfx)+detail("M128,160 L140,158",dc,.7);
    if(t==="beanie")return shape("M103,28 C103,8 137,8 137,28 Z",f,pfx)+shape("M101,24 L139,24 L139,34 L101,34 Z",f,pfx)+detail("M108,26 L108,33 M114,26 L114,33 M120,26 L120,33 M126,26 L126,33 M132,26 L132,33",dc,.6);
    if(t==="cap")return shape("M104,27 C104,12 136,12 136,27 Z",f,pfx)+shape("M100,26 L140,26 L148,32 L104,32 Z",f,pfx);
    if(t==="bag")return detail("M146,92 L170,236",mix(it.color,"#000",.2),2.4)+shape("M158,232 L190,232 L193,266 L156,266 Z",f,pfx)+detail("M158,242 L190,242",dc,.8);
    return "";
}
function drawUmbrella(it,pfx,defs){const c=it?it.color:"#3A3633";const f=it?fillDef(it,defs,pfx):c;return detail("M206,256 L206,412 C206,420 214,420 214,412",mix(c,"#000",.25),2.2)+`<path d="M206,262 L197,384 L206,398 L215,384 Z" fill="${f}" stroke="rgba(30,24,20,.3)" stroke-width=".8"/>`+detail("M206,262 L206,398",mix(c,"#fff",.25),.6)+(it?"":`<text x="206" y="252" text-anchor="middle" font-size="9" fill="${mix(c,"#000",.1)}" font-family="Jost,sans-serif">+</text>`)}

let SVGN=0;
const BW=1.15;const LM={female:{neck:82,shW:90,waist:168,hip:212,hipW:94,crotch:236,knee:340,ankle:440,floor:466,handX:64,handY:268},
    male:{neck:85,shW:112,waist:172,hip:214,hipW:92,crotch:238,knee:340,ankle:440,floor:466,handX:58,handY:272}};
const BODY={
    female:{head:"M120,14 C132,14 139,25 139,40 C139,56 130,68 120,68 C110,68 101,56 101,40 C101,25 108,14 120,14 Z",
        neck:"M112,60 C113,70 112,77 108,86 L132,86 C128,77 127,70 128,60 Z",
        torso:"M110,82 C100,84 88,86 84,92 C80,98 82,110 86,118 C88,134 90,150 96,168 C92,184 82,198 80,214 C80,224 84,232 92,238 L148,238 C156,232 160,224 160,214 C158,198 148,184 144,168 C150,150 152,134 154,118 C158,110 160,98 156,92 C152,86 140,84 130,82 Z",
        leg:"M82,218 C82,260 92,300 97,338 C99,368 100,410 103,442 L114,442 C114,410 117,372 117,340 C119,300 121,262 120,232 Z",
        foot:"M102,440 L115,440 C117,450 117,460 115,467 L101,467 C99,460 100,450 102,440 Z",
        arm:"M86,92 C76,96 72,110 71,130 C70,150 68,170 66,192 C64,212 63,232 63,248 L74,250 C75,232 77,212 79,194 C81,172 83,150 85,124 Z",
        hand:"M63,246 C60,258 61,272 67,280 C72,277 75,266 74,250 Z",bust:true},
    male:{head:"M120,13 C133,13 141,25 141,41 C141,57 131,70 120,70 C109,70 99,57 99,41 C99,25 107,13 120,13 Z",
        neck:"M110,60 C111,70 110,78 106,88 L134,88 C130,78 129,70 130,60 Z",
        torso:"M108,84 C96,86 80,88 75,96 C70,104 74,118 80,128 C84,146 88,160 92,172 C90,188 86,202 84,216 C84,226 88,234 94,240 L146,240 C152,234 156,226 156,216 C154,202 150,188 148,172 C152,160 156,146 160,128 C166,118 170,104 165,96 C160,88 144,86 132,84 Z",
        leg:"M85,222 C85,262 92,302 96,340 C98,370 99,410 102,442 L115,442 C115,410 117,372 117,340 C119,300 121,262 120,234 Z",
        foot:"M101,440 L116,440 C118,450 118,460 116,467 L100,467 C98,460 99,450 101,440 Z",
        arm:"M77,94 C66,100 63,114 62,134 C61,154 60,174 58,196 C56,216 55,236 55,252 L67,254 C67,236 69,216 71,198 C73,176 76,154 79,128 Z",
        hand:"M55,250 C52,262 54,276 60,284 C66,280 68,268 67,254 Z",bust:false}};
/* where each kind of garment photo sits on the body; garment photos keep their real proportions */
function place(it,role,lm,a){
    const t=it.type;let w,h,y,x;const fit=(mn,mx)=>{if(w<mn){w=mn;h=w*a}if(w>mx){w=mx;h=w*a}};
    if(role==="top"||role==="inner"){y=lm.neck-8;h=(["tee","sporttop","blouse"].includes(t)?lm.hip+12:lm.hip+22)-y;w=h/a;fit(lm.shW*1.08,lm.shW*2.2);if(role==="inner"){w*=1.07;h*=1.1;y-=7}}
    else if(role==="outer"){y=lm.neck-10;const end={blazer:lm.hip+34,jacket:lm.hip+16,padding:lm.hip+26,windbreaker:lm.hip+22,trench:lm.knee+14,coat:lm.knee+26,longpadding:lm.ankle-46}[t]||lm.hip+30;h=end-y;w=h/a;fit(lm.shW*1.3,lm.shW*2.4)}
    else if(role==="bottom"){y=lm.waist-4;const end={shorts:lm.crotch+56,miniskirt:lm.crotch+34,midiskirt:lm.knee+58}[t]||lm.floor-12;h=end-y;w=clamp(h/a,lm.hipW*.95,lm.hipW*(["trousers","flarejeans","midiskirt"].includes(t)?1.55:1.3))}
    else if(role==="dress"){y=lm.neck-6;w=lm.hipW*1.35;h=clamp(w*a,lm.crotch+40-y,lm.ankle-10-y);w=clamp(h/a,lm.shW,lm.hipW*2.1)}
    else if(role==="shoes"){w=lm.hipW*1.1;h=w*a;if(h>72){h=72;w=h/a}y=lm.floor+8-h}
    else if(role==="scarf"){w=lm.shW*.85;h=w*a;if(h>120){h=120;w=h/a}y=lm.neck-12}
    else if(role==="hat"){w=46;h=w*a;y=Math.max(4,22-h*.7)}
    else if(role==="bag"){w=46;h=w*a;if(h>84){h=84;w=h/a}x=240-lm.handX-w*.35;y=lm.handY-20}
    else if(role==="umbrella"){h=200;w=Math.min(h/a,44);x=194;y=lm.floor+6-h}
    if(x===undefined)x=120-w/2;return{x,y,w,h};
}
function openClip(id,b){const cx=120,y0=b.y-6,y1=b.y+b.h+6,L=b.x-4,Rr=b.x+b.w+4;
    return`<clipPath id="${id}" clipPathUnits="userSpaceOnUse"><path d="M${L},${y0} L${cx-b.w*.05},${y0} L${cx-b.w*.085},${b.y+b.h*.3} L${cx-b.w*.035},${y1} L${L},${y1} Z M${Rr},${y0} L${cx+b.w*.05},${y0} L${cx+b.w*.085},${b.y+b.h*.3} L${cx+b.w*.035},${y1} L${Rr},${y1} Z"/></clipPath>`}
/* Dressing engine: reshapes each garment photo onto the body (sleeves down the arms,
   shoulders sloped, tuck / open / tied at the waist) and adds fabric shading. Pixels come from the user's photo. */
const WORN=new Map(),INFL=new Map(),IMGC=new Map(),MQ=new Map();let MQN=0;const SC=2.5;
function getImg(src){if(!IMGC.has(src))IMGC.set(src,loadImg(src));return IMGC.get(src)}
async function loadCanvas(it){const r=srcOf(it);const im=await getImg(r.src);let iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;if(!iw||!ih){iw=300;ih=Math.round(300*r.a)}
    const k=Math.min(1,560/Math.max(iw,ih)),c=document.createElement("canvas");c.width=Math.max(1,Math.round(iw*k));c.height=Math.max(1,Math.round(ih*k));
    const x=c.getContext("2d",{willReadFrequently:true});x.drawImage(im,0,0,c.width,c.height);const d=x.getImageData(0,0,c.width,c.height).data,A=new Uint8Array(c.width*c.height);let op=0,cnt=0;
    for(let i=0;i<A.length;i++){A[i]=d[i*4+3];if(A[i]>200)op++;if(A[i]>=60)cnt++}return{c,W:c.width,H:c.height,A,opaque:op/A.length,cnt,src:r.src}}
function unitCanvas(){const c=document.createElement("canvas");c.width=240*SC;c.height=510*SC;const x=c.getContext("2d",{willReadFrequently:true});x.setTransform(SC,0,0,SC,0,0);return[c,x]}
async function finish(c){const x=c.getContext("2d",{willReadFrequently:true});x.setTransform(1,0,0,1,0,0);const W=c.width,H=c.height,d=x.getImageData(0,0,W,H).data;let x0=W,y0=H,x1=-1,y1=-1;
    for(let y=0;y<H;y+=2)for(let i=0;i<W;i+=2)if(d[(y*W+i)*4+3]>8){if(i<x0)x0=i;if(i>x1)x1=i;if(y<y0)y0=y;if(y>y1)y1=y}
    if(x1<0)return{skip:true};x0=Math.max(0,x0-2);y0=Math.max(0,y0-2);const bw=Math.min(W-x0,x1-x0+4),bh=Math.min(H-y0,y1-y0+4);
    const o=document.createElement("canvas");o.width=bw;o.height=bh;o.getContext("2d").drawImage(c,x0,y0,bw,bh,0,0,bw,bh);
    const blob=await new Promise(r=>o.toBlob(r,"image/png"));return{url:URL.createObjectURL(blob),x:x0/SC,y:y0/SC,w:bw/SC,h:bh/SC}}
function torsoCols(G,f0,f1){const{W,H,A}=G,L=[],Rr=[];
    for(let y=Math.floor(H*f0);y<H*f1;y+=2){const row=y*W;let l=-1,r=-1,st=-1,gap=0;
        for(let i=0;i<=W;i++){const on=i<W&&A[row+i]>=60;if(on){if(st<0)st=i;gap=0}else if(st>=0){gap++;if(gap>2||i===W){const en=i-gap;if(en-st>=2&&en>=W*.3&&st<=W*.7){if(l<0||st<l)l=st;if(en>r)r=en}st=-1;gap=0}}}
        if(l>=0){L.push(l);Rr.push(r)}}
    if(L.length<3)return null;const md=a=>a.slice().sort((p,q)=>p-q)[a.length>>1];return[md(L),md(Rr)]}
function sleeveOf(G,side,bx0,bx1,yMaxF){const{W,H,A,c}=G,pw=Math.round(W*.015);const sc=document.createElement("canvas");sc.width=W;sc.height=H;const x=sc.getContext("2d");x.drawImage(c,0,0);
    x.globalCompositeOperation="destination-out";if(side<0)x.fillRect(bx0-pw,0,W,H);else x.fillRect(0,0,bx1+pw+1,H);if(yMaxF<1)x.fillRect(0,H*yMaxF,W,H);
    let n=0,sx=0,sy=0,ymin=H;const xa=side<0?0:bx1+pw,xb=side<0?bx0-pw:W;
    for(let y=0;y<H*yMaxF;y+=2)for(let i=xa;i<xb;i+=2)if(A[y*W+i]>=60){n++;sx+=i;sy+=y;if(y<ymin)ymin=y}
    if(n*4<G.cnt*.025)return null;return{canvas:sc,cx:sx/n,cy:sy/n,ymin}}
function torsoOnly(G,bx0,bx1){const pw=Math.round(G.W*.015),c=document.createElement("canvas");c.width=bx1-bx0+2*pw;c.height=G.H;c.getContext("2d").drawImage(G.c,-(bx0-pw),0);return{c,pw}}
function shade(x,ox,Tw,top,h){
    const f0=45/(Tw+90),f1=1-f0,gr=x.createLinearGradient(ox-45,0,ox+Tw+45,0);
    [[0,.24],[f0-.07,.05],[f0,.2],[f0+.06,.03],[.5,-.07],[f1-.06,.03],[f1,.2],[f1+.07,.05],[1,.24]].forEach(([o,a])=>gr.addColorStop(clamp(o,0,1),a<0?`rgba(255,255,255,${-a})`:`rgba(0,0,0,${a})`));
    x.globalCompositeOperation="source-atop";x.fillStyle=gr;x.fillRect(0,0,240,510);
    const gv=x.createLinearGradient(0,top,0,top+h);gv.addColorStop(0,"rgba(255,255,255,.08)");gv.addColorStop(.3,"rgba(0,0,0,0)");gv.addColorStop(1,"rgba(0,0,0,.13)");x.fillStyle=gv;x.fillRect(0,0,240,510);
}
function folds(x,list,a=.14,w=2){x.save();x.filter="blur(1.6px)";x.strokeStyle=`rgba(0,0,0,${a})`;x.lineWidth=w;x.lineCap="round";for(const d of list){x.beginPath();x.moveTo(d[0],d[1]);x.quadraticCurveTo(d[2],d[3],d[4],d[5]);x.stroke()}x.restore()}
function rowExt(G,y){const row=y*G.W;let l=-1,r=-1;for(let i=0;i<G.W;i++)if(G.A[row+i]>=60){if(l<0)l=i;r=i}return[l,r]}
function topRow(G){for(let y=0;y<G.H;y++){const[l]=rowExt(G,y);if(l>=0)return y}return 0}
/* Invisible-mannequin fitting: the photo is never warped. It is scaled from the garment's own
   body width, its shoulder line is put on the mannequin's shoulders, and it is layered in order. */
function dressTop(G,it,role,g,flags){
    const lm=LM[g],isDress=role==="dress",cols=torsoCols(G,isDress?.22:.62,isDress?.36:.9);if(!cols)return null;
    const[bx0,bx1]=cols,bw=Math.max(4,bx1-bx0);
    const Tw=lm.shW*(role==="outer"?1.14:role==="inner"?1.0:isDress?.98:1.05),k=Tw/bw;
    let sr=topRow(G);for(let y=sr;y<G.H*.5;y++){const[l,r]=rowExt(G,y);if(l>=0&&r-l>=bw*.8){sr=y;break}}
    const shY=lm.neck+(g==="male"?9:7)-(role==="outer"?3:role==="inner"?-2:0);
    const ox=120-(bx0+bw/2)*k,oy=shY-sr*k,h=G.H*k,[c,x]=unitCanvas();
    x.drawImage(G.c,ox,oy,G.W*k,h);
    x.globalCompositeOperation="destination-out";
    // When a short-sleeve tee sits over a long-sleeve inner layer, remove the tee's sleeve wings
    // so the inner sleeves remain visible instead of stacking two sets of sleeves.
    if(flags.includes("l")){
        const yTop=oy+(sr+G.H*.10)*k, yBottom=Math.min(lm.waist+18,oy+(sr+G.H*.52)*k);
        const left=ox+bx0*k, right=ox+bx1*k;
        x.beginPath();x.moveTo(0,yTop);x.lineTo(left+Tw*.035,yTop+8);x.lineTo(left+Tw*.02,yBottom);x.lineTo(0,yBottom);x.closePath();
        x.moveTo(240,yTop);x.lineTo(right-Tw*.035,yTop+8);x.lineTo(right-Tw*.02,yBottom);x.lineTo(240,yBottom);x.closePath();x.fill();
    }
    if(flags.includes("t"))x.fillRect(120-Tw/2-4,lm.waist+8,Tw+8,500);
    if(flags.includes("o")){const gp=role==="outer"?.06:.045,t0=oy+sr*k-12,hh=oy+h;x.beginPath();x.moveTo(120-Tw*.025,t0);x.lineTo(120-Tw*gp,t0+(hh-t0)*.32);x.lineTo(120-Tw*.025,hh+4);x.lineTo(120+Tw*.025,hh+4);x.lineTo(120+Tw*gp,t0+(hh-t0)*.32);x.lineTo(120+Tw*.025,t0);x.fill()}
    x.globalCompositeOperation="source-atop";
    const gv=x.createLinearGradient(0,oy,0,oy+h);gv.addColorStop(0,"rgba(255,255,255,.05)");gv.addColorStop(.5,"rgba(0,0,0,0)");gv.addColorStop(1,"rgba(0,0,0,.08)");x.fillStyle=gv;x.fillRect(0,0,240,510);
    const gh=x.createLinearGradient(120-Tw/2,0,120+Tw/2,0);gh.addColorStop(0,"rgba(0,0,0,.1)");gh.addColorStop(.25,"rgba(0,0,0,0)");gh.addColorStop(.75,"rgba(0,0,0,0)");gh.addColorStop(1,"rgba(0,0,0,.1)");x.fillStyle=gh;x.fillRect(120-Tw/2,0,Tw,510);
    if(flags.includes("t")){const gb=x.createLinearGradient(0,lm.waist-8,0,lm.waist+8);gb.addColorStop(0,"rgba(0,0,0,0)");gb.addColorStop(1,"rgba(0,0,0,.18)");x.fillStyle=gb;x.fillRect(0,lm.waist-8,240,16)}
    x.globalCompositeOperation="source-over";return finish(c);
}
function dressBottom(G,it,g){
    const lm=LM[g],ty=topRow(G),ws=[],cs=[];for(let y=ty+1;y<ty+Math.max(3,G.H*.06);y++){const[l,r]=rowExt(G,y);if(l>=0){ws.push(r-l);cs.push((l+r)/2)}}
    if(!ws.length)return null;const md=a=>a.slice().sort((p,q)=>p-q)[a.length>>1],ww=Math.max(4,md(ws)),cx=md(cs);
    let by=G.H-1;while(by>ty&&rowExt(G,by)[0]<0)by--;
    const skirt=["miniskirt","midiskirt","shorts"].includes(it.type),kw=lm.shW*(skirt?.92:.88)/ww,kl=(lm.ankle+10-(lm.waist-6))/Math.max(1,by-ty);
    const k=skirt?kw:Math.pow(kw,.35)*Math.pow(kl,.65),[c,x]=unitCanvas();
    x.drawImage(G.c,120-cx*k,lm.waist-6-ty*k,G.W*k,G.H*k);
    x.globalCompositeOperation="destination-out";x.fillRect(0,lm.floor+3,240,60);
    x.globalCompositeOperation="source-atop";const gh=x.createLinearGradient(120-ww*k/2,0,120+ww*k/2,0);gh.addColorStop(0,"rgba(0,0,0,.1)");gh.addColorStop(.3,"rgba(0,0,0,0)");gh.addColorStop(.7,"rgba(0,0,0,0)");gh.addColorStop(1,"rgba(0,0,0,.1)");x.fillStyle=gh;x.fillRect(0,0,240,510);
    x.globalCompositeOperation="source-over";return finish(c)}
function dressShoes(G,it,g){const lm=LM[g],{W,H,A}=G,col=new Uint32Array(W);for(let y=0;y<H;y++)for(let i=0;i<W;i++)if(A[y*W+i]>=60)col[i]++;
    let best=-1,bl=0;for(let i=Math.floor(W*.3);i<W*.7;i++){if(col[i]===0){let j=i;while(j<W*.7&&col[j]===0)j++;if(j-i>bl){bl=j-i;best=(i+j)>>1}i=j}}
    const[c,x]=unitCanvas(),fx=g==="male"?[107,133]:[106,134],fw=g==="male"?33:30;
    if(best<0){const b=place(it,"shoes",lm,H/W);x.drawImage(G.c,b.x,b.y,b.w,b.h)}
    else for(const[k,[a,bb]]of[[0,best],[best,W]].entries()){let y0=H,y1=0,x0=W,x1=0;for(let y=0;y<H;y++)for(let i=a;i<bb;i++)if(A[y*W+i]>=60){if(y<y0)y0=y;if(y>y1)y1=y;if(i<x0)x0=i;if(i>x1)x1=i}
        if(x1<=x0)continue;const sw=x1-x0+1,shh=y1-y0+1;let w=fw,h=w*shh/sw;if(h>58){h=58;w=h*sw/shh}x.drawImage(G.c,x0,y0,sw,shh,fx[k]-w/2,lm.floor+7-h,w,h)}
    x.globalCompositeOperation="source-atop";const gs=x.createLinearGradient(0,lm.floor-30,0,lm.floor+8);gs.addColorStop(0,"rgba(255,255,255,.05)");gs.addColorStop(1,"rgba(0,0,0,.2)");x.fillStyle=gs;x.fillRect(0,0,240,510);x.globalCompositeOperation="source-over";return finish(c)}
function dressWaist(G,it,g,role){const lm=LM[g],cols=torsoCols(G,.62,.9);if(!cols)return null;const[bx0,bx1]=cols,bw=Math.max(4,bx1-bx0),Tw=lm.hipW*1.35,k=Tw/bw,[c,x]=unitCanvas();
    if(role==="waistBack"){const t=torsoOnly(G,bx0,bx1),h=Math.min(G.H*k,118),y=lm.waist+2;x.save();x.beginPath();x.rect(0,y,240,h);x.clip();x.translate(0,y+G.H*k);x.scale(1,-1);x.drawImage(t.c,120-(bw/2+t.pw)*k,0,t.c.width*k,G.H*k);x.restore();
        x.globalCompositeOperation="source-atop";x.fillStyle="rgba(0,0,0,.16)";x.fillRect(0,0,240,510);x.globalCompositeOperation="source-over";return finish(c)}
    let any=false;for(const side of[-1,1]){const sl=sleeveOf(G,side,bx0,bx1,1);if(!sl)continue;any=true;const px=side<0?bx0:bx1,py=sl.ymin+G.H*.04,ths=Math.atan2(sl.cy-py,sl.cx-px),Lu=2*Math.hypot(sl.cx-px,sl.cy-py)*k,sa=(lm.hipW*.85)/Math.max(1,Lu);
        x.save();x.translate(120+side*lm.hipW*.62,lm.waist+2);x.rotate((side<0?14:166)*Math.PI/180);x.scale(sa,1);x.rotate(-ths);x.scale(k*.8,k*.8);x.translate(-px,-py);x.drawImage(sl.canvas,0,0);x.restore()}
    if(!any)return null;const t=torsoOnly(G,bx0,bx1);x.save();x.beginPath();x.ellipse(120,lm.waist+12,9,7,0,0,Math.PI*2);x.clip();x.drawImage(t.c,t.c.width*.3,G.H*.3,t.c.width*.4,G.H*.3,108,lm.waist+2,24,20);x.restore();
    x.globalCompositeOperation="source-atop";const rg=x.createRadialGradient(118,lm.waist+9,1,120,lm.waist+12,11);rg.addColorStop(0,"rgba(255,255,255,.08)");rg.addColorStop(1,"rgba(0,0,0,.3)");x.fillStyle=rg;x.fillRect(100,lm.waist-6,40,40);
    const gl=x.createLinearGradient(0,lm.waist-8,0,lm.waist+30);gl.addColorStop(0,"rgba(0,0,0,.05)");gl.addColorStop(1,"rgba(0,0,0,.25)");x.fillStyle=gl;x.fillRect(0,lm.waist-10,240,50);x.globalCompositeOperation="source-over";return finish(c)}
async function renderWorn(it,role,g,flags){const G=await loadCanvas(it),lm=LM[g];
    const plain=()=>({url:G.src,...place(it,["waistBack","waistFront"].includes(role)?"top":role,lm,G.H/G.W)});
    if(["scarf","hat","bag","umbrella"].includes(role))return plain();
    if(G.opaque>.97)return role.startsWith("waist")?{skip:true}:plain();
    let r=null;try{if(["top","inner","outer","dress"].includes(role))r=await dressTop(G,it,role,g,flags);else if(role==="bottom")r=await dressBottom(G,it,g);else if(role==="shoes")r=await dressShoes(G,it,g);else r=await dressWaist(G,it,g,role)||{skip:true}}catch(e){r=null}
    return r||plain()}
function styleFor(o,ctx){const st={tuck:false,open:false,outerOpen:false};const t=o.top;
    if(t&&!o.dress&&o.bottom){const tuckable=["shirt","blouse","knit","turtleneck","tee","longsleeve"].includes(t.type),fitted=["midiskirt","miniskirt","slacks","trousers","flarejeans","jeans"].includes(o.bottom.type);
        if(tuckable&&fitted&&(["classy","smart","soft","minimal"].includes(ctx.vibe)||["dinner","smart","formal","date"].includes(ctx.occKey)||["midiskirt","miniskirt","slacks"].includes(o.bottom.type)))st.tuck=true}
    if(t&&["shirt","cardigan"].includes(t.type)&&o.inner)st.open=true;
    st.outerOpen=!!(o.outer&&["coat","trench","blazer","jacket"].includes(o.outer.type)&&!(ctx.feels<3&&o.outer.type!=="blazer"));return st}
function styleNotes(o,st){const n=[],nm=x=>x.name.toLowerCase();
    if(st.open&&o.top&&o.inner)n.push(`Wear the ${nm(o.top)} unbuttoned over the ${nm(o.inner)}.`);
    if(st.tuck&&o.top)n.push(`Tuck the ${nm(o.top)}${o.inner?" and the layer under it":""} in.`);
    if(o.waist)n.push(`Tie the ${nm(o.waist)} around your waist by the sleeves (see the inset).`);
    if(o.outer)n.push(st.outerOpen?`Leave the ${nm(o.outer)} open.`:`Close the ${nm(o.outer)} up.`);return n}
function wornParts(o,g,st){const P=[],add=(it,role,flags,z)=>{if(it)P.push({it,role,flags,z,key:[it.id,it.type,it.pv||0,it.keepBg?1:0,role,g,flags].join("|")})};
    const long=o.bottom&&!["shorts","miniskirt","midiskirt"].includes(o.bottom.type),tf=st.tuck?"t":"";
    add(o.shoes,"shoes","",long?2:5);
    const shortOverLong=!!(o.top&&o.inner&&["tee","sporttop"].includes(o.top.type)&&["longsleeve","turtleneck"].includes(o.inner.type));
    if(st.tuck){add(o.inner,"inner",tf,3);add(o.top,"top",tf+(st.open?"o":"")+(shortOverLong?"l":""),3.5)}
    add(o.bottom,"bottom","",4);
    if(!st.tuck){add(o.inner,"inner","",6);add(o.dress,"dress","",6.5);add(o.top,"top",(st.open?"o":"")+(shortOverLong?"l":""),7)}else add(o.dress,"dress","",6.5);
    add(o.outer,"outer",st.outerOpen?"o":"",8);
    for(const a of(o.acc||[])){if(a.type==="scarf")add(a,"scarf","",9);if(a.type==="bag")add(a,"bag","",12);if(a.type==="beanie"||a.type==="cap")add(a,"hat","",13)}
    return P.sort((a,b)=>a.z-b.z)}
function prepWorn(p,g){if(WORN.has(p.key))return Promise.resolve();if(!INFL.has(p.key))INFL.set(p.key,renderWorn(p.it,p.role,g,p.flags).then(r=>WORN.set(p.key,r)).catch(err=>{console.error("AGORA mannequin clothing render failed:",p.it&&p.it.name,err);WORN.set(p.key,{skip:true,error:err&&err.message||"render failed"})}));return INFL.get(p.key)}
async function dressPending(){for(const el of $$("svg[data-mq]")){const n=+el.dataset.mq,m=MQ.get(n);if(!m)continue;MQ.delete(n);await Promise.all(m.parts.map(p=>prepWorn(p,m.g)));if(el.isConnected)el.outerHTML=mannequinSVG(m.o,m.idx,m.opts)}}
function mannequinSVG(o,idx=0,opts={}){
    const g=(opts.gender||(S.user&&S.user.gender))==="male"?"male":"female",B=BODY[g],pfx="m"+(++SVGN)+"_",parts=wornParts(o,g,opts.style||{}),ready=parts.every(p=>WORN.has(p.key));
    const defs=`<linearGradient id="${pfx}b" x1="0" x2="1"><stop offset="0" stop-color="#0a0a0c"/><stop offset=".3" stop-color="#25252a"/><stop offset=".48" stop-color="#3c3c42"/><stop offset=".66" stop-color="#18181b"/><stop offset="1" stop-color="#070708"/></linearGradient><linearGradient id="${pfx}p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3a3f"/><stop offset="1" stop-color="#111113"/></linearGradient><filter id="${pfx}bl" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.4"/></filter><filter id="${pfx}ds" x="-10%" y="-10%" width="120%" height="125%"><feDropShadow dx="0" dy="1.4" stdDeviation="1.6" flood-color="#000" flood-opacity=".35"/></filter>`;
    const P=d=>`<path d="${d}" fill="url(#${pfx}b)"/>`,HL=(d,w=2.4,op=.17)=>`<path d="${d}" fill="none" stroke="#fff" stroke-opacity="${op}" stroke-width="${w}" stroke-linecap="round" filter="url(#${pfx}bl)"/>`;
    const im=r=>r&&!r.skip?`<image href="${r.url}" x="${r.x.toFixed(1)}" y="${r.y.toFixed(1)}" width="${r.w.toFixed(1)}" height="${r.h.toFixed(1)}" preserveAspectRatio="none" filter="url(#${pfx}ds)"/>`:"";
    let s=`<ellipse cx="122" cy="500" rx="84" ry="6" fill="rgba(0,0,0,.16)"/><rect x="135" y="404" width="4" height="84" fill="#2a2a2e"/><path d="M68,484 L176,484 L192,496 L52,496 Z" fill="url(#${pfx}p)"/><path d="M52,496 L192,496 L192,500 L52,500 Z" fill="#0c0c0e"/><path d="M68,484 L176,484" stroke="#5f5f66" stroke-width=".8"/>`;
    if(opts.umbrella)s+=opts.umbrella===true?`<g transform="translate(-10,56)">${drawUmbrella(null,pfx,[])}</g>`:(()=>{const r=srcOf(opts.umbrella);return im({url:r.src,...place(opts.umbrella,"umbrella",LM[g],r.a)})})();
    s+=`<g transform="translate(120 0) scale(${BW} 1) translate(-120 0)">`;for(const d of both(B.leg))s+=P(d);for(const d of both(B.foot))s+=P(d);s+=P(B.torso);s+=P(B.neck);
    for(const d of both("M101,252 C104,300 106,340 107,430"))s+=HL(d);for(const d of both(g==="male"?"M84,96 C94,91 106,89 114,88":"M90,96 C98,91 108,89 114,88"))s+=HL(d,2.2,.2);s+="</g>";
    if(B.bust)s+=`<ellipse cx="107" cy="124" rx="10" ry="6" fill="#fff" opacity=".07"/><ellipse cx="133" cy="124" rx="10" ry="6" fill="#fff" opacity=".07"/>`;
    if(ready)for(const p of parts)if(p.z<12)s+=im(WORN.get(p.key));
    s+=P(B.head)+`<ellipse cx="${g==="male"?112:113}" cy="30" rx="5" ry="10" fill="#fff" opacity=".2" filter="url(#${pfx}bl)"/>`;
    if(ready)for(const p of parts)if(p.z>=12)s+=im(WORN.get(p.key));
    let attr="";if(!ready){const n=++MQN;MQ.set(n,{o,idx,opts,parts,g});attr=` data-mq="${n}"`;s+=`<text x="120" y="300" text-anchor="middle" font-size="12" fill="#fff" fill-opacity=".8" font-family="Jost,sans-serif">Dressing…</text>`}
    return`<svg${attr} viewBox="16 6 208 498" role="img" aria-label="${esc(opts.label||"Outfit on a mannequin")}"><defs>${defs}</defs>${s}</svg>`;
}
function flatSVG(it){
    const pfx="f"+(++SVGN)+"_",defs=[],t=it.type,cat=T(it).cat;let s="",vb="48 66 144 186";
    if(cat==="top"){if(t==="hoodie"){s+=drawHood(it,defs,pfx);vb="48 34 144 218"}s+=drawTop(it,defs,pfx)}
    else if(cat==="bottom"){s+=drawBottom(it,defs,pfx);vb=["shorts","miniskirt"].includes(t)?"70 196 100 100":t==="midiskirt"?"70 196 100 160":"74 196 92 236"}
    else if(cat==="dress"){s+=drawDress(it,defs,pfx);vb="48 66 144 290"}
    else if(cat==="outer"){s+=drawOuter(it,defs,pfx);const L=OUTER_LEN[t]||250;vb=`38 ${t.includes("padding")?56:66} 164 ${L-50}`}
    else if(cat==="shoes"){s+=drawShoes(it,defs,pfx);vb=t==="boots"?"84 378 72 64":"84 400 72 42"}
    else{if(t==="umbrella"){s+=drawUmbrella(it,pfx,defs);vb="186 248 40 176"}else{s+=drawAcc(it,defs,pfx);vb=t==="scarf"?"92 60 56 110":t==="bag"?"138 86 60 184":"96 4 56 34"}}
    const shade=`<linearGradient id="${pfx}sh" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".14"/><stop offset=".4" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient>`;
    const vbn=vb.split(" ").map(Number);return`<svg xmlns="http://www.w3.org/2000/svg" width="${vbn[2]*4}" height="${vbn[3]*4}" viewBox="${vb}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs>${shade}${defs.join("")}</defs>${s}</svg>`;
}
const SRCC=new Map();
function srcOf(it){
    if(it.img){if(it.cut&&!it.keepBg)return{src:it.cut,a:it.cutAspect||1.2};return{src:it.img,a:it.imgAspect||1.25}}
    const k=it.type+it.color+(it.pattern||"")+(it.color2||"");if(SRCC.has(k))return SRCC.get(k);
    const svg=flatSVG(it),vb=svg.match(/viewBox="([^"]+)"/)[1].split(" ").map(Number);
    const r={src:"data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg),a:vb[3]/vb[2]};SRCC.set(k,r);return r}
const thumb=it=>it.img?`<img src="${it.img}" alt="">`:'<span class="photo-missing">No photo</span>';
// A saved photo is a real wardrobe item even if an older version left sample=true in its metadata.
// Hide only sample placeholders that do not have an uploaded photo.
const wardrobeItems=()=>S.user?(S.user.items||[]).filter(it=>!!it.img):[];
