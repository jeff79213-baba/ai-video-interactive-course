export function buildPromptUrl(origin, chapterId) {
  if (!chapterId) {
    throw new Error("chapterId is required");
  }
  const base = String(origin || "").replace(/\/+$/, "");
  return `${base}/prompts.html#${chapterId}`;
}
