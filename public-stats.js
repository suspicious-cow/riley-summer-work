(function () {
  const KICKS_KEY = 'punt-tracker-kicks-v1';
  const LEGACY_KICKS_KEY = 'riley-punt-tracker-kicks-v1';
  const PUBLIC_STATS_FILE = 'public-stats.json';

  function safeParse(raw) {
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  function readKicks() {
    const fresh = safeParse(localStorage.getItem(KICKS_KEY));
    if (Array.isArray(fresh) && fresh.length > 0) return fresh;
    const legacy = safeParse(localStorage.getItem(LEGACY_KICKS_KEY));
    return Array.isArray(legacy) ? legacy : null;
  }

  function computeFromKicks(kicks) {
    if (!Array.isArray(kicks) || kicks.length === 0) return null;
    const dists = kicks.map((k) => Number(k.distance)).filter(Number.isFinite);
    const hangs = kicks.map((k) => Number(k.hangtime)).filter(Number.isFinite);
    if (dists.length === 0 || hangs.length === 0) return null;
    const avg = (a) => a.reduce((s, n) => s + n, 0) / a.length;
    const sessionIds = new Set(kicks.map((k) => k.sessionId).filter(Boolean));
    return {
      avgDistance: avg(dists),
      avgHangtime: avg(hangs),
      bestDistance: Math.max(...dists),
      bestHangtime: Math.max(...hangs),
      kickCount: kicks.length,
      sessionCount: sessionIds.size,
    };
  }

  function localStorageStats() {
    const stats = computeFromKicks(readKicks());
    if (!stats) return null;
    return { source: 'live', lastUpdated: null, ...stats };
  }

  async function publicFileStats() {
    try {
      const res = await fetch(PUBLIC_STATS_FILE, { cache: 'no-cache' });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data || typeof data !== 'object') return null;
      if (typeof data.avgDistance !== 'number') return null;
      return { source: 'published', ...data };
    } catch (e) {
      return null;
    }
  }

  function setStat(name, html) {
    const el = document.querySelector(`[data-stat="${name}"]`);
    if (el) el.innerHTML = html;
  }

  function applyStats(stats) {
    setStat('avg-distance', `${stats.avgDistance.toFixed(1)}<span class="unit">yd</span>`);
    setStat('avg-hangtime', `${stats.avgHangtime.toFixed(1)}<span class="unit">sec</span>`);
    setStat('best-distance', `${stats.bestDistance}<span class="unit">yd</span>`);
    setStat('best-hangtime', `${stats.bestHangtime.toFixed(1)}<span class="unit">sec</span>`);

    const card = document.getElementById('stats');
    if (!card) return;
    let note = card.querySelector('.stats-live-note');
    if (!note) {
      note = document.createElement('p');
      note.className = 'stats-live-note';
      card.appendChild(note);
    }
    const pill = stats.source === 'live'
      ? '<span class="live-pill">LIVE</span>'
      : '<span class="live-pill published">PUBLISHED</span>';
    const updated = stats.lastUpdated ? ` &middot; updated ${stats.lastUpdated}` : '';
    const kickWord = stats.kickCount === 1 ? 'kick' : 'kicks';
    const sessWord = stats.sessionCount === 1 ? 'session' : 'sessions';
    note.innerHTML = `${pill} <span class="stats-live-text">Pulled from training log &middot; ${stats.kickCount} ${kickWord} across ${stats.sessionCount} ${sessWord}${updated}</span>`;
  }

  async function init() {
    const live = localStorageStats();
    if (live) {
      applyStats(live);
      return;
    }
    const published = await publicFileStats();
    if (published) applyStats(published);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
