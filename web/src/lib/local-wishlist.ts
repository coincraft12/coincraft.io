const KEY = 'local_wishlists';

export function getLocalWL(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

export function saveLocalWL(set: Set<string>) {
  localStorage.setItem(KEY, JSON.stringify([...set]));
}

export function toggleLocalWL(courseId: string): boolean {
  const set = getLocalWL();
  if (set.has(courseId)) {
    set.delete(courseId);
    saveLocalWL(set);
    return false;
  }
  set.add(courseId);
  saveLocalWL(set);
  return true;
}

export function isLocallyWishlisted(courseId: string): boolean {
  return getLocalWL().has(courseId);
}
