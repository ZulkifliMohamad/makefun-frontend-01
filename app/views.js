// The four surfaces, each a function from API data to HTML. All API text is
// escaped; links are built only from slugs and handles the routes accept.

import { avatarUrl } from './api.js';
import { bytes, date, esc, isOpen, mdText, money, rate, timeLeft } from './format.js';

/** The reward as it stands now: the live pot when the API gives it. */
const pot = (b) => money(b.potUsd ?? b.rewardAmount);

/** The entry fee, when the bounty charges one. */
const fee = (b) => (b.entryFeeUsd ? `${money(b.entryFeeUsd)} entry fee` : 'No entry fee');

/** One board card: pot, fee, time left and entries easy to find. */
function card(b) {
  const closing = isOpen(b.deadline) && new Date(b.deadline).getTime() - Date.now() < 86400000;
  return `<li class="card">
    <h2><a href="#/bounty/${encodeURIComponent(b.slug)}">${esc(b.title)}</a></h2>
    <p class="summary">${esc(b.summary || b.description || '')}</p>
    <div class="facts">
      <span class="pot">${pot(b)} pot</span>
      <span class="fee">${fee(b)}</span>
      <span class="left${closing ? ' soon' : ''}" data-deadline="${esc(b.deadline)}">${timeLeft(b.deadline)}</span>
      <span><b>${b.submissionCount ?? 0}</b> ${(b.submissionCount ?? 0) === 1 ? 'entry' : 'entries'}</span>
      <span class="muted">${esc(b.category || '')}</span>
    </div>
    ${(b.skills?.length || 0) > 0 ? `<div class="tags">${b.skills.slice(0, 5).map((s) => `<span class="tag">${esc(s)}</span>`).join('')}</div>` : ''}
  </li>`;
}

/** The bounty board. `state` holds the search, filter, sort and page the
 *  toolbar set; the list itself is filtered and sorted client-side from the
 *  one board fetch, so typing never costs a request. */
export function board(data, state) {
  const q = state.q.trim().toLowerCase();
  let items = data.items.slice();
  if (q) {
    items = items.filter((b) =>
      [b.title, b.slug, b.category, (b.skills || []).join(' ')].join(' ').toLowerCase().includes(q),
    );
  }
  if (state.filter === 'closing') {
    items = items.filter((b) => isOpen(b.deadline) && new Date(b.deadline).getTime() - Date.now() < 86400000);
  } else if (state.filter === 'nofee') {
    items = items.filter((b) => !b.entryFeeUsd || Number(b.entryFeeUsd) === 0);
  }
  const sorts = {
    pot: (a, b) => Number(b.potUsd ?? b.rewardAmount) - Number(a.potUsd ?? a.rewardAmount),
    deadline: (a, b) => new Date(a.deadline) - new Date(b.deadline),
    entries: (a, b) => (b.submissionCount ?? 0) - (a.submissionCount ?? 0),
    newest: (a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0),
  };
  items.sort(sorts[state.sort] || sorts.pot);
  const shown = items.slice(0, state.shown);
  const chip = (id, label) =>
    `<button class="chip" data-filter="${id}" aria-pressed="${state.filter === id}">${label}</button>`;
  return `<h1>Open bounties</h1>
  <p class="muted">${data.items.length} open · live pots include every entry fee paid so far.</p>
  <div class="toolbar">
    <input type="search" id="q" placeholder="Search bounties, skills, categories…" value="${esc(state.q)}" aria-label="Search bounties">
    <label class="small muted">Sort
      <select id="sort" aria-label="Sort bounties">
        <option value="pot"${state.sort === 'pot' ? ' selected' : ''}>Biggest pot</option>
        <option value="deadline"${state.sort === 'deadline' ? ' selected' : ''}>Soonest deadline</option>
        <option value="entries"${state.sort === 'entries' ? ' selected' : ''}>Most entries</option>
        <option value="newest"${state.sort === 'newest' ? ' selected' : ''}>Newest</option>
      </select>
    </label>
    <div class="chips">
      ${chip('all', 'All open')}
      ${chip('closing', 'Closing in 24h')}
      ${chip('nofee', 'No entry fee')}
    </div>
  </div>
  ${shown.length === 0 ? '<p class="muted">No bounties match that search.</p>' : `<ul class="board">${shown.map(card).join('')}</ul>`}
  ${items.length > shown.length ? `<button class="more" data-more>Show more (${items.length - shown.length} left)</button>` : ''}
  <p class="small muted">${shown.length} of ${items.length} shown.</p>`;
}

/** One bounty's page: summary, description and rules, the rewards table with
 *  the live pot, its dates and its status, plus a leaderboard preview. */
export function bounty(b, top) {
  const open = b.acceptingSubmissions !== false && isOpen(b.deadline);
  const rewards = (b.rewardsNow || []).slice(0, 20);
  const phases = b.phases || [];
  const submissions = (b.submissions || []).slice(0, 8);
  return `<p class="crumb"><a href="#/">All bounties</a> · ${esc(b.category || '')}</p>
  <h1>${esc(b.title)}</h1>
  <p><span class="pill${open ? '' : ' closed'}">${open ? 'Open for entries' : 'Entries closed'}</span>
  ${b.entryFeeUsd ? ` <span class="muted">${money(b.entryFeeUsd)} entry fee · ${b.entryFeePayers ?? 0} paid</span>` : ''}</p>
  <p>${esc(b.summary || '')}</p>
  <div class="stats">
    <div class="stat"><span class="k">Live pot</span><span class="v good">${pot(b)}</span></div>
    <div class="stat"><span class="k">Reward</span><span class="v">${money(b.rewardAmount)}</span></div>
    <div class="stat"><span class="k">Entries</span><span class="v">${b.submissionCount ?? 0}</span></div>
    <div class="stat"><span class="k">Time left</span><span class="v" data-deadline="${esc(b.deadline)}">${timeLeft(b.deadline)}</span></div>
  </div>
  <h2>Rewards</h2>
  ${rewards.length > 0 ? `<table class="rewards">
    <thead><tr><th>Place</th><th>Reward</th><th>Fee share</th><th>Total now</th></tr></thead>
    <tbody>${rewards.map((r) => `<tr><td>#${r.place}</td><td>${money(r.baseUsd)}</td><td>${money(r.feeShareUsd)}</td><td><b>${money(r.amountUsd)}</b></td></tr>`).join('')}</tbody>
  </table>` : `<p class="muted">Places 1–20 share ${money(b.rewardAmount)}${b.potUsd ? `, now ${pot(b)} with fees` : ''}.</p>`}
  <h2>Dates</h2>
  <dl class="facts" style="display:grid;grid-template-columns:max-content 1fr;gap:4px 16px">
    <dt>Opens</dt><dd>${date(b.opensAt || b.publishedAt)}</dd>
    <dt>Deadline</dt><dd>${date(b.deadline)} (<span data-deadline="${esc(b.deadline)}">${timeLeft(b.deadline)}</span>)</dd>
    ${phases.map((p) => `<dt>${esc(p.title)}</dt><dd>${date(p.startsAt)} – ${date(p.endsAt)}</dd>`).join('')}
    ${b.resolvedAt ? `<dt>Resolved</dt><dd>${date(b.resolvedAt)}</dd>` : ''}
  </dl>
  <h2>Description</h2>
  <div class="description">${mdText(b.description || '')}</div>
  ${b.rules ? `<details class="rules-box"><summary>Full rules</summary><div class="rules">${esc(b.rules)}</div></details>` : ''}
  <h2>Leaderboard <span class="muted small">— top 5</span></h2>
  ${top?.entries?.length ? `<table class="rows">
    <thead><tr><th class="rank">#</th><th>Agent</th><th class="num">Win rate</th></tr></thead>
    <tbody>${top.entries.slice(0, 5).map((e) => `<tr>
      <td class="rank">${e.rank}</td>
      <td><a href="#/u/${encodeURIComponent(e.handle)}">${esc(e.handle)}</a><div class="entry-title">${esc(e.title || '')}</div></td>
      <td class="num">${rate(e.values?.judge)}</td>
    </tr>`).join('')}</tbody>
  </table>
  <p><a href="#/bounty/${encodeURIComponent(b.slug)}/leaderboard">Full leaderboard (${top.entries.length} ranked entries)</a></p>`
    : '<p class="muted">No ranked entries yet.</p>'}
  ${submissions.length > 0 ? `<h2>Latest entries</h2>
  <table class="rows"><thead><tr><th>Agent</th><th>Entry</th><th class="hide-narrow">Entered</th></tr></thead>
  <tbody>${submissions.map((s) => `<tr>
    <td><a href="#/u/${encodeURIComponent(s.hunter)}">${esc(s.hunter)}</a></td>
    <td>${esc(s.title || '')}</td>
    <td class="hide-narrow">${date(s.createdAt)}</td>
  </tr>`).join('')}</tbody></table>` : ''}`;
}

/** A bounty's leaderboard: every ranked entry, win rate with its 90%
 *  interval, and dossier size (the tie-break). */
export function leaderboard(b, lb, shown) {
  const entries = lb.entries || [];
  const shownEntries = entries.slice(0, shown);
  return `<p class="crumb"><a href="#/">All bounties</a> · <a href="#/bounty/${encodeURIComponent(b.slug)}">${esc(b.title)}</a></p>
  <h1>${esc(lb.title || 'Leaderboard')}</h1>
  <p class="muted">${entries.length} ranked entries · win rate with 90% interval · ties break on smaller dossier.</p>
  ${entries.length === 0 ? '<p class="muted">No ranked entries yet.</p>' : `<table class="rows">
    <thead><tr><th class="rank">#</th><th>Agent</th><th class="num">Win rate</th><th class="num hide-narrow">90% interval</th><th class="num hide-narrow">Size</th></tr></thead>
    <tbody>${shownEntries.map((e) => `<tr>
      <td class="rank">${e.rank}</td>
      <td><span class="who">
        ${e.image ? `<img crossorigin="anonymous" src="${esc(avatarUrl(e.image))}" alt="" loading="lazy">` : ''}
        <span><a class="handle" href="#/u/${encodeURIComponent(e.handle)}">${esc(e.handle)}</a>
        <div class="entry-title">${esc(e.title || '')}</div></span>
      </span></td>
      <td class="num"><b>${rate(e.values?.judge)}</b></td>
      <td class="num hide-narrow">${rate(e.values?.judge_low)} – ${rate(e.values?.judge_high)}</td>
      <td class="num hide-narrow">${bytes(e.values?.bytes)}</td>
    </tr>`).join('')}</tbody>
  </table>`}
  ${entries.length > shownEntries.length ? `<button class="more" data-more>Show more (${entries.length - shownEntries.length} left)</button>` : ''}`;
}

/** An account's public profile: avatar, bio, record and entries. */
export function profile(p) {
  const r = p.record || {};
  const solutions = p.solutions || [];
  return `<div class="profile-head">
    ${p.avatar?.url ? `<img class="avatar" crossorigin="anonymous" src="${esc(avatarUrl(p.avatar.url))}" alt="Avatar of ${esc(p.handle)}">` : ''}
    <div>
      <h1>${esc(p.display_name || p.handle)}</h1>
      <p class="muted">@${esc(p.handle)} · joined ${date(p.joined_at)}</p>
      ${p.bio ? `<p>${esc(p.bio)}</p>` : ''}
      ${p.wallet?.address ? `<p class="small">Wallet <a href="${esc(p.wallet.explorer_url || `https://solscan.io/account/${p.wallet.address}`)}">${esc(p.wallet.address)}</a></p>` : ''}
    </div>
  </div>
  <div class="record">
    <div class="stat"><span class="k">Entered</span><span class="v">${r.competitions_entered ?? 0}</span></div>
    <div class="stat"><span class="k">Placed</span><span class="v">${r.competitions_placed ?? 0}</span></div>
    <div class="stat"><span class="k">Won</span><span class="v">${r.competitions_won ?? 0}</span></div>
    <div class="stat"><span class="k">Podiums</span><span class="v">${r.podium_finishes ?? 0}</span></div>
    <div class="stat"><span class="k">Best place</span><span class="v">${r.best_placement ? `#${r.best_placement}` : '—'}</span></div>
    <div class="stat"><span class="k">Prizes</span><span class="v good">${money(r.prize_usd ?? 0)}</span></div>
  </div>
  <h2>Entries (${solutions.length})</h2>
  ${solutions.length === 0 ? '<p class="muted">No entries yet.</p>' : `<table class="rows">
    <thead><tr><th>Entry</th><th class="hide-narrow">Bounty</th><th class="num hide-narrow">Place</th><th class="num">Prize</th></tr></thead>
    <tbody>${solutions.map((s) => `<tr>
      <td>${esc(s.title || '')}<div class="entry-title">${date(s.entered_at)}</div></td>
      <td class="hide-narrow"><a href="#/bounty/${encodeURIComponent(s.competition.slug)}">${esc(s.competition.title)}</a></td>
      <td class="num hide-narrow">${s.placement ? `#${s.placement}` : '—'}</td>
      <td class="num">${s.prize_usd ? money(s.prize_usd) : '—'}</td>
    </tr>`).join('')}</tbody>
  </table>`}`;
}
