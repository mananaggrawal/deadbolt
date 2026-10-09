#!/usr/bin/env python3
"""Recover src/ from a copy of the live page (only needed if src/ is ever lost).

    python3 split.py live/live.html        # the artifact read result, host skeleton included

DANGER: this overwrites every file it writes in src/. Never run it once you have
edited src/ files; port live-only changes by hand instead (see README).

The live page is one ASCII file. Sections are found by their banner comments and
room closures; non-ASCII text that the build escaped as \\uXXXX is turned back into
real UTF-8 so the source is readable (build.py escapes it again).
"""
import json, os, re, sys

SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src')

# (file, regex for its first line, title the next line starts with). Each file runs from its
# first line to the line before the next file's first line. Order matters.
SECTIONS = [
    ('core.js',    r'^/\* =+$', 'LETHE ENGINE'),
    ('audio.js',   r'^/\* =+$', 'AUDIO '),
    ('ui.js',      r'^/\* =+$', 'ENGINE UI'),
    ('touch.js',   r'^/\* =+$', 'TOUCH '),
    ('body.js',    r'^/\* =+$', 'BODY '),
    ('room406.js', r'^/\* =+$', 'ROOM 406 '),
    ('lamp.js',    r'^const ROOM_LAMP = \(\(\) => \{$', None),
    ('sitting.js', r'^const ROOM_SITTING = \(\(\) => \{$', None),
    ('night.js',   r'^const ROOM_NIGHT = \(\(\) => \{$', None),
    ('lift.js',    r'^const ROOM_LIFT = \(\(\) => \{$', None),
    ('orloj.js',   r'^const ROOM_ORLOJ = \(\(\) => \{$', None),
    ('tik.js',     r'^const ROOM_TIK = \(\(\) => \{$', None),
    ('tio.js',     r'^/\* =+$', 'MYSTERY #9 '),          # #9's banner sits outside its closure
    ('series.js',  r'^/\* =+$', 'SERIES '),
    ('main.js',    r'^/\* =+$', 'MAIN '),
]

def unescape(s):
    """\\uXXXX (non-ASCII only, not preceded by a backslash) -> real characters."""
    def pair(m):
        hi, lo = int(m.group(1), 16), int(m.group(2), 16)
        return chr(0x10000 + ((hi - 0xD800) << 10) + (lo - 0xDC00))
    s = re.sub(r'(?<!\\)\\u(d[89ab][0-9a-f]{2})\\u(d[c-f][0-9a-f]{2})', pair, s)
    return re.sub(r'(?<!\\)\\u([0-9a-f]{4})',
                  lambda m: chr(int(m.group(1), 16)) if int(m.group(1), 16) >= 0x80 else m.group(0), s)

def main(path):
    lines = open(path, encoding='ascii').read().split('\n')
    if lines[0].startswith('<!doctype html><html><head><meta charset=utf8>'):
        lines = lines[1:]                                   # drop the artifact host skeleton
    while lines and lines[-1] in ('', '</body></html>'):
        if lines[-1] == '</body></html>': lines.pop(); break
        lines.pop()
    i_script = lines.index('<script type="module">')
    assert lines[i_script + 1].startswith('const VO = ') and lines[i_script + 2].startswith('import * as THREE')
    i_end = len(lines) - 1 - lines[::-1].index('</script>')

    starts = []
    pos = i_script + 3
    for name, rx, title in SECTIONS:
        for k in range(pos, i_end):
            if re.match(rx, lines[k]) and (title is None or lines[k + 1].strip().startswith(title)):
                starts.append(k); pos = k + 1; break
        else:
            sys.exit(f'section not found: {name}')
    starts.append(i_end)

    os.makedirs(SRC, exist_ok=True)
    w = lambda n, text: open(os.path.join(SRC, n), 'w', encoding='utf-8').write(text)
    w('shell_head.html', '\n'.join(lines[:i_script]) + '\n')
    vo = lines[i_script + 1][len('const VO = '):]
    assert vo.endswith(';'); vo = vo[:-1]
    assert json.dumps(json.loads(vo)) == vo, 'VO json does not round-trip'
    w('vo_all.json', vo + '\n')
    w('pre_core.js', '\n'.join(lines[i_script + 3:starts[0]]) + '\n')   # usually one blank line
    for (name, _, _), a, b in zip(SECTIONS, starts, starts[1:]):
        w(name, unescape('\n'.join(lines[a:b]) + '\n'))
    w('shell_tail.html', '\n'.join(lines[i_end:]) + '\n')
    print('split into', len(SECTIONS) + 4, 'files in', SRC)

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'live/live.html')
