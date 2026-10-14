import { formatProgress } from "./navigation.js";

export function setActiveIndex(root, index) {
  const sections = root.querySelectorAll("[data-chapter]");
  sections.forEach((s, i) => s.classList.toggle("is-active", i === index));
  const counter = root.querySelector("[data-progress]");
  if (counter) counter.textContent = formatProgress(index, sections.length);
  return { index, count: sections.length };
}

export function openLightbox(lightboxEl, svgHtml, promptText = "") {
  const canvas = lightboxEl.querySelector("[data-lightbox-qr]");
  const promptEl = lightboxEl.querySelector("[data-lightbox-prompt]");
  const toggleBtn = lightboxEl.querySelector("[data-lightbox-toggle-prompt]");
  
  if (canvas) canvas.innerHTML = svgHtml;
  
  if (promptEl && promptText) {
    promptEl.textContent = promptText;
    promptEl.hidden = true;
    if (toggleBtn) {
      toggleBtn.hidden = false;
      toggleBtn.textContent = "顯示提示詞";
    }
  } else if (promptEl) {
    promptEl.hidden = true;
    if (toggleBtn) toggleBtn.hidden = true;
  }
  
  lightboxEl.classList.add("is-open");
  lightboxEl.setAttribute("aria-hidden", "false");
  if (typeof lightboxEl.focus === "function") lightboxEl.focus();
}

export function closeLightbox(lightboxEl) {
  lightboxEl.classList.remove("is-open");
  lightboxEl.setAttribute("aria-hidden", "true");
  const promptEl = lightboxEl.querySelector("[data-lightbox-prompt]");
  const toggleBtn = lightboxEl.querySelector("[data-lightbox-toggle-prompt]");
  if (promptEl) promptEl.hidden = true;
  if (toggleBtn) toggleBtn.hidden = true;
}

export function togglePrompt(lightboxEl) {
  const promptEl = lightboxEl.querySelector("[data-lightbox-prompt]");
  const toggleBtn = lightboxEl.querySelector("[data-lightbox-toggle-prompt]");
  if (!promptEl || !toggleBtn) return;
  
  const isHidden = promptEl.hidden;
  promptEl.hidden = !isHidden;
  toggleBtn.textContent = isHidden ? "隱藏提示詞" : "顯示提示詞";
}
