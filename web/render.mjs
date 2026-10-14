// usage: node render.mjs <startFrame> <endFrame> <outDir>   (30 fps, 1080x1920 -> f_0000.jpg ...)
//    or: node render.mjs times t1,t2,... <outDir>            (quick test frames at given seconds)
import { chromium } from 'playwright-core';
import fs, { globSync } from 'fs';

const PORT = process.env.PORT || '8766';
const testMode = process.argv[2] === 'times';
const chrome = process.env.CHROME || globSync('/opt/pw-browsers/chromium-*/chrome-linux/chrome')[0];
const dir = testMode ? process.argv[4] : process.argv[4];
let jobs;
if (testMode) {
  jobs = process.argv[3].split(',').map(Number).map((t) => [t, `t_${t.toFixed(2)}`]);
} else {
  const a = Number(process.argv[2]), b = Number(process.argv[3]);
  jobs = Array.from({ length: b - a }, (_, i) => [(a + i) / 30, `f_${String(a + i).padStart(4, '0')}`]);
}
fs.mkdirSync(dir, { recursive: true });
const br = await chromium.launch({ executablePath: chrome, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'] });
const pg = await br.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
pg.on('pageerror', (e) => console.log('pageerror:', e.message));
await pg.goto(`http://localhost:${PORT}/index.html`);
await pg.waitForFunction(() => window.ready === true, null, { timeout: 120000 });
for (const [t, name] of jobs) {
  await pg.evaluate((t) => window.renderFrame(t), t);
  await pg.screenshot({ path: `${dir}/${name}.jpg`, type: 'jpeg', quality: 93 });
}
await br.close();
