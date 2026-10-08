// Link-preview cards (1200x630 PNG) for the site, each room and each shared result.
// Drawn with satori (layout -> SVG) and resvg (SVG -> PNG); no browser needed.
import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { cfg } from './config.js';
import { roomById, fmtTime, wrongWords, released } from './rooms.js';

const fontDir = path.resolve(cfg.publicDir, '../node_modules/@fontsource/geist-sans/files');
const font = w => fs.readFileSync(path.join(fontDir, `geist-sans-latin-${w}-normal.woff`));
const FONTS = [
  { name: 'Geist', data: font(400), weight: 400, style: 'normal' },
  { name: 'Geist', data: font(500), weight: 500, style: 'normal' },
  { name: 'Geist', data: font(600), weight: 600, style: 'normal' },
];
const C = { bg: '#0b0a09', ink: '#ede8de', ink2: '#c8c1b4', muted: '#8d867b', faint: '#534e47', lamp: '#f0c27a', sq: ['#4d8a4a', '#c9a13b', '#a83a30'], line: '#24211e' };

const artCache = new Map();
function art(id) {
  if (artCache.has(id)) return artCache.get(id);
  const f = path.join(cfg.publicDir, 'art', `${id}.jpg`);
  const v = fs.existsSync(f) ? `data:image/jpeg;base64,${fs.readFileSync(f).toString('base64')}` : null;
  artCache.set(id, v); return v;
}

// a tiny element helper: h('div', {style}, ...children)
const h = (type, style, ...children) => ({ type, props: { style: { display: 'flex', ...style }, children: children.flat().filter(c => c !== null && c !== false && c !== undefined) } });
const img = (src, style) => ({ type: 'img', props: { src, style } });

function frame(left, right) {
  return h('div', { width: 1200, height: 630, background: C.bg, color: C.ink, fontFamily: 'Geist' },
    h('div', { width: 470, height: 630, position: 'relative', overflow: 'hidden' }, left),
    h('div', { flex: 1, flexDirection: 'column', justifyContent: 'space-between', padding: '64px 64px 56px 56px' }, right));
}
function artPanel(id) {
  const src = art(id);
  return [
    src ? img(src, { width: 470, height: 630, objectFit: 'cover' }) : h('div', { width: 470, height: 630, background: '#15130f' }),
    h('div', { position: 'absolute', left: 0, top: 0, width: 470, height: 630, backgroundImage: `linear-gradient(90deg, rgba(11,10,9,0) 55%, ${C.bg} 100%)` }),
  ];
}
const brand = (host) => h('div', { alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  h('div', { alignItems: 'center', gap: 12 },
    h('div', { width: 22, height: 30, border: `2px solid ${C.ink}`, borderRadius: 2, alignItems: 'flex-end', padding: 2 },
      h('div', { width: '100%', height: '100%', background: C.lamp, opacity: 0.85 })),
    h('div', { fontSize: 24, fontWeight: 500, letterSpacing: -0.2 }, cfg.siteName)),
  h('div', { fontSize: 22, color: C.muted }, host));
const squares = (marks, size = 44) => h('div', { gap: 10 }, ...String(marks || '').split('').map(c => h('div', { width: size, height: size, borderRadius: 5, background: C.sq[+c] || C.faint })));

function host() { try { return new URL(cfg.baseURL).host; } catch (e) { return ''; } }

export function siteCard() {
  const r = released(), last = r[r.length - 1];
  return frame(artPanel(last ? last.id : 'tio'), [
    brand(host()),
    h('div', { flexDirection: 'column', gap: 18 },
      h('div', { fontSize: 22, color: C.muted, letterSpacing: 2.5, textTransform: 'uppercase' }, 'Horror escape rooms · in your browser'),
      h('div', { fontSize: 52, lineHeight: 1.1, fontWeight: 400, letterSpacing: -1.1 }, 'Every room has a way out.'),
      h('div', { fontSize: 30, lineHeight: 1.3, color: C.faint }, 'Not everything in it wants you to find it.')),
    h('div', { fontSize: 24, color: C.ink2 }, `${r.length} rooms open · 20 to 40 minutes each`),
  ]);
}

export function roomCard(id) {
  const m = roomById(id); if (!m) return null;
  return frame(artPanel(id), [
    brand(host()),
    h('div', { flexDirection: 'column', gap: 16 },
      h('div', { fontSize: 22, color: C.lamp, letterSpacing: 3, textTransform: 'uppercase' }, `Mystery #${m.n}`),
      h('div', { fontSize: 72, lineHeight: 1.02, letterSpacing: -1.5 }, m.title),
      h('div', { fontSize: 24, color: C.muted, letterSpacing: 1.5, textTransform: 'uppercase' }, `${m.place} · ${m.era}`)),
    h('div', { fontSize: 26, lineHeight: 1.4, color: C.ink2 }, clip(m.tagline || '', 150)),
  ]);
}

export function resultCard(share) {
  const m = roomById(share.room); if (!m) return null;
  const n = String(share.marks || '').length;
  return frame(artPanel(m.id), [
    brand(host()),
    h('div', { flexDirection: 'column', gap: 22 },
      h('div', { fontSize: 22, color: C.lamp, letterSpacing: 3, textTransform: 'uppercase' }, `Mystery #${m.n} · ${m.title}`),
      h('div', { fontSize: 64, lineHeight: 1.05, letterSpacing: -1.2 }, `Escaped in ${fmtTime(share.seconds)}`),
      n ? squares(share.marks, n > 9 ? 36 : 44) : null,
      h('div', { fontSize: 26, color: C.ink2 }, `${share.hints} hint${share.hints === 1 ? '' : 's'} · ${wrongWords(m, share.wrong)}`)),
    h('div', { fontSize: 30, color: C.ink }, 'Can you get out?'),
  ]);
}

const clip = (s, n) => s.length > n ? s.slice(0, s.lastIndexOf(' ', n)) + '…' : s;

const cache = new Map();
export async function png(key, build) {
  if (cache.has(key)) return cache.get(key);
  const tree = build(); if (!tree) return null;
  const svg = await satori(tree, { width: 1200, height: 630, fonts: FONTS });
  const out = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  if (cache.size > 400) cache.delete(cache.keys().next().value);
  cache.set(key, out);
  return out;
}
