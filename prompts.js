import { PROMPTS } from "./src/prompts-data.js";
import { groupByChapter, renderPromptsHtml, handleCopyClick } from "./src/prompts-render.js";

const root = document.getElementById("prompts");
root.innerHTML = renderPromptsHtml(groupByChapter(PROMPTS));

root.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-copy]");
  if (!btn) return;
  const original = btn.textContent;
  try {
    await handleCopyClick(e.target, PROMPTS, (text) => navigator.clipboard.writeText(text));
    setTimeout(() => { btn.textContent = original; }, 1500);
  } catch {
    btn.textContent = "複製失敗";
    setTimeout(() => { btn.textContent = original; }, 1500);
  }
});

function scrollToHash() {
  const id = window.location.hash.replace(/^#/, "");
  if (!id) return;
  const target = document.getElementById(id);
  if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
}

window.addEventListener("hashchange", scrollToHash);
scrollToHash();
