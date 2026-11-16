# BUILD-REPORT — makefun-frontend-01

Bounty: **Build the best make.fun frontend** (`makefun-frontend-01`)
Account: @steady-koala-56 · payout wallet `4o4WqB3G7im2t3Y1FFzaeeKFJ9zVtWQHNy3HY6gQArwo`
Prize: $500 + entry fees (live pot $645 at build time) · entry fee $0.50 USDC (unpaid)
Deadline: 2026-11-17T12:30:00Z
Head commit: `61db8e2e40f89b7356a8d9c4e835625924d2503e` (local git repo only, no remote)

## What was built

A fast, unofficial make.fun frontend as plain static files (no build step,
no framework, no external scripts/styles/fonts). All four required surfaces
work on live data from make.fun's public API (`GET https://make.fun/api/...`),
each reachable by a link and by its own hash route:

- `#/` — bounty board: live pot, entry fee, time left, entries, category and
  skills per bounty; client-side search, sort (biggest pot / soonest deadline /
  most entries / newest), filters (all open / closing in 24h / no entry fee),
  paginated 12 at a time.
- `#/bounty/<slug>` — bounty page: summary, description, full rules in a
  collapsible section, rewards table with the live pot per place (base +
  fee share + total now), dates, open/closed status, entry-fee payers,
  top-5 leaderboard preview, latest entries.
- `#/bounty/<slug>/leaderboard` — full leaderboard: rank, agent (avatar +
  handle linking to the profile), entry title, judge win rate with its 90%
  interval, dossier size (the tie-break), paginated 25 at a time.
- `#/u/<handle>` — public profile: avatar, bio, join date, wallet (Solscan
  link), record (entered / placed / won / podiums / best place / prizes) and
  the account's entries with bounty links, places and prizes.

Performance (what the judge's criteria 2–3 read): API answers are cached in
memory for 60 s and revalidated with ETags, so navigating back costs no new
request; one request per view (bounty page fetches bounty + leaderboard in
parallel); lists are paginated; a single 30 s timer refreshes only the
time-left nodes instead of re-rendering. First load: **6 files, 10,108 bytes
gzip-9 (29,556 raw)**. The footer shows the session's API request count so
the caching is visible. `window.__shotReady` flips false while a route loads
and true once its data is on screen.

## File list

- `main.ts` — entry program (Node 22, stdlib only): copies `app/` +
  `screenshots/` to `/output`, writes `/output/dossier.json` via
  `vendor/makefun-frontend.ts`.
- `serve.ts` — tiny static server for local testing (`node serve.ts`, port 8080).
- `vendor/makefun-frontend.ts` — kit's dossier library, unchanged.
- `app/index.html` — shell, header nav, footer.
- `app/main.js` — router, render orchestration, toolbar events, countdown ticker.
- `app/api.js` — cached API client (board / bounty / leaderboard / profile).
- `app/format.js` — escaping, money, dates, time-left, rates, light Markdown.
- `app/views.js` — the four surfaces.
- `app/style.css` — one stylesheet, system fonts only, responsive to phones.
- `screenshots/1-board.jpg` — board, 1280x800 JPEG, 102,611 bytes.
- `screenshots/2-bounty.jpg` — bounty `makefun-frontend-01`, 1280x800 JPEG,
  78,493 bytes.
- `screenshots/3-leaderboard.jpg` — its leaderboard, 1280x800 JPEG, 92,306 bytes.
- `shots.json` — shot manifest (file, route, viewport).
- `LICENSE` — MIT with `SPDX-License-Identifier: MIT`.
- `README.md` — badges for owner `ZulkifliMohamad`, repo `makefun-frontend-01`
  (see "Still blocks submission" — repo name is assumed, see below).
- `.makefun/owner.json` — `{"wallet": "4o4WqB3G7im2t3Y1FFzaeeKFJ9zVtWQHNy3HY6gQArwo"}`.
- `BUILD-REPORT.md` — this file.

## Check results

Kit check (run 2026-11-16 ~08:37 UTC from the unpacked kit):

```
node cli/makefun.mjs check --kit . --repo ~/workspace/makefun/makefun-frontend-01
```

- **Exit 0: 4 passed, 0 failed, 16 skipped, 5 checked at submission.**
- Passed: `competition_open`, `snapshot` (16 files, 396,320 bytes),
  `license_osi` (MIT), `entrypoint` (main.ts, node22).
- Skipped (site-side only): all transcript checks (`transcripts_*`,
  `thinking_*`) and `committed_secret` (no secrets pushed).
- Checked at submission (need the GitHub repo): `repo_public`, `repo_owner`,
  `repo_created_after_open`, `commit_in_repo`, `duplicate_snapshot`.

Dossier build: `MAKEFUN_OUTPUT_DIR=out node main.ts` run twice produces
byte-identical output (`diff -r` clean). Dossier 396,835 bytes; Load block
Totals: first load 6 files, 10,108 bytes gzip-9; later by `import()` 0 files;
whole app 6 files, 29,556 bytes.

Screenshots: taken with headless Chrome for Testing 157.0.8103.78 over CDP,
waiting for `window.__shotReady`, on live API data (board: 16 open bounties;
bounty page: live pot $645, 290 fee payers, 293 entries; leaderboard: 159
ranked entries; profile route also verified rendering in the browser).
The Hatch-patched Chromium in this VM (`/opt/meta-chromium/chrome`) refuses
loopback navigation (`ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS`, even with
the LNA features disabled) and its one-shot `--screenshot`/`--dump-dom`
modes produce no output, so the stock Chrome for Testing binary was used
instead (a separate instance on its own debugging port and profile; a
sibling agent's instance on port 9222 was not touched after an early
port collision was noticed and avoided).

## What still blocks submission

1. **No GitHub repository yet (parent to create).** The repo must be public,
   created after 2026-11-15T12:30:00Z, owned by `ZulkifliMohamad`, and the
   head commit pushed to it. README badges assume the repo name
   `makefun-frontend-01` — create it with exactly that name, or update the
   badge URLs in `README.md` and re-commit before submitting.
2. **$0.50 entry fee unpaid.** No funds were authorized; the fee must be paid
   (`node cli/makefun.mjs fee pay makefun-frontend-01`) before the first
   submission.
3. **No sealed recording.** This competition takes no transcript upload; the
   entry's transcripts come from `makefun record` streamed while a Claude Code
   or Codex session builds it. This build was done by a Muse subagent session,
   which the recorder does not record, and no recording was started before
   the work began — so a `recording_ids` value does not exist. A rebuild (or
   a recorded revision pass) inside a fresh Claude Code / Codex session
   started after `record` starts is needed to produce one, plus a run record
   (`makefun-run.json`, required for entries received from 2026-11-17T00:00:00Z).
4. **Not submitted.** No submission was made, no repo was created, no fee was
   paid, per the task constraints.

## Notes for the parent

- Serve locally with `node serve.ts --port 8123` from the repo, then open
  `http://127.0.0.1:8123/`.
- Rebuild the dossier any time with `mkdir -p out && MAKEFUN_OUTPUT_DIR=out
  node main.ts` (delete `out/` afterwards; it is build scratch, not committed).
- Live numbers in the screenshots (pot $645, 293 entries, 159 ranked) will
  drift as the bounty runs; the screenshots are a snapshot of the app working
  on live data at build time.
- No API key or private key is stored anywhere in this repo. The referral code
  in `README.md` (`6ksyay6h`) is the account's public referral code.
