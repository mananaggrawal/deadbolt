#!/usr/bin/env python3
"""Every action on a thing has its own key: E, R, T (then Y, U). Before, the prompt showed R for the second action
and every one after it, and R only ever did the second, so a third action (Night Mail's "Push it forward to SLIP",
"Read the note" on the gangway door) showed the same letter as another and couldn't be reached. Phones showed only
the first two buttons. Scenarios:

  night    Night Mail on a computer: the slip gear (pull back, read the plate, push forward) and the gangway door
           (try, knock, read the note) show E, R, T, and each key does its own action
  phone    the same slip gear on a phone: three buttons, the third one does its own action
  crowd    a thing with three actions while holding something with the lamp lit in Tik-Tik (four room buttons on
           the right): at 844x390, 812x375 and 740x360 the action buttons don't overlap the room's buttons

    python3 game/build.py dev                          (game/dist/dev.html keeps the __lethe handle)
    cd site && npm ci                                  (for node_modules/three)
    python3 game/tools/action_keys.py [scenario ...]   (from the repo root; no scenario runs them all)
"""
import sys, os, time, threading, http.server, functools
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
DIST = os.environ.get('DIST', os.path.join(ROOT, 'game', 'dist'))
THREE_JS = os.path.join(ROOT, 'site', 'node_modules', 'three', 'build', 'three.module.js')
WANT = set(sys.argv[1:])
ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog',
        '--disable-hang-monitor', '--autoplay-policy=no-user-gesture-required']
LOCK_STUB = """(() => {
  let locked = null;
  Object.defineProperty(Document.prototype, 'pointerLockElement', { get() { return locked; }, configurable: true });
  HTMLCanvasElement.prototype.requestPointerLock = function () { locked = this; setTimeout(() => document.dispatchEvent(new Event('pointerlockchange'))); return Promise.resolve(); };
  Document.prototype.exitPointerLock = function () { if (locked) { locked = null; setTimeout(() => document.dispatchEvent(new Event('pointerlockchange'))); } };
})();"""
# aim at a thing (by its id) and press a key, in one go so the render loop can't move the aim in between
HELP = r"""
window.K = (() => {
  const L = __lethe, G = L.G;
  const hover = id => { G.hover = L.INTER.get(id); L.updatePrompt(true); };
  const prompt = id => { hover(id); return Array.from(document.querySelectorAll('#prompt .act')).map(e => [e.querySelector('kbd').textContent, e.textContent.replace(e.querySelector('kbd').textContent, '')]); };
  const press = (id, code) => { hover(id); dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true })); dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true })); };
  const subs = () => (document.querySelector('#subs') || {}).innerText || '';
  const card = () => L.UI.kind ? (document.querySelector('#card') || {}).innerText || '' : '';
  const clear = () => { if (L.UI.kind) L.UI.close(true); const s = document.querySelector('#subs'); if (s) s.innerHTML = ''; };
  return { L, G, hover, prompt, press, subs, card, clear };
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

def open_room(p, room, save, viewport=(640, 360), touch=False):
    b = p.chromium.launch(args=ARGS)
    ctx = b.new_context(viewport={'width': viewport[0], 'height': viewport[1]}, has_touch=touch, is_mobile=touch)
    ctx.add_init_script(LOCK_STUB)
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('https://cdn.jsdelivr.net/**', lambda r: r.fulfill(path=THREE_JS, content_type='text/javascript'))
    pg.route('https://fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
    pg.route('https://fonts.gstatic.com/**', lambda r: r.abort())
    pg.goto(BASE + '/dev.html')
    pg.wait_for_function(f'() => typeof __lethe === "object" && __lethe.ROOMS && __lethe.ROOMS.{room}', timeout=120000)
    pg.evaluate("() => { try { localStorage.setItem('mr.age', '1'); } catch (e) {} }")
    pg.evaluate("([r, s]) => { const R = __lethe.ROOMS[r], d = R.defaults(); const S = Object.assign(d, s, { flags: Object.assign({}, s.flags) }); localStorage.setItem(R.saveKey, JSON.stringify(S)); }", [room, save])
    pg.evaluate(f"() => __lethe.enterMystery('{room}')")
    t0 = time.time()
    while time.time() - t0 < 400:
        if pg.evaluate("() => { const c = document.querySelector('#bCont'); return !!(c && !c.hidden && !c.disabled); }"): break
        pg.wait_for_timeout(1000)
    if touch: pg.tap('#bCont')
    else: pg.click('#bCont')
    pg.wait_for_timeout(1500)
    pg.evaluate(HELP)
    pg.evaluate("() => { for (let i = 0; i < 10; i++) K.L.update(0.05); }")
    return b, pg, errs

def E(pg, js, arg=None):
    return pg.evaluate(js, arg) if arg is not None else pg.evaluate(js)

NIGHT = dict(flags=dict(woke=True, triedDoor=True, readPlate=True, winKey=True, winUnlocked=True, keys=True, boxOpen=True, slipFitted=True),
             inv=['keyring'], player=dict(x=-0.6, z=3.6, yaw=0, pitch=0))

def scen_night(p):
    b, pg, errs = open_room(p, 'night', NIGHT)
    pr = E(pg, "() => K.prompt('slip')")
    check([k for k, _ in pr] == ['E', 'R', 'T'], f'slip gear shows E, R, T ({pr})')
    E(pg, "() => { K.clear(); K.press('slip', 'KeyR'); }")
    check('SLIP GEAR' in E(pg, "() => K.card()"), 'R reads the plate')
    E(pg, "() => { K.clear(); K.press('slip', 'KeyT'); }")
    check('let the carriage go' in E(pg, "() => K.subs()") and not E(pg, "() => K.card()"), f'T pushes it forward to SLIP (not the plate): "{E(pg, "() => K.subs()")[:60]}"')
    E(pg, "() => { K.clear(); K.press('slip', 'KeyE'); }")
    check(not E(pg, "() => K.card()") and E(pg, "() => K.L.S.slip") == 'armed', 'E tries the lever (no slack yet, it stays ARMED)')
    pr = E(pg, "() => K.prompt('cdoor')")
    check([k for k, _ in pr] == ['E', 'R', 'T'] and 'Knock' in pr[1][1] and 'note' in pr[2][1], f'gangway door shows E try, R knock, T read the note ({pr})')
    E(pg, "() => { K.clear(); K.press('cdoor', 'KeyT'); }")
    check(E(pg, "() => !!K.L.UI.kind") and 'SLIP' not in E(pg, "() => K.card()"), f'T on the door reads the note: "{E(pg, "() => K.card()")[:50]}"')
    E(pg, "() => { K.clear(); K.press('cdoor', 'KeyR'); }")
    check(not E(pg, "() => K.card()"), 'R on the door knocks (no note opens)')
    check(not errs, f'no script errors {errs[:2]}')
    b.close()

def scen_phone(p):
    b, pg, errs = open_room(p, 'night', NIGHT, viewport=(844, 390), touch=True)
    E(pg, "() => { K.G.touch = true; K.hover('slip'); }")
    pg.wait_for_timeout(300)
    labels = E(pg, "() => { K.hover('slip'); return Array.from(document.querySelectorAll('#tcActs .tcb')).map(b => b.textContent); }")
    check(len(labels) == 3 and 'SLIP' in labels[2], f'three buttons, the third is Push it forward to SLIP ({labels})')
    E(pg, "() => { K.clear(); K.hover('slip'); const b = document.querySelectorAll('#tcActs .tcb')[2]; b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); }")
    check('let the carriage go' in E(pg, "() => K.subs()"), 'the third button pushes it forward')
    E(pg, "() => { K.clear(); K.hover('slip'); const b = document.querySelectorAll('#tcActs .tcb')[1]; b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); }")
    check('SLIP GEAR' in E(pg, "() => K.card()"), 'the second button reads the plate')
    check(not errs, f'no script errors {errs[:2]}')
    b.close()

def scen_crowd(p):
    for vw in [(844, 390), (812, 375), (740, 360)]:
        b, pg, errs = open_room(p, 'tik', dict(flags=dict(woke=True, gotMatches=True, lit=True), lamp=2, player=dict(x=1.1, y=1.45, z=1.05, yaw=0, pitch=0)), viewport=vw, touch=True)
        r = E(pg, """() => {
          K.G.touch = true; const D = K.L.ROOM.debug; D.pickUp('tabo');
          const a = { label: 'First action', run() {} }, b = { label: 'A second action', run() {} }, c = { label: 'And a third one', run() {} };
          K.L.INTER.set('__test', { id: '__test', name: 'Test', obj: K.L.scene, actions: () => [a, b, c] });
          K.hover('__test'); K.L.updatePrompt(true);
          const box = e => e.getBoundingClientRect(), acts = Array.from(document.querySelectorAll('#tcActs .tcb')).map(box), ex = Array.from(document.querySelectorAll('#tcExtra .tcb')).map(box);
          const hit = acts.some(A => ex.some(X => A.left < X.right && A.right > X.left && A.top < X.bottom && A.bottom > X.top));
          return { acts: acts.length, extras: ex.length, hit, actTop: Math.round(Math.min(...acts.map(x => x.top))), exBottom: Math.round(Math.max(...ex.map(x => x.bottom))) };
        }""")
        check(r['acts'] == 3 and r['extras'] >= 3 and not r['hit'], f'{vw[0]}x{vw[1]}: 3 action buttons and {r["extras"]} room buttons don\'t overlap (actions from y={r["actTop"]}, room buttons to y={r["exBottom"]})')
        if os.environ.get('SHOTS'): pg.screenshot(path=os.path.join(os.environ['SHOTS'], f'crowd_{vw[0]}x{vw[1]}.png'))
        check(not errs, f'no script errors {errs[:2]}')
        b.close()

SCEN = dict(night=scen_night, phone=scen_phone, crowd=scen_crowd)
with sync_playwright() as p:
    for name, fn in SCEN.items():
        if WANT and name not in WANT: continue
        print(f'--- {name}'); sys.stdout.flush()
        try: fn(p)
        except Exception as e: check(False, f'{name}: {e}')
print(f'\n{len(fails)} failed' if fails else '\nall passed')
sys.exit(1 if fails else 0)
