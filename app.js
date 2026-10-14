import { CHAPTER_COUNT } from "./src/course-data.js";
import { PROMPTS } from "./src/prompts-data.js";
import { buildPromptUrl } from "./src/qr-url.js";
import { nextIndex, prevIndex } from "./src/navigation.js";
import { renderQrSvg } from "./src/qr.js";
import { setActiveIndex, openLightbox, closeLightbox, togglePrompt } from "./src/slideshow.js";

const root = document.getElementById("slideshow");
const lightbox = document.getElementById("lightbox");
const caption = lightbox.querySelector("[data-lightbox-caption]");
const btnPrev = root.querySelector('[data-nav="prev"]');
const btnNext = root.querySelector('[data-nav="next"]');
const introVideo = document.getElementById("introVideo");
const videoHint = document.querySelector("[data-video-hint]");

let current = 0;

function getPromptText(qrId) {
  const prompt = PROMPTS.find(p => p.chapterId === qrId);
  return prompt ? prompt.text : "";
}

function render() {
  const { index } = setActiveIndex(root, current);
  btnPrev.disabled = index === 0;
  btnNext.disabled = index === CHAPTER_COUNT - 1;
  
  // Show intro video only for Chapter 1 (index 0)
  if (introVideo) {
    introVideo.hidden = index !== 0;
  }
  if (videoHint) {
    videoHint.hidden = index !== 0;
  }
}

function go(delta) {
  current = delta > 0 ? nextIndex(current, CHAPTER_COUNT) : prevIndex(current, CHAPTER_COUNT);
  render();
}

btnPrev.addEventListener("click", () => go(-1));
btnNext.addEventListener("click", () => go(1));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { closeLightbox(lightbox); return; }
  if (lightbox.classList.contains("is-open")) {
    if (e.key === "Enter" || e.key === " ") {
      const toggleBtn = lightbox.querySelector("[data-lightbox-toggle-prompt]");
      if (toggleBtn && !toggleBtn.hidden) {
        e.preventDefault();
        togglePrompt(lightbox);
      }
    }
    return;
  }
  if (e.key === "ArrowRight") go(1);
  if (e.key === "ArrowLeft") go(-1);
});

render();

root.querySelectorAll("[data-qr]").forEach((el) => {
  let svg = "";
  try {
    svg = renderQrSvg(window.qrcode, buildPromptUrl(window.location.origin, el.dataset.qr));
    el.innerHTML = svg;
  } catch (err) {
    el.textContent = "QR 產生失敗";
    console.error("QR 產生失敗", err);
    return;
  }
  const promptText = getPromptText(el.dataset.qr);
  const open = () => {
    if (caption) caption.textContent = `${el.dataset.promptLabel || ""}｜掃描後可取得提示詞｜點畫面任一處關閉`;
    openLightbox(lightbox, svg, promptText);
  };
  el.addEventListener("click", open);
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  });
});

lightbox.addEventListener("click", (e) => {
  // Don't close if clicking on the prompt toggle button or prompt area
  if (e.target.closest("[data-lightbox-toggle-prompt]") || e.target.closest("[data-lightbox-prompt]")) {
    return;
  }
  closeLightbox(lightbox);
});

lightbox.querySelector("[data-lightbox-toggle-prompt]").addEventListener("click", (e) => {
  e.stopPropagation();
  togglePrompt(lightbox);
});

if (introVideo && videoHint) {
  const showHint = () => { videoHint.hidden = false; };
  const hideHint = () => { videoHint.hidden = true; };
  introVideo.addEventListener("loadeddata", hideHint);
  introVideo.addEventListener("canplay", hideHint);
  introVideo.addEventListener("error", showHint);
  introVideo.querySelectorAll("source").forEach((s) => s.addEventListener("error", showHint));
  if (introVideo.readyState >= 2) hideHint();
}
