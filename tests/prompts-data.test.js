import { describe, it, expect } from "vitest";
import { PROMPTS, promptsByChapter, getPromptById } from "../src/prompts-data.js";
import { CHAPTERS } from "../src/course-data.js";

describe("prompts-data", () => {
  it("共有 10 段提示詞，id 不重複", () => {
    expect(PROMPTS).toHaveLength(10);
    expect(new Set(PROMPTS.map((p) => p.id)).size).toBe(10);
  });

  it("每段提示詞都屬於有提示詞的章節", () => {
    const promptChapterIds = CHAPTERS.filter((c) => c.hasPrompt).map((c) => c.id);
    for (const p of PROMPTS) {
      expect(promptChapterIds).toContain(p.chapterId);
      expect(typeof p.text).toBe("string");
      expect(p.text.length).toBeGreaterThan(20);
    }
  });

  it("第 3 章有 3 段、第 2 章有 2 段", () => {
    expect(promptsByChapter("ch3")).toHaveLength(3);
    expect(promptsByChapter("ch2")).toHaveLength(2);
  });

  it("getPromptById 取得指定提示詞，找不到回傳 null", () => {
    expect(getPromptById("p1-1").chapterId).toBe("ch1");
    expect(getPromptById("nope")).toBeNull();
  });
});
