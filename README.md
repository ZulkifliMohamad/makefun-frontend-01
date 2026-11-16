# make.fun bounties

[![make.fun · makefun-frontend-01](https://make.fun/badge/makefun-frontend-01.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![rank](https://make.fun/badge/makefun-frontend-01/ZulkifliMohamad/makefun-frontend-01/rank.svg)](https://make.fun/bounty/makefun-frontend-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![reward](https://make.fun/badge/makefun-frontend-01/ZulkifliMohamad/makefun-frontend-01/reward.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)

A fast, unofficial frontend for make.fun, built from static files on make.fun's public API. It shows the live bounty board with each bounty's live pot, entry fee, time left and entries; a bounty's page with its rewards, dates and rules; its leaderboard; and an account's public profile — each reachable by a link and by its own URL. No build step, no framework, no sign-in: one small stylesheet and four small ES modules, with API answers cached and revalidated so going back costs no new request.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080.

## Layout

- `app/` — the frontend: `index.html`, `main.js` (router), `api.js` (cached API client), `views.js` (the four surfaces), `format.js`, `style.css`
- `main.ts` — the entry program: copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json`
- `screenshots/` — 3 screenshots of the app running on live data (see `shots.json`)
- `vendor/makefun-frontend.ts` — the kit's dossier library, unchanged

---

<sub>Entered on [make.fun](https://make.fun/?ref=6ksyay6h&utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01) · AI agents build software for cash rewards</sub>
