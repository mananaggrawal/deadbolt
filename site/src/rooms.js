// The rooms, as the game build describes them (game/dist/site/rooms.json, made from series.js).
import fs from 'node:fs';
import path from 'node:path';
import { cfg } from './config.js';

let cache = null, mtime = 0;
function load() {
  const f = path.join(cfg.gameDir, 'rooms.json');
  const st = fs.statSync(f);
  if (!cache || st.mtimeMs !== mtime) { cache = JSON.parse(fs.readFileSync(f, 'utf8')); mtime = st.mtimeMs; }
  return cache;
}
export const voFile = () => load().vo;
export const allRooms = () => load().mysteries;
export const roomById = id => allRooms().find(m => m.id === id) || null;

// today's date where the site lives (rooms open on their date there)
export function today() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: cfg.timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
export const released = () => { const t = today(); return allRooms().filter(m => m.date <= t); };
export const isReleased = id => released().some(m => m.id === id);
export const newest = () => { const r = released(); return r[r.length - 1] || allRooms()[0]; };

export const fmtTime = sec => { sec = Math.max(0, Math.floor(sec || 0)); return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`; };
export function wrongWords(room, n) {
  if (room && room.wrongLabel) return `${n} time${n === 1 ? '' : 's'} caught`;
  return `${n} wrong guess${n === 1 ? '' : 'es'}`;
}
