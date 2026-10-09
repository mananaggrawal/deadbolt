#!/usr/bin/env python3
"""Build the Mystery Rooms game from src/.

    python3 build.py site   ->  dist/site/            (what the self-hosted server serves)
    python3 build.py prod   ->  dist/dead-air.html    (single self-contained page, as the old artifact)
    python3 build.py dev    ->  dist/dev.html         (keeps /*DEBUG*/ ... /*END*/ blocks, e.g. window.__lethe)
    python3 build.py check  ->  prod build, then compare with live/live.html byte for byte
                                (only meaningful until src/ diverges from the last artifact)

`site` writes:
    dist/site/play.html            the game page; the server fills in <!--MR_HEAD--> (meta tags, mr.js)
    dist/site/vo.<hash>.json       every voice clip (fetched after the page opens, cached for a year)
    dist/site/rooms.json           MYSTERIES from series.js, for the server's pages and preview cards
three.js is served from /vendor/ by the server, not from jsdelivr.

Page layout (in order):
    src/shell_head.html          HTML + every room's CSS (+ new rooms' <room>.css spliced before </style>)
    <script type="module">
    const VO = {...};            src/vo_all.json merged with each new room's vo_<room>.json
    import three r160
    src/pre_core.js, core.js, audio.js, ui.js, touch.js, body.js, room406.js
    ROOMS (below): already-wrapped closures, then new rooms wrapped as const ROOM_X = (() => { ... })();
    src/series.js, src/main.js
    src/shell_tail.html          </script> and the end of the page

Everything non-ASCII in the script is escaped as \\uXXXX so text renders whatever
charset the host declares. The shell must stay ASCII (use HTML entities / CSS escapes).
"""
import hashlib, json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SRC, DIST = os.path.join(HERE, 'src'), os.path.join(HERE, 'dist')
THREE_CDN = "import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';\n"
THREE_SITE = "import * as THREE from '/vendor/three-0.160.0.module.js';\n"

ENGINE = ['pre_core.js', 'core.js', 'audio.js', 'ui.js', 'touch.js', 'body.js', 'room406.js']

# Rooms after #1, in release order. A string is a file that is already a closure
# (const ROOM_X = (() => { ... return {...}; })();). A dict is a room built as
# separate files that build.py wraps for you, e.g.
#   dict(var='ROOM_WARD', files=['ward_a.js', 'ward_b.js', 'ward_c.js', 'ward_d.js', 'ward_e.js'],
#        css='ward.css', vo='vo_ward.json'),
# Also add the room to ROOMS in main.js and to MYSTERIES in series.js, and any new
# Google Fonts family to the <link> in shell_head.html and the preload list in main.js.
# On the website, also add its door to ROOMS in site/public/landing.html.
ROOMS = [
    'lamp.js',      # 2  The Lamp Room
    'sitting.js',   # 3  The Last Sitting
    'night.js',     # 4  Night Mail
    'lift.js',      # 5  Doors Closing
    'tik.js',       # 6  Tik-Tik
    'tio.js',       # 7  El Tío
    dict(var='ROOM_DED', files=['ded_a.js', 'ded_b.js', 'ded_c.js', 'ded_d.js', 'ded_e.js'],
         css='ded.css', vo='vo_ded.json'),   # 8  Dedushka
    dict(var='ROOM_SAT', files=['sat_a.js', 'sat_b.js', 'sat_c.js', 'sat_d.js', 'sat_e.js'],
         css='sat.css', vo='vo_sat.json'),   # 9  Saturation
]

TAIL = ['series.js', 'main.js']

# Voice clips added to the older rooms after vo_all.json was frozen (kept apart so that
# file, one long line, doesn't conflict between sessions): merged after vo_all.json.
EXTRA_VO = ['vo_rework.json']

def rd(name):
    return open(os.path.join(SRC, name), encoding='utf-8').read()

def escape_js(s):
    out = []
    for ch in s:
        o = ord(ch)
        if o < 0x80: out.append(ch)
        elif o <= 0xFFFF: out.append('\\u%04x' % o)
        else:
            o -= 0x10000
            out.append('\\u%04x\\u%04x' % (0xD800 + (o >> 10), 0xDC00 + (o & 0x3FF)))
    return ''.join(out)

def strip_debug(s):
    s = re.sub(r'^[ \t]*/\*DEBUG\*/.*?/\*END\*/[ \t]*\n', '', s, flags=re.S | re.M)   # whole-line blocks
    return re.sub(r'/\*DEBUG\*/.*?/\*END\*/', '', s, flags=re.S)                       # inline blocks

def assemble():
    head, vo, css = rd('shell_head.html'), json.loads(rd('vo_all.json')), []
    js = [rd(f) for f in ENGINE]
    for r in ROOMS:
        if isinstance(r, str):
            js.append(rd(r)); continue
        body = ''.join(rd(f) if rd(f).endswith('\n') else rd(f) + '\n' for f in r['files'])
        js.append(f"const {r['var']} = (() => {{\n{body}}})();\n")
        if r.get('css'): css.append(rd(r['css']))
        if r.get('vo'):
            extra = json.loads(rd(r['vo']))
            clash = set(extra) & set(vo)
            assert not clash, f"VO clip ids already used: {sorted(clash)[:5]} (give the room its own prefix)"
            vo.update(extra)
    for f in EXTRA_VO:
        if not os.path.exists(os.path.join(SRC, f)): continue
        extra = json.loads(rd(f))
        clash = set(extra) & set(vo)
        assert not clash, f"VO clip ids already used: {sorted(clash)[:5]}"
        vo.update(extra)
    js += [rd(f) for f in TAIL]
    if css:
        i = head.rindex('</style>')
        head = head[:i] + ''.join(c if c.endswith('\n') else c + '\n' for c in css) + head[i:]
    bad = [c for c in head if ord(c) > 0x7F]
    assert not bad, f'shell_head.html has non-ASCII characters {sorted(set(bad))[:5]}: use entities or CSS escapes'
    return head, vo, ''.join(js)

def build(mode):
    head, vo, code = assemble()
    script = 'const VO = ' + json.dumps(vo) + ';\n' + THREE_CDN + code
    if mode != 'dev': script = strip_debug(script)
    page = head + '<script type="module">\n' + escape_js(script) + rd('shell_tail.html')
    os.makedirs(DIST, exist_ok=True)
    out = os.path.join(DIST, 'dev.html' if mode == 'dev' else 'dead-air.html')
    open(out, 'w', encoding='ascii').write(page)
    if mode != 'dev':
        for tok in ('__lethe', '__efs', '/*DEBUG*/'):
            assert tok not in page, f'{tok} leaked into the prod build'
    print(f'wrote {out} ({len(page):,} bytes, {page.count(chr(10)):,} lines)')
    return page

def mysteries_json():
    """Evaluate the MYSTERIES array in series.js with node and return it as data."""
    js = rd('series.js')
    i = js.index('const MYSTERIES = [') + len('const MYSTERIES = ')
    depth, j, q = 0, i, None
    while True:                                   # find the matching ] (skipping strings)
        c = js[j]
        if q:
            if c == '\\': j += 1
            elif c == q: q = None
        elif c in '\'"`': q = c
        elif c == '[': depth += 1
        elif c == ']':
            depth -= 1
            if depth == 0: break
        j += 1
    arr = js[i:j + 1]
    out = subprocess.run(['node', '-e', f'process.stdout.write(JSON.stringify({arr}))'],
                         capture_output=True, text=True, check=True).stdout
    keep = ('n', 'id', 'title', 'date', 'place', 'era', 'mins', 'hook', 'tagline', 'start', 'loading', 'theme', 'endTitle', 'wrongLabel', 'wrongWords')
    keys = room_keys()
    return [dict({k: m[k] for k in keep if k in m}, keys=keys.get(m['id'], [])) for m in json.loads(out)]

def room_keys():
    """Each room's controls (the `keys:` list its pause card shows), by room id, for the room's screen on the site."""
    sources = [rd('room406.js')] + [rd(r) if isinstance(r, str) else ''.join(rd(f) + '\n' for f in r['files']) for r in ROOMS]
    found = {}
    for src in sources:
        rid = re.search(r"^  id: '([^']+)'", src, re.M)
        ks = re.search(r'^  keys: (\[\[.*\]\]),?\s*$', src, re.M)
        if not rid or not ks: continue
        out = subprocess.run(['node', '-e', f'process.stdout.write(JSON.stringify({ks.group(1)}))'],
                             capture_output=True, text=True, check=True).stdout
        found[rid.group(1)] = json.loads(out)
    return found

def build_site():
    head, vo, code = assemble()
    vo_txt = json.dumps(vo, separators=(',', ':'))
    vo_name = 'vo.%s.json' % hashlib.sha256(vo_txt.encode()).hexdigest()[:12]
    # voices load after the page opens; audio.js decodes them as soon as both they and the audio context exist
    loader = ("var VO;\n"
              f"fetch('/game/{vo_name}').then(r => r.json()).then(j => {{ VO = j; "
              "try { if (A.ctx) { A.voLoading = false; loadVO(); } } catch (e) {} }).catch(() => {});\n")
    # MR_KEEP_DEBUG=1 keeps the window.__lethe test handle, for local headless checks only (never deploy it)
    keep = os.environ.get('MR_KEEP_DEBUG') == '1'
    script = escape_js((lambda x: x if keep else strip_debug(x))(loader + THREE_SITE + code))
    # the game code is its own file (hashed, so the CDN can cache it for good); the page is a small shell
    app_name = 'app.%s.js' % hashlib.sha256(script.encode()).hexdigest()[:12]
    # the website's look over the game's own screens: Geist, and src/deadbolt.css after every room's styles
    geist = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@300..600&family=Geist+Mono:wght@400;500&display=swap">\n'
    head = head.replace('<style>', geist + '<style>', 1)
    i = head.rindex('</style>'); head = head[:i] + rd('deadbolt.css') + head[i:]
    # the room's screen: the corridor's layout (src/deadbolt_title.html), filled in by the server for each room
    a = head.index('<section id="title" class="screen" hidden>'); b = head.index('</section>', a) + len('</section>')
    head = head[:a] + rd('deadbolt_title.html').strip() + head[b:]
    shell = '<!doctype html>\n<html lang="en">\n<meta charset="utf-8">\n<!--MR_HEAD-->\n' + head
    page = (shell + '<link rel="modulepreload" href="/vendor/three-0.160.0.module.js">\n'
            f'<script type="module" src="/game/{app_name}"></script>\n')
    for tok in (() if keep else ('__lethe', '__efs', '/*DEBUG*/', 'cdn.jsdelivr.net')):
        assert tok not in page and tok not in script, f'{tok} leaked into the site build'
    out = os.path.join(DIST, 'site')
    os.makedirs(out, exist_ok=True)
    for f in os.listdir(out):
        if (f.startswith('vo.') and f.endswith('.json') and f != vo_name) or (f.startswith('app.') and f.endswith('.js') and f != app_name):
            os.remove(os.path.join(out, f))
    open(os.path.join(out, 'play.html'), 'w', encoding='ascii').write(page)
    open(os.path.join(out, app_name), 'w', encoding='ascii').write(script)
    open(os.path.join(out, vo_name), 'w', encoding='ascii').write(vo_txt)
    json.dump({'vo': vo_name, 'app': app_name, 'mysteries': mysteries_json()},
              open(os.path.join(out, 'rooms.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'wrote {out}/play.html ({len(page):,} bytes), {app_name} ({len(script):,} bytes), {vo_name} ({len(vo_txt):,} bytes), rooms.json')

def check():
    page = build('prod')
    live_path = os.path.join(HERE, 'live', 'live.html')
    live = open(live_path, encoding='ascii').read().split('\n')
    if live[0].startswith('<!doctype html><html><head><meta charset=utf8>'): live = live[1:]
    if live and live[-1] == '</body></html>': live = live[:-1]
    live = '\n'.join(live)
    if page.rstrip('\n') == live.rstrip('\n'):
        print('OK: prod build matches live/live.html byte for byte (bar trailing newlines)')
        return
    a, b = page.split('\n'), live.split('\n')
    for k, (x, y) in enumerate(zip(a, b)):
        if x != y:
            print(f'first difference at line {k + 1}:\n build: {x[:160]}\n live : {y[:160]}'); break
    else:
        print(f'same prefix, different length: build {len(a)} lines, live {len(b)} lines')
    sys.exit(1)

if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else 'prod'
    if mode == 'check': check()
    elif mode == 'site': build_site()
    else: build(mode)
