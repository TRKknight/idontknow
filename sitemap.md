# Site Map

The app is a single-page React app compiled into `root_app.js` (no JSX; plain `React.createElement`). It is loaded by `index.html`. Everything is driven by the `screen` state (top-level navigation) and per-screen sub-states (`mode`, tabs, etc.).

---

## Top-level screens (`screen` state)

| Name | Route string | `root_app.js` line | Description |
|---|---|---|---|
| Home | `home` | 8889 | Landing page with tile grid for all sections |
| Biochemistry home | `biochem-home` | 9101 | Biochemistry section landing (cards for the 5 biochem tools) |
| Disorders | `disorders` | 9853 | **Biochemical Disorders** — browse grid + drawer + flashcards + quiz |
| Pathways | `pathways` | 9409 (`PathwayBrowser` at 1150) | Pathway browser |
| Normal Values | `normal-values` | 9426 (`NormalValuesView` at 7314) | Reference-range lists |
| Vitamins | `vitamins` | 9430 (`VitaminsView` at 7585) | Vitamin encyclopedia |
| Minerals | `minerals` | 9447 (`MineralsView` at 10396) | Mineral encyclopedia |
| Physiology | `physiology` | 9463 | iframe shell that embeds the separate `physio/index.html` app |
| Feed | `feed` | 9550 | Social-style feed |
| Clinical Vignettes | `clinical-vignettes` | 9611 | Vignette picker/index |
| Clinical Cases | `clinical-cases` | 9741 (`CasesView` at 6492) | Interactive case simulations |
| Vignette (single) | `vignettes` | 9746 (`ClinicalVignetteView` at 5867) | An open vignette playthrough |
| Admin | `showLogin` -> `AdminPanel` | 2707 | CMS (5 taps on a screen title opens it) |

---

## Disorders screen (`disorders`) — sub-modes (`mode` state)

| Name | Mode string | Where | Notes |
|---|---|---|---|
| Browse | `browse` | mode button 9900; grid 9915+; **detail drawer 10162–10393** | Card grid + category/important/search filters |
| Flashcards | `flashcard` | `startFC` at 8409; button 9903 | Flashcard deck mode |
| Quiz | `quiz` | `startQuiz` at 8422; button 9906 | Quiz-me mode |

Key landmaks inside Browse:
- Detail drawer: `sel && <div style={s.mask}>` at ~10162; drawer sheet is `s.drw` (has `ref: drwRef` at 10167).
- Related Pathways block: ends ~10339.
- Prev/Next navigation row: **10340–10393** (added feature).
- Image lightbox: `ImageLightbox` component at 206; used at ~10389.
- Shared filtered list: `const filtered = allData.filter(...)` at 8398.

---

## Physiology (`physiology`) — SEPARATE embedded app

Not in `root_app.js`. It is an iframe loading `physio/index.html` from the `physio/` directory. Its internal modes are `home`, `browse`, `quiz`, `reflex`, `reflexDetails`. Marked visible only if `visibility.physiology`.

---

## Admin panel (`AdminPanel`) — CMS tabs

Reached via the login overlay (`AdminLogin` at 2206). Its own tab state (`tab`) drives bulk editors:

- `disorders`
- `pathways` (`PathwayAdminPanel` at 1600)
- `vitamins`
- `normal-values`
- `minerals`
- `vignettes`
- `cases`
- `visibility` (toggle which sections render for visitors)
- `physio-viva`
- `physio-reflex-detail`
- `physio-notes`
- `physio-clinical`

---

## Shared components / utilities

| Name | Line | Purpose |
|---|---|---|
| `ImageLightbox` | 206 | Full-screen image zoom (used by Disorders drawer) |
| `PathwayViewer` | 491 | Drawer showing pathway chain details |
| `PathwayBrowser` | 1150 | Pathways screen body |
| `AdminLogin` | 2206 | 4-digit secret login |
| `AdminPanel` | 2707 | CMS root |
| `App()` | 8032 | Root component: state (`screen`, `mode`, `dark`, `filtered`, `sel`, `lightbox`, `drwRef`, ...), `navigateTo`, `goBack` |

## Data files (`data/`)

- `disorders.json` — fields: `id, cat (A–O), num, disorder, defect, pathway, keyFeature, basis, diagnosis, treatment`, optional `important`/`imageUrl`
- `pathways.json` — pathway chains/graphs
- `vitamins.json`, `minerals.json`, `vignettes.json`, `cases.json`, `normal_values.json`
- `physio/` — separate Physiology mini-app

## How to talk to me about edits

1. Screen name from the top-level or Disorders tables above (e.g. "Minerals list", "Disorders detail drawer").
2. For the Disorders tab, distinguish: Browse grid, Detail drawer, Flashcards, or Quiz.
3. Physiology and Admin CMS are their own namespaces — say "Physiology app" or "Admin panel" explicitly.