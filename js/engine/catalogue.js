"use strict";
/* AGORA · Garment catalogue, occasions and style vibes */
/* ---------- garment catalogue ---------- */
const TYPES={
    tee:{cat:"top",label:"T-shirt",w:1,f:1,tags:["casual","street"]},
    longsleeve:{cat:"top",label:"Long-sleeve tee",w:2,f:1.5,tags:["casual","minimal"]},
    shirt:{cat:"top",label:"Shirt",w:2,f:3,tags:["smart","classy","minimal"]},
    blouse:{cat:"top",label:"Blouse",w:1.5,f:3,tags:["soft","classy"]},
    knit:{cat:"top",label:"Knit sweater",w:3.5,f:2.6,tags:["soft","minimal","classy","casual"]},
    turtleneck:{cat:"top",label:"Turtleneck",w:3.5,f:3,tags:["classy","minimal","smart"]},
    cardigan:{cat:"top",label:"Cardigan",w:3,f:2.5,tags:["soft","casual"]},
    sweatshirt:{cat:"top",label:"Sweatshirt",w:3,f:1,tags:["casual","street","sporty"]},
    hoodie:{cat:"top",label:"Hoodie",w:3.2,f:.8,tags:["street","casual","sporty"]},
    sporttop:{cat:"top",label:"Training top",w:1.2,f:.3,tags:["sporty"]},
    jeans:{cat:"bottom",label:"Jeans",w:2,f:2,tags:["casual","street","minimal"]},
    flarejeans:{cat:"bottom",label:"Flare jeans",w:2,f:2,tags:["casual","bold","soft","street"]},
    trousers:{cat:"bottom",label:"Wide trousers",w:2,f:3.2,tags:["classy","minimal","smart","soft"]},
    slacks:{cat:"bottom",label:"Tailored slacks",w:2,f:4,tags:["classy","smart"]},
    cargo:{cat:"bottom",label:"Cargo pants",w:2.2,f:1,tags:["street","casual"]},
    joggers:{cat:"bottom",label:"Joggers",w:2,f:.5,tags:["sporty","street"]},
    shorts:{cat:"bottom",label:"Shorts",w:.5,f:1,tags:["casual","sporty"]},
    miniskirt:{cat:"bottom",label:"Mini skirt",w:.8,f:2,tags:["bold","soft"]},
    midiskirt:{cat:"bottom",label:"Midi skirt",w:1.4,f:3,tags:["soft","classy","minimal"]},
    dress:{cat:"dress",label:"Dress",w:2,f:3.2,tags:["soft","classy"]},
    blazer:{cat:"outer",label:"Blazer",w:2,f:4,tags:["smart","classy","minimal"]},
    jacket:{cat:"outer",label:"Jacket",w:2,f:1.8,tags:["casual","street"]},
    trench:{cat:"outer",label:"Trench coat",w:2.5,f:3.5,tags:["classy","minimal","smart"]},
    coat:{cat:"outer",label:"Wool coat",w:4,f:3.8,tags:["classy","minimal","smart"]},
    padding:{cat:"outer",label:"Short padding",w:4.5,f:1,tags:["street","casual","sporty"]},
    longpadding:{cat:"outer",label:"Long padding",w:5.5,f:1,tags:["casual","street"]},
    windbreaker:{cat:"outer",label:"Windbreaker",w:1.2,f:.5,tags:["sporty","street"]},
    sneakers:{cat:"shoes",label:"Sneakers",w:0,f:1.8,tags:["casual","street","minimal"]},
    runners:{cat:"shoes",label:"Running shoes",w:0,f:.3,tags:["sporty"]},
    loafers:{cat:"shoes",label:"Loafers",w:0,f:3.6,tags:["classy","smart","minimal"]},
    boots:{cat:"shoes",label:"Boots",w:.5,f:3,tags:["classy","street","bold"]},
    heels:{cat:"shoes",label:"Heels",w:0,f:4.4,tags:["classy","bold"]},
    derbies:{cat:"shoes",label:"Derby shoes",w:0,f:4.2,tags:["classy","smart"]},
    scarf:{cat:"acc",label:"Scarf",w:.8,f:2.5,tags:["classy","soft"]},
    beanie:{cat:"acc",label:"Beanie",w:.6,f:1,tags:["street","casual"]},
    cap:{cat:"acc",label:"Cap",w:0,f:.5,tags:["sporty","street"]},
    bag:{cat:"acc",label:"Bag",w:0,f:2.5,tags:["classy","casual"]},
    umbrella:{cat:"acc",label:"Umbrella",w:0,f:2,tags:[]},
};
const CATS=[["top","Tops"],["bottom","Bottoms"],["dress","Dresses"],["outer","Outerwear"],["shoes","Shoes"],["acc","Accessories"]];
const STYLE_TAGS=["casual","smart","minimal","classy","soft","bold","street","sporty"];
const PATTERNS=["solid","stripe","check","print","denim","knit","quilt"];
const T=it=>TYPES[it.type]||TYPES.tee;
const pW=it=>it?(it.w??T(it).w):0;
const FEM=["midiskirt","miniskirt","dress","heels","blouse"];
const LAYER={knit:["shirt","blouse","turtleneck","longsleeve"],sweatshirt:["shirt","longsleeve","turtleneck"],cardigan:["tee","shirt","longsleeve","turtleneck","blouse"],tee:["longsleeve","turtleneck"],shirt:["tee","turtleneck"],hoodie:["longsleeve","shirt"],dress:["tee","longsleeve","turtleneck","shirt","blouse"]};
const DRESS_BOTTOMS=["flarejeans","jeans","trousers"];
function wearable(items){return S.user&&S.user.gender==="male"?items.filter(i=>!FEM.includes(i.type)):items}
const pF=it=>it?(it.f??T(it).f):0;
const pTags=it=>it?(it.tags&&it.tags.length?it.tags:T(it).tags):[];

/* ---------- occasions & vibes ---------- */
const OCCASIONS=[
    {k:"class",label:"Going to class",f:[.8,2.5],pref:["sneakers","jeans","knit","sweatshirt","hoodie","cargo","longsleeve","jacket","padding","cardigan"],tags:["casual","minimal","street"],kw:["class","lecture","lab","seminar","study","exam","강의","수업","tutorial"]},
    {k:"cafe",label:"Café hangout",f:[1,2.9],pref:["knit","cardigan","sneakers","trousers","jacket","midiskirt","blouse","longsleeve"],tags:["casual","soft","minimal"],kw:["cafe","café","coffee","카페","brunch"]},
    {k:"shopping",label:"Window shopping",f:[1,2.7],pref:["sneakers","jeans","cargo","jacket","tee","sweatshirt","trench","bag"],tags:["casual","street","minimal"],kw:["shopping","mall","market","store","쇼핑"]},
    {k:"picnic",label:"Picnic",f:[.8,2.2],pref:["sneakers","tee","cardigan","shorts","longsleeve","jeans","midiskirt","windbreaker","dress"],tags:["casual","soft"],kw:["picnic","park","hangang","한강","hike","outdoor","소풍"]},
    {k:"date",label:"Date",f:[2,3.8],pref:["knit","blouse","midiskirt","dress","loafers","boots","coat","trousers","turtleneck"],tags:["soft","classy","bold"],kw:["date","movie","데이트","concert"]},
    {k:"dinner",label:"Dinner",f:[2.4,4.2],pref:["shirt","turtleneck","slacks","trousers","loafers","coat","blazer","boots"],tags:["classy","smart","minimal"],kw:["dinner","restaurant","drinks","저녁","회식","bar"]},
    {k:"smart",label:"Meeting / smart casual",f:[2.8,4],pref:["shirt","blazer","slacks","trousers","loafers","derbies","knit","turtleneck","trench"],tags:["smart","classy","minimal"],kw:["meeting","presentation","office","work","intern","미팅","발표","team"]},
    {k:"formal",label:"Formal event",f:[3.8,5],pref:["shirt","blazer","slacks","derbies","heels","coat","dress"],tags:["classy","smart"],kw:["interview","wedding","ceremony","formal","gala","면접","결혼","graduation"]},
    {k:"athletic",label:"Athletic / gym",f:[0,1.2],pref:["sporttop","joggers","shorts","runners","windbreaker","sweatshirt","cap"],tags:["sporty"],kw:["gym","run","workout","yoga","sport","football","badminton","운동","헬스","swim","jog"]},
];
const OCC=Object.fromEntries(OCCASIONS.map(o=>[o.k,o]));
const VIBES=[["any","Any vibe"],["casual","Casual"],["smart","Smart casual"],["minimal","Minimal"],["classy","Classy"],["soft","Soft"],["bold","Bold"],["street","Street"],["sporty","Athletic"]];
function guessOcc(title){const t=title.toLowerCase();for(const o of OCCASIONS)if(o.kw.some(k=>t.includes(k)))return o.k;return"cafe"}
