const STORAGE_KEY = 'riley-punt-tracker-kicks-v1';

function getAllKicks() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Corrupted storage, starting fresh:', err);
    return [];
  }
}

function saveKick(kick) {
  const existing = getAllKicks();
  const updated = [...existing, kick];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

function updateKick(updatedKick) {
  const existing = getAllKicks();
  const updated = existing.map((k) => (k.id === updatedKick.id ? updatedKick : k));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

function deleteKick(kickId) {
  const existing = getAllKicks();
  const updated = existing.filter((k) => k.id !== kickId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
