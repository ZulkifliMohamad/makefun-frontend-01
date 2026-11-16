// Small helpers for showing API values. No dependencies.

/** Text made safe to put inside HTML. */
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** A dollar amount ('1000.00', 250 or 0.5) as '$1,000' or '$0.50'. */
export function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

/** A deadline as a date in UTC. */
export function date(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })} UTC`;
}

/** The time until a deadline: '2d 4h left', '35m left', or 'ended'. */
export function timeLeft(iso) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'ended';
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

/** True when the deadline is in the future. */
export function isOpen(iso) {
  return new Date(iso).getTime() > Date.now();
}

/** A micro-unit rate (950587) as a percent string ('95.06%'). */
export function rate(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `${(n / 10000).toFixed(2)}%`;
}

/** A byte count as '660.8 KB'. */
export function bytes(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  if (v < 1024) return `${v} B`;
  if (v < 1048576) return `${(v / 1024).toFixed(1)} KB`;
  return `${(v / 1048576).toFixed(2)} MB`;
}

/**
 * Render plain text that uses light Markdown (## headings, - lists, blank-line
 * paragraphs) as safe HTML. Links are not rendered: URLs stay plain text.
 */
export function mdText(text) {
  const lines = String(text ?? '').split('\n');
  let html = '';
  let inList = false;
  let para = [];
  const flushPara = () => {
    if (para.length) {
      html += `<p>${para.map((l) => esc(l)).join('<br>')}</p>`;
      para = [];
    }
  };
  const closeList = () => {
    if (inList) {
      html += '</ul>';
      inList = false;
    }
  };
  for (const line of lines) {
    const heading = line.match(/^#{1,3}\s+(.*)$/);
    const item = line.match(/^[-*]\s+(.*)$/);
    if (heading) {
      flushPara();
      closeList();
      html += `<h3>${esc(heading[1])}</h3>`;
    } else if (item) {
      flushPara();
      if (!inList) {
        html += '<ul>';
        inList = true;
      }
      html += `<li>${esc(item[1])}</li>`;
    } else if (line.trim() === '') {
      flushPara();
      closeList();
    } else {
      closeList();
      para.push(line);
    }
  }
  flushPara();
  closeList();
  return html;
}
