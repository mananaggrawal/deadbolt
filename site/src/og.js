// Link-preview cards (1200x630) for the site, each room and each shared result.
// Drawn with satori (layout -> SVG) and resvg (SVG -> pixels), then encoded as JPEG (small enough for
// WhatsApp, which drops large preview images) or PNG; no browser needed.
// Everything that matters sits in the middle of the card, so it still reads when an app crops it to a
// square thumbnail (WhatsApp does for some links): the white door logo, the name, the room.
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import jpeg from 'jpeg-js';
import { cfg } from './config.js';
import { roomById, fmtTime, wrongWords, released } from './rooms.js';
import { art as ART, fonts as FONT_B64 } from './generated/assets.js';

const FONTS = [400, 500, 600].map(w => ({ name: 'Geist', data: Buffer.from(FONT_B64[w], 'base64'), weight: w, style: 'normal' }));
const C = { bg: '#0b0a09', ink: '#ede8de', ink2: '#d6cfc2', muted: '#a39b8e', faint: '#534e47', lamp: '#f0c27a', sq: ['#4d8a4a', '#c9a13b', '#a83a30'] };

const art = id => (ART[id] ? `data:image/jpeg;base64,${ART[id]}` : null);

// the site's logo: the white door (frame, leaf and knob), as on the landing page and the favicon
const DOOR = 'data:image/svg+xml;base64,' + Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="3.2 1.2 15.6 20.6">'
  + '<rect x="4" y="2" width="14" height="19" rx="1" fill="none" stroke="#ede8de" stroke-width="1.6"/>'
  + '<rect x="5.6" y="3.6" width="10.8" height="17.4" fill="#ede8de"/>'
  + '<circle cx="14.2" cy="12.4" r=".95" fill="#0b0a09"/></svg>').toString('base64');

// a tiny element helper: h('div', {style}, ...children)
const h = (type, style, ...children) => ({ type, props: { style: { display: 'flex', ...style }, children: children.flat().filter(c => c !== null && c !== false && c !== undefined) } });
const img = (src, style) => ({ type: 'img', props: { src, style } });
const door = height => img(DOOR, { width: Math.round(height * 15.6 / 20.6), height });

// the room's art, full bleed, darkened so the words on top read on any picture
function backdrop(id) {
  const src = art(id);
  return [
    src ? img(src, { position: 'absolute', left: 0, top: 0, width: 1200, height: 630, objectFit: 'cover' }) : null,
    h('div', { position: 'absolute', left: 0, top: 0, width: 1200, height: 630, background: 'rgba(8,7,6,0.36)' }),
    h('div', { position: 'absolute', left: 0, top: 0, width: 1200, height: 630, backgroundImage: 'radial-gradient(ellipse 62% 70% at 50% 50%, rgba(8,7,6,0.66) 0%, rgba(8,7,6,0.34) 58%, rgba(8,7,6,0) 100%)' }),
    h('div', { position: 'absolute', left: 0, top: 0, width: 1200, height: 630, backgroundImage: 'linear-gradient(180deg, rgba(8,7,6,0.55) 0%, rgba(8,7,6,0) 26%, rgba(8,7,6,0) 70%, rgba(8,7,6,0.7) 100%)' }),
  ];
}
function card(id, ...content) {
  return h('div', { width: 1200, height: 630, position: 'relative', background: C.bg, color: C.ink, fontFamily: 'Geist' },
    ...backdrop(id),
    h('div', { position: 'absolute', left: 0, top: 0, width: 1200, height: 630, flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '50px 80px 54px' }, ...content));
}
// the logo and name, small, at the top of room and result cards
const lockup = () => h('div', { alignItems: 'center', gap: 14 }, door(40), h('div', { fontSize: 32, fontWeight: 500, letterSpacing: -0.4 }, cfg.siteName));
const caps = (text, style) => h('div', { fontSize: 24, letterSpacing: 5, textTransform: 'uppercase', ...style }, text);
const squares = (marks, size = 42) => h('div', { gap: 10 }, ...String(marks || '').split('').map(c => h('div', { width: size, height: size, borderRadius: 5, background: C.sq[+c] || C.faint })));
const titleSize = t => (t.length > 18 ? 72 : t.length > 13 ? 86 : 104);

export function siteCard() {
  const r = released(), last = r[r.length - 1];
  return card(last ? last.id : 'tio',
    h('div', { height: 40 }),
    h('div', { flexDirection: 'column', alignItems: 'center' },
      door(118),
      h('div', { fontSize: 112, fontWeight: 500, letterSpacing: -3, lineHeight: 1, marginTop: 34 }, cfg.siteName),
      caps('Horror mystery rooms', { color: C.lamp, fontSize: 28, letterSpacing: 7, marginTop: 26 })),
    h('div', { fontSize: 26, color: C.ink2 }, r.length > 1 ? `${r.length} rooms open` : ' '),
  );
}

export function roomCard(id) {
  const m = roomById(id); if (!m) return null;
  return card(id,
    lockup(),
    h('div', { flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
      caps(`Mystery #${m.n}`, { color: C.lamp }),
      h('div', { fontSize: titleSize(m.title), lineHeight: 1.02, letterSpacing: -2, marginTop: 18, textAlign: 'center' }, m.title),
      caps(`${m.place} · ${m.era}`, { color: C.muted, fontSize: 21, letterSpacing: 3.5, marginTop: 22, textAlign: 'center' })),
    h('div', { fontSize: 27, lineHeight: 1.4, color: C.ink2, textAlign: 'center', maxWidth: 900 }, brief(m.tagline || m.hook || '')),
  );
}

export function resultCard(share) {
  const m = roomById(share.room); if (!m) return null;
  const n = String(share.marks || '').length;
  return card(m.id,
    lockup(),
    h('div', { flexDirection: 'column', alignItems: 'center', gap: 22 },
      caps(`Mystery #${m.n} · ${m.title}`, { color: C.lamp }),
      h('div', { fontSize: 72, lineHeight: 1.04, letterSpacing: -1.6 }, `Escaped in ${fmtTime(share.seconds)}`),
      n ? squares(share.marks, n > 9 ? 34 : 42) : null,
      h('div', { fontSize: 26, color: C.ink2 }, `${share.hints} hint${share.hints === 1 ? '' : 's'} · ${wrongWords(m, share.wrong)}`)),
    h('div', { fontSize: 32, fontWeight: 500 }, 'Can you get out?'),
  );
}

// a room's story, as many whole sentences as fit on two lines (the full story is the link's description)
function brief(s, max = 118) {
  const sentences = s.match(/[^.!?]+[.!?]+(\s|$)/g) || [s];
  let out = '';
  for (const x of sentences) { if ((out + x).trim().length > max) break; out += x; }
  out = out.trim() || sentences[0].trim();
  return out.length <= max ? out : out.slice(0, out.lastIndexOf(' ', max - 2)) + '…';
}

const cache = new Map();
// fmt 'jpg' (what pages point at now) or 'png' (older links already out in apps)
export async function image(key, build, fmt = 'jpg') {
  const k = `${fmt}:${key}`;
  if (cache.has(k)) return cache.get(k);
  const tree = build(); if (!tree) return null;
  const svg = await satori(tree, { width: 1200, height: 630, fonts: FONTS });
  const px = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render();
  const out = fmt === 'png' ? px.asPng() : Buffer.from(jpeg.encode({ data: px.pixels, width: px.width, height: px.height }, 84).data);
  if (cache.size > 400) cache.delete(cache.keys().next().value);
  cache.set(k, out);
  return out;
}
export const png = (key, build) => image(key, build, 'png');
