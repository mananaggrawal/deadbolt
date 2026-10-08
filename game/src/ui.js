/* =====================================================================
   ENGINE UI — locks, documents, containers, item cards (shared by rooms)
   ===================================================================== */
/* ---------- lock UI ---------- */
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function openLock(cfg) {
  const set = cfg.letters ? ALPHA : '0123456789';
  const vals = (S.locks[cfg.id] || Array(cfg.n).fill(0)).slice(0, cfg.n);
  let cur = 0;
  const wheelHtml = i => { const v = vals[i], L = set.length; return `<div class="wheel ${cfg.brass ? 'brass' : ''}" data-i="${i}"><button data-up="${i}" aria-label="Wheel ${i + 1} up">&#9650;</button><div class="face" data-f="${i}"><span>${set[(v + L - 1) % L]}</span><span class="c">${set[v]}</span><span>${set[(v + 1) % L]}</span></div><button data-dn="${i}" aria-label="Wheel ${i + 1} down">&#9660;</button></div>`; };
  const render = (msg = '', bad = false) => {
    $('#card').querySelector('.wheels').innerHTML = vals.map((_, i) => wheelHtml(i)).join('');
    const m = $('#lmsg'); m.textContent = msg; m.className = 'lockmsg' + (bad ? ' bad' : '');
    $('#card').querySelectorAll('.wheel').forEach((w, i) => w.style.outline = i === cur ? '1px solid rgba(231,222,198,.5)' : 'none');
    bind();
  };
  const spin = (i, d) => { vals[i] = (vals[i] + d + set.length) % set.length; cur = i; S.locks[cfg.id] = vals.slice(); sClick(null, 0.25, 3200); render(); };
  const bind = () => {
    $('#card').querySelectorAll('[data-up]').forEach(b => b.onclick = () => spin(+b.dataset.up, 1));
    $('#card').querySelectorAll('[data-dn]').forEach(b => b.onclick = () => spin(+b.dataset.dn, -1));
    $('#card').querySelectorAll('[data-f]').forEach(f => { f.onwheel = e => { e.preventDefault(); spin(+f.dataset.f, e.deltaY > 0 ? 1 : -1); }; f.onclick = e => { const r = f.getBoundingClientRect(); spin(+f.dataset.f, e.clientY < r.top + r.height / 2 ? -1 : 1); }; });
  };
  const tryIt = () => {
    if (G.time < (G.lockout || 0)) { render('Your hands are shaking too much. Give it a few seconds.', true); return; }
    const code = vals.map(v => set[v]).join('');
    if (cfg.answer === code) { sThunk(cfg.pos, 0.9, 220); sClick(cfg.pos, 0.6, 1800); UI.close(); cfg.onOpen(); }
    else { S.wrong++; save(); sThunk(cfg.pos, 0.6, 120); render(cfg.failMsg || 'It doesn\'t give.', true); setTimeout(() => { if (UI.kind === 'lock') { UI.close(true); ROOM.penalty && ROOM.penalty(); } }, 700); }
  };
  UI.show('lock', `<button class="x">Close &middot; Esc</button><h2>${esc(cfg.title)}</h2><p class="sub">${cfg.sub}</p>
    <div class="lock"><div class="wheels"></div><div id="lmsg" class="lockmsg"></div><button class="btn primary" id="ltry">${esc(cfg.btn)}</button>
    <p class="muted" style="font-size:11px;margin:0">${G.touch ? 'Tap the top or bottom of a wheel to turn it' : 'Click or scroll the wheels &middot; arrow keys work too &middot; <kbd>Enter</kbd> to try'}</p></div>`,
    { onKey: e => {
      if (e.code === 'ArrowLeft') { cur = (cur + cfg.n - 1) % cfg.n; render(); }
      else if (e.code === 'ArrowRight') { cur = (cur + 1) % cfg.n; render(); }
      else if (e.code === 'ArrowUp') { e.preventDefault(); spin(cur, -1); }
      else if (e.code === 'ArrowDown') { e.preventDefault(); spin(cur, 1); }
      else if (e.code === 'Enter') { if (document.activeElement && document.activeElement.tagName === 'BUTTON') return; e.preventDefault(); tryIt(); }
      else if (e.key && e.key.length === 1) { const k = e.key.toUpperCase(); const ix = set.indexOf(k); if (ix >= 0) { vals[cur] = ix; S.locks[cfg.id] = vals.slice(); sClick(null, 0.25, 3200); cur = Math.min(cfg.n - 1, cur + 1); render(); } }
    } });
  $('#ltry').onclick = tryIt; render();
}

/* ---------- documents & containers ---------- */
function openDoc(id, back) {
  const d = ROOM.DOCS[id]; if (!d) return;
  if (!S.docs.includes(id)) { S.docs.push(id); save(); }
  d.onRead && d.onRead();
  const pages = typeof d.pages === 'function' ? d.pages() : d.pages;
  let i = 0;
  const cls = d.style === 'photo' ? 'ui-card photo' : `paper ${d.style}`;
  const draw = () => {
    UI.show('doc', `<button class="x">${back ? 'Back' : 'Close'} &middot; Esc</button><p class="doc-title">${esc(d.title)}</p><div class="page">${pages[i]}</div>
      ${pages.length > 1 ? `<div class="pager"><button id="pgP" ${i === 0 ? 'disabled' : ''}>&larr; Prev</button><span>${i + 1} / ${pages.length}</span><button id="pgN" ${i === pages.length - 1 ? 'disabled' : ''}>Next &rarr;</button></div>` : ''}`,
      { cls, closeOnE: true, onClose: back === 'notebook' ? () => { if (G.mode === 'play') openNotebook(); } : null,
        onKey: e => { if (e.code === 'ArrowRight' && i < pages.length - 1) { i++; draw(); } else if (e.code === 'ArrowLeft' && i > 0) { i--; draw(); } } });
    if ($('#pgP')) { $('#pgP').onclick = () => { i--; draw(); }; $('#pgN').onclick = () => { i++; draw(); }; }
    d.bind && d.bind($('#card'));
    sClick(null, 0.18, 5000);
  };
  draw();
}
function openContainer(title, sub, entries) {
  const draw = () => {
    UI.show('box', `<button class="x">Close &middot; Esc</button><h2>${esc(title)}</h2><p class="sub">${sub}</p><div class="list">${entries.map((e, k) => {
      const done = e.take && has(e.take);
      return `<div class="it"><div><div class="nm">${esc(e.name)}</div><div class="ds">${e.desc}</div></div>${e.take ? (done ? '<span class="done">Taken</span>' : `<button class="btn" data-k="${k}">Take</button>`) : (e.read || e.item) ? `<button class="btn" data-k="${k}">${e.verb || (e.item ? 'Look' : 'Read')}</button>` : ''}</div>`;
    }).join('')}</div>`, { closeOnE: true });
    $('#card').querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
      const e = entries[+b.dataset.k];
      if (e.take) { give(e.take); e.onTake && e.onTake(); draw(); }
      else if (e.read) openDoc(e.read);
      else if (e.item) inspectItem(e.item);
    });
  };
  draw();
}
function inspectItem(id, back) {
  const it = ROOM.ITEMS[id]; if (!it) return;
  if (it.doc) { openDoc(it.doc, back); return; }
  UI.show('item', `<button class="x">${back ? 'Back' : 'Close'} &middot; Esc</button><h2>${esc(it.name)}</h2><p style="font-size:14px;line-height:1.65;margin:0">${it.desc}</p>`,
    { closeOnE: true, onClose: back === 'notebook' ? () => { if (G.mode === 'play') openNotebook(); } : null });
}



