import { describe, it, expect } from "vitest";
import { promptChapters } from "../src/course-data.js";
import { buildPromptUrl } from "../src/qr-url.js";
import { PROMPTS } from "../src/prompts-data.js";

describe("QR ↔ anchor coupling", () => {
  it("每個有提示詞的章節都會產生對應 prompts.html 錨點的 QR 網址", () => {
    const origin = "https://aivideo-sk.web.app";
    expect(promptChapters().map((c) => c.id)).toEqual(["ch1", "ch2", "ch3", "ch4", "ch5"]);
    for (const c of promptChapters()) {
      expect(buildPromptUrl(origin, c.id)).toBe(`${origin}/prompts.html#${c.id}`);
    }
  });

  it("每段提示詞都隸屬於有提示詞的章節", () => {
    const ids = new Set(promptChapters().map((c) => c.id));
    for (const p of PROMPTS) {
      expect(ids.has(p.chapterId)).toBe(true);
    }
  });
});
