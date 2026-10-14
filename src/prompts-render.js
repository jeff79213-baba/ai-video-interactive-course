export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function groupByChapter(prompts) {
  const groups = [];
  for (const p of prompts) {
    let g = groups.find((x) => x.chapterId === p.chapterId);
    if (!g) {
      g = { chapterId: p.chapterId, chapterTitle: p.chapterTitle, items: [] };
      groups.push(g);
    }
    g.items.push(p);
  }
  return groups;
}

export function renderPromptsHtml(groups) {
  return groups
    .map(
      (g) => `
    <section class="prompt-group" id="${escapeHtml(g.chapterId)}">
      <h2 class="prompt-group__title">${escapeHtml(g.chapterTitle)}</h2>
      ${g.items
        .map(
          (p) => `
        <article class="prompt-card">
          <div class="prompt-card__head">
            <h3 class="prompt-card__label">${escapeHtml(p.label)}</h3>
            <button type="button" class="prompt-card__copy" data-copy="${escapeHtml(p.id)}">複製</button>
          </div>
          <pre class="prompt-card__text">${escapeHtml(p.text)}</pre>
        </article>`
        )
        .join("")}
    </section>`
    )
    .join("");
}

export async function handleCopyClick(target, prompts, writeText) {
  const btn = target && target.closest ? target.closest("[data-copy]") : null;
  if (!btn) return false;
  const prompt = prompts.find((p) => p.id === btn.dataset.copy);
  if (!prompt) return false;
  await writeText(prompt.text);
  btn.textContent = "已複製";
  return true;
}
