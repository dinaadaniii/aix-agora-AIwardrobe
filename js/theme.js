/* Light / dark theme switch.
   Loaded in <head> WITHOUT defer, so the saved theme is applied before the page draws (no flash).
   No saved choice = follow the device setting. The choice is shared by the landing page and the app. */
(function(){
    const KEY="agora-theme";
    const root=document.documentElement;
    const media=window.matchMedia("(prefers-color-scheme: dark)");

    function saved(){try{return localStorage.getItem(KEY)}catch(e){return null}}
    function current(){return root.dataset.theme||(media.matches?"dark":"light")}

    function apply(theme){
        if(theme==="light"||theme==="dark")root.dataset.theme=theme;
        else delete root.dataset.theme;
        const meta=document.querySelector('meta[name="theme-color"]');
        if(meta)meta.content=current()==="dark"?"#3C0008":"#F4F4F6";
        document.querySelectorAll("[data-theme-toggle]").forEach(btn=>{
            const dark=current()==="dark";
            btn.setAttribute("aria-label",dark?"Switch to light mode":"Switch to dark mode");
            btn.setAttribute("title",dark?"Light mode":"Dark mode");
            btn.setAttribute("aria-pressed",String(dark));
        });
    }

    function toggle(){
        const next=current()==="dark"?"light":"dark";
        try{localStorage.setItem(KEY,next)}catch(e){}
        apply(next);
    }

    apply(saved());
    media.addEventListener("change",()=>{if(!saved())apply(null)});
    document.addEventListener("DOMContentLoaded",()=>{
        document.querySelectorAll("[data-theme-toggle]").forEach(btn=>btn.addEventListener("click",toggle));
        apply(saved());
    });
})();
