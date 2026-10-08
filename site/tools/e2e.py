#!/usr/bin/env python3
"""Headless check of a running site: landing page, sign-in dialog, a door, Begin asking for
Google sign-in, then (with a session cookie) the game page loading a room through the host
bridge, events reaching the server, sharing, feedback, results synced onto the doors, and
the dashboard for the admin account.

    python3 tools/e2e.py http://localhost:3100 [session-cookie-value] [shots-dir]

The session cookie is the value of better-auth.session_token for a signed-in account that
has confirmed 18+ (locally: MR_DEV_PASSWORD_LOGIN=true, sign up with email and password).

Needs: pip install playwright && python3 -m playwright install chromium
"""
import json, os, sys, time
from playwright.sync_api import sync_playwright

BASE = sys.argv[1].rstrip('/') if len(sys.argv) > 1 else 'http://localhost:3100'
COOKIE = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] != '-' else None
SHOTS = sys.argv[3] if len(sys.argv) > 3 else os.path.join(os.path.dirname(os.path.abspath(__file__)), 'shots')
os.makedirs(SHOTS, exist_ok=True)
# a normal browser's user agent: the server ignores events from headless browsers
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog', '--disable-hang-monitor']
fails = []
def check(ok, what):
    print(('ok   ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

def page_with_logs(ctx):
    pg = ctx.new_page(); logs = []
    pg.on('console', lambda m: logs.append(f'{m.type}: {m.text}'))
    pg.on('pageerror', lambda e: logs.append(f'pageerror: {e}'))
    pg.route('https://fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
    pg.route('https://fonts.gstatic.com/**', lambda r: r.abort())
    return pg, logs

with sync_playwright() as p:
    b = p.chromium.launch(args=ARGS)

    # ---- signed out: landing, sign-in dialog, a door, Begin asks for Google ----
    ctx = b.new_context(viewport={'width': 1280, 'height': 800}, user_agent=UA)
    pg, logs = page_with_logs(ctx)
    pg.goto(BASE + '/'); pg.wait_for_timeout(2500)
    check(pg.locator('#mrAccount button', has_text='Sign in').count() == 1, 'signed-out visitor sees a Sign in button')
    check(pg.locator('#doors .dbtn').count() >= 9, f"corridor has doors ({pg.locator('#doors .dbtn').count()})")
    check(pg.evaluate('typeof window.MR') == 'object' and pg.evaluate('window.MR.v') == 1, 'mr.js loaded')
    pg.screenshot(path=f'{SHOTS}/01-landing.png')
    pg.click('#mrAccount button'); pg.wait_for_timeout(300)
    check(pg.locator('.mrm #mrGo').is_disabled(), 'Continue with Google is disabled until 18+ is ticked')
    pg.check('#mrAge'); check(not pg.locator('.mrm #mrGo').is_disabled(), 'ticking 18+ enables Continue with Google')
    pg.screenshot(path=f'{SHOTS}/02-signin.png')
    pg.click('.mrm .x')
    pg.evaluate("document.querySelector('#doors .dbtn[data-id=\"tio\"]').scrollIntoView({block:'center'})"); pg.wait_for_timeout(400)
    url0 = pg.url; pg.click('#doors .dbtn[data-id="tio"]'); pg.wait_for_timeout(900)
    check(pg.url == url0 and pg.locator('.mrm h2', has_text='Sign in to play').count() == 1, 'signed out, a door opens the sign-in dialog in place')
    check(pg.locator('#room').count() == 0, 'no second panel in between')
    pg.screenshot(path=f'{SHOTS}/03-door-signin.png')
    pg.click('.mrm .x')
    anon = pg.evaluate('MR.anon')
    pg.evaluate('MR.flush()'); pg.wait_for_timeout(500)
    csp = [l for l in logs if 'Content Security Policy' in l or 'pageerror' in l]
    check(not csp, 'landing: no script errors or CSP blocks' + (f': {csp[:3]}' if csp else ''))
    pg.goto(BASE + '/play/lamp'); pg.wait_for_timeout(1500)
    check('signin=required' in pg.url and pg.locator('.mrm h2', has_text='Sign in to play').count() == 1, 'signed out, /play/lamp sends you to sign in')
    ctx.close()

    # ---- signed in: the game page, an escape, a share, feedback; results on the doors; the dashboard ----
    if COOKIE:
        ctx = b.new_context(viewport={'width': 1280, 'height': 800}, user_agent=UA)
        ctx.add_cookies([{'name': 'better-auth.session_token', 'value': COOKIE, 'url': BASE}])
        pg2, logs2 = page_with_logs(ctx)
        # a door goes straight to the room's own screen: one screen before playing, already filled in by the server
        pg2.goto(BASE + '/'); pg2.wait_for_timeout(2500)
        pg2.evaluate("document.querySelector('#doors .dbtn[data-id=\"tio\"]').scrollIntoView({block:'center'})"); pg2.wait_for_timeout(400)
        pg2.click('#doors .dbtn[data-id="tio"]'); pg2.wait_for_url('**/play/tio', timeout=20000)
        check(pg2.url.endswith('/play/tio'), 'signed in, a door opens /play/tio')
        check(pg2.is_visible('#title') and pg2.inner_text('#tTitle') == 'El Tío' and 'Level 3' not in pg2.inner_text('#tHook'), "the room's screen shows at once, with its story")
        pg2.screenshot(path=f'{SHOTS}/03-room-screen.png')
        pg2.go_back(); pg2.wait_for_timeout(1200)
        check(not pg2.evaluate("document.documentElement.classList.contains('locked')"), 'the back button returns to a usable corridor')
        pg2.goto(BASE + '/play/lamp')
        pg2.wait_for_selector('#title:not([hidden])', timeout=60000)
        check(pg2.inner_text('#tTitle') == 'The Lamp Room', '/play/lamp opens The Lamp Room title screen')
        t0 = time.time()
        while pg2.is_disabled('#bNew') and time.time() - t0 < 180: pg2.wait_for_timeout(1000)
        check(not pg2.is_disabled('#bNew'), f'room built and ready ({time.time() - t0:.0f}s)')
        pg2.screenshot(path=f'{SHOTS}/04-game-title.png')
        # software WebGL draws a frame every few seconds: let only a few frames run so the page stays responsive
        pg2.evaluate("() => { const raf = window.requestAnimationFrame.bind(window); let n = 0; window.requestAnimationFrame = f => (++n < 20 ? raf(f) : 0); }")
        pg2.click('#bNew', no_wait_after=True, timeout=90000); pg2.wait_for_timeout(4000)
        pg2.evaluate('MR.flush()'); pg2.wait_for_timeout(800)
        errs = [l for l in logs2 if 'Content Security Policy' in l or 'pageerror' in l]
        check(not errs, 'game page: no script errors or CSP blocks' + (f': {errs[:3]}' if errs else ''))
        # (no screenshots while a room is rendering: software WebGL makes them time out)
        pg2.evaluate('MR.go(null)'); pg2.wait_for_url('**/#rooms', timeout=30000)
        check(pg2.url.endswith('/#rooms'), 'quitting the game returns to the corridor')
        pg2.wait_for_timeout(1500)
        res = pg2.evaluate("""async () => { MR.emit('room_escape', { room: 'lamp', first: true, day: '2026-10-08', time: 1290, hints: 1, wrong: 0, tiers: {}, marks: [{title:'a',lvl:0},{title:'b',lvl:1},{title:'c',lvl:0}] });
                                   await new Promise(r => setTimeout(r, 800));
                                   return await MR.share({ room: 'lamp', text: 'Mystery #2 \u00b7 The Lamp Room\\nEscaped in 21:30', time: 1290, hints: 1, wrong: 0, marks: [0,1,0] }); }""")
        check(bool(res and ('/r/' in (res.get('fallback') or '') or 'Copied' in (res.get('msg') or ''))), f'share returns a link ({res})')
        pg2.evaluate("MR.feedback({ from: 'end', room: 'lamp' })"); pg2.wait_for_timeout(300)
        pg2.click('#mrRate button[data-v="4"]'); pg2.click('#mrDiff button[data-v="Just right"]'); pg2.fill('#mrTxt', 'The lighthouse was great.')
        pg2.screenshot(path=f'{SHOTS}/05b-feedback.png')
        pg2.click('#mrSend'); pg2.wait_for_timeout(800)
        check(pg2.locator('.mrm h2', has_text='Thank you').count() == 1, 'feedback form sends')
        pg = pg2
        pg.goto(BASE + '/'); pg.wait_for_timeout(3000)
        check(pg.locator('#mrAccount .av').count() == 1, 'signed-in visitor sees the account chip')
        synced = pg.evaluate("JSON.parse(localStorage.getItem('lethe.results.v1') || '{}')")
        check('lamp' in synced.get('rooms', {}), f"account results synced into the browser ({list(synced.get('rooms', {}))})")
        pg.screenshot(path=f'{SHOTS}/06-signed-in-corridor.png')
        pg.click('#mrAccount .av'); pg.wait_for_timeout(300); pg.screenshot(path=f'{SHOTS}/07-account-menu.png')
        r = pg.goto(BASE + '/admin'); pg.wait_for_timeout(1200)
        if r.status == 200:
            check(pg.locator('h1', has_text='Dashboard').count() == 1 and pg.locator('#live').count() == 1, 'dashboard opens for the admin account')
            pg.screenshot(path=f'{SHOTS}/09-admin.png', full_page=True)
        else:
            check(r.status == 403 and pg.locator('#go').count() == 1, f"anyone else gets the dashboard's sign-in page ({r.status})")
        ctx.close()
    else:
        print('skip signed-in checks (no session cookie given)')

    # ---- phone, landscape ----
    ctx = b.new_context(viewport={'width': 844, 'height': 390}, is_mobile=True, has_touch=True, device_scale_factor=2)
    pg, logs = page_with_logs(ctx)
    pg.goto(BASE + '/'); pg.wait_for_timeout(2000)
    pg.screenshot(path=f'{SHOTS}/08-phone-landscape.png')
    check(pg.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), 'phone: no sideways scroll')
    ctx.close()
    b.close()

print(json.dumps({'anon': anon, 'fails': fails}))
sys.exit(1 if fails else 0)
