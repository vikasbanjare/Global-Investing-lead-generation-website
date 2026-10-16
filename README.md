# mStock Global Investing — lead-generation landing page (design preview)

A single-page landing site for investing in US stocks and ETFs from India: "Your evening. Wall Street's morning."

**Live preview:** https://vikasbanjare.github.io/Global-Investing-lead-generation-website/

> This is a design prototype, **not an official mStock website**. The hosted build shows a preview banner, is excluded from search engines, and its lead forms do not send data anywhere (the CRM hook is a `TODO(lead-endpoint)` in `src/main.js`).

## What's inside

- **Hero:** a 3D model of Lower Manhattan built from real OpenStreetMap building footprints and heights (`public/data/manhattan.json`, made by `scripts/build-city-data.mjs`), rendered with three.js. Phones get a pre-rendered poster (`public/city-poster.webp`).
- **Live time story:** IST and New York clocks, US market status, and a timeline of the US session in India time.
- **Tonight on Wall Street:** a split-flap board of popular US stocks by sector.
- **Funnel events:** `lead_view`, `lead_focus`, `lead_submit_valid`, `lead_submit_invalid` pushed to `window.dataLayer` (never the phone number).

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
```

`npm run build` produces `dist/`. Pushing to `main` builds and deploys the preview via `.github/workflows/pages.yml`.

## Before this goes live as an official page

- Footer: IFSCA registration number, registered office address, and real link targets (terms, privacy, disclosures, schedule of charges, tax guide, login).
- Compliance sign-off on facts not in the product document: tax rates, the $250K LRS limit, "5,000+ stocks", the entity name, "about 10 minutes".
- Brand sign-off on colours and the official logo; a real support email.
- Connect the lead form to the CRM; remove the preview banner and `noindex`.

## Credits

Map data © OpenStreetMap contributors, available under the [Open Database License](https://www.openstreetmap.org/copyright). Brand marks via Simple Icons, for identification only. Open Sans under the SIL Open Font License.
