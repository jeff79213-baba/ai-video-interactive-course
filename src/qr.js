export function renderQrSvg(qrFactory, url, cellSize = 4, margin = 2) {
  const qr = qrFactory(0, "M");
  qr.addData(url);
  qr.make();
  return qr.createSvgTag(cellSize, margin);
}
