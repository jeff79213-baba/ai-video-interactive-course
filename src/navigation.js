export function nextIndex(current, count) {
  if (count <= 0) return 0;
  if (current >= count - 1) return count - 1;
  return current + 1;
}

export function prevIndex(current, count) {
  if (count <= 0) return 0;
  if (current <= 0) return 0;
  return current - 1;
}

export function formatProgress(current, count) {
  return `第 ${current + 1} / ${count} 章`;
}
