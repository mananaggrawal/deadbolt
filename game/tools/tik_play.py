#!/usr/bin/env python3
"""Tik-Tik: the tik-tik call has to keep coming. Every call is counted where it is made (the oscillator
is set to 3100 Hz, a pitch only the tik-tik uses), and the game is stepped by hand. Scenarios:

  caught   she spots you in the open yard, goes quiet, dives and takes you; you come round in the sala
           and the tik-tik is back within a few seconds, and keeps coming
  cover    she dives, you get under the house in time; she pulls up and the tik-tik comes back
  resume   leaving mid-dive and continuing (the room's state is rebuilt in the same page) brings it back
  quiet    while she is diving at you there is no tik-tik at all (she goes silent when she comes)
  first    the first time you step outside, the "Listen. Tik-tik..." note comes with a tik-tik to hear

    python3 game/build.py dev                       (game/dist/dev.html keeps the __lethe handle)
    cd site && npm ci                               (for node_modules/three)
    python3 game/tools/tik_play.py [scenario ...]   (from the repo root; no scenario runs them all)

Each scenario forces her call timer to run out the moment she starts her dive (the case that used to
silence her for minutes), so the result doesn't depend on luck. Needs playwright with Chromium.
"""
import sys, os, time, threading, http.server, functools
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
DIST = os.environ.get('DIST', os.path.join(ROOT, 'game', 'dist'))
PAGE = os.environ.get('PAGE', 'dev.html')
THREE_JS = os.path.join(ROOT, 'site', 'node_modules', 'three', 'build', 'three.module.js')
WANT = set(sys.argv[1:])
ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog',
        '--disable-hang-monitor', '--autoplay-policy=no-user-gesture-required']
INIT = """(() => {
  let locked = null;
  Object.defineProperty(Document.prototype, 'pointerLockElement', { get() { return locked; }, configurable: true });
  HTMLCanvasElement.prototype.requestPointerLock = function () { locked = this; setTimeout(() => document.dispatchEvent(new Event('pointerlockchange'))); return Promise.resolve(); };
  Document.prototype.exitPointerLock = function () { if (locked) { locked = null; setTimeout(() => document.dispatchEvent(new Event('pointerlockchange'))); } };
  // count every tik-tik: its first click is the only thing in the game set to 3100 Hz
  window.__tiks = [];
  const sv = AudioParam.prototype.setValueAtTime;
  AudioParam.prototype.setValueAtTime = function (v, t) { if (v === 3100) { const L = window.__lethe; window.__tiks.push(L && L.G ? +L.G.time.toFixed(2) : -1); } return sv.call(this, v, t); };
})();"""
HELP = r"""
window.T = (() => {
  const L = __lethe, R = () => L.ROOM, D = () => L.ROOM.debug, G = L.G;
  const step = (sec, dt = 0.05) => { const n = Math.round(sec / dt); for (let i = 0; i < n; i++) L.update(dt); };
  const V = () => D().V, H = () => D().V.h;
  const tiks = () => window.__tiks.length;
  // let her hunt you until she starts her dive (or give up); her call timer runs out right then
  const untilDive = (max = 40) => { let t = 0; while (t < max && !['alert', 'dive'].includes(H().state)) { step(0.1); t += 0.1; } if (['alert', 'dive'].includes(H().state)) { H().tikT = 0.2; return true; } return false; };
  const until = (fn, max = 20) => { let t = 0; while (t < max && !fn()) { step(0.1); t += 0.1; } return fn(); };
  return { L, R, D, G, V, H, step, tiks, untilDive, until, get S() { return L.S; } };
})();
"""

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=DIST))
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = f'http://127.0.0.1:{srv.server_address[1]}'

fails = []
def check(ok, what):
    print(('ok   ' if ok else 'FAIL ') + what); sys.stdout.flush()
    if not ok: fails.append(what)

# the visitor has been, you've seen what she is, you've been outside once: the hunt is on
FLAGS = dict(woke=True, gotMatches=True, lit=True, visitor=True, peeked=True, manaKnown=True, hunted=True)
YARD = dict(x=3.0, y=0.0, z=8.0, yaw=3.14, pitch=0)   # the open yard, between the house and the gate

def open_room(p, save):
    ctx = p.chromium.launch(args=ARGS).new_context(viewport={'width': 640, 'height': 360})
    ctx.add_init_script(INIT)
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('https://cdn.jsdelivr.net/**', lambda r: r.fulfill(path=THREE_JS, content_type='text/javascript'))
    pg.route('https://fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
    pg.route('https://fonts.gstatic.com/**', lambda r: r.abort())
    pg.goto(BASE + '/' + PAGE)
    pg.wait_for_function('() => typeof __lethe === "object" && __lethe.ROOMS && __lethe.ROOMS.tik', timeout=120000)
    pg.evaluate("() => { try { localStorage.setItem('mr.age', '1'); } catch (e) {} }")
    pg.evaluate("(s) => { const d = __lethe.ROOMS.tik.defaults(); const S = Object.assign(d, s, { flags: Object.assign({}, s.flags) }); localStorage.setItem(__lethe.ROOMS.tik.saveKey, JSON.stringify(S)); }", save)
    pg.evaluate("() => __lethe.enterMystery('tik')")
    t0 = time.time()
    while time.time() - t0 < 400:
        if pg.evaluate("() => { const c = document.querySelector('#bCont'); return !!(c && !c.hidden && !c.disabled); }"): break
        pg.wait_for_timeout(1000)
    pg.click('#bCont'); pg.wait_for_timeout(1500)
    pg.evaluate(HELP)
    pg.evaluate("() => T.step(0.5)")
    return ctx, pg, errs

def E(pg, js, arg=None):
    return pg.evaluate(js, arg) if arg is not None else pg.evaluate(js)

def hunted(pg):
    """lamp turned up, standing in the open, and she is circling close by"""
    return E(pg, "() => { T.S.lamp = 2; T.D().hSet('circle', 999); T.H().pos.set(3, 8, 1); T.H().vel.set(0, 0, 0); T.H().meter = 0; return T.untilDive(); }")

def scen_caught(p):
    ctx, pg, errs = open_room(p, dict(flags=FLAGS, player=YARD, lamp=2))
    check(E(pg, "() => T.L.A ? T.L.A.ready !== false : true"), 'audio is running')
    n0 = E(pg, "() => T.tiks()"); E(pg, "() => T.step(12)"); n1 = E(pg, "() => T.tiks()")
    check(n1 - n0 >= 2, f'the tik-tik comes while she circles ({n1 - n0} in 12 s)')
    check(hunted(pg), 'she spots you in the open and starts her dive')
    n0 = E(pg, "() => T.tiks()")
    got = E(pg, "() => T.until(() => !!T.V().catching, 15)")
    check(got, 'she takes you')
    back = E(pg, "() => T.until(() => !T.V().catching, 10)")
    n1 = E(pg, "() => T.tiks()")
    check(back and E(pg, "() => T.D().insideHouse()"), 'you come round in the sala')
    check(n1 == n0, f'no tik-tik while she dives at you and carries you off ({n1 - n0})')
    t0 = E(pg, "() => T.G.time")
    E(pg, "() => T.step(40)")
    calls = E(pg, "(t0) => window.__tiks.filter(t => t > t0)", t0)
    first = (calls[0] - t0) if calls else None
    check(len(calls) >= 6, f'after you come round the tik-tik keeps coming ({len(calls)} in 40 s; she is "{E(pg, "() => T.H().state")}")')
    check(first is not None and first < 7, f'the first one comes within a few seconds ({first if first is None else round(first, 1)} s)')
    check(not errs, f'no script errors {errs[:2]}')
    ctx.close()

def scen_cover(p):
    ctx, pg, errs = open_room(p, dict(flags=FLAGS, player=dict(YARD, x=4.6, z=4.0), lamp=2))
    check(hunted(pg), 'she spots you and starts her dive')
    E(pg, "() => T.until(() => T.H().state === 'dive', 5)")
    # crawl under the house before she reaches you
    E(pg, "() => { const B = T.D().BODY, G = T.G; T.L.bodyPlace ? T.L.bodyPlace(3.0, 0, 1.5, 0, true) : null; if (!T.L.bodyPlace) { T.L.P.x = 3.0; T.L.P.z = 1.5; B.y = B.ys = 0; B.crouch = true; G.crouch = true; } T.step(0.2); }")
    under = E(pg, "() => T.D().underHouse()")
    pulled = E(pg, "() => T.until(() => T.H().state === 'pull' || !!T.V().catching, 8)")
    check(under and pulled and not E(pg, "() => !!T.V().catching"), f'under the house in time, she pulls up (state {E(pg, "() => T.H().state")})')
    t0 = E(pg, "() => T.G.time"); E(pg, "() => T.step(30)")
    calls = E(pg, "(t0) => window.__tiks.filter(t => t > t0)", t0)
    check(len(calls) >= 4, f'the tik-tik comes back after she pulls up ({len(calls)} in 30 s)')
    check(not errs, f'no script errors {errs[:2]}')
    ctx.close()

def scen_resume(p):
    ctx, pg, errs = open_room(p, dict(flags=FLAGS, player=YARD, lamp=2))
    check(hunted(pg), 'she spots you and starts her dive')
    E(pg, "() => T.step(0.6)")
    # back to the corridor mid-dive and Continue: the room's state is rebuilt in the same page
    E(pg, "() => { T.R().applyState(); T.step(0.2); }")
    t0 = E(pg, "() => T.G.time"); E(pg, "() => T.step(30)")
    calls = E(pg, "(t0) => window.__tiks.filter(t => t > t0)", t0)
    check(len(calls) >= 4, f'continuing after leaving mid-dive, the tik-tik comes ({len(calls)} in 30 s)')
    check(not errs, f'no script errors {errs[:2]}')
    ctx.close()

def scen_quiet(p):
    ctx, pg, errs = open_room(p, dict(flags=FLAGS, player=YARD, lamp=2))
    check(hunted(pg), 'she spots you and starts her dive')
    n0 = E(pg, "() => T.tiks()")
    # stay out of reach long enough to hear her whole dive, without being taken
    E(pg, "() => { let t = 0; while (t < 6 && ['alert', 'dive'].includes(T.H().state)) { const h = T.H(); if (h.state === 'dive' && h.pos.distanceTo(T.L.camera.position) < 3) h.pos.y += 4; T.step(0.1); t += 0.1; } }")
    n1 = E(pg, "() => T.tiks()")
    check(n1 == n0, f'silent while she comes for you ({n1 - n0} calls)')
    check(not errs, f'no script errors {errs[:2]}')
    ctx.close()

def scen_first(p):
    fl = dict(FLAGS); del fl['hunted']
    ctx, pg, errs = open_room(p, dict(flags=fl, player=dict(YARD, x=-2.6, y=1.45, z=2.1), lamp=2))   # in the sala
    E(pg, "() => { T.H().tikT = 5; T.step(0.3); }")
    E(pg, "() => { T.L.bodyPlace(3.0, 0, 8.0, 3.14, false); T.step(0.1); }")
    check(E(pg, "() => !!T.S.flags.hunted"), 'stepping outside gives the "Listen" note')
    t0 = E(pg, "() => T.G.time"); E(pg, "() => T.step(1.5)")
    calls = E(pg, "(t0) => window.__tiks.filter(t => t >= t0 - 0.11)", t0)
    check(len(calls) >= 1, f'a tik-tik comes with it ({len(calls)} within 1.5 s)')
    check(not errs, f'no script errors {errs[:2]}')
    ctx.close()

SCEN = dict(caught=scen_caught, cover=scen_cover, resume=scen_resume, quiet=scen_quiet, first=scen_first)
with sync_playwright() as p:
    for name, fn in SCEN.items():
        if WANT and name not in WANT: continue
        print(f'--- {name}'); sys.stdout.flush()
        try: fn(p)
        except Exception as e: check(False, f'{name}: {e}')
print(f'\n{len(fails)} failed' if fails else '\nall passed')
sys.exit(1 if fails else 0)
