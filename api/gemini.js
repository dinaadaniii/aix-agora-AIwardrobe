/* AGORA · Gemini proxy (Vercel Function).
   The API key lives in the Vercel project's environment variables as GEMINI_API_KEY and never reaches the browser.
   Only two fixed jobs are allowed, with prompts built here, so the key can't be used as a general-purpose Gemini proxy:
     POST {mode:"tag",  image:<base64 jpeg>, types:[...], patterns:[...], tags:[...]}  -> {type,name,pattern,tags,suede}
     POST {mode:"note", occasion, feels, rain, vibe, pieces:[{name,type}]}           -> {note}
   GET returns {configured:true|false} so the app can show or hide its AI buttons. */
const MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
const API = "https://generativelanguage.googleapis.com/v1beta/models/";
const WINDOW_MS = 10 * 60 * 1000, MAX_PER_WINDOW = 40;     // per IP, per server instance
const hits = new Map();

const word = (s, n = 24) => typeof s === "string" && /^[a-z0-9 _-]+$/i.test(s) && s.length <= n;
const clean = (s, n) => String(s == null ? "" : s).replace(/[\u0000-\u001f<>]/g, " ").slice(0, n).trim();

function limited(ip) {
    const now = Date.now(), list = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS);
    list.push(now); hits.set(ip, list);
    if (hits.size > 5000) hits.clear();
    return list.length > MAX_PER_WINDOW;
}
function sameSite(req) {
    const origin = req.headers.origin;
    if (!origin) return true;
    try {
        const o = new URL(origin).host, h = req.headers["x-forwarded-host"] || req.headers.host;
        return o === h || /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(o);
    } catch { return false; }
}
async function callGemini(parts, json, maxTokens) {
    const r = await fetch(API + encodeURIComponent(MODEL) + ":generateContent", {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
        body: JSON.stringify({
            contents: [{ role: "user", parts }],
            generationConfig: { temperature: json ? 0.2 : 0.7, maxOutputTokens: maxTokens, ...(json ? { responseMimeType: "application/json" } : {}) },
        }),
    });
    if (r.status === 429) { const e = new Error("rate_limited"); e.status = 429; throw e; }
    if (!r.ok) { const e = new Error("upstream_" + r.status); e.status = 502; throw e; }
    const data = await r.json();
    const text = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("").trim();
    if (!text) { const e = new Error("empty"); e.status = 502; throw e; }
    return text;
}

module.exports = async function handler(req, res) {
    res.setHeader("cache-control", "no-store");
    if (req.method === "GET") return res.status(200).json({ configured: !!process.env.GEMINI_API_KEY });
    if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
    if (!process.env.GEMINI_API_KEY) return res.status(503).json({ error: "not_configured" });
    if (!sameSite(req)) return res.status(403).json({ error: "forbidden" });
    const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "?").split(",")[0].trim();
    if (limited(ip)) return res.status(429).json({ error: "rate_limited" });

    const b = typeof req.body === "string" ? safeParse(req.body) : (req.body || {});
    try {
        if (b.mode === "tag") {
            const img = typeof b.image === "string" ? b.image.replace(/^data:image\/\w+;base64,/, "") : "";
            if (!img || img.length > 1_500_000) return res.status(400).json({ error: "bad_image" });
            const types = (b.types || []).filter(t => word(t)).slice(0, 80);
            const patterns = (b.patterns || []).filter(t => word(t)).slice(0, 20);
            const tags = (b.tags || []).filter(t => word(t)).slice(0, 30);
            if (!types.length) return res.status(400).json({ error: "bad_request" });
            const prompt = `This is a photo of one clothing item for a wardrobe app. Reply with only JSON: {"type": one of ${JSON.stringify(types)}, "name": short name like "Grey crewneck knit" (max 4 words), "pattern": one of ${JSON.stringify(patterns)}, "tags": up to 3 of ${JSON.stringify(tags)}, "suede": boolean}. If the photo is not a clothing item, use the closest type anyway.`;
            const text = await callGemini([{ text: prompt }, { inlineData: { mimeType: "image/jpeg", data: img } }], true, 200);
            const j = safeParse(text) || {};
            return res.status(200).json({
                type: types.includes(j.type) ? j.type : null,
                name: clean(j.name, 40) || null,
                pattern: patterns.includes(j.pattern) ? j.pattern : null,
                tags: Array.isArray(j.tags) ? j.tags.filter(t => tags.includes(t)).slice(0, 3) : [],
                suede: typeof j.suede === "boolean" ? j.suede : null,
            });
        }
        if (b.mode === "note") {
            const pieces = (Array.isArray(b.pieces) ? b.pieces : []).slice(0, 10).map(p => `${clean(p && p.name, 40)} (${clean(p && p.type, 20)})`).filter(s => s.length > 4);
            if (!pieces.length) return res.status(400).json({ error: "bad_request" });
            const feels = Number.isFinite(+b.feels) ? Math.round(+b.feels) : null;
            const prompt = `You are a friendly personal stylist in a wardrobe app for university students in Korea. In at most 2 short sentences (under 40 words total), tell the user how to wear this outfit today and one small styling tip. Plain, warm, specific; no emojis, no hashtags, don't list every piece.
Occasion: ${clean(b.occasion, 40) || "everyday"}. Feels-like temperature: ${feels == null ? "unknown" : feels + "°C"}. Rain: ${b.rain ? "yes" : "no"}. Style vibe: ${clean(b.vibe, 20) || "any"}.
Outfit: ${pieces.join("; ")}.`;
            const note = clean(await callGemini([{ text: prompt }], false, 120), 320);
            return res.status(200).json({ note });
        }
        return res.status(400).json({ error: "unknown_mode" });
    } catch (e) {
        const status = e.status || 500;
        return res.status(status).json({ error: status === 429 ? "rate_limited" : "ai_unavailable" });
    }
};
function safeParse(s) { try { return JSON.parse(s); } catch { const m = String(s).match(/\{[\s\S]*\}/); try { return m ? JSON.parse(m[0]) : null; } catch { return null; } } }
