import { describe, it, expect } from "vitest";
import { CHAPTERS, CHAPTER_COUNT, getChapterById, promptChapters } from "../src/course-data.js";

describe("course-data", () => {
  it("共有 7 章", () => {
    expect(CHAPTER_COUNT).toBe(7);
    expect(CHAPTERS).toHaveLength(7);
  });

  it("章節 id 依序為 ch1..ch7 且 index 從 1 起算", () => {
    CHAPTERS.forEach((c, i) => {
      expect(c.id).toBe(`ch${i + 1}`);
      expect(c.index).toBe(i + 1);
    });
  });

  it("第 1～5 章有提示詞，第 6、7 章沒有", () => {
    expect(promptChapters().map((c) => c.id)).toEqual(["ch1", "ch2", "ch3", "ch4", "ch5"]);
    expect(getChapterById("ch6").hasPrompt).toBe(false);
    expect(getChapterById("ch7").hasPrompt).toBe(false);
  });

  it("getChapterById 找不到時回傳 null", () => {
    expect(getChapterById("ch99")).toBeNull();
  });
});
