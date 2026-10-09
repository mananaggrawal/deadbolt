#!/usr/bin/env python3
"""Dedushka played through the real interactions: aim at the thing, take the action the prompt offers
(probe()/act(), exactly what a click does). Between places the player is teleported (bodyPlace), and the
crate is placed under the barn oar; the chest is dragged for real. Scenarios:

  solve    a fresh game to the escape, no mistakes
  cellar   ask for the other oar, drag the chest off the hatch, go down, climb back up holding it
  old      the cellar scenario on a build without the fix (expects to be stuck in the cellar)
  garden   an oar put down on the garden's ridges stays in sight and can be picked up again
  gate     the ritual refuses until the boat is afloat with both oars, then runs
  rescue   a save stuck after the ritual with the boat unready winds back and can carry the logs
  boarded  a save made during the ride resumes on the landing with the basket in your hands

    python3 game/build.py dev                       (game/dist/dev.html keeps the __lethe handle)
    cd site && npm ci                               (for node_modules/three)
    python3 game/tools/ded_play.py [scenario ...]   (from the repo root; no scenario runs them all)

Needs playwright with Chromium. SwiftShader is slow: the whole set takes about six minutes.
"""
import sys, os, json, time, threading, http.server, functools
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
# helpers inside the page
HELP = r"""
window.T = (() => {
  const L = __lethe, R = () => L.ROOM, D = () => L.ROOM.debug, G = L.G;
  const step = (sec, dt = 0.05) => { const n = Math.round(sec / dt); for (let i = 0; i < n; i++) L.update(dt); };
  const bp = L.bodyPlace || ((x, y, z, yaw, cr) => { const B = D().BODY; L.P.x = x; L.P.z = z; B.y = B.ys = y; B.vy = 0; B.ground = true; B.crouch = !!cr; G.crouch = !!cr; G.yaw = yaw; G.eye = G.eyeT = y + (cr ? B.crouchEye : B.standEye); B.eye = G.eye - y; });
  const place = (x, y, z, yaw = 0, cr = false) => { bp(x, y, z, yaw, cr); G.pitch = 0; step(0.2); };
  const aim = (x, y, z) => { L.scene.updateMatrixWorld(true); const c = L.camera.position; const dx = x - c.x, dy = y - c.y, dz = z - c.z;
    G.yaw = Math.atan2(-dx, -dz); G.pitch = Math.atan2(dy, Math.hypot(dx, dz)); L.update(0.016); L.update(0.016); L.update(0.016);
    return G.hover ? G.hover.id : null; };
  const wp = o => { const v = L.camera.position.clone(); o.updateWorldMatrix(true, true); if (L.THREE) new L.THREE.Box3().setFromObject(o).getCenter(v); else o.getWorldPosition(v); return v; };
  const aimAt = o => { const v = wp(o); return aim(v.x, v.y, v.z); };
  const acts = () => { const d = G.hover; if (!d) return []; const a = typeof d.actions === 'function' ? d.actions() : (d.actions || []); return a.map(x => x.label); };
  // take the action whose label matches (on whatever is aimed at)
  const doAct = re => { const labels = acts(); const i = labels.findIndex(l => new RegExp(re, 'i').test(l)); if (i < 0) return { ok: false, labels, hover: G.hover && G.hover.id }; L.act(i); L.update(0.016); return { ok: true, label: labels[i] }; };
  const subs = () => (document.querySelector('#subs') || {}).innerText || '';
  const toasts = () => Array.from(document.querySelectorAll('#toast, .toast, #toasts')).map(e => e.innerText).join(' | ');
  return { L, R, D, G, step, place, aim, aimAt, wp, acts, doAct, subs, toasts, get S() { return L.S; } };
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

def open_room(p, save=None, shots=None):
    ctx = p.chromium.launch(args=ARGS).new_context(viewport={'width': 640, 'height': 360})
    ctx.add_init_script(LOCK_STUB)
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('https://cdn.jsdelivr.net/**', lambda r: r.fulfill(path=THREE_JS, content_type='text/javascript'))
    pg.route('https://fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
    pg.route('https://fonts.gstatic.com/**', lambda r: r.abort())
    pg.goto(BASE + '/dev.html')
    pg.wait_for_function('() => typeof __lethe === "object" && __lethe.ROOMS && __lethe.ROOMS.ded', timeout=120000)
    pg.evaluate("() => { try { localStorage.setItem('mr.age', '1'); } catch (e) {} }")
    if save is not None:
        pg.evaluate("(s) => { const d = __lethe.ROOMS.ded.defaults(); const S = Object.assign(d, s, { flags: Object.assign({}, s.flags) }); localStorage.setItem(__lethe.ROOMS.ded.saveKey, JSON.stringify(S)); }", save)
    pg.evaluate("() => __lethe.enterMystery('ded')")
    t0 = time.time()
    while time.time() - t0 < 400:
        st = pg.evaluate("() => { const b = document.querySelector('#bNew'), c = document.querySelector('#bCont'); return { n: b && !b.disabled, c: c && !c.hidden && !c.disabled }; }")
        if (save is not None and st['c']) or (save is None and st['n']): break
        pg.wait_for_timeout(1000)
    # an age or content gate in the way?
    for sel in ('#ageYes', '[data-age="yes"]', 'button:has-text("I am 18")'):
        try:
            if pg.locator(sel).count(): pg.click(sel)
        except Exception: pass
    pg.click('#bCont' if save is not None else '#bNew'); pg.wait_for_timeout(1500)
    pg.evaluate(HELP)
    pg.evaluate("() => T.step(0.5)")
    return ctx, pg, errs

def E(pg, js, arg=None):
    return pg.evaluate(js, arg) if arg is not None else pg.evaluate(js)

def shot(pg, name):
    if not os.environ.get('SHOTS'): return   # SHOTS=<dir> saves a few screenshots
    pg.evaluate("() => { __lethe.scene.updateMatrixWorld(true); __lethe.render(0.016); }")
    pg.screenshot(path=os.path.join(os.environ['SHOTS'], name + '.png'))

BASE_FLAGS = dict(woke=True, letterRead=True, firstOut=True, matchesMissing=True, matchesBack=True, threadTaken=True, threadTied=True, lampLit=True)

def scen_cellar(p, old=False):
    """the second oar: ask, the chest, the hatch, the cellar, and back up with the oar"""
    save = dict(flags=dict(BASE_FLAGS, barnSeen=True, pegsSeen=True, oar1Taken=True, stoveLit=True, jacketGone=True),
                player=dict(x=4.6, y=0.7, z=-4.2, yaw=0.9, pitch=0), stove='burning', stoveT=10, zas=False, woodIn=True, damper=True, cat='step', torch=1)
    ctx, pg, errs = open_room(p, save)
    tag = '[old build] ' if old else ''
    h = E(pg, "() => T.aimAt(T.D().O.table)"); r = E(pg, "() => T.doAct('Ask him')")
    check(h == 'table' and r['ok'], f'{tag}asked him at the table leg ({h}, {r})')
    if not old:
        t = E(pg, "() => T.R().HINTS.find(h => h.id === 'oar2').tiers.join(' / ')")
        check('Ask him again' in t, 'oar hint before he answers: ask again')
    E(pg, "() => { T.place(5.0, 0.7, 1.4, 0); T.step(3.5); T.place(4.4, 0.7, -0.9, 0.3); T.step(1.5); }")
    check(E(pg, "() => !!T.S.flags.chestMoved && T.D().chestOnTrap()"), f'{tag}the chest is on the cellar hatch when you come back')
    if not old:
        t = E(pg, "() => T.R().HINTS.find(h => h.id === 'oar2').tiers")
        check(len(t) == 4 and 'chest' in t[1] and 'shelves of jars' in t[3] and 'Ask him again' not in ' '.join(t), 'oar hint after he answers: the chest, the hatch, where the oar really is')
    # drag the chest off the hatch by walking backwards with it
    E(pg, "() => T.place(3.0, 0.7, -1.05, 0)")
    h = E(pg, "() => T.aimAt(T.D().O.chest)"); r = E(pg, "() => T.doAct('Drag')")
    check(h == 'chest' and r['ok'], f'{tag}took hold of the chest ({h}, {r})')
    pg.keyboard.down('KeyS'); E(pg, "() => T.step(1.6)"); pg.keyboard.up('KeyS')
    E(pg, "() => { if (T.D().DRAG.cur) __lethe.ROOM.dropHeld(); T.step(0.3); }")
    off = E(pg, "() => !T.D().chestOnTrap()")
    if not off:  # walking back may be blocked by the bed or the wall in this spot; slide it east instead
        E(pg, "() => { const c = T.D().O.chest; c.position.set(4.3, c.position.y, -2.15); T.D().DRAG.defs.chest.sync(); T.S.props.chest = { x: 4.3, y: c.position.y, z: -2.15 }; }")
    check(E(pg, "() => !T.D().chestOnTrap()"), f'{tag}the chest is off the hatch' + ('' if off else ' (placed: the backwards walk was blocked)'))
    E(pg, "() => T.place(3.0, 0.7, -1.1, 0)")
    h = E(pg, "() => T.aim(3.0, 0.75, -2.15)"); r = E(pg, "() => T.doAct('Lift the hatch')"); E(pg, "() => T.step(1)")
    check(h == 'trap' and r['ok'] and E(pg, "() => !!T.S.trap"), f'{tag}lifted the hatch ({h}, {r})')
    h = E(pg, "() => T.aim(3.0, 0.75, -2.15)"); r = E(pg, "() => T.doAct('Climb down')"); E(pg, "() => T.step(4)")
    check(r['ok'] and E(pg, "() => T.D().inCellar()"), f'{tag}climbed down into the cellar ({r})')
    shot(pg, ('old_' if old else '') + 'cellar_arrive')
    h = E(pg, "() => T.aimAt(T.D().O.oar2)"); r = E(pg, "() => T.doAct('Take the oar')")
    check(h == 'oar2' and r['ok'] and E(pg, "() => T.D().HOLD.cur") == 'oar2', f'{tag}took the oar from the cellar floor ({h}, {r})')
    h = E(pg, "() => T.aim(3.0, -0.25, -2.3)"); r = E(pg, "() => T.doAct('Climb up')"); E(pg, "() => T.step(4)")
    up = E(pg, "() => ({ cellar: T.D().inCellar(), izba: T.D().inIzba(), held: T.D().HOLD.cur, hand: T.D().HOLD.cur ? T.D().HOLD.defs[T.D().HOLD.cur].hand.visible : null, y: T.D().BODY.y, toast: T.toasts(), subs: T.subs() })")
    if old:
        check(up['cellar'] and up['held'] == 'oar2', f'[old build] reproduced: still in the cellar holding the oar ({up["toast"][:80]})')
    else:
        check(h == 'cellarLadder' and r['ok'], f'aimed at the cellar ladder and climbed ({h}, {r})')
        check(not up['cellar'] and up['izba'] and up['held'] == 'oar2' and up['hand'], f'up in the izba with the oar in your hands ({up})')
    check(not errs, f'{tag}no script errors ({errs[:2]})')
    ctx.close()

def scen_gate(p):
    """the ritual waits for the boat"""
    save = dict(flags=dict(BASE_FLAGS, stoveLit=True, jacketGone=True, shoeFound=True, basketShoe=True, basketBread=True, basketPot=True, tarred=True, caulked=True, boatSeen=True),
                stove='embers', stoveT=80, zas=False, woodIn=True, damper=True, potEmbers=True, basket=dict(shoe=True, bread=True, pot=True),
                caulk=4, boat='right', held='basket', player=dict(x=0.98, y=0.7, z=-3.3, yaw=3.14159, pitch=-0.2), cat='step')
    ctx, pg, errs = open_room(p, save)
    check(E(pg, "() => T.D().HOLD.cur") == 'basket', 'holding the packed basket')
    h = E(pg, "() => T.aimAt(T.D().O.stoveHit)"); r = E(pg, "() => T.doAct('ask him')"); E(pg, "() => T.step(1)")
    st = E(pg, "() => ({ rit: !!T.S.flags.ritual, started: !!T.S.flags.ritualStarted, wrong: T.S.wrong, held: T.D().HOLD.cur, subs: T.subs() })")
    check(h == 'stove' and r['ok'] and not st['rit'] and not st['started'] and st['wrong'] == 0 and st['held'] == 'basket' and 'Not yet' in st['subs'], f'boat not ready: he is not asked, no mistake, still holding the basket ({st["subs"][:70]})')
    r = E(pg, "() => { __lethe.ROOM.dropHeld(); T.step(0.2); return T.D().HOLD.cur; }")
    check(r is None, 'the basket can still be put down before the ritual')
    t = E(pg, "() => T.R().HINTS.find(h => h.id === 'basket').tiers[0]")
    check('boat' in t, 'basket hint says to ready the boat first')
    # now the boat is ready
    E(pg, "() => { T.S.boat = 'launched'; T.S.flags.launched = true; T.S.oarsIn = 2; T.S.oarsUsed = { oar1: true, oar2: true }; T.D().placeBoat(); }")
    h = E(pg, "() => T.aimAt(T.D().O.basket)"); r = E(pg, "() => T.doAct('Pick up the basket')")
    check(h == 'basket' and r['ok'], f'picked the basket up again ({h}, {r})')
    E(pg, "() => T.place(0.98, 0.7, -3.3, 3.14159)")
    h = E(pg, "() => T.aimAt(T.D().O.stoveHit)"); r = E(pg, "() => T.doAct('ask him')"); E(pg, "() => T.step(13.5)")
    st = E(pg, "() => ({ rit: !!T.S.flags.ritual, held: T.D().HOLD.cur, drop: T.D().HOLD.defs.basket.droppable })")
    check(r['ok'] and st['rit'] and st['held'] == 'basket' and st['drop'] is False, f'boat ready: the ritual runs and he is in your arms ({st})')
    E(pg, "() => T.step(5)")
    check(E(pg, "() => !!T.S.flags.fire"), 'the house catches after the ritual')
    check(not errs, f'no script errors ({errs[:2]})')
    ctx.close()

def scen_garden(p):
    """put an oar down on the garden's ridges of earth (along one, across them) and in the yard: it must stay in sight
    and in reach. Before the fix it was put at ground level and an oar laid along a ridge vanished inside it."""
    save = dict(flags=dict(BASE_FLAGS, stoveLit=True, jacketGone=True, barnSeen=True, oar1Taken=True),
                held='oar1', player=dict(x=5.0, y=0, z=16.4, yaw=-1.5708, pitch=0), cat='step')
    ctx, pg, errs = open_room(p, save)
    box = "() => { const w = T.D().HOLD.defs.oar1.world; w.updateWorldMatrix(true, true); const b = new (__lethe.THREE || THREE).Box3().setFromObject(w); return { minY: b.min.y, maxY: b.max.y, vis: w.visible, prop: T.S.props.oar1 }; }"
    ok_three = E(pg, "() => !!__lethe.THREE")
    def drop_and_check(label, x, z, yaw, want_min):
        E(pg, f"() => {{ if (T.D().HOLD.cur !== 'oar1') {{ T.aimAt(T.D().HOLD.defs.oar1.world); T.doAct('oar'); }} T.place({x}, 0, {z}, {yaw}); T.G.pitch = -0.6; __lethe.ROOM.dropHeld(); T.step(0.3); }}")
        b = E(pg, box) if ok_three else None
        held = E(pg, "() => T.D().HOLD.cur")
        check(held is None and (b is None or (b['vis'] and b['prop']['y'] >= want_min)), f'{label}: put down and in sight (lies {b and round(b["prop"]["y"], 3)} m up; {b})')
        h = E(pg, "() => T.aimAt(T.D().HOLD.defs.oar1.world)"); r = E(pg, "() => T.doAct('oar')")
        check(h == 'oar1' and r['ok'] and E(pg, "() => T.D().HOLD.cur") == 'oar1', f'{label}: picked up again ({h}, {r})')
        return b
    # the ridges stand 0.11 m proud of the ground. The one at z = 16.4 runs east-west; facing east, the oar lands lengthwise on its crest
    drop_and_check('along a garden ridge', 5.0, 16.4, -1.5708, 0.1)
    # facing the river, it lands across the ridges and rests on their crests
    drop_and_check('across the garden ridges', 6.0, 15.85, 3.14159, 0.09)
    # in the yard (flat ground) nothing changes: it lies on the ground
    b = drop_and_check('in the yard', 9.0, 6.0, 3.14159, -0.02)
    check(b is None or b['prop']['y'] < 0.01, f'in the yard it still lies on the ground, not lifted ({b})')
    check(not errs, f'no script errors ({errs[:2]})')
    ctx.close()

def scen_rescue(p):
    """a game saved by the old build in the stuck state: ritual done, fire going, boat not ready"""
    save = dict(flags=dict(BASE_FLAGS, stoveLit=True, jacketGone=True, shoeFound=True, basketShoe=True, basketBread=True, basketPot=True, tarred=True, caulked=True,
                           boatSeen=True, ritualStarted=True, ritual=True, fire=True, oar1Taken=True, oar2Taken=True, chestMoved=True),
                stove='embers', stoveT=80, zas=False, woodIn=True, damper=True, potEmbers=True, basket=dict(shoe=True, bread=True, pot=True),
                caulk=4, boat='right', held='basket', houseFire=0.7, burnT=[200, 180, 150, 120, 60], cat='flee',
                player=dict(x=5.4, y=0, z=21.0, yaw=0.3, pitch=0), props=dict(chest=dict(x=4.3, y=0.7, z=-2.15)))
    ctx, pg, errs = open_room(p, save)
    E(pg, "() => T.step(2.5)")
    st = E(pg, "() => ({ rit: !!T.S.flags.ritual, fire: !!T.S.flags.fire, held: T.D().HOLD.cur, drop: T.D().HOLD.defs.basket.droppable, smoke: T.D().O.smokeLayer.visible, subs: T.subs(), bx: T.D().O.basket.position.x, bz: T.D().O.basket.position.z, bvis: T.D().O.basket.visible })")
    check(not st['rit'] and not st['fire'] and st['held'] is None and st['drop'] and not st['smoke'], f'stuck save wound back: no ritual, no fire, hands free ({st})')
    check(st['bvis'] and abs(st['bx'] - 3.75) < 0.1 and abs(st['bz'] + 5.78) < 0.1, 'the basket is back on the bench')
    check('packed and ready' in st['subs'], f'the player is told what happened ({st["subs"][:60]})')
    E(pg, "() => T.place(4.9, 0, 23.2, 0)")
    h = E(pg, "() => T.aimAt(T.D().O.rollers[0])"); r = E(pg, "() => T.doAct('Pick up the log')")
    check(h == 'roller0' and r['ok'] and E(pg, "() => T.D().HOLD.cur") == 'roller0', f'you can carry the logs now ({h}, {r})')
    check(not errs, f'no script errors ({errs[:2]})')
    ctx.close()

def scen_boarded(p):
    """a game saved during the ride comes back on the landing with him in your arms"""
    save = dict(flags=dict(BASE_FLAGS, stoveLit=True, jacketGone=True, shoeFound=True, basketShoe=True, basketBread=True, basketPot=True, tarred=True, caulked=True,
                           boatSeen=True, ritualStarted=True, ritual=True, fire=True, oar1Taken=True, oar2Taken=True, launched=True, boarded=True),
                stove='embers', zas=False, woodIn=True, damper=True, potEmbers=True, basket=dict(shoe=True, bread=True, pot=True), caulk=4, boat='launched',
                oarsIn=2, oarsUsed=dict(oar1=True, oar2=True), held=None, houseFire=0.8, cat='boat', player=dict(x=9.1, y=-0.86, z=29.9, yaw=0, pitch=0))
    ctx, pg, errs = open_room(p, save)
    st = E(pg, "() => ({ held: T.D().HOLD.cur, hand: T.D().HOLD.cur && T.D().HOLD.defs.basket.hand.visible })")
    check(st['held'] == 'basket' and st['hand'], f'resumed on the landing holding the basket ({st})')
    h = E(pg, "() => T.aimAt(T.D().O.boat)")
    check(h == 'boat' and any('Step into the boat' in l for l in E(pg, "() => T.acts()")), f'and can step into the boat ({h}, {E(pg, "() => T.acts()")})')
    check(not errs, f'no script errors ({errs[:2]})')
    ctx.close()

def scen_solve(p):
    """a fresh game to the end, every step through the real interactions; you are teleported between places"""
    ctx, pg, errs = open_room(p, None)
    E(pg, "() => { for (let i = 0; i < 200 && !T.S.flags.woke; i++) T.step(0.1); }")
    check(E(pg, "() => !!T.S.flags.woke"), 'woke up')
    def use(what, at, target, re, n=1):
        x, y, z = at
        h = E(pg, "([x, y, z, t]) => { T.place(x, y, z, 0); if (typeof t === 'string' && t[0] === '@') t = eval(t.slice(1)); return Array.isArray(t) ? T.aim(t[0], t[1], t[2]) : T.aimAt(eval(t)); }", [x, y, z, target])
        for _ in range(n):
            r = E(pg, "(re) => T.doAct(re)", re); E(pg, "() => T.step(0.3)")
            if not r['ok']: break
        check(r['ok'], f'{what} ({h}: {r.get("label") or r})')
        return r['ok']
    O = 'T.D().O.'
    use('try to light the lamp: no matches', (4.4, 0.7, -4.1), O + 'lamp', 'Light the lamp')
    E(pg, "() => T.step(9)")
    check(E(pg, "() => !!T.S.flags.matchesMissing"), 'the matches are missing')
    use('take the red thread', (3.0, 0.7, -5.2), O + 'sewing', 'red thread')
    use('tie it round the table leg', (4.2, 0.7, -4.1), O + 'table', 'Tie')
    use('ask him for the matches', (4.2, 0.7, -4.1), O + 'table', 'Ask him')
    E(pg, "() => { T.place(5.0, 0.7, 1.4, 0); T.step(3.5); T.place(4.4, 0.7, -4.0, 0); T.step(1.5); }")
    use('take the matches off the table', (4.4, 0.7, -4.1), O + 'matchBox', 'Take your matches')
    use('light the lamp', (4.4, 0.7, -4.1), O + 'lamp', 'Light the lamp')
    use('take an armful of logs', (17.5, 0, 5.3), O + 'woodHit', 'armful')
    use('peel birch bark', (13.8, 0, 6.1), O + 'birchLog', 'Peel')
    use('take the iron door off the oven', (0.98, 0.7, -3.3), O + 'stoveHit', 'iron door')
    use('put the logs in', (0.98, 0.7, -3.3), O + 'stoveHit', 'logs in')
    use('tuck the bark under', (0.98, 0.7, -3.3), O + 'stoveHit', 'bark')
    use('open the damper from the step', (2.2, 1.2, -1.4), O + 'damper', 'Open the damper')
    use('light the stove', (0.98, 0.7, -3.3), O + 'stoveHit', 'Light it')
    check(E(pg, "() => !!T.S.flags.stoveLit && T.S.wrong === 0"), 'the stove is lit, no mistakes')
    use('take the caulking tools', (1.3, 0.7, 1.45), O + 'toolbox', 'caulking')
    E(pg, "() => { T.place(17.5, 0, -0.3, 0); T.step(1); }")
    check(E(pg, "() => !!T.S.flags.barnSeen"), 'in the barn')
    use('look at the empty pegs', (16.3, 0, -3.0), O + 'pegHit', 'Look')
    use('take the oakum', (18.6, 0, -3.0), O + 'oakum', 'oakum')
    use('pick up the tar pot', (17.85, 0, -2.6), O + 'tar', 'Pick up the tar')
    use('put the tar in the stove to warm', (0.98, 0.7, -3.3), O + 'stoveHit', 'tar pot in')
    # the crate under the oar (placed; dragging it is covered by the chest), then up onto it
    E(pg, "() => { const d = T.D().DRAG.defs.crate, o = d.obj; o.position.set(17.4, 0, -0.84 + 0.6); d.sync(); T.S.props.crate = { x: 17.4, y: 0, z: -0.24 }; }")
    use('take the first oar, standing on the crate', (17.4, 0.5, -0.24), O + 'oar1', 'Take the oar')
    E(pg, "() => { T.place(17.4, 0, 1.0, 0); __lethe.ROOM.dropHeld(); T.step(0.5); }")
    E(pg, "() => T.step(20)")
    use('take the hot tar out', (0.98, 0.7, -3.3), O + 'stoveHit', 'tar pot out')
    check(E(pg, "() => !!T.S.tarHot"), 'the tar is runny')
    use('hammer the oakum into the seam (4 blows)', (5.5, 0, 20.1), O + 'boat', 'Hammer', n=4)
    use('brush on the tar', (5.5, 0, 20.1), O + 'boat', 'Brush')
    check(E(pg, "() => !!T.S.flags.tarred"), 'the seam is sealed')
    E(pg, "() => { __lethe.ROOM.dropHeld(); T.step(0.3); }")
    use('pick up the ladder', (15.85, 0, 7.3), O + 'ladder', 'Pick up the ladder')
    use('set it against the gable', (3.0, 0, 4.9), O + 'gableHit', 'Set the ladder')
    use('climb the ladder', (3.0, 0, 5.0), O + 'ladder', 'Climb the ladder')
    E(pg, "() => T.step(4.8)")
    check(E(pg, "() => T.D().inAttic()"), 'in the attic')
    use("take Babushka's shoe", (2.1, 3.42, -1.6), O + 'shoes[4]', 'Take her shoe')
    use('draw the hatch bolt', (2.85, 3.42, 0.6), O + 'hatchBolt', 'Draw the bolt')
    use('climb down to the seni', (2.85, 3.42, 0.6), O + 'hatchBolt', 'Climb down')
    E(pg, "() => T.step(3.6)")
    check(E(pg, "() => !T.D().inAttic() && T.D().BODY.y < 1") , 'down in the seni')
    E(pg, "() => T.step(75)")
    check(E(pg, "() => T.S.stove === 'embers'"), 'the stove has burned down to embers')
    use('take the clay pot', (1.2, 0.7, -4.0), O + 'pot', 'clay pot')
    use('rake embers into it', (0.98, 0.7, -3.3), O + 'stoveHit', 'Rake')
    E(pg, "() => { __lethe.ROOM.dropHeld(); T.step(0.3); }")
    use('put the shoe in the basket', (3.75, 0.7, -4.9), O + 'basket', 'shoe')
    use('put bread in the shoe', (3.75, 0.7, -4.9), O + 'basket', 'bread')
    use('pick the pot up again', (0.98, 0.7, -3.3), O + 'pot', 'clay pot|Take')
    use('put the pot of embers in', (3.75, 0.7, -4.9), O + 'basket', 'pot of embers')
    use('pick up the basket', (3.75, 0.7, -4.9), O + 'basket', 'Pick up the basket')
    use('ask him before the boat is ready', (0.98, 0.7, -3.3), O + 'stoveHit', 'ask him')
    E(pg, "() => T.step(1)")
    check(E(pg, "() => !T.S.flags.ritualStarted && T.S.wrong === 0 && /Not yet/.test(T.subs())"), 'refused until the boat is ready, no mistake')
    E(pg, "() => { T.place(3.75, 0.7, -4.9, 0); __lethe.ROOM.dropHeld(); T.step(0.3); }")
    use('pick up the boat hook', (-1.2, 0, 18.6), O + 'hook', 'boat hook')
    use('lever her over', (5.5, 0, 20.1), O + 'boat', 'Lever')
    E(pg, "() => T.step(2.6)")
    check(E(pg, "() => T.S.boat === 'right'"), 'the boat is the right way up')
    for i in (0, 1):
        use(f'pick up round log {i + 1}', (4.6, 0, 21.2), O + f'rollers[{i}]', 'Pick up the log')
        use(f'lay log {i + 1} in front of her bow', (5.5, 0, 21.0), O + 'boat', 'Lay the log')
    use('push her down to the water', (5.5, 0, 20.1), O + 'boat', 'Push her')
    E(pg, "() => T.step(4.6)")
    check(E(pg, "() => T.S.boat === 'launched'"), 'she is in the river')
    use('pick up the first oar again', (17.4, 0, 1.1), '@T.D().O.oar1.position.toArray()', 'Pick up the oar')
    use('put it in the boat', (9.1, -0.86, 27.4), O + 'boat', 'Put the oar')
    use('ask him for the other oar', (4.2, 0.7, -4.1), O + 'table', 'Ask him')
    E(pg, "() => { T.place(5.0, 0.7, 1.4, 0); T.step(3.5); T.place(3.0, 0.7, -1.05, 0); T.step(1.5); }")
    check(E(pg, "() => T.D().chestOnTrap()"), 'the chest is on the hatch')
    use('take hold of the chest', (3.0, 0.7, -1.05), O + 'chest', 'Drag')
    pg.keyboard.down('KeyS'); E(pg, "() => T.step(1.6)"); pg.keyboard.up('KeyS'); E(pg, "() => { if (T.D().DRAG.cur) __lethe.ROOM.dropHeld(); T.step(0.3); }")
    check(E(pg, "() => !T.D().chestOnTrap()"), 'dragged the chest off the hatch')
    use('lift the hatch', (3.0, 0.7, -1.1), [3.0, 0.75, -2.15], 'Lift the hatch')
    use('climb down into the cellar', (3.0, 0.7, -1.1), [3.0, 0.75, -2.15], 'Climb down')
    E(pg, "() => T.step(4)")
    E(pg, "() => { const t = T.D().O.oar2; T.aimAt(t); }")
    r = E(pg, "() => T.doAct('Take the oar')"); check(r['ok'], f'take the other oar in the cellar ({r})')
    E(pg, "() => { T.aim(3.0, -0.25, -2.3); }"); r = E(pg, "() => T.doAct('Climb up')"); E(pg, "() => T.step(4)")
    check(r['ok'] and E(pg, "() => T.D().inIzba() && T.D().HOLD.cur === 'oar2'"), 'climbed out of the cellar with it')
    use('put the other oar in the boat', (9.1, -0.86, 27.4), O + 'boat', 'Put the oar')
    check(E(pg, "() => T.S.oarsIn === 2"), 'both oars in her')
    use('pick up the basket again', (3.75, 0.7, -4.9), O + 'basket', 'Pick up the basket')
    use('set it on the stove and ask him', (0.98, 0.7, -3.3), O + 'stoveHit', 'ask him')
    E(pg, "() => T.step(13.5)")
    check(E(pg, "() => !!T.S.flags.ritual && T.D().HOLD.cur === 'basket'"), 'he came, and he is in your arms')
    E(pg, "() => T.step(5)")
    check(E(pg, "() => !!T.S.flags.fire"), 'the house is on fire')
    r = E(pg, "() => { const p = __lethe.ROOM.dropHeld(); T.step(0.2); return T.D().HOLD.cur; }")
    check(r == 'basket', 'he cannot be put down')
    use('step into the boat', (9.1, -0.86, 27.4), O + 'boat', 'Step into the boat')
    E(pg, "() => { for (let i = 0; i < 400 && !T.S.flags.escaped; i++) T.step(0.1); }")
    check(E(pg, "() => !!T.S.flags.escaped"), 'escaped across the river')
    check(E(pg, "() => T.S.wrong") == 0, f'no mistakes on the way ({E(pg, "() => T.S.wrong")})')
    check(not errs, f'no script errors ({errs[:2]})')
    ctx.close()

with sync_playwright() as p:
    for name, fn in [('cellar', scen_cellar), ('garden', scen_garden), ('gate', scen_gate), ('rescue', scen_rescue), ('boarded', scen_boarded), ('solve', scen_solve)]:
        if WANT and name not in WANT and not (name == 'cellar' and 'old' in WANT): continue
        print(f'--- {name}'); t0 = time.time()
        try: fn(p, old=True) if (name == 'cellar' and 'old' in WANT) else fn(p)
        except Exception as e: check(False, f'{name} crashed: {e}')
        print(f'    ({time.time() - t0:.0f}s)')
print(f'\n{len(fails)} failed' if fails else '\nall passed')
sys.exit(1 if fails else 0)
