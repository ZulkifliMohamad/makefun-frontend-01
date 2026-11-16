// Router and render orchestration for the four hash routes:
//
//   #/                              the bounty board
//   #/bounty/<slug>                 one bounty
//   #/bounty/<slug>/leaderboard     that bounty's leaderboard
//   #/u/<handle>                    an account's public profile
//
// window.__shotReady is false while a route loads and true once its data is
// on screen, so a screenshot script knows when to capture. A single 30 s
// timer refreshes only the time-left nodes, never the whole page.

import { getBounties, getBounty, getLeaderboard, getProfile, requestCount } from './api.js';
import { timeLeft } from './format.js';
import { board, bounty, leaderboard, profile } from './views.js';

const app = document.getElementById('app');
const reqs = document.getElementById('reqs');

// Board toolbar state, kept across renders so typing never loses its place.
const boardState = { q: '', filter: 'all', sort: 'pot', shown: 12 };
let boardData = null;
let navToken = 0;
let aborter = null;

function loading(message) {
  return `<p class="loading">${message}</p>`;
}

function failure(error, retry) {
  return `<div class="error"><p><b>Could not load this page.</b></p>
  <p>${error.message}</p>
  <p><button class="more" data-retry="${retry || ''}">Try again</button> <a href="#/">Back to the board</a></p></div>`;
}

function showRequests() {
  if (reqs) reqs.textContent = `${requestCount} API request${requestCount === 1 ? '' : 's'} this session (cached answers cost none).`;
}

/** Refresh every time-left node in place. */
function tick() {
  for (const node of app.querySelectorAll('[data-deadline]')) {
    node.textContent = timeLeft(node.getAttribute('data-deadline'));
  }
}
setInterval(tick, 30000);

/** Render the board from the cached fetch, keeping the search focus. */
function renderBoard() {
  const active = document.activeElement?.id;
  const value = document.activeElement?.value;
  app.innerHTML = board(boardData, boardState);
  if (active === 'q') {
    const input = document.getElementById('q');
    if (input) {
      input.focus();
      input.setSelectionRange(value?.length ?? 0, value?.length ?? 0);
    }
  }
  window.__shotReady = true;
}

async function render() {
  const token = ++navToken;
  aborter?.abort();
  aborter = new AbortController();
  const { signal } = aborter;
  window.__shotReady = false;
  const hash = location.hash || '#/';
  const bountyMatch = hash.match(/^#\/bounty\/([^/]+)(?:\/leaderboard)?$/);
  const leaderboardMatch = hash.match(/^#\/bounty\/([^/]+)\/leaderboard$/);
  const profileMatch = hash.match(/^#\/u\/([^/]+)$/);
  try {
    if (leaderboardMatch) {
      const slug = decodeURIComponent(leaderboardMatch[1]);
      document.title = `Leaderboard | make.fun bounties`;
      app.innerHTML = loading('Loading leaderboard…');
      const [b, lb] = await Promise.all([getBounty(slug, signal), getLeaderboard(slug, signal)]);
      if (token !== navToken) return;
      document.title = `${b.title} leaderboard | make.fun bounties`;
      let shown = 25;
      const paint = () => {
        app.innerHTML = leaderboard(b, lb, shown);
        window.__shotReady = true;
      };
      paint();
      app.querySelector('[data-more]')?.addEventListener('click', () => {
        shown += 25;
        paint();
      });
    } else if (bountyMatch) {
      const slug = decodeURIComponent(bountyMatch[1]);
      document.title = `Loading… | make.fun bounties`;
      app.innerHTML = loading('Loading bounty…');
      const [b, lb] = await Promise.all([
        getBounty(slug, signal),
        getLeaderboard(slug, signal).catch(() => null),
      ]);
      if (token !== navToken) return;
      document.title = `${b.title} | make.fun bounties`;
      app.innerHTML = bounty(b, lb);
    } else if (profileMatch) {
      const handle = decodeURIComponent(profileMatch[1]);
      document.title = `@${handle} | make.fun bounties`;
      app.innerHTML = loading('Loading profile…');
      const p = await getProfile(handle, signal);
      if (token !== navToken) return;
      document.title = `@${p.handle} | make.fun bounties`;
      app.innerHTML = profile(p);
    } else {
      document.title = 'make.fun bounties';
      app.innerHTML = loading('Loading bounties…');
      boardData = await getBounties(signal);
      if (token !== navToken) return;
      renderBoard();
    }
  } catch (error) {
    if (signal.aborted || token !== navToken) return;
    document.title = 'Something went wrong | make.fun bounties';
    app.innerHTML = failure(error);
  }
  showRequests();
  window.scrollTo(0, 0);
  if (window.__shotReady !== true) window.__shotReady = true;
}

// Toolbar events, delegated so re-renders need no rebinding.
let debounce = 0;
app.addEventListener('input', (event) => {
  if (event.target.id === 'q') {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      boardState.q = event.target.value;
      boardState.shown = 12;
      renderBoard();
    }, 150);
  }
});
app.addEventListener('change', (event) => {
  if (event.target.id === 'sort') {
    boardState.sort = event.target.value;
    boardState.shown = 12;
    renderBoard();
  }
});
app.addEventListener('click', (event) => {
  const chip = event.target.closest('[data-filter]');
  if (chip) {
    boardState.filter = chip.getAttribute('data-filter');
    boardState.shown = 12;
    renderBoard();
    return;
  }
  if (event.target.closest('[data-more]')) {
    boardState.shown += 12;
    renderBoard();
    return;
  }
  if (event.target.closest('[data-retry]')) render();
});

window.addEventListener('hashchange', render);
render();
