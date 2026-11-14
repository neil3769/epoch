// Draws Epoch's icon (an orbit ring with one dot on an indigo square) and
// writes PNGs with a tiny encoder, so no image tooling is needed.
// Run: npm run icons
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const BG = [0x33, 0x46, 0xd3];
const FG = [0xff, 0xff, 0xff];
const DOT = [0xff, 0xbf, 0x47];

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function png(size, pixel) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x, y);
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
      raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Coverage-based drawing with 4x4 supersampling. */
function icon(size, { rounded, scale }) {
  const S = 4;
  return png(size, (px, py) => {
    let bg = 0,
      ring = 0,
      dot = 0;
    for (let sy = 0; sy < S; sy++)
      for (let sx = 0; sx < S; sx++) {
        const x = (px + (sx + 0.5) / S) / size;
        const y = (py + (sy + 0.5) / S) / size;
        // Background: rounded square (or full bleed for maskable / iOS).
        let inBg = true;
        if (rounded) {
          const r = 0.22;
          const dx = Math.max(r - x, 0, x - (1 - r));
          const dy = Math.max(r - y, 0, y - (1 - r));
          inBg = dx * dx + dy * dy <= r * r;
        }
        if (!inBg) continue;
        bg++;
        const cx = (x - 0.5) / scale;
        const cy = (y - 0.5) / scale;
        const d = Math.hypot(cx, cy);
        const dd = Math.hypot(cx - 0.235, cy + 0.2);
        if (dd <= 0.1) dot++;
        else if (d >= 0.24 && d <= 0.33) ring++;
      }
    const n = S * S;
    const a = bg / n;
    if (a === 0) return [0, 0, 0, 0];
    const mix = (c) => {
      const fr = ring / bg;
      const fd = dot / bg;
      return Math.round(BG[c] * (1 - fr - fd) + FG[c] * fr + DOT[c] * fd);
    };
    return [mix(0), mix(1), mix(2), Math.round(a * 255)];
  });
}

mkdirSync('public/icons', { recursive: true });
writeFileSync('public/icons/icon-192.png', icon(192, { rounded: true, scale: 1 }));
writeFileSync('public/icons/icon-512.png', icon(512, { rounded: true, scale: 1 }));
// Maskable icons must survive a circular crop: full bleed, artwork scaled into the safe zone.
writeFileSync('public/icons/icon-maskable-512.png', icon(512, { rounded: false, scale: 0.8 }));
// iOS adds its own rounded corners and dislikes transparency.
writeFileSync('public/icons/apple-touch-icon.png', icon(180, { rounded: false, scale: 0.9 }));

writeFileSync(
  'public/favicon.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#3346d3"/><circle cx="32" cy="32" r="18" fill="none" stroke="#fff" stroke-width="5.8"/><circle cx="47" cy="19.2" r="6.4" fill="#ffbf47"/></svg>\n`,
);
console.log('icons written');
