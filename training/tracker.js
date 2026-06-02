const form = document.getElementById('kick-form');
const kickList = document.getElementById('kick-list');
const emptyState = document.getElementById('empty-state');
const hangtimeInput = document.getElementById('hangtime');
const notesInput = document.getElementById('notes');
const fieldError = document.getElementById('field-error');
const editBanner = document.getElementById('edit-mode-banner');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const saveBtn = document.getElementById('save-btn');

const bestKickDistanceEl = document.getElementById('best-kick-distance');
const bestKickHangtimeEl = document.getElementById('best-kick-hangtime');
const bestDayAvgEl = document.getElementById('best-day-avg');
const bestDayDateEl = document.getElementById('best-day-date');
const i20CountEl = document.getElementById('i20-count');
const tbCountEl = document.getElementById('tb-count');

let editingKickId = null;

function todayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function makeKick(hangtime, notes, fieldData) {
  return {
    id: `kick-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: todayKey(),
    timestamp: new Date().toISOString(),
    distance: fieldData.distance,
    hangtime: Number(hangtime),
    result: fieldData.result,
    notes: notes.trim(),
    position: fieldData,
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
      const isEditing = kick.id === editingKickId;
      if (isEditing) li.classList.add('editing');
      li.innerHTML = `
        <div class="kick-distance">${kick.distance}<span class="unit">yd</span></div>
        <div class="kick-meta">
          <div class="kick-hangtime">${kick.hangtime.toFixed(1)} sec hang${resultBadge(kick.result)}</div>
          ${kick.notes ? `<div class="kick-notes">${escapeHtml(kick.notes)}</div>` : ''}
        </div>
        <div class="kick-actions">
          <button type="button" class="kick-edit" data-kick-id="${kick.id}" aria-label="Edit kick">&#9998;</button>
          <button type="button" class="kick-delete" data-kick-id="${kick.id}" aria-label="Delete kick">&#10005;</button>
        </div>
      `;
      kickList.appendChild(li);
    });
}

function renderAll() {
  renderStats();
  renderTodaysKicks();
}

function handleFieldChange(fieldData) {
  if (fieldData) fieldError.hidden = true;
}

function setEditMode(kickId) {
  editingKickId = kickId;
  const isEditing = kickId !== null;
  editBanner.hidden = !isEditing;
  saveBtn.textContent = isEditing ? 'Update Kick' : 'Save Kick';
}

function startEdit(kickId) {
  const kick = getAllKicks().find((k) => k.id === kickId);
  if (!kick) return;

  setEditMode(kickId);
  hangtimeInput.value = kick.hangtime;
  notesInput.value = kick.notes || '';
  loadFieldData(kick.position || null);

  fieldError.hidden = true;
  renderTodaysKicks();
  editBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function cancelEdit() {
  setEditMode(null);
  form.reset();
  resetLanding();
  handleLosChange();
  renderTodaysKicks();
}

cancelEditBtn.addEventListener('click', cancelEdit);

kickList.addEventListener('click', (event) => {
  const deleteBtn = event.target.closest('.kick-delete');
  const editBtn = event.target.closest('.kick-edit');
  if (deleteBtn) {
    const kickId = deleteBtn.dataset.kickId;
    if (editingKickId === kickId) cancelEdit();
    deleteKick(kickId);
    renderAll();
    return;
  }
  if (editBtn) {
    startEdit(editBtn.dataset.kickId);
  }
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const fieldData = getFieldData();
  if (!fieldData) {
    fieldError.hidden = false;
    fieldError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  if (editingKickId) {
    const existing = getAllKicks().find((k) => k.id === editingKickId);
    if (existing) {
      const updated = {
        ...existing,
        distance: fieldData.distance,
        hangtime: Number(hangtimeInput.value),
        result: fieldData.result,
        notes: notesInput.value.trim(),
        position: fieldData,
      };
      updateKick(updated);
    }
    setEditMode(null);
  } else {
    const kick = makeKick(hangtimeInput.value, notesInput.value, fieldData);
    saveKick(kick);
  }

  form.reset();
  resetLanding();
  handleLosChange();
  hangtimeInput.focus();
  renderAll();
});

setupField({ onChange: handleFieldChange });
renderAll();
