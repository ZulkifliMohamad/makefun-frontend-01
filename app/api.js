// make.fun's public API: read-only GET requests, open to any origin (CORS).
// The full API is described at https://make.fun/api/openapi.json.
//
// Performance: answers are cached in memory for 60 seconds and revalidated
// with ETags, so navigating back and forth costs no new request while the
// minute's tag still holds, and a repeated view within the minute costs none
// at all. requestCount is shown in the footer so the caching is visible.

const API = 'https://make.fun/api';
const TTL_MS = 60000;

const cache = new Map(); // path -> { at, etag, data }
export let requestCount = 0;

async function get(path, signal) {
  const now = Date.now();
  const hit = cache.get(path);
  if (hit && now - hit.at < TTL_MS) return hit.data;
  requestCount += 1;
  const headers = {};
  if (hit?.etag) headers['If-None-Match'] = hit.etag;
  const res = await fetch(API + path, { headers, signal });
  if (res.status === 304 && hit) {
    hit.at = now;
    return hit.data;
  }
  if (!res.ok) throw new Error(`make.fun answered ${res.status} for ${path}`);
  const data = await res.json();
  cache.set(path, { at: now, etag: res.headers.get('etag'), data });
  return data;
}

/** The open bounties: { items: [...] }. */
export const getBounties = (signal) => get('/competitions?status=open&activity=times', signal);

/** One bounty, by its slug. */
export const getBounty = (slug, signal) => get(`/competitions/${encodeURIComponent(slug)}`, signal);

/** One bounty's leaderboard: { columns, entries: [...] }. */
export const getLeaderboard = (slug, signal) =>
  get(`/competitions/${encodeURIComponent(slug)}/leaderboard`, signal);

/** One account's public profile, by its handle. */
export const getProfile = (handle, signal) => get(`/profiles/${encodeURIComponent(handle)}`, signal);

/** Absolute URL for an avatar path the API answers with. */
export function avatarUrl(path) {
  if (!path) return '';
  return path.startsWith('http') ? path : `https://make.fun${path}`;
}
