// Server-rendered pages other than the landing page and the game: result pages, legal pages, the staging gate.
import { cfg } from './config.js';
import { roomById, fmtTime, wrongWords } from './rooms.js';

export const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// meta tags, favicon, analytics and the site client, shared by every page
// image: a 1200x630 preview card (src/og.js). Its address carries the build version, so apps that keep
// a picture per address (X, Facebook, Telegram) fetch the new card after a redesign.
export function headTags({ title, description, path = '/', image = '/og/site.jpg', imageAlt = '', page = 'site', room = null, noindex = false }) {
  const url = cfg.baseURL + path;
  const img = (image.startsWith('http') ? image : cfg.baseURL + image) + (image.includes('?') ? '&' : '?') + 'v=' + encodeURIComponent(cfg.version);
  const alt = imageAlt || `${cfg.siteName}: horror mystery rooms`;
  const imgType = /\.png(\?|$)/.test(image) ? 'image/png' : 'image/jpeg';
  const mrCfg = { version: cfg.version, requireLogin: cfg.requireLogin, page, room, siteName: cfg.siteName };
  return `<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(url)}">
${noindex ? '<meta name="robots" content="noindex">' : ''}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(cfg.siteName)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:locale" content="en_US">
<meta property="og:image" content="${esc(img)}">
<meta property="og:image:secure_url" content="${esc(img)}">
<meta property="og:image:type" content="${imgType}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(alt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(img)}">
<meta name="twitter:image:alt" content="${esc(alt)}">
<meta name="theme-color" content="#0b0a09">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="${esc(cfg.siteName)}">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
<script>window.MR_CFG=${JSON.stringify(mrCfg).replace(/</g, '\\u003c')};</script>
<script src="/mr.js?v=${esc(cfg.version)}"></script>`;
}

const CSS = `
:root{--bg:#0b0a09;--bg2:#121110;--card:#161412;--line:#24211e;--line2:#312d29;--ink:#ede8de;--ink2:#c8c1b4;--muted:#8d867b;--faint:#534e47;--lamp:#f0c27a;
--sq0:#4d8a4a;--sq1:#c9a13b;--sq2:#a83a30;--sans:"Geist",ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;--mono:"Geist Mono",ui-monospace,Menlo,monospace;color-scheme:dark}
*{box-sizing:border-box}html{background:var(--bg)}body{margin:0;background:var(--bg);color:var(--ink);font:400 15px/24px var(--sans);-webkit-font-smoothing:antialiased}
a{color:inherit}p{margin:0 0 14px}h1,h2,h3{font-weight:400;margin:0;text-wrap:balance}
.wrap{max-width:1080px;margin:0 auto;padding:0 40px}.wide .wrap{max-width:1320px}@media(max-width:768px){.wrap{padding:0 16px}}
.nav{display:flex;align-items:center;justify-content:space-between;min-height:76px;gap:16px}
.logo{display:inline-flex;align-items:center;gap:10px;text-decoration:none;font-size:16px}
.mark{width:22px;height:22px}
.btn{display:inline-flex;align-items:center;gap:8px;min-height:40px;padding:8px 18px;border-radius:999px;background:var(--ink);color:var(--bg);border:0;cursor:pointer;font:450 15px/24px var(--sans);text-decoration:none;white-space:nowrap}
.btn:hover{background:#fff5e2}.btn-ghost{background:transparent;color:var(--ink)}.btn-ghost:hover{background:#1a1816}.btn-sm{min-height:32px;padding:4px 14px;font-size:14px}
.eyebrow{font:500 12px/16px var(--mono);letter-spacing:.2em;text-transform:uppercase;color:var(--lamp)}
.muted{color:var(--muted)}
.sqs{display:flex;gap:6px;flex-wrap:wrap}.sqs i{width:26px;height:26px;border-radius:3px;display:inline-block}.l0{background:var(--sq0)}.l1{background:var(--sq1)}.l2{background:var(--sq2)}
.legal{max-width:720px;padding:24px 0 96px}.legal h1{font-size:40px;line-height:48px;letter-spacing:-.6px;margin:24px 0 8px}.legal h2{font-size:22px;line-height:30px;margin:40px 0 10px}
.legal p,.legal li{color:var(--ink2)}.legal ul{padding-left:20px;margin:0 0 14px}.legal li{margin:0 0 6px}
footer{border-top:1px solid var(--line);padding:32px 0 48px;color:var(--muted);font-size:14px}footer .wrap{display:flex;gap:24px;flex-wrap:wrap;justify-content:space-between}footer a{color:var(--muted);text-decoration:none;margin-right:18px}footer a:hover{color:var(--ink)}`;

const LOGO = `<svg class="mark" viewBox="0 0 22 22" aria-hidden="true"><rect x="4" y="2" width="14" height="19" rx="1" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="5.6" y="3.6" width="10.8" height="17.4" fill="#f0c27a" opacity=".85"/><rect x="5.6" y="3.6" width="5" height="17.4" fill="currentColor"/></svg>`;

export function layout(head, body, { nav = true, wide = false, footer = true } = {}) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@300..600&family=Geist+Mono:wght@400;500&display=swap">
${head}<style>${CSS}</style></head><body${wide ? ' class="wide"' : ''}>
${nav ? `<div class="wrap nav"><a class="logo" href="/">${LOGO}<span>${esc(cfg.siteName)}</span></a><span id="mrAccount"></span></div>` : ''}
${body}
${footer ? '' : '<!--'}<footer><div class="wrap"><span><a href="/#rooms">All the rooms</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a>${cfg.contactEmail ? `<a href="mailto:${esc(cfg.contactEmail)}">Contact</a>` : ''}</span><span>Horror mystery rooms.</span></div></footer>${footer ? '' : '-->'}
</body></html>`;
}

/* ---------- /r/<code>: someone's result ---------- */
export function resultPage(share) {
  const m = roomById(share.room);
  const marks = String(share.marks || '').split('').map(Number);
  const title = `Escaped ${m.title} in ${fmtTime(share.seconds)}`;
  const desc = `Mystery #${m.n} · ${m.place}, ${m.era}. ${m.tagline || ''}`;
  const head = headTags({ title: `${title} · ${cfg.siteName}`, description: desc, path: `/r/${share.code}`, image: `/og/r/${share.code}.jpg`, imageAlt: `${title}: ${m.title} on ${cfg.siteName}`, page: 'result', room: m.id, noindex: true });
  const body = `
<style>
.res{position:relative;min-height:calc(100dvh - 76px - 120px);display:flex;align-items:center;overflow:hidden;isolation:isolate}
.res .bg{position:absolute;inset:0;z-index:-1}.res .bg img{width:100%;height:100%;object-fit:cover;filter:brightness(.55)}
.res .bg::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(5,4,4,.95) 0,rgba(5,4,4,.75) 50%,rgba(5,4,4,.2) 100%),linear-gradient(0deg,rgba(11,10,9,1),transparent 30%)}
.res .in{padding:64px 0 80px;max-width:640px}
.res h1{font-size:clamp(40px,7vw,76px);line-height:1;letter-spacing:-1.2px;margin:18px 0 22px}
.res .meta{color:var(--ink2);font-size:17px;margin:20px 0 6px}.res .place{color:var(--muted);font-size:13px;letter-spacing:.08em;text-transform:uppercase}
.res .hook{color:var(--ink2);font-size:16px;line-height:26px;margin:28px 0 32px;max-width:560px}
.res .actions{display:flex;gap:12px;flex-wrap:wrap}
</style>
<section class="res"><div class="bg"><img src="/art/${esc(m.id)}.jpg" alt=""></div>
<div class="wrap"><div class="in">
  <p class="eyebrow">Mystery #${m.n} &middot; ${esc(m.title)}</p>
  <h1>Escaped in ${fmtTime(share.seconds)}</h1>
  <div class="sqs" aria-label="${marks.length} puzzles">${marks.map(l => `<i class="l${l}"></i>`).join('')}</div>
  <p class="meta">${share.hints} hint${share.hints === 1 ? '' : 's'} &middot; ${esc(wrongWords(m, share.wrong))}</p>
  <p class="place">${esc(m.place)} &middot; ${esc(m.era)}</p>
  <p class="hook">${esc(m.hook)}</p>
  <div class="actions"><a class="btn" href="/play/${esc(m.id)}?s=${esc(share.code)}">Can you get out? Go in</a><a class="btn btn-ghost" href="/#rooms">All the rooms</a></div>
</div></div></section>`;
  return layout(head, body);
}

/* ---------- legal ---------- */
export function privacyPage() {
  const who = cfg.contactEmail ? `<a href="mailto:${esc(cfg.contactEmail)}">${esc(cfg.contactEmail)}</a>` : 'the contact address on this site';
  const head = headTags({ title: `Privacy · ${cfg.siteName}`, description: `How ${cfg.siteName} uses your data.`, path: '/privacy', page: 'legal' });
  return layout(head, `<div class="wrap"><article class="legal">
<p class="eyebrow">Privacy</p><h1>What we keep, and why</h1>
<p class="muted">Last updated 8 October 2026.</p>
<p>${esc(cfg.siteName)} is a set of horror mystery rooms. We collect as little as we can, we never sell it, and there are no ads.</p>
<h2>What we keep</h2>
<ul>
<li>You sign in with Google to play. Google tells us your name, email address and profile picture. We don't get access to your Gmail, Drive, contacts or anything else, and we don't keep Google's access tokens.</li>
<li>While you play we record what happens in each room: when you start, which puzzles you finish, hints you take, wrong guesses, your time, and whether you escaped. This is linked to your account.</li>
<li>We keep your first escape from each room (time, squares, hints and wrong guesses) so it appears on every device you sign in on, plus your share links and how many people opened them, and the date you confirmed you're 18 or older.</li>
<li>We record your type of device (phone or computer, and its browser) and your country. We don't store your IP address.</li>
<li>Your browser gets a random ID so we can count visits before you sign in. Once you sign in on that browser, it's linked to your account.</li>
<li>We count page visits and which site a visitor came from ourselves. There are no third-party trackers or advertising cookies.</li>
<li>When you share a room, a result or the site, your link carries a short code and the app you chose (WhatsApp, email and so on), so we can count how many people opened it and went on to play. If you arrived through someone's link, we note that link against your browser's random ID.</li>
<li>We set one cookie to keep you signed in. It's needed for signing in to work.</li>
</ul>
<h2>Feedback</h2>
<p>If you send feedback, we keep what you wrote with the room and puzzle you were on.</p>
<h2>Why we use it</h2>
<p>To run the game, keep your results across devices, make share links work, and see which rooms are too hard, too easy or broken so we can fix them. Nothing is used for advertising.</p>
<h2>Where it's kept, and for how long</h2>
<ul>
<li>The site runs on Vercel and the database on Neon (Postgres). Database backups are encrypted and kept for 30 days.</li>
<li>Play-by-play records are kept for 13 months, then reduced to daily totals with nothing that identifies anyone.</li>
<li>Account data is kept until you delete your account.</li>
</ul>
<h2>Your choices</h2>
<ul>
<li>Signed in, the account menu (top right) lets you delete your account. Deleting removes your account, results, share links and feedback, and unlinks your past plays from you.</li>
<li>To get a copy of your data, ask anything about it, or complain, write to ${who}. We reply within 7 days.</li>
</ul>
<h2>Age</h2>
<p>These rooms contain frightening scenes and are meant for adults. Accounts are only for people aged 18 or over.</p>
<h2>Changes</h2>
<p>If this policy changes in a way that matters, we'll say so on the front page before the change takes effect.</p>
</article></div>`);
}

export function termsPage() {
  const head = headTags({ title: `Terms · ${cfg.siteName}`, description: `The terms for playing ${cfg.siteName}.`, path: '/terms', page: 'legal' });
  return layout(head, `<div class="wrap"><article class="legal">
<p class="eyebrow">Terms</p><h1>Playing ${esc(cfg.siteName)}</h1>
<p class="muted">Last updated 8 October 2026.</p>
<h2>The game</h2>
<p>The rooms are free to play. We may add, change or retire rooms at any time. We try to keep the site running but can't promise it will always be available, or that your progress will never be lost.</p>
<h2>Content</h2>
<p>The rooms contain horror: sudden scares, frightening images and sounds, and themes of death. They are made for adults. Accounts are only for people aged 18 or over.</p>
<h2>Fair use</h2>
<p>Please don't try to break, overload or copy the site, or use it to harm others. We may remove accounts or share links that do.</p>
<h2>Your account</h2>
<p>Sign-in is through Google. You can delete your account at any time from the account menu. The <a href="/privacy">privacy page</a> explains what we keep.</p>
<h2>Ownership</h2>
<p>The rooms, their stories, art, sound and code belong to their makers. Sharing your results and links to the site is welcome.</p>
<h2>Liability</h2>
<p>The site is provided as it is. To the extent the law allows, we aren't liable for losses from using it.</p>
</article></div>`);
}

/* ---------- staging: only admin emails get past this ---------- */
export function gatePage(signedInAs) {
  const head = headTags({ title: `Staging · ${cfg.siteName}`, description: 'Staging site', path: '/', page: 'gate', noindex: true });
  return layout(head, `<div class="wrap"><article class="legal"><p class="eyebrow">Staging</p><h1>This is the staging site</h1>
<p>${signedInAs ? `You're signed in as ${esc(signedInAs)}, which isn't on the list of people allowed in.` : 'It is only open to the people who run the rooms. Sign in with an allowed Google account to go in.'}</p>
<p><button class="btn" type="button" onclick="MR.signInDialog('nav')">Sign in with Google</button></p></article></div>`);
}

export function notFoundPage() {
  const head = headTags({ title: `Not found · ${cfg.siteName}`, description: 'This door leads nowhere.', path: '/', page: 'site', noindex: true });
  return layout(head, `<div class="wrap"><article class="legal"><p class="eyebrow">404</p><h1>This door leads nowhere.</h1><p><a class="btn" href="/">Back to the corridor</a></p></article></div>`);
}
