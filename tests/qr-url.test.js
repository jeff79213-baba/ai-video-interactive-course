import { describe, it, expect } from "vitest";
import { buildPromptUrl } from "../src/qr-url.js";

describe("buildPromptUrl", () => {
  it("組合 origin 與 prompts.html 錨點", () => {
    expect(buildPromptUrl("https://aivideo-sk.web.app", "ch1"))
      .toBe("https://aivideo-sk.web.app/prompts.html#ch1");
  });

  it("origin 尾端有斜線時不重複", () => {
    expect(buildPromptUrl("http://localhost:3000/", "ch3"))
      .toBe("http://localhost:3000/prompts.html#ch3");
  });

  it("缺少 chapterId 時丟出錯誤", () => {
    expect(() => buildPromptUrl("http://localhost:3000", "")).toThrow();
  });
});
