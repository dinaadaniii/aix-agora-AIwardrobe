/* AGORA runtime configuration.
   Frontend phase: Supabase (login, cloud wardrobe) and the Gemini AI try-on lab are switched off,
   and everything is saved in this browser (IndexedDB).
   To turn the cloud back on later, set SUPABASE_ENABLED to true. The key below is the publishable
   browser key; never put a service-role key in this file. */
window.AGORA_CONFIG = {
    SUPABASE_ENABLED: false,
    AI_TRYON_ENABLED: false,
    SUPABASE_URL: "https://nlpotsrqnetrgfixwvre.supabase.co",
    SUPABASE_PUBLISHABLE_KEY: "sb_publishable_TjY53UAmw3ZpxMskXByZKQ_OUt_SLcO",
    SUPABASE_JS_CDN: "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
};
