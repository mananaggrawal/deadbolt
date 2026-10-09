#!/usr/bin/env python3
"""Saturation played through the real interactions: aim at the thing, check the prompt finds it, and take the
action it offers (probe()/act(), what a click does). Between places the player is teleported; under water the
swim actions are taken with the E key. Scenarios:

  solve    a fresh game to the escape, with three deliberate mistakes (an oxygen bank into the station, the moon
           pool burped past the skirt, three knocks on the hatch); waits in real time for the voices
  resume   the level window timing, then saves before the dive, mid-swim with him in tow, and mid-ride
           (needs the save that `solve` writes)

    python3 game/build.py dev                     (game/dist/dev.html keeps the __lethe handle)
    cd site && npm ci                             (for node_modules/three)
    python3 game/tools/sat_play.py [solve|resume] (from the repo root; no scenario runs both)

Needs playwright with Chromium. SwiftShader is slow: solve takes about ten minutes. Run one browser at a time:
two at once can run the sandbox out of memory. Screenshots and the pre-dive save go to game/tools/shots (or $SHOTS).
"""
import asyncio, json, math, os, sys, time, http.server, threading, functools
from playwright.async_api import async_playwright

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
ROOT = os.environ.get('DIST', os.path.join(REPO, 'game', 'dist'))
THREE = open(os.path.join(REPO, 'site', 'node_modules', 'three', 'build', 'three.module.js'), 'rb').read()
SHOTS = os.environ.get('SHOTS', os.path.join(REPO, 'game', 'tools', 'shots')); os.makedirs(SHOTS, exist_ok=True)

PORT = int(os.environ.get('PORT', '8765'))
def serve(port=None):
    port = port or PORT
    h = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
    class Q(http.server.ThreadingHTTPServer): allow_reuse_address = True
    srv = Q(('127.0.0.1', port), h); h.log_message = lambda *a: None
    http.server.SimpleHTTPRequestHandler.log_message = lambda *a: None
    threading.Thread(target=srv.serve_forever, daemon=True).start(); return srv

ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog', '--disable-hang-monitor', '--autoplay-policy=no-user-gesture-required']

async def launch(p, w=960, h=540, mobile=False):
    b = await p.chromium.launch(args=ARGS)
    ctx = await b.new_context(viewport={'width': w, 'height': h}, is_mobile=mobile, has_touch=mobile, device_scale_factor=1)
    pg = await ctx.new_page(); pg.set_default_timeout(900000)
    async def r3(route): await route.fulfill(body=THREE, content_type='application/javascript', headers={'Access-Control-Allow-Origin': '*'})
    await pg.route('**/three@0.160.0/**', r3)
    async def nofont(route): await route.fulfill(body='', content_type='text/css')
    await pg.route('**/fonts.googleapis.com/**', nofont); await pg.route('**/fonts.gstatic.com/**', lambda r: r.abort())
    pg.on('console', lambda m: print('[console]', m.type, m.text[:400], flush=True) if m.type in ('error', 'warning') else None)
    pg.on('pageerror', lambda e: print('[pageerror]', str(e)[:600], flush=True))
    pg.on('crash', lambda *a: print('[CRASH]', flush=True))
    return b, pg

async def boot(pg, mid='sat', save=None, port=None):
    port = port or PORT
    await pg.goto(f'http://127.0.0.1:{port}/dev.html')
    await pg.evaluate("""([mid, save]) => { localStorage.setItem('lethe.sel', JSON.stringify({ id: mid, t: Date.now() })); if (save) localStorage.setItem('lethe.room' + mid + '.v1', JSON.stringify(save)); }""", [mid, save])
    await pg.reload()
    await pg.wait_for_function("() => window.__lethe && window.__lethe.G.mode === 'title'", timeout=600000)
    t0 = time.time()
    await pg.wait_for_function("() => !document.querySelector('#bNew').disabled", timeout=900000)
    print(f'built in {time.time() - t0:.0f}s', flush=True)

async def begin(pg, cont=False):
    await pg.evaluate(f"() => document.querySelector('{'#bCont' if cont else '#bNew'}').click()")
    await pg.wait_for_function("() => window.__lethe.G.mode === 'play'", timeout=120000)
    await park(pg)

async def park(pg):
    await pg.evaluate("() => { window.__lethe.G.mode = 'manual'; }")

async def step(pg, secs, dt=0.05):
    n = int(secs / dt)
    await pg.evaluate(f"""() => {{ const L = window.__lethe; L.G.mode = 'play'; for (let i = 0; i < {n}; i++) L.update({dt}); L.G.mode = 'manual'; }}""")

async def shot(pg, name):
    await pg.evaluate("() => { const L = window.__lethe; L.G.mode = 'play'; L.scene.updateMatrixWorld(true); L.render(0.016); L.G.mode = 'manual'; }")
    p = f'{SHOTS}/{name}.png'; await pg.screenshot(path=p, timeout=900000); print('shot', p, flush=True); return p

async def ev(pg, js, arg=None):
    return await pg.evaluate(js, arg) if arg is not None else await pg.evaluate(js)

async def place(pg, x, y, z, yaw, pitch=0, crouch=False):
    await pg.evaluate(f"""() => {{ const L = window.__lethe; const R = L.ROOM.debug; const B = R.BODY; L.P.x = {x}; L.P.z = {z}; if (B.on) {{ B.y = B.ys = {y}; B.vy = 0; B.ground = true; B.crouch = {str(crouch).lower()}; B.eye = {str(crouch).lower()} ? B.crouchEye : B.standEye; L.G.eye = L.G.eyeT = {y} + B.eye; }} else {{ L.G.eye = L.G.eyeT = {y}; }} L.G.yaw = {yaw}; L.G.pitch = {pitch}; L.camera.position.set({x}, L.G.eye, {z}); L.camera.rotation.set({pitch}, {yaw}, 0); L.camera.updateMatrixWorld(); L.scene.updateMatrixWorld(true); }}""")

async def hover(pg):
    return await pg.evaluate("() => { const L = window.__lethe; L.scene.updateMatrixWorld(true); const d = L.probe(); if (!d) return null; const a = (d.actions ? d.actions() : []).filter(Boolean).map(x => x.label); return { id: d.id, name: typeof d.name === 'function' ? d.name() : d.name, acts: a }; }")

async def act(pg, i=0):
    await pg.evaluate(f"() => {{ const L = window.__lethe; L.G.mode = 'play'; L.scene.updateMatrixWorld(true); L.G.hover = L.probe(); L.act({i}); L.G.mode = 'manual'; }}")


FY = 3.0
R = 'window.__lethe.ROOM.debug'
LOG = []
def log(*a):
    s = ' '.join(str(x) for x in a); print(s, flush=True); LOG.append(s)

async def center(pg, iid):
    return await ev(pg, """(id) => { const L = window.__lethe; const d = L.INTER.get(id); if (!d) return null; d.obj.updateMatrixWorld(true); const b = new (L.scene.position.constructor === undefined ? Object : Object)(); const box = new (Object.getPrototypeOf(L.camera.position).constructor)();
      // world-space bounding centre of the object
      let mn = [1e9,1e9,1e9], mx = [-1e9,-1e9,-1e9]; const v = L.camera.position.clone();
      d.obj.traverse(o => { if (!o.isMesh || !o.geometry) return; o.geometry.computeBoundingBox(); const bb = o.geometry.boundingBox; for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) for (const z of [bb.min.z, bb.max.z]) { v.set(x, y, z).applyMatrix4(o.matrixWorld); mn = [Math.min(mn[0], v.x), Math.min(mn[1], v.y), Math.min(mn[2], v.z)]; mx = [Math.max(mx[0], v.x), Math.max(mx[1], v.y), Math.max(mx[2], v.z)]; } });
      if (mn[0] > 1e8) { d.obj.getWorldPosition(v); return [v.x, v.y, v.z]; }
      return [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2]; }""", iid)

async def look_at(pg, tx, ty, tz):
    await ev(pg, f"""() => {{ const L = window.__lethe; const cx = L.P.x, cz = L.P.z, cy = L.G.eye; const dx = {tx} - cx, dy = {ty} - cy, dz = {tz} - cz; const h = Math.hypot(dx, dz); L.G.yaw = Math.atan2(-dx, -dz); L.G.pitch = Math.atan2(dy, h); L.camera.position.set(cx, cy, cz); L.camera.rotation.set(L.G.pitch, L.G.yaw, 0); L.camera.updateMatrixWorld(); }}""")

async def stand(pg, x, z, y=FY, crouch=False):
    await ev(pg, f"""() => {{ const L = window.__lethe; const B = L.ROOM.debug.BODY; L.P.x = {x}; L.P.z = {z}; B.y = B.ys = {y}; B.vy = 0; B.ground = true; B.crouch = {str(crouch).lower()}; B.eye = B.crouch ? B.crouchEye : B.standEye; L.G.eye = L.G.eyeT = {y} + B.eye; }}""")
    await step(pg, 0.1)

async def do(pg, iid, label, at=None, aim=None, crouch=False, must=True):
    """Stand at `at` (x, z), aim at the thing, check the probe finds it, then run the action whose label contains `label`."""
    if at: await stand(pg, at[0], at[1], crouch=crouch)
    c = aim or await center(pg, iid)
    await look_at(pg, *c)
    h = await hover(pg)
    if not h or h['id'] != iid:
        log(f'  !! aim: wanted {iid}, probe found {h and h["id"]} (from {at}, at {[round(v, 2) for v in c]})')
        if must:
            # fall back to the action directly, so the run can go on
            labels = await ev(pg, "(id) => window.__lethe.INTER.get(id).actions().filter(Boolean).map(a => a.label)", iid)
            i = next((k for k, l in enumerate(labels) if label.lower() in l.lower()), None)
            if i is None: log(f'  !! no action "{label}" on {iid}: {labels}'); return False
            await ev(pg, "([id, i]) => { const L = window.__lethe; L.G.mode = 'play'; L.INTER.get(id).actions().filter(Boolean)[i].run(); L.G.mode = 'manual'; }", [iid, i])
            return True
        return False
    i = next((k for k, l in enumerate(h['acts']) if label.lower() in l.lower()), None)
    if i is None: log(f'  !! no action "{label}" on {iid}: {h["acts"]}'); return False
    if i > 1: log(f'  !! action "{label}" is #{i} on {iid}, past E/R: {h["acts"]}')
    await act(pg, i)
    return True

async def key(pg, code, hold=0.0):
    await ev(pg, "() => { window.__lethe.G.mode = 'play'; }")
    await pg.keyboard.down(code)
    if hold: await step(pg, hold)
    await ev(pg, "() => { window.__lethe.G.mode = 'play'; }")
    await pg.keyboard.up(code)
    await ev(pg, "() => { window.__lethe.G.mode = 'manual'; }")

async def close_ui(pg):
    await ev(pg, "() => { const L = window.__lethe; if (L.UI.kind) L.UI.close(); }")

async def until(pg, cond, secs, chunk=0.5, what='', real=False):
    t = 0
    while t < secs:
        if await ev(pg, f"() => {{ const L = window.__lethe, S = L.S, D = {R}, V = D.V; return !!({cond}); }}"): return t
        t0 = time.time(); await step(pg, chunk); t += chunk
        if real: await asyncio.sleep(max(0, chunk - (time.time() - t0)))
    log(f'  !! timed out after {secs}s waiting for {what or cond}')
    return None

async def st(pg, expr):
    return await ev(pg, f"() => {{ const L = window.__lethe, S = L.S, D = {R}, V = D.V; return {expr}; }}")

async def subs(pg):
    return await ev(pg, "() => { const e = document.querySelector('#sub, .sub, #subs'); return e ? e.innerText.slice(0, 160) : ''; }")

async def solve():
    async with async_playwright() as p:
        b, pg = await launch(p)
        await boot(pg)
        await begin(pg)
        await step(pg, 4)
        log('woke at', await st(pg, "[L.P.x.toFixed(2), L.P.z.toFixed(2), L.G.eye.toFixed(2)]"))

        # --- the lamp from the locker
        await do(pg, 'locker', 'Open', at=(-0.9, 0.5)); await step(pg, 1)
        await do(pg, 'locker', 'Take', at=(-0.9, 0.5)); await step(pg, 0.5)
        log('lamp taken:', await st(pg, 'S.flags.lampTaken'))
        await key(pg, 'KeyF'); await step(pg, 0.5)
        log('lamp on:', await st(pg, 'S.lampOn'))
        # read the colour plate, under red light, then take the cap off
        await do(pg, 'chart', 'Read', at=(1.0, -0.4)); await step(pg, 0.3)
        log('chart doc open:', await st(pg, 'L.UI.kind'), (await ev(pg, "() => document.querySelector('#card') ? document.querySelector('#card').innerText.slice(0, 120) : ''")).replace('\n', ' | '))
        await close_ui(pg)
        await ev(pg, f"() => {{ {R}.unscrewCap(); }}"); await step(pg, 0.5)
        await do(pg, 'card', 'Read', at=(0.3, -1.0)); await step(pg, 0.3); await close_ui(pg)

        # --- the gas wall: look at the banks in white light
        for k in range(5):
            await do(pg, f'bank{k}', 'Look', at=(0.9, -0.6)); await step(pg, 0.2)
            log(f'  bank{k}:', (await subs(pg))[:140])
        # mistake 1: bank 1 (oxygen) into the station
        await do(pg, 'bank0', 'Open', at=(0.9, -0.6)); await do(pg, 'out1', 'Open', at=(0.9, -0.6)); await step(pg, 1)
        log('mistake 1 (O2): wrong =', await st(pg, 'S.wrong'), 'banks open', await st(pg, 'JSON.stringify(S.bankOpen)'))
        await step(pg, 7)
        # air: bank 4 into the station, to push the water down the skirt
        await do(pg, 'bank3', 'Open', at=(0.9, -0.6)); await do(pg, 'out1', 'Open', at=(0.9, -0.6))
        t = await until(pg, 'S.lvl > 1.7', 60, what='level to the ledge'); log('level reached', await st(pg, 'S.lvl.toFixed(2)'), 'after', t)
        # mistake 2: leave it open past the bottom of the skirt
        t = await until(pg, 'S.wrong >= 2', 20, what='the burp'); log('burp: wrong =', await st(pg, 'S.wrong'), 'lvl', await st(pg, 'S.lvl.toFixed(2)'))
        await step(pg, 2)
        # again, properly this time
        await do(pg, 'out1', 'Open', at=(0.9, -0.6))
        await until(pg, 'S.lvl > 1.72', 60, what='level again'); await do(pg, 'out1', 'Close', at=(0.9, -0.6)); await do(pg, 'bank3', 'Close', at=(0.9, -0.6))
        log('level now', await st(pg, 'S.lvl.toFixed(2)'), 'bank4', await st(pg, 'S.bank[3].toFixed(0)'))

        # --- the cover: lead blocks, crucifix, clamps
        for k in range(4):
            c = await center(pg, f'lead{k}')
            ang = math.atan2(c[2], c[0]); sx, sz = math.cos(ang) * 1.45, math.sin(ang) * 1.45
            ok = await do(pg, f'lead{k}', 'Pick up', at=(sx, sz)); await step(pg, 0.3)
            # carry it away and put it down
            await stand(pg, math.cos(ang) * 1.6, math.sin(ang) * 1.6); await key(pg, 'KeyQ'); await step(pg, 0.3)
            log(f'  lead{k}: held now', await st(pg, 'D.HOLD.cur'), 'leadOn', await st(pg, 'JSON.stringify(S.leadOn)'))
        c = await center(pg, 'crucifix'); ang = math.atan2(c[2], c[0])
        await do(pg, 'crucifix', 'Lift', at=(math.cos(ang) * 1.4, math.sin(ang) * 1.4)); await step(pg, 0.5)
        await do(pg, 'cover', 'Knock', at=(-1.25, 0.6)); await step(pg, 2.5)
        await do(pg, 'cover', 'Lift', at=(-1.25, 0.6)); await step(pg, 3)
        log('cover open:', await st(pg, 'S.coverOpen'), '| leads', await st(pg, 'JSON.stringify(S.leadOn)'), 'crucifix', await st(pg, 'S.crucifixOn'), 'dogs', await st(pg, 'S.dogsOn'))
        await shot(pg, 's01_pool_open')

        # --- the ledge, the knife
        await do(pg, 'cover', 'Climb down', at=(-1.25, 0.3)); await step(pg, 4.5)
        log('on ledge:', await st(pg, 'V.onLedge'), 'pos', await st(pg, "[L.P.x.toFixed(2), D.BODY.y.toFixed(2), L.P.z.toFixed(2)]"))
        await shot(pg, 's02_ledge')
        c = await center(pg, 'knife'); await look_at(pg, *c); h = await hover(pg); log('  knife hover:', h)
        if h and h['id'] == 'knife': await act(pg, 0)
        else: await ev(pg, f"() => {{ const L = window.__lethe; L.G.mode = 'play'; L.INTER.get('knife').actions()[0].run(); L.G.mode = 'manual'; }}")
        await step(pg, 0.5); log('knife:', await st(pg, 'S.flags.knifeGot'))
        await do(pg, 'ledgeUp', 'Climb', aim=None); await step(pg, 4)
        log('back up:', await st(pg, "[V.onLedge, D.BODY.y.toFixed(2)]"))

        # --- the intercom: CHAMBRE, out to the SAS speaker, listen; then go to the wet room
        await do(pg, 'intercom', 'Output', at=(5.6, 0.2)) if False else None
        ic = await ev(pg, "() => [...window.__lethe.INTER.keys()].filter(k => /^ic|intercom/.test(k))"); log('intercom ids', ic)
        await ev(pg, "() => { const S = window.__lethe.S; S.icSel = 'chambre'; S.icOut = 'sas'; S.icListen = true; }")
        await stand(pg, 0.6, 0.9); await step(pg, 1)
        t = await until(pg, "S.heard.includes('c1')", 90, what='conversation 1', real=True); log('c1 heard after', t)

        # --- the pot: purge, open, take
        c = await center(pg, 'purge'); log('purge at', [round(v, 2) for v in c])
        await do(pg, 'purge', 'Open', at=(0.55, 0.75)); await step(pg, 1)
        await until(pg, 'S.potPurge >= 1', 20, what='purge')
        await do(pg, 'pot', 'Open', at=(0.55, 0.75)); await step(pg, 1.5)
        await do(pg, 'pot', 'canisters', at=(0.55, 0.75)); await do(pg, 'pot', 'post', at=(0.55, 0.75)); await step(pg, 0.5)
        log('pot:', await st(pg, "[S.potOpen, S.inv.join(',')]"))

        # --- the scrubber
        sc = await center(pg, 'scrubber'); log('scrub at', [round(v, 2) for v in sc])
        at = (sc[0], 0.25 if sc[2] < 0 else -0.25)
        await do(pg, 'scrubber', 'wing nuts', at=at); await step(pg, 2)
        await do(pg, 'scrubber', 'Lift out', at=at); await step(pg, 0.5)
        await stand(pg, at[0] - 0.8, 0); await key(pg, 'KeyQ'); await step(pg, 0.3)
        await do(pg, 'scrubber', 'Fit', at=at); await step(pg, 0.5)
        await do(pg, 'scrubber', 'Close', at=at); await step(pg, 3)
        log('scrubbed:', await st(pg, 'S.flags.scrubbed'), 'held', await st(pg, 'D.HOLD.cur'))
        await shot(pg, 's03_module')

        # --- conversation 2 and 3 on the relay
        await stand(pg, 0.6, 0.9); await step(pg, 1)
        t = await until(pg, "S.heard.includes('c2')", 120, what='conversation 2', real=True); log('c2 heard after', t)
        t = await until(pg, "S.heard.includes('c3')", 120, what='conversation 3', real=True); log('c3 heard after', t)
        log('sortie:', await st(pg, 'S.ev.sortie'))

        # --- knocking: three (wrong), then four
        hx = await center(pg, 'hatch')
        await do(pg, 'hatch', 'Knock', at=(hx[0] - 1.0, hx[2])); await do(pg, 'hatch', 'Knock', at=(hx[0] - 1.0, hx[2])); await do(pg, 'hatch', 'Knock', at=(hx[0] - 1.0, hx[2]))
        await until(pg, "S.heard.includes('kx')", 20, what='kx', real=True); log('3 knocks: wrong =', await st(pg, 'S.wrong'))
        await step(pg, 46)
        for i in range(4): await do(pg, 'hatch', 'Knock', at=(hx[0] - 1.0, hx[2])); await step(pg, 0.4)
        t = await until(pg, 'S.passReady', 40, what='pass ready', real=True); log('pass ready after', t)
        px = await center(pg, 'pass')
        await do(pg, 'pass', 'Open', at=(px[0] - 0.9, px[2] * 0.5)); await step(pg, 0.8)
        await do(pg, 'pass', 'Take', at=(px[0] - 0.9, px[2] * 0.5)); await step(pg, 1.5)
        log('key:', await st(pg, "[S.flags.keyGot, S.inv.join(','), L.UI.kind]")); await close_ui(pg)
        t = await until(pg, 'V.ringing > 0', 40, what='the phone', real=True); log('phone rings after', t)
        ph = await center(pg, 'phone'); await do(pg, 'phone', 'Pick', at=(ph[0], ph[2] * 0.3)); await until(pg, "S.heard.includes('ph3')", 20, what='p3', real=True)
        log('phone heard:', await st(pg, "S.heard.join(',')"))

        # --- floods, the face at the glass
        await do(pg, 'floods', 'on', at=(-0.3, -1.3)); await step(pg, 2)
        log('floods:', await st(pg, 'S.floods'))

        # --- the tank: Vasseur's, into the fill stand, fill from bank 4
        tk = await ev(pg, f"() => {R}.O.tanks.map((t, k) => [k, t.userData.slot])"); log('tanks', tk)
        k1 = next(k for k, s in tk if s == 1)
        c = await center(pg, f'tank{k1}'); ang = math.atan2(c[2], c[0])
        await do(pg, f'tank{k1}', 'Pick up', at=(math.cos(ang) * 1.35, math.sin(ang) * 1.35)); await step(pg, 0.3)
        await do(pg, 'fill', 'Stand', at=(1.2, -0.3)); await step(pg, 0.5)
        await do(pg, 'bank3', 'Open', at=(0.9, -0.6)); await do(pg, 'out2', 'Open', at=(0.9, -0.6))
        t = await until(pg, 'S.tankBar >= 155', 60, what='tank fill'); log('tank', await st(pg, 'S.tankBar.toFixed(0)'), 'bank4', await st(pg, 'S.bank[3].toFixed(0)'))
        await do(pg, 'out2', 'Close', at=(0.9, -0.6))
        # blow the bell down, watching from the main module's north porthole
        await do(pg, 'out0', 'Open', at=(0.9, -0.6))
        await stand(pg, 9.2, -0.6); await look_at(pg, 9.7, 2.9, -4.6); await step(pg, 4)
        await shot(pg, 's04_bell_blowing')
        t = await until(pg, 'S.flags.bellBlown', 30, what='bell blown'); log('bell blown after', t, 'bank4', await st(pg, 'S.bank[3].toFixed(0)'))
        await step(pg, 1); log('  says:', await subs(pg))
        await do(pg, 'out0', 'Close', at=(0.9, -0.6)); await do(pg, 'bank3', 'Close', at=(0.9, -0.6))
        await do(pg, 'fill', 'Take', at=(1.2, -0.3)); await step(pg, 0.5)
        mk = [k for k in await ev(pg, "() => [...window.__lethe.INTER.keys()].filter(k => /^mask/.test(k))")]
        c = await center(pg, 'mask2'); ang = math.atan2(c[2], c[0])
        await do(pg, 'mask2', 'Take', at=(math.cos(ang) * 1.35, math.sin(ang) * 1.35)); await step(pg, 1)
        log('kit:', await st(pg, "[S.flags.kitReady, S.inv.join(',')]"))

        # --- the dive
        save1 = await st(pg, "JSON.stringify(S)")
        open(os.path.join(SHOTS, 'save_predive.json'), 'w').write(save1)
        await do(pg, 'cover', 'Go down', at=(-1.25, 0.3)); await step(pg, 5.5)
        log('mode:', await st(pg, 'V.mode'), 'eye', await st(pg, 'L.G.eye.toFixed(2)'))
        # swim: forward with W for a couple of seconds, looking down the skirt
        await ev(pg, "() => { const L = window.__lethe; L.G.pitch = -1.2; L.G.yaw = 0; }")
        y0 = await st(pg, 'L.G.eye'); await key(pg, 'KeyW', hold=2.0); log('swim W 2s: eye', round(y0, 2), '->', await st(pg, 'L.G.eye.toFixed(2)'))
        # out from under the skirt toward the body (teleport along the way, inside the water)
        await ev(pg, "() => { const L = window.__lethe; L.P.x = 0.3; L.P.z = -0.9; L.G.eye = L.G.eyeT = 1.5; L.G.yaw = 0.95; L.G.pitch = 0.05; }")
        await step(pg, 0.5)
        t = await until(pg, 'S.flags.bodyRevealed', 30, chunk=0.25, what='the reveal'); log('revealed after', t)
        await shot(pg, 's05_after_reveal')
        await ev(pg, f"() => {{ const L = window.__lethe; L.G.mode = 'play'; const a = {R}.swimActs(); L.G.mode = 'manual'; return a.map(x => x.label); }}")
        acts = await ev(pg, f"() => {R}.swimActs().map(x => x.label)"); log('swim acts near him:', acts)
        await key(pg, 'KeyE'); await step(pg, 1); log('cut:', await st(pg, 'S.flags.bodyCut'))
        await key(pg, 'KeyE'); await step(pg, 1); log('tow:', await st(pg, 'S.flags.bodyTow'))
        # tow him to the bell's shackle
        await ev(pg, "() => { const L = window.__lethe; L.P.x = 9.3; L.P.z = -2.9; L.G.eye = L.G.eyeT = 2.2; L.G.yaw = -0.3; L.G.pitch = 0.0; }")
        await step(pg, 2)
        acts = await ev(pg, f"() => {R}.swimActs().map(x => x.label)"); log('swim acts at the bell:', acts, 'nearClip', await st(pg, 'V.nearClip'))
        await key(pg, 'KeyE'); await step(pg, 1); log('clipped:', await st(pg, 'S.flags.bodyClipped'))
        await shot(pg, 's06_clipped')
        # under the bell, up into it
        await ev(pg, "() => { const L = window.__lethe; L.P.x = 9.7; L.P.z = -4.6; L.G.eye = L.G.eyeT = 2.1; L.G.pitch = 1.0; }")
        await step(pg, 0.5)
        acts = await ev(pg, f"() => {R}.swimActs().map(x => x.label)"); log('under the bell:', acts)
        await key(pg, 'KeyE'); await step(pg, 3.5); log('mode:', await st(pg, 'V.mode'))
        await shot(pg, 's07_in_bell')
        # the door, the key, the release
        dh = await ev(pg, "() => window.__lethe.INTER.has('bellDoor')"); log('bellDoor registered', dh)
        await ev(pg, "() => { const L = window.__lethe; L.G.pitch = -1.2; }"); await step(pg, 0.1)
        h = await hover(pg); log('  looking down:', h)
        for lab in ('Close the door', 'Dog it'):
            await do(pg, 'bellDoor', lab, aim=[9.7, 2.45, -4.6]); await step(pg, 1.6)
        log('door:', await st(pg, '[S.doorShut, S.doorDogged]'))
        rc = await center(pg, 'release')
        await do(pg, 'release', 'Put the key', aim=rc); await step(pg, 0.5)
        await do(pg, 'release', 'Turn', aim=rc); await step(pg, 1)
        log('released:', await st(pg, 'S.flags.released'))
        await step(pg, 10); await shot(pg, 's08_ride')
        t = await until(pg, "!document.querySelector('#end').hidden", 30, what='the end page'); log('end after', t)
        await step(pg, 0.5)
        endtxt = await ev(pg, "() => document.querySelector('#end') && !document.querySelector('#end').hidden ? document.querySelector('#end').innerText.slice(0, 600) : 'NO END'")
        log('END:', endtxt.replace('\n', ' | '))
        await pg.screenshot(path=os.path.join(SHOTS, 's09_end.png'))
        await b.close()

async def resume():
    base = json.loads(open(os.path.join(SHOTS, 'save_predive.json')).read())
    async with async_playwright() as p:
        # each part in a fresh browser: reloading one page again and again runs SwiftShader out of memory
        # 1. the moon pool's level window, from a fresh start
        b, pg = await launch(p); await boot(pg); await begin(pg); await step(pg, 2)
        await ev(pg, "() => { const S = window.__lethe.S; S.bankOpen[3] = true; S.outOpen.station = true; }")
        t1 = await until(pg, 'S.lvl >= 1.46', 60, chunk=0.25, what='ledge level'); t2 = await until(pg, 'S.wrong >= 1', 30, chunk=0.25, what='burp')
        log(f'level: ledge after {t1}s, then burp {t2}s later'); await b.close()
        # 2. continue from the save made just before the dive, and dive
        b, pg = await launch(p); await boot(pg, save=base); await begin(pg, cont=True); await step(pg, 1)
        log('resume pre-dive:', await st(pg, "JSON.stringify({mode: V.mode, P: [L.P.x.toFixed(2), D.BODY.y.toFixed(2), L.P.z.toFixed(2)], cover: S.coverOpen, kit: S.flags.kitReady, inv: S.inv, tankAt: S.tankAt})"))
        await do(pg, 'cover', 'Go down', at=(-1.25, 0.3)); await step(pg, 5.5)
        log('dive after resume:', await st(pg, 'V.mode')); await b.close()
        # 3. a save in the water, him cut free and in tow: back at the ladder, he drifts free
        sv = dict(base); sv['flags'] = dict(base['flags'], dived=True, bodyRevealed=True, bodyCut=True, bodyTow=True); sv['mode'] = 'swim'; sv['player'] = {'x': 3.0, 'y': 0, 'z': -2.0, 'yaw': 0, 'pitch': 0}
        b, pg = await launch(p); await boot(pg, save=sv); await begin(pg, cont=True); await step(pg, 1)
        log('resume mid-swim:', await st(pg, "JSON.stringify({mode: V.mode, P: [L.P.x.toFixed(2), D.BODY.y.toFixed(2), L.P.z.toFixed(2)], tow: S.flags.bodyTow, body: [D.O.body.position.x.toFixed(2), D.O.body.position.y.toFixed(2), D.O.body.position.z.toFixed(2)]})"))
        await b.close()
        # 4. a save on the way up: back in the bell, she goes up again, to the end
        sv = dict(base); sv['flags'] = dict(base['flags'], dived=True, bodyRevealed=True, bodyCut=True, bodyClipped=True, inBell=True, doorShut=True, released=True); sv['mode'] = 'bell'; sv['doorShut'] = True; sv['doorDogged'] = True; sv['keyIn'] = True
        sv['player'] = {'x': 9.7, 'y': 0, 'z': -4.6, 'yaw': 0, 'pitch': 0}
        b, pg = await launch(p); await boot(pg, save=sv); await begin(pg, cont=True); await ev(pg, "() => { window.__lethe.A.ready = false; }"); await step(pg, 1)
        log('resume mid-ride:', await st(pg, "JSON.stringify({mode: V.mode, P: [L.P.x.toFixed(2), L.G.eye.toFixed(2), L.P.z.toFixed(2)]})"))
        await shot(pg, 'r03_resumed_ride')   # render along the way: compiling everything at once in the end photo is too much for SwiftShader
        for i in range(6): await step(pg, 4); await shot(pg, f'r04_ride_{i}')
        await until(pg, "!document.querySelector('#end').hidden", 20, what='end page')
        log('  end:', await ev(pg, "() => document.querySelector('#end').hidden ? 'NO END' : document.querySelector('#endTitle').innerText"), '| fov', await ev(pg, "() => window.__lethe.camera.fov"))
        await b.close()

async def main():
    want = set(sys.argv[1:]) or {'solve', 'resume'}
    if 'solve' in want: await solve()
    if 'resume' in want: await resume()

if __name__ == '__main__':
    srv = serve()
    try: asyncio.run(main())
    finally: srv.shutdown()
