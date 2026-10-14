import { describe, it, expect } from "vitest";
import { nextIndex, prevIndex, formatProgress } from "../src/navigation.js";

describe("navigation", () => {
  it("nextIndex 前進，到達最後一章則停留", () => {
    expect(nextIndex(0, 7)).toBe(1);
    expect(nextIndex(5, 7)).toBe(6);
    expect(nextIndex(6, 7)).toBe(6);
  });

  it("prevIndex 後退，第一章則停留", () => {
    expect(prevIndex(3, 7)).toBe(2);
    expect(prevIndex(0, 7)).toBe(0);
  });

  it("count <= 0 回傳 0", () => {
    expect(nextIndex(0, 0)).toBe(0);
    expect(prevIndex(5, 0)).toBe(0);
  });

  it("formatProgress 從 1 起算顯示", () => {
    expect(formatProgress(0, 7)).toBe("第 1 / 7 章");
    expect(formatProgress(6, 7)).toBe("第 7 / 7 章");
  });
});
