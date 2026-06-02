const form = document.getElementById('kick-form');
const kickList = document.getElementById('kick-list');
const emptyState = document.getElementById('empty-state');
const distanceInput = document.getElementById('distance');
const hangtimeInput = document.getElementById('hangtime');
const notesInput = document.getElementById('notes');

const bestKickDistanceEl = document.getElementById('best-kick-distance');
const bestKickHangtimeEl = document.getElementById('best-kick-hangtime');
const bestDayAvgEl = document.getElementById('best-day-avg');
const bestDayDateEl = document.getElementById('best-day-date');
const i20CountEl = document.getElementById('i20-count');
const tbCountEl = document.getElementById('tb-count');

function todayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function selectedResult() {
  const checked = document.querySelector('input[name="result"]:checked');
  return checked ? checked.value : 'normal';
}

function makeKick(distance, hangtime, result, notes) {
  return {
    id: `kick-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: todayKey(),
    timestamp: new Date().toISOString(),
    distance: Number(distance),
    hangtime: Number(hangtime),
    result,
    notes: notes.trim(),
  };
}

function formatDate(isoDate) {
  const [y, m, d] = isoDate.split('-');
  return `${Number(m)}/${Number(d)}/${y.slice(2)}`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function resultBadge(result) {
  if (result === 'inside20') return '<span class="kick-result result-inside20">Inside 20</span>';
  if (result === 'touchback') return '<span class="kick-result result-touchback">Touchback</span>';
  return '';
}

function renderStats() {
  const all = getAllKicks();

  const best = bestKick(all);
  if (best) {
    bestKickDistanceEl.innerHTML = `${best.distance}<span class="unit">yd</span>`;
    bestKickHangtimeEl.textContent = `${best.hangtime.toFixed(1)} sec · ${formatDate(best.date)}`;
  } else {
    bestKickDistanceEl.innerHTML = '&mdash;';
    bestKickHangtimeEl.textContent = 'no kicks yet';
  }

  const bestDay = bestDailyAverage(all);
  if (bestDay) {
    bestDayAvgEl.innerHTML = `${bestDay.average.toFixed(1)}<span class="unit">yd</span>`;
    bestDayDateEl.textContent = `${formatDate(bestDay.date)} · ${bestDay.count} kick${bestDay.count === 1 ? '' : 's'}`;
  } else {
    bestDayAvgEl.innerHTML = '&mdash;';
    bestDayDateEl.textContent = 'no sessions yet';
  }

  const { touchbacks, inside20 } = touchbackCounts(all);
  i20CountEl.textContent = String(inside20);
  tbCountEl.textContent = String(touchbacks);
}

function renderTodaysKicks() {
  const all = getAllKicks();
  const today = todayKey();
  const todays = all.filter((k) => k.date === today);

  kickList.innerHTML = '';

  if (todays.length === 0) {
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;

  todays
    .slice()
    .reverse()
    .forEach((kick) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="kick-distance">${kick.distance}<span class="unit">yd</span></div>
        <div class="kick-meta">
          <div class="kick-hangtime">${kick.hangtime.toFixed(1)} sec hang${resultBadge(kick.result)}</div>
          ${kick.notes ? `<div class="kick-notes">${escapeHtml(kick.notes)}</div>` : ''}
        </div>
      `;
      kickList.appendChild(li);
    });
}

function renderAll() {
  renderStats();
  renderTodaysKicks();
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const kick = makeKick(
    distanceInput.value,
    hangtimeInput.value,
    selectedResult(),
    notesInput.value
  );
  saveKick(kick);
  form.reset();
  distanceInput.focus();
  renderAll();
});

renderAll();
