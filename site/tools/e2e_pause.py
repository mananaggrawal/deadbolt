#!/usr/bin/env python3
"""Pausing stops everything: Tik-Tik's opening lines (wake1, wake2, a 1.5 s wait, matches) must hold
while the pause menu is open, also through Hints and the Notebook opened from it and a hidden tab, and
carry on in order after Resume.

    MR_KEEP_DEBUG=1 python3 game/build.py site     (keeps the window.__lethe test handle; never deploy it)
    REQUIRE_LOGIN=false npm start                  (from site/, after node tools/prepare.mjs)
    python3 tools/e2e_pause.py http://localhost:3000

Needs: pip install playwright && python3 -m playwright install chromium
"""
import sys, time
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:3100'
ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog',
        '--disable-hang-monitor', '--autoplay-policy=no-user-gesture-required']
LOCK_STUB = """(() => {
  let locked = null;
  Object.defineProperty(Document.prototype, 'pointerLockElement', { get() { return locked; }, configurable: true });
  HTMLCanvasElement.prototype.requestPointerLock = function () { locked = this; setTimeout(() => document.dispatchEvent(new Event('pointerlockchange'))); return Promise.resolve(); };
  Document.prototype.exitPointerLock = function () { if (locked) { locked = null; setTimeout(() => document.dispatchEvent(new Event('pointerlockchange'))); } };
  addEventListener('keydown', e => { if (e.key === 'Escape' && locked) { locked = null; document.dispatchEvent(new Event('pointerlockchange')); e.stopImmediatePropagation(); } }, true);
  let vis = 'visible';
  Object.defineProperty(Document.prototype, 'visibilityState', { get() { return vis; }, configurable: true });
  Object.defineProperty(Document.prototype, 'hidden', { get() { return vis === 'hidden'; }, configurable: true });
  window.__setVis = v => { vis = v; document.dispatchEvent(new Event('visibilitychange')); };
})();"""
fails = []
def check(ok, what):
    print(('ok   ' if ok else 'FAIL ') + what); sys.stdout.flush()
    if not ok: fails.append(what)

subs = lambda pg: pg.inner_text('#subs')
st = lambda pg: pg.evaluate('__lethe.A.ctx && __lethe.A.ctx.state')
ct = lambda pg: pg.evaluate('__lethe.A.ctx.currentTime')

with sync_playwright() as p:
    b = p.chromium.launch(args=ARGS)
    ctx = b.new_context(viewport={'width': 1280, 'height': 800})
    ctx.add_init_script(LOCK_STUB)
    pg = ctx.new_page(); logs = []
    pg.on('pageerror', lambda e: logs.append(f'pageerror: {e}'))
    pg.route('https://fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
    pg.route('https://fonts.gstatic.com/**', lambda r: r.abort())
    pg.goto(BASE + '/play/tik'); pg.wait_for_selector('#title:not([hidden])', timeout=60000)
    t0 = time.time()
    while pg.is_disabled('#bNew') and time.time() - t0 < 240: pg.wait_for_timeout(1000)
    pg.click('#bNew'); pg.wait_for_timeout(1500)
    check(pg.evaluate('typeof __lethe') == 'object', 'debug handle present')
    # voices decode in the background: wait for the clips, then run the opening's game clock quickly
    pg.wait_for_function("() => __lethe.A.ready", timeout=60000, polling=200); pg.wait_for_timeout(8000)
    pg.evaluate("() => { for (let i = 0; i < 100 && !/awake/.test(document.querySelector('#subs').innerText); i++) __lethe.update(0.05); }")
    pg.wait_for_function("() => /awake/.test(document.querySelector('#subs').innerText)", timeout=30000, polling=200)
    check(st(pg) == 'running', f'sound running before pause ({st(pg)})')
    pg.wait_for_timeout(600)

    # ---- Esc pauses: sound suspended, the line holds, the next one doesn't start ----
    pg.keyboard.press('Escape'); pg.wait_for_timeout(500)
    check(pg.locator('#card h2', has_text='Paused').count() == 1, 'Esc opens the pause menu')
    check(pg.evaluate('__lethe.G.paused === true && __lethe.PZ.on === true'), 'game paused and real-time waits frozen')
    check(st(pg) == 'suspended', f'audio suspended while paused ({st(pg)})')
    c1 = ct(pg); line0 = subs(pg); pg.wait_for_timeout(12000); c2 = ct(pg)
    check(abs(c2 - c1) < 0.01, f'audio clock stands still while paused ({c1:.2f} -> {c2:.2f})')
    check(subs(pg) == line0 and 'awake' in subs(pg), f'12 s later the same line is held, the next hasn\'t started ({subs(pg)!r})')
    gt = pg.evaluate('__lethe.G.time'); pg.wait_for_timeout(1500)
    check(abs(pg.evaluate('__lethe.G.time') - gt) < 1e-6, 'game time stands still')

    # ---- hints and the notebook from the pause menu stay paused and come back to it ----
    pg.click('#pHint'); pg.wait_for_timeout(400)
    check(pg.locator('#card h2', has_text='Hints').count() == 1 and pg.evaluate('__lethe.G.paused') and st(pg) == 'suspended', 'Hints from the pause menu: still paused and silent')
    pg.keyboard.press('KeyH'); pg.wait_for_timeout(400)
    check(pg.locator('#card h2', has_text='Paused').count() == 1, 'closing Hints (H) goes back to the pause menu')
    pg.click('#pNb'); pg.wait_for_timeout(400)
    check(pg.locator('#card h2', has_text='Notebook').count() == 1 and st(pg) == 'suspended', 'Notebook from the pause menu: still silent')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(400)
    check(pg.locator('#card h2', has_text='Paused').count() == 1 and pg.evaluate('__lethe.G.paused'), 'closing the Notebook (Esc) goes back to the pause menu')

    # ---- leaving the tab and coming back doesn't wake the sound under the pause menu ----
    pg.evaluate("__setVis('hidden')"); pg.wait_for_timeout(300); pg.evaluate("__setVis('visible')"); pg.wait_for_timeout(500)
    check(st(pg) == 'suspended' and pg.evaluate('__lethe.PZ.on'), f'tab hidden and shown again while paused: still silent ({st(pg)})')
    check(subs(pg) == line0, 'still the same line')

    # ---- Resume: sound comes back and the narration carries on in order ----
    pg.click('#pRes'); pg.wait_for_timeout(600)
    check(not pg.evaluate('__lethe.G.paused') and not pg.evaluate('__lethe.PZ.on'), 'Resume unpauses')
    check(st(pg) == 'running', f'audio running again ({st(pg)})')
    c3 = ct(pg); pg.wait_for_timeout(1000)
    check(ct(pg) > c3 + 0.3, 'audio clock moving again')
    try: pg.wait_for_function("() => /Nanay still/.test(document.querySelector('#subs').innerText)", timeout=20000, polling=200); ok = True
    except Exception: ok = False
    check(ok, f'the next line plays after resuming ({subs(pg)!r})')
    # pause during the 1.5 s gap and the line after it: the gap waits too
    try: pg.wait_for_function("() => !/Nanay still/.test(document.querySelector('#subs').innerText)", timeout=20000, polling=200)
    except Exception: pass
    pg.evaluate('__lethe.openPause()'); pg.wait_for_timeout(5000)
    check('matches' not in subs(pg).lower(), f'paused in the gap: the following line waits ({subs(pg)!r})')
    pg.evaluate('__lethe.UI.close()')
    try: pg.wait_for_function("() => /matches are on top/.test(document.querySelector('#subs').innerText)", timeout=20000, polling=200); ok = True
    except Exception: ok = False
    check(ok, 'after resuming, the following line plays')

    # ---- a pause and resume in the same instant leaves the sound on ----
    pg.evaluate('() => { __lethe.openPause(); __lethe.UI.close(); }'); pg.wait_for_timeout(800)
    check(st(pg) == 'running', f'instant pause+resume: sound still on ({st(pg)})')
    pg.evaluate('() => { __lethe.openPause(); }'); pg.wait_for_timeout(5); pg.evaluate('() => __lethe.UI.close()'); pg.wait_for_timeout(800)
    check(st(pg) == 'running', f'pause then resume 5 ms later: sound still on ({st(pg)})')

    check(not logs, f'no script errors {logs[:3]}')
    b.close()
print(f'\n{len(fails)} failed' if fails else '\nall passed'); sys.exit(1 if fails else 0)
