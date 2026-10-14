import { describe, it, expect } from "vitest";
import { renderQrSvg } from "../src/qr.js";

function fakeQrFactory() {
  const calls = {};
  const instance = {
    addData(data) { calls.data = data; return this; },
    make() { calls.made = true; return this; },
    createSvgTag(cellSize, margin) {
      calls.svgOpts = { cellSize, margin };
      return `<svg data-test="qr">${calls.data}</svg>`;
    }
  };
  return { calls, factory: () => instance };
}

describe("renderQrSvg", () => {
  it("把 url 交給 QR 實例並回傳 SVG 字串", () => {
    const { calls, factory } = fakeQrFactory();
    const svg = renderQrSvg(factory, "https://x.test/prompts.html#ch1");
    expect(svg).toContain("https://x.test/prompts.html#ch1");
    expect(svg.startsWith("<svg")).toBe(true);
    expect(calls.made).toBe(true);
    expect(calls.svgOpts).toEqual({ cellSize: 4, margin: 2 });
  });

  it("可自訂 cellSize / margin", () => {
    const { calls, factory } = fakeQrFactory();
    renderQrSvg(factory, "x", 8, 4);
    expect(calls.svgOpts).toEqual({ cellSize: 8, margin: 4 });
  });
});
