// Story-driven 9:16 scene renderer (2D canvas). Reads /story.json and /timings.json.
// Each of the 6 scenes (5 s each) picks a visual "motif"; text layers come from the story fields:
//   kicker (typewritten big date/place), sub (small line), headline[] (big stacked lines), reveal (red line near the bottom)
// Motifs: portrait, building, city_rain, forest_dig, ship_sea, desert_ruins, map_path, document, castle_night, dna_lab, cta
const W = 1080, H = 1920;
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const subEl = document.getElementById('sub');
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ss = (a, b, x) => { x = clamp((x - a) / (b - a)); return x * x * (3 - 2 * x); };
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (i) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const GOLD = '#d9b46c', TEAL = '#3fd8cf', RED = '#ff4a4a';
const story = await (await fetch('/story.json')).json();
const timings = await (await fetch('/timings.json')).json();
const FONT = '"Liberation Sans","DejaVu Sans",Arial';

function type(txt, t, t0, cps = 16) { const n = Math.floor(clamp((t - t0) * cps, 0, txt.length)); return txt.slice(0, n) + ((t - t0) * cps < txt.length && Math.floor(t * 8) % 2 ? '▌' : ''); }
function text(s, x, y, size, color, align = 'center', weight = 900, stroke, maxW) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  if (maxW) { const w = ctx.measureText(s).width; if (w > maxW) { size = Math.floor(size * maxW / w); ctx.font = `${weight} ${size}px ${FONT}`; } }
  ctx.textAlign = align; ctx.textBaseline = 'middle';
  if (stroke) { ctx.lineWidth = stroke; ctx.strokeStyle = '#000'; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); }
  ctx.fillStyle = color; ctx.fillText(s, x, y);
}
function bgGrad(c0, c1) { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, c0); g.addColorStop(1, c1); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
function glow(x, y, r, color, a = 1) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, color.replace('A', a)); g.addColorStop(1, color.replace('A', 0)); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); }

// ---- shared shapes ----
function person(x, y, s, col, opts = {}) {
  ctx.fillStyle = col; const h = 300 * s;
  ctx.beginPath(); ctx.arc(x, y - h * 0.9, 24 * s * (opts.kid ? 1.1 : 1), 0, 7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - 22 * s, y - h * 0.82); ctx.lineTo(x + 22 * s, y - h * 0.82);
  ctx.lineTo(x + (opts.dress ? 56 : 34) * s, y); ctx.lineTo(x - (opts.dress ? 56 : 34) * s, y); ctx.closePath(); ctx.fill();
}
function bust(cx, cy, s, col) {
  ctx.fillStyle = col; ctx.beginPath();
  ctx.moveTo(cx - 250 * s, cy + 420 * s); ctx.quadraticCurveTo(cx - 220 * s, cy + 190 * s, cx - 80 * s, cy + 150 * s);
  ctx.lineTo(cx - 50 * s, cy + 70 * s); ctx.quadraticCurveTo(cx - 90 * s, cy + 30 * s, cx - 95 * s, cy - 40 * s);
  ctx.quadraticCurveTo(cx - 100 * s, cy - 150 * s, cx - 10 * s, cy - 165 * s);
  ctx.quadraticCurveTo(cx + 70 * s, cy - 160 * s, cx + 85 * s, cy - 80 * s);
  ctx.lineTo(cx + 105 * s, cy - 40 * s); ctx.lineTo(cx + 85 * s, cy - 25 * s); ctx.lineTo(cx + 92 * s, cy + 5 * s);
  ctx.lineTo(cx + 70 * s, cy + 22 * s); ctx.quadraticCurveTo(cx + 78 * s, cy + 60 * s, cx + 30 * s, cy + 78 * s);
  ctx.lineTo(cx + 40 * s, cy + 150 * s); ctx.quadraticCurveTo(cx + 220 * s, cy + 190 * s, cx + 260 * s, cy + 420 * s);
  ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.arc(cx - 85 * s, cy - 150 * s, 62 * s, 0, 7); ctx.fill();
}
function helix(cx, cy, h, w, phase, alpha = 1, c1 = TEAL, c2 = GOLD) {
  const n = 46; ctx.lineWidth = 7;
  for (let i = 0; i < n; i++) {
    const y = cy - h / 2 + (h * i) / (n - 1), p = i * 0.42 + phase;
    const x1 = cx + Math.sin(p) * w, x2 = cx - Math.sin(p) * w, z = Math.cos(p);
    ctx.globalAlpha = alpha * (0.35 + 0.17 * (z + 1));
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
    ctx.globalAlpha = alpha; ctx.fillStyle = c1; ctx.beginPath(); ctx.arc(x1, y, 13 + z * 4, 0, 7); ctx.fill();
    ctx.fillStyle = c2; ctx.beginPath(); ctx.arc(x2, y, 13 - z * 4, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
function snow(t, n, speed, col = 'rgba(255,255,255,.7)') { ctx.fillStyle = col; for (let i = 0; i < n; i++) { const x = (rnd(i) * W + Math.sin(t + i) * 30) % W, y = (rnd(i + 99) * H + t * speed * (0.5 + rnd(i + 5))) % H; ctx.beginPath(); ctx.arc(x, y, 2 + rnd(i + 7) * 4, 0, 7); ctx.fill(); } }
function rain(t, n) { ctx.strokeStyle = 'rgba(170,200,230,.35)'; ctx.lineWidth = 2.5; for (let i = 0; i < n; i++) { const x = rnd(i) * W, y = (rnd(i + 50) * H + t * 2200 * (0.6 + rnd(i + 3))) % H; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 14, y + 60); ctx.stroke(); } }
function stars(n, maxY = 600) { ctx.fillStyle = '#fff'; for (let i = 0; i < n; i++) { ctx.globalAlpha = 0.3 + 0.7 * rnd(i + 2); ctx.fillRect(rnd(i) * W, rnd(i + 8) * maxY, 3, 3); } ctx.globalAlpha = 1; }

// ---- text layers ----
function layers(sc, u, accent) {
  if (sc.kicker) text(type(sc.kicker, u, 0.15, sc.kicker.length > 8 ? 14 : 6), 540, 250, 230, accent, 'center', 900, 12, 960);
  if (sc.sub) { ctx.globalAlpha = ss(0.8, 1.2, u); text(sc.sub, 540, sc.kicker ? 400 : 1130, sc.kicker ? 50 : 40, sc.kicker ? '#fff' : accent, 'center', 700, 0, 960); ctx.globalAlpha = 1; }
  if (sc.headline) {
    const n = sc.headline.length, y0 = sc.kicker ? 560 : (sc.motif === 'cta' ? 360 : 300), sp = sc.motif === 'cta' ? 165 : 170;
    const sizes = n === 3 ? [118, 200, 150] : n === 2 ? [150, 180] : [170];
    const cols = sc.colors || (sc.motif === 'cta' ? ['#fff', accent, TEAL] : ['#fff', accent, '#fff']);
    sc.headline.forEach((l, i) => { const a = ss(0.1 + i * 0.12, 0.45 + i * 0.12, u); ctx.globalAlpha = a; text(l, 540, y0 + i * sp, sizes[i], cols[i] || '#fff', 'center', 900, 14, 980); });
    ctx.globalAlpha = 1;
  }
  if (sc.reveal) { ctx.globalAlpha = ss(2.4, 3.0, u); text(sc.reveal, 540, 1640, 78, RED, 'center', 900, 10, 1000); ctx.globalAlpha = 1; }
}

// ---- motifs (u = local time 0..5) ----
const M = {};
M.portrait = (u, sc, ac) => {
  bgGrad('#14100c', '#050403');
  const sh = u < 0.5 ? (1 - u / 0.5) * 14 : 0; ctx.translate(Math.sin(u * 90) * sh, Math.cos(u * 77) * sh);
  glow(540, 650, 760, 'rgba(217,180,108,A)', 0.55);
  ctx.fillStyle = 'rgba(217,180,108,.07)'; ctx.beginPath(); ctx.moveTo(540, 0); ctx.lineTo(120, H); ctx.lineTo(960, H); ctx.fill();
  const z = 1 + u * 0.04; ctx.save(); ctx.translate(540, 760); ctx.scale(z, z); ctx.translate(-540, -760); bust(540, 700, 1.7, '#000'); ctx.restore();
  ctx.globalAlpha = ss(0.2, 0.9, u) * (0.75 + 0.25 * Math.sin(u * 9)); text(sc.glyph || '?', 540, 520, 760, 'rgba(217,180,108,.18)'); ctx.globalAlpha = 1;
};
M.building = (u, sc, ac) => {
  bgGrad('#0a1018', '#04070b'); glow(540, 380, 600, 'rgba(120,160,220,A)', 0.2); stars(60);
  ctx.save(); const z = 1 + u * 0.03; ctx.translate(540, 900); ctx.scale(z, z); ctx.translate(-540, -900);
  ctx.fillStyle = '#05070b'; ctx.fillRect(110, 640, 860, 560); ctx.fillRect(110, 1200, 860, 60);
  ctx.beginPath(); ctx.moveTo(90, 640); ctx.lineTo(540, 520); ctx.lineTo(990, 640); ctx.fill(); ctx.fillRect(480, 560, 120, 80);
  for (let r = 0; r < 2; r++) for (let c = 0; c < 6; c++) { const lit = (r + c) % 3 !== 1; ctx.fillStyle = lit ? `rgba(255,190,90,${0.55 + 0.25 * Math.sin(u * 6 + c)})` : '#101620'; ctx.fillRect(160 + c * 135, 700 + r * 220, 70, 120); }
  ctx.restore();
  [[0, 1.0, 0], [1, 0.95, 1], [2, 0.8, 1], [3, 0.8, 1], [4, 0.78, 1], [5, 0.78, 1], [6, 0.62, 0]].forEach(([i, s, d]) => { const x = 190 + i * 115; const a = 1 - ss(2.2 + i * 0.25, 2.6 + i * 0.25, u); ctx.globalAlpha = a * ss(0.1 + i * 0.07, 0.5 + i * 0.07, u); person(x, 1180, 0.55 * s * 1.3, '#000', { dress: d, kid: i > 1 }); ctx.globalAlpha = 1; });
  snow(u, 140, 220);
};
M.city_rain = (u, sc, ac) => {
  bgGrad('#0c0f16', '#05060a'); glow(760, 760, 520, 'rgba(255,200,120,A)', 0.55 + 0.1 * Math.sin(u * 20));
  for (let i = 0; i < 14; i++) { const bw = 90 + rnd(i) * 80, bx = i * 85 - 20, bh = 360 + rnd(i + 4) * 520; ctx.fillStyle = '#05060a'; ctx.fillRect(bx, 1250 - bh, bw, bh); ctx.fillStyle = 'rgba(255,200,120,.5)'; for (let k = 0; k < 14; k++) if (rnd(i * 13 + k) > 0.65) ctx.fillRect(bx + 14 + (k % 3) * 24, 1250 - bh + 30 + Math.floor(k / 3) * 60, 12, 20); }
  ctx.fillStyle = '#0a0c12'; ctx.fillRect(0, 1250, W, 670);
  ctx.fillStyle = '#000'; ctx.fillRect(748, 650, 14, 600); ctx.beginPath(); ctx.arc(755, 640, 34, 0, 7); ctx.fill(); glow(755, 640, 120, 'rgba(255,230,160,A)', 1);
  const wx = lerp(120, 560, ss(0, 4.2, u)); ctx.save(); ctx.translate(wx, 1250 + Math.sin(u * 8) * 5); person(0, 0, 1.2, '#000', { dress: 1 }); ctx.beginPath(); ctx.fillStyle = '#000'; ctx.ellipse(0, -300 * 1.2 * 0.98, 44, 16, 0, 0, 7); ctx.fill(); ctx.restore();
  rain(u, 160);
};
M.forest_dig = (u, sc, ac) => {
  bgGrad('#0d1410', '#040605'); glow(540, 520, 700, 'rgba(255,170,90,A)', 0.28);
  for (let L = 0; L < 3; L++) { ctx.fillStyle = ['#0a110c', '#070c08', '#030504'][L]; for (let i = 0; i < 12; i++) { const x = i * 100 - 40 + L * 35 + (rnd(i + L) * 30), h = 420 + L * 90 + rnd(i + 3) * 160, y = 1180 + L * 20; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 70 + L * 10, y - h); ctx.lineTo(x + 140 + L * 20, y); ctx.fill(); } }
  const g = ctx.createLinearGradient(0, 900, 0, 1300); g.addColorStop(0, 'rgba(200,220,200,0)'); g.addColorStop(1, 'rgba(200,220,200,.32)'); ctx.fillStyle = g; ctx.fillRect(0, 900, W, 400);
  ctx.fillStyle = '#030403'; ctx.fillRect(0, 1180, W, 740);
  ctx.fillStyle = '#000'; ctx.beginPath(); ctx.moveTo(220, 1180); ctx.lineTo(860, 1180); ctx.lineTo(960, 1330); ctx.lineTo(120, 1330); ctx.fill();
  const hp = ss(1.3, 2.4, u); helix(540, 1000 - hp * 80, 520 * hp + 40, 130, u * 2.6, hp);
  ctx.fillStyle = 'rgba(255,170,90,.8)'; ctx.fillRect(820, 1160, 22, 38); glow(831, 1170, 120, 'rgba(255,170,90,A)', 0.8 + 0.2 * Math.sin(u * 11));
};
M.ship_sea = (u, sc, ac) => {
  bgGrad('#0a1622', '#04080d'); stars(50, 700); glow(780, 420, 380, 'rgba(200,220,255,A)', 0.35); ctx.fillStyle = '#dfe9ff'; ctx.beginPath(); ctx.arc(780, 420, 70, 0, 7); ctx.fill();
  const bob = Math.sin(u * 2.2) * 14, tilt = Math.sin(u * 1.7) * 0.05;
  ctx.save(); ctx.translate(540, 1000 + bob); ctx.rotate(tilt); ctx.fillStyle = '#020305';
  ctx.beginPath(); ctx.moveTo(-300, 0); ctx.lineTo(300, 0); ctx.lineTo(240, 90); ctx.lineTo(-250, 90); ctx.closePath(); ctx.fill();
  for (const mx of [-130, 20, 160]) { ctx.fillRect(mx - 6, -420, 12, 420); ctx.beginPath(); ctx.moveTo(mx + 8, -400); ctx.quadraticCurveTo(mx + 120 + Math.sin(u * 2 + mx) * 12, -250, mx + 8, -60); ctx.fill(); ctx.beginPath(); ctx.moveTo(mx - 8, -380); ctx.quadraticCurveTo(mx - 90, -250, mx - 8, -90); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,190,90,.8)'; ctx.fillRect(-200, 18, 14, 18); ctx.fillRect(-150, 18, 14, 18); glow(-193, 27, 60, 'rgba(255,190,90,A)', 0.6); ctx.restore();
  for (let L = 0; L < 5; L++) { ctx.fillStyle = `rgba(${6 + L * 4},${18 + L * 8},${34 + L * 10},.96)`; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, 1090 + L * 70 + Math.sin(x * 0.012 + u * (1.4 + L * 0.3) + L) * (16 + L * 6)); ctx.lineTo(W, H); ctx.fill(); }
  const f = ctx.createLinearGradient(0, 900, 0, 1250); f.addColorStop(0, 'rgba(180,200,220,0)'); f.addColorStop(1, 'rgba(180,200,220,.22)'); ctx.fillStyle = f; ctx.fillRect(0, 900, W, 350);
};
M.desert_ruins = (u, sc, ac) => {
  bgGrad('#2a1530', '#e0884a'); ctx.fillStyle = '#ffd9a0'; ctx.beginPath(); ctx.arc(540, 1020, 150, 0, 7); ctx.fill(); glow(540, 1020, 520, 'rgba(255,190,110,A)', 0.55);
  ctx.fillStyle = '#1a0d1c'; for (const [x, w, h] of [[160, 340, 300], [560, 420, 380], [880, 220, 190]]) { ctx.beginPath(); ctx.moveTo(x - w / 2, 1180); ctx.lineTo(x, 1180 - h); ctx.lineTo(x + w / 2, 1180); ctx.fill(); }
  for (let i = 0; i < 5; i++) { ctx.fillRect(100 + i * 70, 1010 - (i % 2) * 60, 28, 190 + (i % 2) * 60); }
  for (let L = 0; L < 3; L++) { ctx.fillStyle = ['#2b1424', '#1d0e1c', '#0f060f'][L]; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, 1180 + L * 90 + Math.sin(x * 0.006 + L * 2) * 50); ctx.lineTo(W, H); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,220,170,.5)'; for (let i = 0; i < 90; i++) { const x = (rnd(i) * W + u * 260 * (0.5 + rnd(i + 3))) % W, y = 1000 + rnd(i + 9) * 400; ctx.fillRect(x, y, 4, 2); }
};
M.map_path = (u, sc, ac) => {
  bgGrad('#d9c59a', '#b89c68'); ctx.strokeStyle = 'rgba(80,50,20,.18)'; ctx.lineWidth = 2; for (let i = 0; i < W; i += 70) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i * 1.77); ctx.lineTo(W, i * 1.77); ctx.stroke(); }
  ctx.fillStyle = 'rgba(120,90,50,.35)'; ctx.strokeStyle = 'rgba(70,45,20,.7)'; ctx.lineWidth = 5;
  for (let k = 0; k < 3; k++) { ctx.beginPath(); for (let i = 0; i <= 22; i++) { const a = i / 22 * 6.283, r = 150 + rnd(i + k * 30) * 130; const x = [250, 760, 520][k] + Math.cos(a) * r, y = [900, 760, 1160][k] + Math.sin(a) * r * 0.7; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); ctx.fill(); ctx.stroke(); }
  const pts = [[190, 1050], [380, 860], [560, 980], [700, 760], [840, 900]]; const prog = ss(0.6, 3.6, u) * (pts.length - 1);
  ctx.strokeStyle = '#8b1a1a'; ctx.lineWidth = 8; ctx.setLineDash([22, 16]); ctx.beginPath(); ctx.moveTo(...pts[0]);
  for (let i = 1; i < pts.length; i++) { const f = clamp(prog - (i - 1)); if (f <= 0) break; ctx.lineTo(lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)); } ctx.stroke(); ctx.setLineDash([]);
  if (prog >= pts.length - 1) { ctx.strokeStyle = '#8b1a1a'; ctx.lineWidth = 14; const [x, y] = pts[4]; ctx.beginPath(); ctx.moveTo(x - 30, y - 30); ctx.lineTo(x + 30, y + 30); ctx.moveTo(x + 30, y - 30); ctx.lineTo(x - 30, y + 30); ctx.stroke(); }
  ctx.save(); ctx.translate(900, 1130); ctx.rotate(u * 0.1); ctx.strokeStyle = 'rgba(60,35,15,.8)'; ctx.fillStyle = 'rgba(60,35,15,.8)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 60, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, -85); ctx.lineTo(16, 0); ctx.lineTo(0, 85); ctx.lineTo(-16, 0); ctx.closePath(); ctx.fill(); ctx.restore();
};
M.document = (u, sc, ac) => {
  bgGrad('#1a120c', '#070403'); glow(540, 800, 700, 'rgba(255,200,120,A)', 0.35);
  ctx.save(); ctx.translate(540, 840); ctx.rotate(-0.04 + Math.sin(u) * 0.01); ctx.fillStyle = '#e6d6b0'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 40; ctx.fillRect(-380, -520, 760, 1040); ctx.shadowBlur = 0;
  for (let i = 0; i < 16; i++) { const w = 560 + rnd(i) * 150; ctx.fillStyle = 'rgba(60,40,20,.55)'; ctx.fillRect(-340, -440 + i * 54, w, 14); const a = ss(1.0 + i * 0.12, 1.5 + i * 0.12, u); if (rnd(i + 20) > 0.45) { ctx.fillStyle = '#0a0a0a'; ctx.fillRect(-345, -448 + i * 54, (w + 12) * a, 30); } }
  const sa = ss(2.6, 3.0, u); if (sa > 0) { ctx.globalAlpha = sa; ctx.translate(120, 260); ctx.rotate(-0.25); ctx.scale(1.6 - 0.6 * sa, 1.6 - 0.6 * sa); ctx.strokeStyle = RED; ctx.lineWidth = 12; ctx.strokeRect(-250, -70, 500, 140); text(sc.stamp || 'UNSOLVED', 0, 4, 90, RED, 'center', 900, 0, 460); ctx.globalAlpha = 1; }
  ctx.restore();
};
M.castle_night = (u, sc, ac) => {
  bgGrad('#0b0b1a', '#040408'); stars(70, 800); glow(300, 420, 360, 'rgba(210,220,255,A)', 0.3); ctx.fillStyle = '#e6ecff'; ctx.beginPath(); ctx.arc(300, 420, 64, 0, 7); ctx.fill();
  ctx.fillStyle = '#020204'; ctx.beginPath(); ctx.moveTo(0, 1300); ctx.quadraticCurveTo(540, 900, W, 1250); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
  const cx = 600; ctx.fillRect(cx - 260, 900, 520, 330);
  for (const [x, w, h] of [[-250, 110, 300], [-120, 90, 220], [0, 150, 420], [130, 90, 230], [250, 110, 320]]) { ctx.fillRect(cx + x - w / 2, 900 - h, w, h + 40); ctx.beginPath(); ctx.moveTo(cx + x - w / 2 - 10, 900 - h); ctx.lineTo(cx + x, 900 - h - w * 0.9); ctx.lineTo(cx + x + w / 2 + 10, 900 - h); ctx.fill(); }
  for (let i = 0; i < 12; i++) { const lit = rnd(i + Math.floor(u * 3)) > 0.35; if (lit) { ctx.fillStyle = 'rgba(255,190,90,.85)'; ctx.fillRect(cx - 240 + (i % 6) * 90 + (i > 5 ? 20 : 0), 560 + Math.floor(i / 6) * 220 + (i % 3) * 40, 22, 40); } }
  for (let b = 0; b < 7; b++) { const bx = (rnd(b) * W + u * 120 * (0.6 + rnd(b + 2))) % W, by = 300 + rnd(b + 5) * 400 + Math.sin(u * 6 + b) * 30; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + 34, by - 14 + Math.sin(u * 18 + b) * 12); ctx.lineTo(bx + 22, by + 6); ctx.lineTo(bx - 34, by - 14 + Math.sin(u * 18 + b) * 12); ctx.closePath(); ctx.fill(); }
  const f = ctx.createLinearGradient(0, 1050, 0, 1400); f.addColorStop(0, 'rgba(160,170,200,0)'); f.addColorStop(1, 'rgba(160,170,200,.25)'); ctx.fillStyle = f; ctx.fillRect(0, 1050, W, 350);
};
function gel(x, y, w, h, lanes, u) {
  ctx.fillStyle = 'rgba(8,16,22,.92)'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = 'rgba(63,216,207,.5)'; ctx.lineWidth = 3; ctx.strokeRect(x, y, w, h);
  const lw = w / lanes.length;
  lanes.forEach((ln, i) => { const cx = x + lw * (i + 0.5); text(ln.name, cx, y - 30, 30, '#cfe', 'center', 800, 0, lw - 10); ln.bands.forEach((b, k) => { const by = y + 40 + b * (h - 80), a = ss(0.2 + k * 0.08, 0.7 + k * 0.08, u); ctx.fillStyle = ln.col; ctx.globalAlpha = a * 0.95; ctx.fillRect(cx - lw * 0.32, by - 7, lw * 0.64, 15); ctx.globalAlpha = a * 0.35; ctx.fillRect(cx - lw * 0.4, by - 14, lw * 0.8, 29); ctx.globalAlpha = 1; }); });
}
M.dna_lab = (u, sc, ac) => {
  bgGrad('#071217', '#030708'); ctx.strokeStyle = 'rgba(63,216,207,.06)'; ctx.lineWidth = 2; for (let i = 0; i < W; i += 60) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }
  helix(150, 330, 380, 60, u * 3, 0.5); helix(930, 330, 380, 60, -u * 3, 0.5);
  text(sc.title || 'DNA TEST', 540, 260, 140, TEAL, 'center', 900, 12, 700); text('ILLUSTRATIVE GRAPHIC', 540, 360, 30, 'rgba(255,255,255,.5)', 'center', 700);
  const b1 = [0.18, 0.37, 0.58, 0.8], b2 = [0.28, 0.5, 0.71];
  const L = sc.left, R = sc.right;
  gel(70, 500, 440, 340, [{ name: L.labels[0], bands: b1, col: TEAL }, { name: L.labels[1], bands: b1, col: TEAL }], u);
  gel(570, 500, 440, 340, [{ name: R.labels[0], bands: b2, col: RED }, { name: R.labels[1], bands: b1, col: '#7aa' }], u);
  ctx.globalAlpha = ss(1.3, 1.8, u); text(L.verdict, 290, 920, 80, '#5dff9a', 'center', 900, 10, 420); L.lines.forEach((s, i) => text(s, 290, 995 + i * 45, 38, '#fff', 'center', 800, 0, 420)); ctx.globalAlpha = 1;
  ctx.globalAlpha = ss(2.9, 3.4, u); text(R.verdict, 790, 920, 80, RED, 'center', 900, 10, 420); R.lines.forEach((s, i) => text(s, 790, 995 + i * 45, 38, '#fff', 'center', 800, 0, 420)); ctx.globalAlpha = 1;
  if (sc.footer) { ctx.globalAlpha = ss(3.7, 4.2, u); sc.footer.forEach((s, i) => text(s, 540, 1120 + i * 60, i ? 44 : 50, ac, 'center', 900, 8, 980)); ctx.globalAlpha = 1; }
};
M.cta = (u, sc, ac) => {
  bgGrad('#12090c', '#050205'); glow(540, 700, 800, 'rgba(255,74,100,A)', 0.22 + 0.06 * Math.sin(u * 6));
  helix(540, 820, 900, 170, u * 2.2, 0.28, TEAL, GOLD);
  const p = ss(1.0, 1.5, u) * (1 + 0.04 * Math.sin(u * 9)); ctx.save(); ctx.translate(540, 1030); ctx.scale(p, p);
  ctx.fillStyle = '#ff2d55'; ctx.beginPath(); ctx.roundRect(-250, -62, 500, 124, 62); ctx.fill(); text('▶  ' + (sc.cta || 'FOLLOW'), 0, 4, 66, '#fff', 'center', 900, 0, 440); ctx.restore();
  ctx.globalAlpha = ss(2.2, 2.8, u); ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.beginPath(); ctx.roundRect(120, 1760, 840, 120, 40); ctx.fill(); text((sc.bubble || 'WHAT NEXT?') + ' 💬', 540, 1822, 52, '#111', 'center', 900, 0, 780); ctx.globalAlpha = 1;
};

// ---- subtitles (word-timed chunks, current word highlighted) ----
const words = timings.flatMap((s) => s.words);
const chunks = []; { let cur = []; for (const w of words) { cur.push(w); if (cur.length >= 3 || /[.,?!]$/.test(w.w)) { chunks.push(cur); cur = []; } } if (cur.length) chunks.push(cur); }
let lastKey = '';
function setSub(t) {
  let ci = -1;
  for (let i = 0; i < chunks.length; i++) { const c = chunks[i], nx = chunks[i + 1]; const t0 = c[0].t0 - 0.03, t1 = nx ? Math.min(nx[0].t0 - 0.03, c[c.length - 1].t1 + 0.35) : c[c.length - 1].t1 + 0.4; if (t >= t0 && t < t1) { ci = i; break; } }
  if (ci < 0) { if (lastKey !== '') { subEl.innerHTML = ''; lastKey = ''; } return; }
  const c = chunks[ci]; const cur = c.findIndex((w) => t >= w.t0 && t < w.t1); const key = ci + ':' + cur; if (key === lastKey) return; lastKey = key;
  subEl.innerHTML = '<div>' + c.map((w, i) => `<span class="${i === cur ? 'on' : ''}">${w.w.replace(/[.,?!]+$/, '')}</span>`).join('') + '</div>';
  subEl.style.fontSize = '104px'; const wd = subEl.firstChild.getBoundingClientRect().width; if (wd > 980) subEl.style.fontSize = (104 * 980 / wd).toFixed(1) + 'px';
}
window.renderFrame = (t) => {
  const si = Math.min(5, Math.floor(t / 5)), u = t - si * 5, sc = story.scenes[si], ac = sc.accent || GOLD;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H); ctx.globalAlpha = 1;
  const punch = 1 + 0.07 * (1 - ss(0, 0.28, u)); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(punch, punch); ctx.translate(-W / 2, -H / 2);
  (M[sc.motif] || M.portrait)(u, sc, ac); layers(sc, u, ac); ctx.restore();
  for (let i = 0; i < 260; i++) { ctx.fillStyle = `rgba(255,255,255,${0.05 + 0.06 * rnd(i + t * 31)})`; ctx.fillRect(rnd(i * 3 + t * 17) * W, rnd(i * 7 + t * 11) * H, 3, 3); }
  const fl = (1 - ss(0, 0.18, u)) * (si === 0 ? 0 : 0.65); if (fl > 0) { ctx.fillStyle = `rgba(255,255,255,${fl})`; ctx.fillRect(0, 0, W, H); }
  if (si === 0 && t < 0.25) { ctx.fillStyle = `rgba(255,40,40,${0.5 * (1 - t / 0.25)})`; ctx.fillRect(0, 0, W, H); }
  setSub(t); return true;
};
window.ready = true;
