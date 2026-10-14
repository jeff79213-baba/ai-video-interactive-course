import { describe, it, expect } from "vitest";
import { setActiveIndex, openLightbox, closeLightbox, togglePrompt } from "../src/slideshow.js";

describe("slideshow", () => {
  it("setActiveIndex 切換 is-active 並更新進度", () => {
    document.body.innerHTML = `
      <div id="root">
        <span data-progress></span>
        <section data-chapter></section>
        <section data-chapter></section>
        <section data-chapter></section>
      </div>`;
    const root = document.getElementById("root");
    const res = setActiveIndex(root, 1);
    const sections = root.querySelectorAll("[data-chapter]");
    expect(res).toEqual({ index: 1, count: 3 });
    expect(sections[1].classList.contains("is-active")).toBe(true);
    expect(sections[0].classList.contains("is-active")).toBe(false);
    expect(root.querySelector("[data-progress]").textContent).toBe("第 2 / 3 章");
  });

  it("openLightbox 寫入 QR 並開啟", () => {
    document.body.innerHTML = `<div id="lb"><div data-lightbox-qr></div></div>`;
    const lb = document.getElementById("lb");
    openLightbox(lb, "<svg>qr</svg>");
    expect(lb.classList.contains("is-open")).toBe(true);
    expect(lb.getAttribute("aria-hidden")).toBe("false");
    expect(lb.querySelector("[data-lightbox-qr]").innerHTML).toContain("qr");
  });

  it("openLightbox 帶入提示詞並顯示切換按鈕", () => {
    document.body.innerHTML = `
      <div id="lb">
        <div data-lightbox-qr></div>
        <div data-lightbox-prompt></div>
        <button data-lightbox-toggle-prompt></button>
      </div>`;
    const lb = document.getElementById("lb");
    openLightbox(lb, "<svg>qr</svg>", "測試提示詞內容");
    expect(lb.querySelector("[data-lightbox-prompt]").textContent).toBe("測試提示詞內容");
    expect(lb.querySelector("[data-lightbox-prompt]").hidden).toBe(true);
    expect(lb.querySelector("[data-lightbox-toggle-prompt]").hidden).toBe(false);
    expect(lb.querySelector("[data-lightbox-toggle-prompt]").textContent).toBe("顯示提示詞");
  });

  it("closeLightbox 關閉並隱藏提示詞區塊", () => {
    document.body.innerHTML = `
      <div id="lb" class="is-open" aria-hidden="false">
        <div data-lightbox-prompt></div>
        <button data-lightbox-toggle-prompt></button>
      </div>`;
    const lb = document.getElementById("lb");
    closeLightbox(lb);
    expect(lb.classList.contains("is-open")).toBe(false);
    expect(lb.getAttribute("aria-hidden")).toBe("true");
    expect(lb.querySelector("[data-lightbox-prompt]").hidden).toBe(true);
    expect(lb.querySelector("[data-lightbox-toggle-prompt]").hidden).toBe(true);
  });

  it("togglePrompt 切換顯示/隱藏提示詞", () => {
    document.body.innerHTML = `
      <div id="lb" class="is-open">
        <div data-lightbox-prompt hidden>提示詞內容</div>
        <button data-lightbox-toggle-prompt>顯示提示詞</button>
      </div>`;
    const lb = document.getElementById("lb");
    
    togglePrompt(lb);
    expect(lb.querySelector("[data-lightbox-prompt]").hidden).toBe(false);
    expect(lb.querySelector("[data-lightbox-toggle-prompt]").textContent).toBe("隱藏提示詞");
    
    togglePrompt(lb);
    expect(lb.querySelector("[data-lightbox-prompt]").hidden).toBe(true);
    expect(lb.querySelector("[data-lightbox-toggle-prompt]").textContent).toBe("顯示提示詞");
  });
});
