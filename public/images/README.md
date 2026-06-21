# FIFAFun 2026 — Image Assets

Drop your images into the correct sub-folder and they will be picked up automatically.

---

## Folder structure

```
public/images/
  logo/          → Site logo files
  banners/       → Slideshow hero images
  flags/         → Country flag PNG files
  teams/         → Team / squad photos
  venues/        → Stadium photos
  highlights/    → Article / story images
  sponsors/      → Sponsor logos
icons/           → Custom SVG / PNG icons
```

---

## logo/

| File | Used for |
|------|----------|
| `eagle-logo.png` | Main navbar logo (eagle kicking ball) — recommended 200×80px |
| `eagle-logo-square.png` | Favicon / mobile icon — 512×512px |
| `worldcup-text.png` | Optional text-only logo |

---

## banners/

Auto-cycling slideshow on Go FIFAFun page. Add as many as you like.

| File | Description |
|------|-------------|
| `slide1.jpg` | First slide (shown first) — recommended 1920×800px |
| `slide2.jpg` | Second slide |
| `slide3.jpg` | Third slide |
| `slide4.jpg` | (optional) |

To change the number of slides or captions, edit:
`src/app/predictions/PredictionsClient.tsx` → `SLIDES` array

---

## flags/

Flag PNG images. Filename = ISO 3166-1 alpha-2 country code (lowercase).
If a local file is missing, it falls back to flagcdn.com CDN automatically.

| File | Country |
|------|---------|
| `mx.png` | Mexico |
| `za.png` | South Africa |
| `kr.png` | South Korea |
| `cz.png` | Czechia |
| `ca.png` | Canada |
| `ba.png` | Bosnia-Herzegovina |
| `qa.png` | Qatar |
| `ch.png` | Switzerland |
| `ht.png` | Haiti |
| `gb-sct.png` | Scotland |
| `br.png` | Brazil |
| `ma.png` | Morocco |
| `us.png` | United States |
| `py.png` | Paraguay |
| `au.png` | Australia |
| `tr.png` | Türkiye |
| `de.png` | Germany |
| `cw.png` | Curaçao |
| `ci.png` | Ivory Coast |
| `ec.png` | Ecuador |
| `nl.png` | Netherlands |
| `jp.png` | Japan |
| `se.png` | Sweden |
| `tn.png` | Tunisia |
| `ir.png` | Iran |
| `nz.png` | New Zealand |
| `be.png` | Belgium |
| `eg.png` | Egypt |
| `sa.png` | Saudi Arabia |
| `uy.png` | Uruguay |
| `es.png` | Spain |
| `cv.png` | Cabo Verde |
| `fr.png` | France |
| `sn.png` | Senegal |
| `iq.png` | Iraq |
| `no.png` | Norway |
| `ar.png` | Argentina |
| `dz.png` | Algeria |
| `at.png` | Austria |
| `jo.png` | Jordan |
| `pt.png` | Portugal |
| `cd.png` | DR Congo |
| `uz.png` | Uzbekistan |
| `co.png` | Colombia |
| `gh.png` | Ghana |
| `pa.png` | Panama |
| `gb-eng.png` | England |
| `hr.png` | Croatia |

Recommended size: 48×36px PNG, transparent background.
Free source: https://flagcdn.com (or download the full pack from GitHub)

---

## teams/

Team / squad photos for team profile pages.
Filename: `{team-slug}.jpg` e.g. `mexico.jpg`, `united-states.jpg`

---

## venues/

Stadium photos for venue pages.
Filename: `{venue-slug}.jpg` e.g. `estadio-azteca.jpg`, `sofi-stadium.jpg`

---

## highlights/

Story / article images for the Highlights page.
Filename: `{story-slug}.jpg` e.g. `usa-4-paraguay.jpg`

---

## sponsors/

Sponsor logos shown in footer (optional).
Filename: `{sponsor-name}.png`
