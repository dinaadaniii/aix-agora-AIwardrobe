"use strict";
/* AGORA · Favourite outfit collection */
function renderFavourites(){
    const u=S.user,grid=$("#favourites-grid");if(!u||!grid)return;
    const favs=(u.favourites||[]).slice().sort((a,b)=>(b.savedAt||0)-(a.savedAt||0));
    if(!favs.length){grid.innerHTML='<div class="empty"><h3>No favourite outfits yet</h3><p>Go to Today and press Like on an outfit. Your liked looks will be collected here.</p><a class="btn terra" href="#today">Explore Today</a></div>';return;}
    const byId=new Map(wardrobeItems().map(it=>[String(it.id),it]));
    grid.innerHTML=`<div class="favgrid">${favs.map((f,i)=>{
        const ids=f.slotIds||{};const pieces=[ids.outer,ids.inner,ids.top,ids.dress,ids.bottom,ids.waist,ids.shoes,...(ids.acc||[])].filter(Boolean).map(id=>byId.get(String(id))).filter(Boolean);
        const caption=pieces.map(x=>esc(x.name)).join(' · ');
        return `<article class="favcard"><div class="favvisual"><div class="favpieces">${pieces.length?pieces.map(x=>`<figure>${thumb(x)}<figcaption>${esc(x.name)}</figcaption></figure>`).join(''):'<p class="muted">Some pieces are no longer in your closet.</p>'}</div></div><div class="favbody"><h3>Saved outfit</h3><p>${caption||'Clothing items unavailable'}</p><div class="favmeta">${esc(f.date||'')} · ${esc(f.occasion||'')} ${f.vibe&&f.vibe!=='any'?'· '+esc(f.vibe):''}</div><button class="btn ghost small fav-remove" data-fav="${esc(f.feedbackId||f.id)}">Remove favourite</button></div></article>`;
    }).join('')}</div>`;
    $$('.fav-remove',grid).forEach(b=>b.onclick=async()=>{const id=b.dataset.fav;u.favourites=(u.favourites||[]).filter(f=>(f.feedbackId||f.id)!==id);u.feedback=(u.feedback||[]).filter(f=>f.id!==id);await save();toast('Favourite removed.');renderFavourites();});
}
