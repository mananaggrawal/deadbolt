#!/usr/bin/env python3
"""One-off: turn the door landing page preview (an artifact) into site/public/landing.html.
Kept for the record; edit site/public/landing.html directly from now on."""
import re, sys
src, out = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()

def rep(old, new, count=1):
    global s
    n = s.count(old)
    assert n == count, f'expected {count} of {old[:70]!r}, found {n}'
    s = s.replace(old, new)

# document shell: a real <head> the server fills in (<!--MR_HEAD-->: title, meta, mr.js)
first, rest = s.split('\n', 1)
assert first.startswith('<!doctype html><html><head><meta charset=utf8>')
s = ('<!doctype html><html lang="en"><head><meta charset="utf-8">'
     '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<!--MR_HEAD-->\n' + rest)
rep('<title>Mystery Rooms</title>\n', '')
s = re.sub(r'<div class="strip">.*?</div></div>\n', '</head><body>\n', s, count=1, flags=re.S)
assert '</head><body>' in s

# art from the site root (pages like /m/<id> are one level down)
rep('src="art/tik.jpg"', 'src="/art/tik.jpg"')
rep('`<img src="art/${r.id}.jpg" alt="" decoding="async">`', '`<img src="/art/${r.id}.jpg" alt="" decoding="async">`')
rep('`<img src="art/${r.id}.jpg" alt="">`', '`<img src="/art/${r.id}.jpg" alt="">`')

# nav: the account chip (filled by mr.js)
rep('<button class="btn btn-sm" type="button" data-enter="newest">Play the newest room</button>',
    '<span id="mrAccount"></span>\n      <button class="btn btn-sm" type="button" data-enter="newest">Play the newest room</button>')
rep('.nav-right { display: flex; align-items: center; gap: 8px; }',
    '.nav-right { display: flex; align-items: center; gap: 8px; }\n#mrAccount { display: inline-flex; align-items: center; min-height: 32px; }')

# copy: no account needed to play; signing in keeps results everywhere
rep('<p class="note">No download and no sign-up. 20 to 40 minutes a room. Headphones on.</p>',
    '<p class="note">No download, and no account needed. 20 to 40 minutes a room. Headphones on.</p>')
rep("<p>Yes. There's no account to make and nothing to install. Open a door and you're in.</p>",
    "<p>Yes. There's nothing to install and you don't need an account. Open a door and you're in. Sign in with Google only if you want your results kept on every device.</p>")
rep('<details class="faq"><summary>Can I continue on another device?</summary><p>Not yet. Your progress and results are kept in the browser you played in.</p></details>',
    '<details class="faq"><summary>Can I continue on another device?</summary><p>Your results can. Sign in with Google on each device and your escapes and squares follow you. A room you leave halfway picks up again on the device you were playing on.</p></details>\n'
    '        <details class="faq"><summary>What do you keep about me?</summary><p>As a guest, only an anonymous record of how each room went, so we can see where people get stuck. Signed in, also your name, email and results. The <a href="/privacy" style="text-decoration:underline;text-underline-offset:3px">privacy page</a> has the details.</p></details>')
rep('<li><span class="k">Time</span><span>20 to 40 minutes. Leave halfway and the room waits for you in this browser.</span></li>',
    '<li><span class="k">Time</span><span>20 to 40 minutes. Leave halfway and the room waits for you on this device.</span></li>')
rep("<div class=\"txt\"><h4>Your night, in squares</h4><p>When you get out, each puzzle becomes a square. Copy it and send it to a friend who hasn't played yet, without giving anything away.</p></div>",
    "<div class=\"txt\"><h4>Your night, in squares</h4><p>When you get out, each puzzle becomes a square. Share them with a link to your result, and your friends can try the same room without anything given away.</p></div>")
rep('<span class="faint">No account. Nothing to install.</span>',
    '<span class="faint"><a href="/privacy">Privacy</a> &middot; <a href="/terms">Terms</a></span>')

# the room's title screen: Begin goes straight into the game on this site
rep('<a class="btn" id="rStart" href="https://claude.ai/artifact/Bk5N9ftkTCgtNvXxu6DRce" target="_blank" rel="noopener">Begin</a>',
    '<a class="btn" id="rStart" href="/">Begin</a>')
rep('<p class="rnote">Preview: this button opens the current game in a new tab, where you pick this room from the list. In the finished version it starts the room right here.</p>',
    '<p class="rnote" id="rNote"></p>')

# script: rooms that are open today (the server says which), statuses, deep links
rep("const LIVE = 'https://claude.ai/artifact/Bk5N9ftkTCgtNvXxu6DRce';\n", '')
s = s.replace('const ROOMS = [{"n": 1,', 'const ROOMS_ALL = [{"n": 1,', 1)
rep("const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];",
    "const ROOMS = ROOMS_ALL.filter(r => !Array.isArray(window.MR_RELEASED) || window.MR_RELEASED.includes(r.id));\n"
    "const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];\n"
    "/* the game keeps results and saves in this browser; show them on the doors */\n"
    "const LSget = k => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } };\n"
    "const mmss = t => { t = Math.floor(t || 0); return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };\n"
    "function statusOf(id) {\n"
    "  const res = (LSget('lethe.results.v1') || {}).rooms || {}, sv = LSget(`lethe.room${id}.v1`);\n"
    "  if (res[id]) return { done: true, time: res[id].time };\n"
    "  if (sv && sv.flags && sv.flags.woke && !sv.flags.escaped) return { prog: true };\n"
    "  return {};\n"
    "}")
rep("""  const s = $('#rStart'); s.href = LIVE; s.innerHTML = `${esc(r.start || 'Begin')} <svg""",
    """  const st = statusOf(r.id), signed = !!(window.MR && MR.me);
  $('#rNote').textContent = st.done ? `You escaped this one in ${mmss(st.time)}. You can play it again any time.`
    : st.prog ? 'You left this room halfway. It picks up where you stopped.'
    : signed ? 'Signed in: your result will be kept on every device.' : 'Playing as a guest. Sign in from the top of the page to keep your results on every device.';
  const s = $('#rStart'); s.href = `/play/${encodeURIComponent(r.id)}`; s.innerHTML = `${esc(st.prog ? 'Continue' : st.done ? 'Play again' : (r.start || 'Begin'))} <svg""")
rep("/* footer */\n",
    "/* statuses on the corridor doors */\n"
    "function paintStatus() {\n"
    "  $$('#doors .dbtn[data-id]').forEach(b => {\n"
    "    const r = byId[b.dataset.id]; if (!r) return;\n"
    "    const st = statusOf(r.id), cm = $('.cm', b); if (!cm) return;\n"
    "    cm.textContent = st.done ? `Escaped · ${mmss(st.time)}` : st.prog ? 'In progress' : r.mins;\n"
    "    cm.style.color = st.done ? 'var(--sq-g)' : st.prog ? 'var(--lamp)' : '';\n"
    "  });\n"
    "}\n"
    "paintStatus();\n"
    "addEventListener('mr:ready', paintStatus);\n"
    "addEventListener('pageshow', paintStatus);\n\n"
    "/* footer */\n")
rep("let carb = 112;",
    "/* /m/<id>: open straight onto that room's title screen */\n"
    "if (window.MR_OPEN && byId[window.MR_OPEN]) { fillRoom(byId[window.MR_OPEN]); showRoom(); }\n"
    "let carb = 112;")
open(out, 'w', encoding='utf-8').write(s)
print('wrote', out, len(s), 'bytes')
