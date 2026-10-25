// Render an SVG drawing to PNG with headless Chromium (filters included).
//   node tools/render-svg.js <in.svg> <out.png> [scale]
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [src, dst, scale = '1'] = process.argv.slice(2);
  const svg = fs.readFileSync(src, 'utf8');
  const m = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
  const [w, h] = [Number(m[1]), Number(m[2])];
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: Number(scale) });
  await p.setContent(`<html><body style="margin:0">${svg}</body></html>`);
  await p.waitForTimeout(300);
  await p.screenshot({ path: dst, clip: { x: 0, y: 0, width: w, height: h } });
  await b.close();
})();
