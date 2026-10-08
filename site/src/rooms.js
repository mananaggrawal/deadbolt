// The rooms, as the game build describes them (MYSTERIES in game/src/series.js, via rooms.json).
import { cfg } from './config.js';
import { rooms } from './generated/assets.js';

export const voFile = () => rooms.vo;
export const allRooms = () => rooms.mysteries;
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
