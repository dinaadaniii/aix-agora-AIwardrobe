# AGORA

**AGORA** is a wardrobe and daily outfit app. You photograph your clothes once, and AGORA suggests what to wear based on the day's weather, your schedule and the occasion, using only pieces you own.

> **Current phase: frontend.** There is no login and no cloud sync. Everything is saved in your browser (IndexedDB). Use **Account → Export backup** to keep a copy. Supabase login and the Gemini AI try-on are switched off in `js/config.js` until the backend phase.

Live site: deployed on Vercel from the `main` branch.

## Design

Cloud-grey background, denim-indigo text and one raincoat-yellow accent for primary actions, set in Bricolage Grotesque. Colours and fonts are CSS variables at the top of `css/agora.css` (with a dark mode) and `css/landing.css`.

## Features

- **Today**: weather for the selected day and city, your plans, and three recommended looks on a mannequin or as a flat lay. Tap a piece to swap it; *Wear this look* saves the outfit to that day's calendar.
- **Closet**: upload one or many photos. AGORA removes the background and reads the main colour in the browser.
- **Week**: add plans or import an `.ics` calendar file; each day shows its best look.
- **Calendar**: month view with plans and saved outfits.
- **2D Try-On**: dress a front-facing mannequin with your own clothing photos.
- **Account**: rename your profile, export or import a JSON backup, or delete all data.

Weather is a live 16-day forecast from [Open-Meteo](https://open-meteo.com/) (free, no API key), cached in the browser for 3 hours. If it can't be reached, or for days beyond the forecast, AGORA falls back to its built-in Gyeonggi climate model and says so on the weather card.

## Run it locally

You need Python 3 and a modern browser (Chrome recommended). From the project folder:

```bash
# Windows
py -m http.server 8000
# macOS / Linux
python3 -m http.server 8000
```

Then open <http://localhost:8000> for the landing page, or <http://localhost:8000/app.html> for the app. Keep the terminal open while you use the app and press `Ctrl + C` to stop. Don't open `index.html` by double-clicking: browsers block some features on `file://` pages.

## Project structure

No build step: plain HTML, CSS and JavaScript files, loaded in order by `index.html`.

```text
index.html               landing page (with a live demo of the recommender)
app.html                 the app: shell and page markup
vercel.json              Vercel settings (clean URLs, so the app is at /app; old /AGORA.html redirects there)
favicon.svg
css/
  base.css               browser reset
  features.css           try-on, calendar and account sheet styles
  agora.css              app design: colours, type, layout
  landing.css            landing page
js/
  config.js              feature flags (SUPABASE_ENABLED, AI_TRYON_ENABLED)
  core/utils.js          DOM helpers, dates, colour maths
  engine/weather.js      Open-Meteo forecast + climate-model fallback
  engine/catalogue.js    garment types, occasions, style vibes
  engine/score.js        recommendation context and outfit scoring
  render/mannequin.js    mannequin and garment drawing
  data/db.js             IndexedDB storage
  data/sample-closet.js  sample items (not used in the UI yet)
  data/local-profile.js  no-login profile, backup export/import
  app/state.js           app state, saving, view switching
  views/                 today, tryon, closet, plan (week + calendar), insights
  cloud/supabase.js      Supabase login and cloud sync (off for now)
  main.js                routing and startup
  landing.js             landing page demo
archive/                 earlier single-file versions, for reference
```

The scripts share one global scope and must load in the order listed in `app.html`. Turning them into ES modules is planned for a later milestone.

## Configuration

`js/config.js`:

| Setting | Default | Meaning |
| --- | --- | --- |
| `SUPABASE_ENABLED` | `false` | `true` loads Supabase and requires login; wardrobe syncs to the cloud. |
| `AI_TRYON_ENABLED` | `false` | Shows the Gemini AI model lab on the Try-On page (needs Supabase and the `gemini-virtual-tryon` Edge Function). |

Only the Supabase **publishable** key belongs in this file. Never commit a service-role key or any other secret.

## Deploy

The repository is connected to Vercel. Pushing to `main` deploys production; pushing any other branch creates a preview URL. There is no build command and the output directory is the repository root.

## Roadmap

1. **M0 Foundation**: merge the latest versions, split into files, deploy (done)
2. **M1 Mobile shell and Today**: live weather, bottom tab bar, looks-first Today on phones, city in onboarding (done); sample closet with photos (next)
3. **M2 Closet and Plan**: category tiles, outfit builder, month planning
4. **M3 Stats and smarter picks**: cost per wear, wardrobe stats, rotation, feedback learning
5. **M4 Polish**: installable PWA, Keep/Bye review, accessibility
6. **Later**: Supabase login and sync, Gemini AI try-on

## Team

- Nur Dina Adani: original app, 2D try-on, Supabase and Gemini prototypes
- Imran: frontend development from M0
