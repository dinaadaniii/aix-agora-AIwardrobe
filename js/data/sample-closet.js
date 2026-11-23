"use strict";
/* AGORA · Sample closet */
/* ---------- sample closet (persona Syafiq, week 3) ---------- */
const SAMPLE=[
    ["White oxford shirt","shirt","#f4f1ea"],["Grey crewneck knit","knit","#9a9894","knit"],["Cream cable knit","knit","#e8dcc4","knit"],["Black tee","tee","#232221"],["Navy hoodie","hoodie","#25304a"],
    ["Breton long-sleeve","longsleeve","#f1ece2","stripe",{color2:"#26314d"}],["Brown cardigan","cardigan","#6e4b33","knit"],["Charcoal turtleneck","turtleneck","#3a3836","knit"],["Sage sweatshirt","sweatshirt","#a7b49a"],["Training top","sporttop","#2b2b2b"],
    ["Dark straight jeans","jeans","#2d3a52","denim"],["Light-wash jeans","jeans","#7f9bb8","denim"],["Beige wide trousers","trousers","#cdb895"],["Black tailored slacks","slacks","#1f1e1d"],["Olive cargo pants","cargo","#5f6340"],["Grey joggers","joggers","#8a8a88"],["Navy shorts","shorts","#26324d"],
    ["Camel wool coat","coat","#b98b56"],["Black short padding","padding","#1d1d1d","quilt"],["Denim jacket","jacket","#5a7696","denim"],["Beige trench","trench","#cdb48a"],["Brown suede blouson","jacket","#7a5235","solid",{suede:true}],["Olive windbreaker","windbreaker","#5c6b4a"],["Long black padding","longpadding","#262626","quilt"],
    ["White leather sneakers","sneakers","#f2efe9"],["Black penny loafers","loafers","#1c1b1a"],["Brown suede Chelsea boots","boots","#5b3b28","solid",{suede:true}],["Grey running shoes","runners","#9aa3ad"],
    ["Burgundy scarf","scarf","#6b1f2a","knit"],["Grey beanie","beanie","#7d7b78","knit"],["Black compact umbrella","umbrella","#2a2826"],["Brown leather bag","bag","#6e4b33"],
];
const SAMPLE_F=[
    ["White basic tee","tee","#f5f3ee"],["Striped long-sleeve tee","longsleeve","#f1ece2","stripe",{color2:"#26314d"}],["Ivory bow blouse","blouse","#efe8d8"],["Light blue oxford shirt","shirt","#a9c2dc"],["Cream cardigan","cardigan","#e9dcc3","knit"],["Grey crewneck knit","knit","#9a9894","knit"],["Black turtleneck","turtleneck","#232221","knit"],["Dusty pink sweatshirt","sweatshirt","#e2b9bd"],["Training top","sporttop","#2b2b2b"],
    ["Mid-wash flare jeans","flarejeans","#4a6585","denim"],["Black wide trousers","trousers","#1f1e1d"],["Brown midi skirt","midiskirt","#6e4b33"],["Denim mini skirt","miniskirt","#6f8db0","denim"],["Grey joggers","joggers","#8a8a88"],
    ["Sage midi dress","dress","#a7b49a"],["Black slip dress","dress","#1d1c1b"],["Blush floral dress","dress","#e9c8c0","print",{color2:"#b5583a"}],
    ["Camel wool coat","coat","#b98b56"],["Tweed cropped jacket","jacket","#d9cfc0","check",{color2:"#6b5b4a"}],["Beige trench","trench","#cdb48a"],["Black short padding","padding","#1d1d1d","quilt"],["Navy blazer","blazer","#26314d"],["Cream long padding","longpadding","#e9e1d0","quilt"],
    ["White leather sneakers","sneakers","#f2efe9"],["Black loafers","loafers","#1c1b1a"],["Brown knee boots","boots","#5b3b28"],["Black heels","heels","#1d1c1b"],["Grey running shoes","runners","#9aa3ad"],
    ["Burgundy scarf","scarf","#6b1f2a","knit"],["Cream beanie","beanie","#e9dcc3","knit"],["Black compact umbrella","umbrella","#2a2826"],["Brown shoulder bag","bag","#6e4b33"],
];
function sampleItems(g){return(g==="female"?SAMPLE_F:SAMPLE).map(([name,type,color,pattern,extra])=>Object.assign({id:uid(),name,type,color,pattern:pattern||"solid",sample:true,added:Date.now()},extra||{}))}
