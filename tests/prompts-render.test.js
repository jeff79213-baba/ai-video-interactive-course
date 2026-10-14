import { describe, it, expect, vi } from "vitest";
import {
  escapeHtml,
  groupByChapter,
  renderPromptsHtml,
  handleCopyClick
} from "../src/prompts-render.js";
import { PROMPTS } from "../src/prompts-data.js";

describe("prompts-render", () => {
  it("escapeHtml 轉義 HTML 特殊字元", () => {
    expect(escapeHtml(`<a href="x">&'`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&#39;");
  });

  it("groupByChapter 依章節分組並保留順序", () => {
    const groups = groupByChapter(PROMPTS);
    expect(groups.map((g) => g.chapterId)).toEqual(["ch1", "ch2", "ch3", "ch4", "ch5"]);
    expect(groups[2].items).toHaveLength(3);
  });

  it("renderPromptsHtml 產生章節錨點與複製按鈕", () => {
    const html = renderPromptsHtml(groupByChapter(PROMPTS));
    expect(html).toContain('id="ch1"');
    expect(html).toContain('id="ch5"');
    expect(html).toContain('data-copy="p1-1"');
    expect(html).toContain('data-copy="p5-2"');
  });

  it("handleCopyClick 複製對應文字並改按鈕文字", async () => {
    document.body.innerHTML = `<button data-copy="p1-1">複製</button>`;
    const btn = document.querySelector("[data-copy]");
    const writeText = vi.fn().mockResolvedValue();
    const ok = await handleCopyClick(btn, PROMPTS, writeText);
    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith(PROMPTS.find((p) => p.id === "p1-1").text);
    expect(btn.textContent).toBe("已複製");
  });

  it("handleCopyClick 非複製按鈕回傳 false", async () => {
    document.body.innerHTML = `<div id="notBtn"></div>`;
    const ok = await handleCopyClick(document.getElementById("notBtn"), PROMPTS, vi.fn());
    expect(ok).toBe(false);
  });
});
