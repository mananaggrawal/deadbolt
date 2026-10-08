#!/usr/bin/env python3
"""Headless check of the phone journey, sharing, and the pause key on a computer.

    python3 tools/e2e_mobile.py http://localhost:3100 [admin-session-cookie|-] [shots-dir] [--require-login]

Covers: an upright phone (landing, share panel, a door, the game's title screen, Begin waiting for the phone
to turn), arriving through a share link, Instagram's in-app browser, Esc to pause and Esc again to carry on
(with a simulated mouse capture that behaves like Chrome's), sharing a result, and the dashboard's Sharing
section. With --require-login (run the server with REQUIRE_LOGIN=true) it checks sign-in happens on the door.

Needs: pip install playwright && python3 -m playwright install chromium
"""
import json, os, re, sys, time
from playwright.sync_api import sync_playwright

args = [a for a in sys.argv[1:] if not a.startswith('--')]
REQUIRE = '--require-login' in sys.argv
BASE = (args[0] if args else 'http://localhost:3100').rstrip('/')
COOKIE = args[1] if len(args) > 1 and args[1] != '-' else None
SHOTS = args[2] if len(args) > 2 else os.path.join(os.path.dirname(os.path.abspath(__file__)), 'shots')
os.makedirs(SHOTS, exist_ok=True)
ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog', '--disable-hang-monitor']
IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
INSTA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0.0.0 Mobile Safari/537.36 Instagram 350.0.0.0.0 Android'
PHONE = dict(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, device_scale_factor=2, user_agent=IPHONE)
fails = []
def check(ok, what):
    print(('ok   ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

# behaves like Chrome's mouse capture: only straight after a click, refused for a second after Esc released it,
# and Esc while captured is taken by the browser (or, with __deliverEsc, also passed to the page)
LOCK_STUB = """(() => {
  let locked = null, lastEscExit = -1e9;
  Object.defineProperty(Document.prototype, 'pointerLockElement', { get() { return locked; }, configurable: true });
  HTMLCanvasElement.prototype.requestPointerLock = function () {
    const ok = navigator.userActivation && navigator.userActivation.isActive && performance.now() - lastEscExit > 1000;
    window.__lockTries = (window.__lockTries || 0) + 1;
    if (ok) { locked = this; setTimeout(() => document.dispatchEvent(new Event('pointerlockchange'))); return Promise.resolve(); }
    setTimeout(() => document.dispatchEvent(new Event('pointerlockerror')));
    return Promise.reject(new DOMException('refused', 'NotAllowedError'));
  };
  Document.prototype.exitPointerLock = function () { if (locked) { locked = null; setTimeout(() => document.dispatchEvent(new Event('pointerlockchange'))); } };
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && locked) { locked = null; lastEscExit = performance.now(); document.dispatchEvent(new Event('pointerlockchange')); if (!window.__deliverEsc) e.stopImmediatePropagation(); }
  }, true);
})();"""

def page_with_logs(ctx):
    pg = ctx.new_page(); logs = []
    pg.on('console', lambda m: logs.append(f'{m.type}: {m.text}'))
    pg.on('pageerror', lambda e: logs.append(f'pageerror: {e}'))
    pg.route('https://fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
    pg.route('https://fonts.gstatic.com/**', lambda r: r.abort())
    return pg, logs

def errors(logs):
    return [l for l in logs if 'pageerror' in l or 'Content Security Policy' in l]

def wait_built(pg, limit=180):
    t0 = time.time()
    while pg.is_disabled('#bNew') and time.time() - t0 < limit: pg.wait_for_timeout(1000)
    return not pg.is_disabled('#bNew')

def share_links(pg):
    pg.wait_for_function("() => { const a = document.querySelector('.mrm [data-ch=wa]'); return a && /\\/(i|r)\\/[a-z0-9]{6}/.test(decodeURIComponent(a.href)); }", timeout=8000)
    return pg.evaluate("Object.fromEntries([...document.querySelectorAll('.mrm [data-ch]')].map(a => [a.dataset.ch, a.href || '']))")

with sync_playwright() as p:
    b = p.chromium.launch(args=ARGS)

    if REQUIRE:
        # ---- sign-in required: it happens on the door, and Google would bring you back into the room ----
        ctx = b.new_context(**PHONE)
        pg, logs = page_with_logs(ctx)
        pg.goto(BASE + '/play/lamp'); pg.wait_for_timeout(2500)
        check('/m/lamp' in pg.url and 'signin=required' in pg.url, f'signed out: /play/lamp goes to its door to sign in ({pg.url})')
        check(pg.locator('.mrm h2', has_text='Sign in').count() == 1, 'the sign-in dialog is showing')
        nx = pg.evaluate("new URLSearchParams(location.search).get('next')")
        check(nx == '/play/lamp', f'after Google the player comes straight back into the room ({nx})')
        pg.locator('.mrm .x').tap(); pg.wait_for_timeout(300)
        pg.evaluate("document.querySelector('#doors .dbtn[data-id=\"tik\"]').scrollIntoView({block:'center'})"); pg.wait_for_timeout(400)
        pg.locator('#doors .dbtn[data-id="tik"]').tap(); pg.wait_for_timeout(1200)
        check(pg.locator('.mrm h2', has_text='Sign in').count() == 1, 'tapping a door while signed out asks to sign in right there')
        pg.screenshot(path=f'{SHOTS}/m20-signin-on-door.png')
        ctx.close(); b.close()
        print(json.dumps({'fails': fails})); sys.exit(1 if fails else 0)

    # ---- an upright phone: the landing page and sharing the site ----
    ctx = b.new_context(**PHONE, permissions=['clipboard-read', 'clipboard-write'])
    pg, logs = page_with_logs(ctx)
    pg.goto(BASE + '/'); pg.wait_for_timeout(2000)
    check(pg.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), 'phone: the landing page has no sideways scroll')
    robots = pg.evaluate("fetch('/robots.txt').then(r => r.text())")
    check(not re.search(r'^Disallow: /(i|r)/', robots, re.M), 'robots.txt lets link-preview bots read share links (/i/, /r/)')
    check(pg.locator('.nav .shr').is_visible(), 'phone: the top bar has a Share button')
    pg.locator('.nav .shr').tap(); pg.wait_for_timeout(300)
    links = share_links(pg)
    check(links.get('wa', '').startswith('https://wa.me/') and 'via%3Dwa' in links['wa'] and '%2Fi%2F' in links['wa'], 'site share: WhatsApp link carries an /i/ code and via=wa')
    check(set(['wa', 'tg', 'x', 'fb', 'em', 'cp']).issubset(links), f'site share: every app is offered ({sorted(links)})')
    check(pg.evaluate("document.querySelector('.mrm .mrs-apps [data-ch]').dataset.ch") == 'wa', 'phone: WhatsApp is the first choice')
    check(pg.evaluate("(() => { const i = document.querySelector('.mrm .mrs-img'); return !!i && /\\/og\\/site\\.jpg/.test(i.src); })()"), 'site share: the panel shows the link preview picture')
    check(pg.evaluate("[...document.querySelectorAll('.mrm .mrs-apps [data-ch]')].every(a => a.getBoundingClientRect().right <= innerWidth)"), 'phone: every app fits across the panel')
    check('escape' not in pg.locator('.mrm').inner_text().lower() and 'browser' not in pg.locator('.mrm').inner_text().lower(), 'site share: no "escape" or "browser" in the wording')
    pg.screenshot(path=f'{SHOTS}/m01-share-site.png')
    pg.locator('.mrm [data-ch=cp]').tap(); pg.wait_for_timeout(500)
    clip = pg.evaluate('navigator.clipboard.readText()')
    check(re.search(r'/i/[a-z0-9]{6}\?via=cp$', clip or '') is not None, f'Copy link copies a tracked link ({clip})')
    site_code = re.search(r'/i/([a-z0-9]{6})', clip or '').group(1) if clip and '/i/' in clip else None
    pg.locator('.mrm .x').tap(); pg.wait_for_timeout(300)

    # sending a room to someone (what the room's screen and pause menu open)
    pg.evaluate("MR.openShare({ kind: 'room', room: 'tik', n: 8, title: 'Tik-Tik', tagline: 'A stilt house in a typhoon.', surface: 'title' })"); pg.wait_for_timeout(300)
    links = share_links(pg)
    room_code = re.search(r'%2Fi%2F([a-z0-9]{6})', links['wa']).group(1)
    check(pg.locator('.mrm h2', has_text='Send this room').count() == 1 and room_code != site_code, 'a room share has its own link')
    pg.screenshot(path=f'{SHOTS}/m02-share-room.png')
    pg.locator('.mrm [data-ch=wa]').evaluate('a => a.addEventListener("click", e => e.preventDefault(), { once: true })')
    pg.locator('.mrm [data-ch=wa]').tap(); pg.wait_for_timeout(600)
    pg.locator('.mrm .x').tap(); pg.wait_for_timeout(200)
    # the corridor: its doors fetch the game code in the background
    pg.evaluate("document.getElementById('doors').scrollIntoView({block:'center'})"); pg.wait_for_timeout(800)
    check(pg.locator('link[rel=prefetch][href^="/game/app."]').count() == 1, 'the corridor fetches the game code in the background')
    pg.evaluate('scrollTo(0, 0)'); pg.wait_for_timeout(400)
    pg.locator('.hero [data-enter=newest]').tap()
    try: pg.wait_for_url('**/play/**', timeout=15000); inroom = True
    except Exception: inroom = False
    check(inroom, 'phone: Open the newest door goes to that room\'s screen')
    check(not errors(logs), 'landing: no script errors' + (f': {errors(logs)[:3]}' if errors(logs) else ''))
    ctx.close()

    # ---- a phone that can share files: each app gets the picture with the text and link as its caption ----
    ctx = b.new_context(**PHONE)
    ctx.add_init_script("""(() => {
      navigator.canShare = d => !!d && (!d.files || d.files.every(f => f instanceof File));
      navigator.share = async d => { window.__shared = { text: d.text || '', url: d.url || '', files: (d.files || []).map(f => ({ name: f.name, type: f.type, size: f.size })) }; };
    })()""")
    pg, logs = page_with_logs(ctx)
    pg.goto(BASE + '/'); pg.wait_for_timeout(800)
    pg.locator('.nav .shr').tap()
    pg.wait_for_function("() => /\\/i\\/[a-z0-9]{6}/.test((document.getElementById('mrLu') || {}).textContent || '')", timeout=8000)
    pg.wait_for_timeout(1200)   # the picture loads with the panel
    check(pg.locator('.mrm [data-ch=sh]').count() == 0 and pg.locator('.mrm .mrs-apps [data-ch]').count() == 5, 'phone that shares files: one row of apps, no separate "More"')
    pg.locator('.mrm [data-ch=wa]').tap(); pg.wait_for_timeout(400)
    sh = pg.evaluate('window.__shared') or {}
    f = (sh.get('files') or [{}])[0]
    check(f.get('type') == 'image/jpeg' and f.get('size', 0) > 20000 and re.search(r'/i/[a-z0-9]{6}\?via=wa$', sh.get('text', '')) and sh['text'].startswith('Deadbolt: horror mystery rooms.'),
          f'WhatsApp gets the picture with the text and link together ({f}, {sh.get("text")!r})')
    pg.evaluate("window.__shared = null; MR.openShare({ kind: 'result', room: 'tik', n: 8, title: 'Tik-Tik', text: 'Deadbolt #8 \u00b7 Tik-Tik\\nEscaped in 18:02', result: { time: 1082, hints: 0, wrong: 1, marks: [0,0,1] } })")
    pg.wait_for_function("() => /\\/r\\/[a-z0-9]{6}/.test((document.getElementById('mrLu') || {}).textContent || '')", timeout=8000)
    pg.wait_for_timeout(1500)
    pg.locator('.mrm [data-ch=tg]').tap(); pg.wait_for_timeout(400)
    sh = pg.evaluate('window.__shared') or {}
    check(re.search(r'/r/[a-z0-9]{6}\?via=tg$', sh.get('text', '')) and (sh.get('files') or [{}])[0].get('type') == 'image/jpeg', f'a result sends its own picture and /r/ link ({sh.get("text")!r})')
    check(not errors(logs), 'picture sharing: no script errors' + (f': {errors(logs)[:3]}' if errors(logs) else ''))
    pg.locator('.mrm .x').tap(); pg.wait_for_timeout(200)
    pg.evaluate("MR.openShare({ kind: 'room', room: 'tik', n: 8, title: 'Tik-Tik', tagline: 'A stilt house in a typhoon.' })"); pg.wait_for_timeout(1500)
    pg.screenshot(path=f'{SHOTS}/m01b-share-picture.png')
    ctx.close()

    # ---- what WhatsApp sees for that link: the page (kept out of search) and its picture ----
    import urllib.request
    req = urllib.request.Request(f'{BASE}/i/{room_code}?via=wa', headers={'User-Agent': 'WhatsApp/2.24.20.80 A'})
    with urllib.request.urlopen(req) as r:
        html, noindex = r.read().decode(), (r.headers.get('X-Robots-Tag') or '')
    img = re.search(r'<meta property="og:image" content="([^"]+)"', html)
    check(img and '/og/m/tik.jpg' in img.group(1) and 'noindex' in noindex, f'a share link names its room picture and asks not to be indexed ({img and img.group(1)})')
    if img:
        with urllib.request.urlopen(urllib.request.Request(img.group(1).replace(re.match(r'https?://[^/]+', img.group(1)).group(0), BASE), headers={'User-Agent': 'WhatsApp/2.24.20.80 A'})) as r:
            body = r.read()
            check(r.headers.get('Content-Type') == 'image/jpeg' and int(r.headers.get('Content-Length') or 0) == len(body) and 20_000 < len(body) < 300_000,
                  f'the picture is a JPEG with its size, under WhatsApp\'s limit ({len(body)} bytes)')

    # ---- arriving through that link, on another phone ----
    ctx = b.new_context(**PHONE)
    pg, logs = page_with_logs(ctx)
    pg.goto(f'{BASE}/i/{room_code}?via=wa')
    try: pg.wait_for_url('**/play/tik', timeout=15000); inroom = True
    except Exception: inroom = False
    check(inroom, f'an invite link opens that room ({pg.url})')
    frm = pg.evaluate("JSON.parse(localStorage.getItem('mr.from') || 'null')")
    check(bool(frm) and frm.get('code') == room_code and frm.get('via') == 'wa', f'the browser remembers which link and app it came through ({frm})')
    ctx.close()

    # ---- the game on an upright phone ----
    ctx = b.new_context(**PHONE)
    pg, logs = page_with_logs(ctx)
    pg.goto(BASE + '/play/lamp')
    check(pg.locator('#boot').count() == 1, 'the game page shows a loading screen straight away')
    pg.wait_for_selector('#title:not([hidden])', timeout=60000); pg.wait_for_timeout(800)
    check(pg.evaluate("getComputedStyle(document.getElementById('rotate')).display") == 'none', 'upright phone: the title screen is readable (no "turn your phone" yet)')
    check(pg.locator('#boot').count() == 0, 'the loading screen goes once the title is up')
    check(pg.locator('#title .rm-touch').is_visible() and 'thumb' in pg.inner_text('#title .rm-touch').lower() and not pg.locator('#title .rm-keys').is_visible(), 'phone: the title shows thumb controls, not keys')
    check(pg.locator('#tShare').is_visible() and pg.evaluate("document.getElementById('tShare').tagName") == 'BUTTON', 'the title screen offers a "Dare a friend" button')
    box = pg.locator('#bNew').bounding_box()
    check(box is not None and box['y'] + box['height'] < 740, f'upright phone: the way in is on the first screen (y={box and round(box["y"])})')
    check(pg.evaluate("document.getElementById('title').scrollWidth <= innerWidth"), 'upright phone: nothing runs off the side')
    pg.locator('#tShare').tap(); pg.wait_for_timeout(300)
    check(pg.locator('.mrm h2', has_text='Send this room').count() == 1, 'Dare a friend opens the room share panel')
    pg.locator('.mrm .x').tap(); pg.wait_for_timeout(200)
    pg.screenshot(path=f'{SHOTS}/m03-game-title-portrait.png')
    check(wait_built(pg), 'the room builds on a phone')
    pg.locator('#bNew').tap(); pg.wait_for_timeout(1200)
    check(pg.evaluate("getComputedStyle(document.getElementById('rotate')).display") == 'flex' and 'begin' in pg.inner_text('#rotMsg'), 'Begin on an upright phone asks to turn it, to begin')
    check(pg.evaluate("!document.getElementById('title').hidden && !document.body.classList.contains('playing')"), '...and the room waits instead of starting unseen')
    pg.screenshot(path=f'{SHOTS}/m04-turn-to-begin.png')
    pg.set_viewport_size({'width': 844, 'height': 390}); pg.wait_for_timeout(2500)
    check(pg.evaluate("document.getElementById('title').hidden && document.body.classList.contains('playing')"), 'turning the phone sideways starts the room')
    check(pg.evaluate("document.getElementById('tc') && document.getElementById('tc').classList.contains('busy')") in (True, False), 'touch controls are up')
    # switching apps pauses
    pg.evaluate("Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange'))")
    pg.wait_for_timeout(400)
    check(pg.locator('#card h2', has_text='Paused').count() == 1, 'leaving the app pauses the room')
    saved = pg.evaluate("Object.keys(localStorage).some(k => /^lethe\\.room.*\\.v1$/.test(k))")
    check(saved, 'leaving the app saves progress straight away')
    pg.evaluate("Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' }); Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange'))")
    check(pg.locator('#pShare').count() == 1, 'the pause menu offers "Send this room to a friend"')
    pg.set_viewport_size({'width': 390, 'height': 844}); pg.wait_for_timeout(500)
    check(pg.evaluate("getComputedStyle(document.getElementById('rotate')).display") == 'flex', 'turning upright mid-room asks to turn back')
    check(not errors(logs), 'game page (phone): no script errors' + (f': {errors(logs)[:3]}' if errors(logs) else ''))
    ctx.close()

    # ---- Instagram's in-app browser ----
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, user_agent=INSTA)
    pg, logs = page_with_logs(ctx)
    pg.goto(BASE + '/'); pg.wait_for_timeout(2000)
    bar = pg.locator('#mrbar')
    check(bar.count() == 1 and 'Instagram' in bar.inner_text(), 'in Instagram: a bar explains sign-in and full screen need Chrome')
    href = pg.get_attribute('#mrbar a', 'href') or ''
    check(href.startswith('intent://') and 'com.android.chrome' in href, 'Android: "Open in Chrome" hands the page to Chrome')
    pg.locator('#mrAccount button').tap(); pg.wait_for_timeout(300)
    check(pg.locator('.mrm', has_text="doesn't allow signing in").count() == 1 and pg.locator('#mrGo').count() == 0, 'in Instagram: sign-in explains instead of failing at Google')
    pg.screenshot(path=f'{SHOTS}/m05-instagram.png')
    ctx.close()

    # ---- a computer: Esc pauses, Esc again carries on ----
    for deliver in (False, True):
        ctx = b.new_context(viewport={'width': 1280, 'height': 800})
        ctx.add_init_script(('window.__deliverEsc = true;' if deliver else '') + LOCK_STUB)
        pg, logs = page_with_logs(ctx)
        tag = ' (browser also passes Esc to the page)' if deliver else ''
        pg.goto(BASE + '/play/lamp'); pg.wait_for_selector('#title:not([hidden])', timeout=60000)
        wait_built(pg)
        pg.click('#bNew'); pg.wait_for_timeout(6500)           # past the click's activation window
        check(pg.evaluate('document.pointerLockElement === document.getElementById("view")'), 'Begin captures the mouse' + tag)
        pg.keyboard.press('Escape'); pg.wait_for_timeout(500)
        check(pg.locator('#card h2', has_text='Paused').count() == 1, 'Esc pauses, even during the opening cutscene' + tag)
        pg.wait_for_timeout(1200); pg.click('#pRes'); pg.wait_for_timeout(500)
        check(pg.locator('#overlay').is_hidden() and pg.evaluate('document.pointerLockElement === document.getElementById("view")'), 'Resume carries on with the mouse captured' + tag)
        # (software rendering runs the game clock slowly: wait for the opening cutscene to end)
        pg.wait_for_selector('#toast >> text=notebook', timeout=180000); pg.wait_for_timeout(6500)
        pg.keyboard.press('Escape'); pg.wait_for_timeout(500)
        check(pg.locator('#card h2', has_text='Paused').count() == 1, 'Esc pauses' + tag)
        pg.wait_for_timeout(700)
        pg.keyboard.press('Escape'); pg.wait_for_timeout(800)
        check(pg.locator('#overlay').is_hidden(), 'Esc again closes the pause menu' + tag)
        try: pg.wait_for_selector('#clickhint', state='visible', timeout=10000); hint = True   # (next frame; software rendering is slow)
        except Exception: hint = False
        check(hint, '...and shows "Click to carry on"' + tag)
        check(pg.locator('#toast', has_text='no need to click').count() == 0, '...without dropping into the no-capture mouse mode' + tag)
        pg.mouse.click(640, 400); pg.wait_for_timeout(400)
        check(pg.evaluate('document.pointerLockElement === document.getElementById("view")') and pg.locator('#clickhint').is_hidden(), 'one click captures the mouse again' + tag)
        # pause, then Resume with the mouse inside Chrome's one-second refusal
        pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
        pg.click('#pRes'); pg.wait_for_timeout(400)
        check(pg.locator('#overlay').is_hidden() and pg.locator('#toast', has_text='no need to click').count() == 0, 'Resume straight after Esc never drops into the no-capture mode' + tag)
        pg.wait_for_timeout(900); pg.mouse.click(640, 400); pg.wait_for_timeout(400)
        check(pg.evaluate('document.pointerLockElement === document.getElementById("view")'), '...and the next click captures the mouse' + tag)
        check(not errors(logs), 'game page (computer): no script errors' + tag + (f': {errors(logs)[:3]}' if errors(logs) else ''))
        ctx.close()

    # ---- sharing a result (what the end screen calls) ----
    ctx = b.new_context(viewport={'width': 1280, 'height': 800})
    pg, logs = page_with_logs(ctx)
    pg.goto(BASE + '/play/lamp'); pg.wait_for_selector('#title:not([hidden])', timeout=60000); pg.wait_for_timeout(500)
    pg.evaluate("""() => { MR.emit('room_escape', { room: 'lamp', first: true, day: '2026-10-08', time: 1290, hints: 1, wrong: 0, tiers: {}, marks: [{title:'a',lvl:0},{title:'b',lvl:1},{title:'c',lvl:0}] });
                     return MR.share({ room: 'lamp', n: 2, title: 'The Lamp Room', text: 'Mystery #2 · The Lamp Room\\nEscaped in 21:30 · 1 hint\\n\U0001F7E9\U0001F7E8\U0001F7E9', time: 1290, hints: 1, wrong: 0, marks: [0,1,0] }); }""")
    links = share_links(pg)
    wa = links.get('wa', '')
    check('%2Fr%2F' in wa and 'I%20got%20out%20of%20The%20Lamp%20Room%20on%20Deadbolt' in wa and '%F0%9F%9F%A9' not in wa and '21%3A30' not in wa,
          'result share: just "I got out of The Lamp Room on Deadbolt" and an /r/ link, no squares or time')
    pg.screenshot(path=f'{SHOTS}/m06-share-result.png')
    ctx.close()

    # ---- the dashboard ----
    if COOKIE:
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
        ctx.add_cookies([{'name': 'better-auth.session_token', 'value': COOKIE, 'url': BASE}])
        pg, logs = page_with_logs(ctx)
        pg.goto(BASE + '/admin?range=all'); pg.wait_for_timeout(1500)
        # shares are counted under Acquisition since the dashboard became standard product analytics (4ae5fe6)
        sec = pg.locator('section', has=pg.locator('h2', has_text='Acquisition'))
        check(sec.count() == 1, 'dashboard has an Acquisition section')
        txt = sec.inner_text() if sec.count() else ''
        check(re.search(r'Times shared\s+[1-9]', txt) is not None, f'dashboard counts shares ({txt.splitlines()[:3]})')
        check(pg.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), 'dashboard: no sideways scroll on a phone')
        if sec.count(): sec.scroll_into_view_if_needed(); pg.wait_for_timeout(200)
        pg.screenshot(path=f'{SHOTS}/m07-admin-acquisition.png', full_page=False)
        ctx.close()
    b.close()

print(json.dumps({'fails': fails}))
sys.exit(1 if fails else 0)
