export function loadIds(storage, key, validIds) {
  try {
    const stored = JSON.parse(storage().getItem(key) ?? '[]');
    return new Set(Array.isArray(stored) ? stored.filter(id => validIds.has(id)) : []);
  } catch {
    return new Set();
  }
}

export function saveIds(storage, key, ids) {
  try {
    storage().setItem(key, JSON.stringify([...ids]));
    return true;
  } catch {
    return false;
  }
}

export function nextReviewId(review, activeId) {
  const ids = [...review];
  return ids[(ids.indexOf(activeId) + 1) % ids.length];
}
