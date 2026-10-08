/* =====================================================================
   LETHE ENGINE — shared first-person mystery-room engine
   Movement, look, collision, interaction, ink post-process, tweens,
   UI shell, notebook, hints and saving. Rooms plug in via ROOM.
   ===================================================================== */

const $ = (s, r = document) => r.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const irand = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const TAU = Math.PI * 2;
const wait = ms => new Promise(r => setTimeout(r, ms));
const smooth = t => t * t * (3 - 2 * t);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const store = {
  get(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} },
};

/* ---------------- renderer ---------------- */
const canvas = $('#view');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
} catch (e) {
  $('#nogl').hidden = false; $('#title').hidden = true; $('#home').hidden = true;
  throw e;
}
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;
const IS_TOUCH = (() => { try { return matchMedia('(pointer: coarse)').matches && !matchMedia('(pointer: fine)').matches; } catch (e) { return false; } })();
let PR = Math.min(window.devicePixelRatio || 1, IS_TOUCH ? 1.0 : 1.25);
renderer.setPixelRatio(PR);
// a phone that can't keep up drops to a lower resolution (see perfTick in main.js)
function setRenderScale(s) { if (Math.abs(s - PR) < 0.01) return; PR = s; renderer.setPixelRatio(PR); onResize(); renderer.shadowMap.needsUpdate = true; }

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050506, 0.05);
const camera = new THREE.PerspectiveCamera(70, 1, 0.03, 60);
camera.rotation.order = 'YXZ';
camera.layers.enable(1);
scene.add(camera);

const normalMat = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide });

const post = new THREE.ShaderMaterial({
  uniforms: {
    tColor: { value: null }, tDepth: { value: null }, tNormal: { value: null },
    res: { value: new THREE.Vector2(1, 1) }, time: { value: 0 },
    near: { value: camera.near }, far: { value: camera.far },
    flash: { value: 0 }, black: { value: 0 }, fear: { value: 0 }, grain: { value: 0.045 }, red: { value: 0 },
    // realistic mode (a room opts in with enableRealistic): HDR, tone mapping, AO, bloom, FXAA
    real: { value: 0 }, exposure: { value: 1 }, aoAmt: { value: 0 }, aoRad: { value: 0.32 }, bloomAmt: { value: 0 }, tBloom: { value: null },
    proj: { value: new THREE.Vector2(1, 1) }, vig: { value: 0.6 }, sat: { value: 1 }, warm: { value: new THREE.Vector3(1, 1, 1) },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader: `
    precision highp float;
    uniform sampler2D tColor; uniform sampler2D tDepth; uniform sampler2D tNormal;
    uniform vec2 res; uniform float time, near, far, flash, black, fear, grain, red;
    uniform float real, exposure, aoAmt, aoRad, bloomAmt, vig, sat; uniform vec3 warm; uniform vec2 proj; uniform sampler2D tBloom;
    varying vec2 vUv;
    float ld(vec2 uv){ float z = texture2D(tDepth, uv).x; float n = z*2.0-1.0; return (2.0*near*far)/(far+near-n*(far-near)); }
    vec3 nr(vec2 uv){ return texture2D(tNormal, uv).xyz*2.0-1.0; }
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
    // ---- realistic path ----
    float lumT(vec3 c){ c = c/(1.0+c); return dot(c, vec3(0.299,0.587,0.114)); }
    vec3 fxaa(vec2 uv){
      vec2 px = 1.0/res;
      vec3 cNW = texture2D(tColor, uv+vec2(-1.0,-1.0)*px).rgb, cNE = texture2D(tColor, uv+vec2(1.0,-1.0)*px).rgb;
      vec3 cSW = texture2D(tColor, uv+vec2(-1.0,1.0)*px).rgb, cSE = texture2D(tColor, uv+vec2(1.0,1.0)*px).rgb, cM = texture2D(tColor, uv).rgb;
      float lNW = lumT(cNW), lNE = lumT(cNE), lSW = lumT(cSW), lSE = lumT(cSE), lM = lumT(cM);
      float lMin = min(lM, min(min(lNW,lNE), min(lSW,lSE))), lMax = max(lM, max(max(lNW,lNE), max(lSW,lSE)));
      if (lMax - lMin < max(0.0312, lMax*0.125)) return cM;
      vec2 dir = vec2(-((lNW+lNE)-(lSW+lSE)), (lNW+lSW)-(lNE+lSE));
      float red_ = max((lNW+lNE+lSW+lSE)*0.03125, 1.0/128.0);
      float rcp = 1.0/(min(abs(dir.x), abs(dir.y)) + red_);
      dir = clamp(dir*rcp, vec2(-8.0), vec2(8.0))*px;
      vec3 a = 0.5*(texture2D(tColor, uv+dir*(1.0/3.0-0.5)).rgb + texture2D(tColor, uv+dir*(2.0/3.0-0.5)).rgb);
      vec3 b = a*0.5 + 0.25*(texture2D(tColor, uv-dir*0.5).rgb + texture2D(tColor, uv+dir*0.5).rgb);
      float lb = lumT(b);
      return (lb < lMin || lb > lMax) ? a : b;
    }
    vec3 vpos(vec2 uv){ float z = ld(uv); return vec3((uv*2.0-1.0)*proj*z, -z); }
    float ssao(vec2 uv, float d){
      vec3 p = vpos(uv); vec3 n = normalize(nr(uv));
      float r = aoRad; float sr = min(0.12, r/(d*proj.y*2.0));
      float a0 = hash(uv*res)*6.2831, occ = 0.0;
      for (int i = 0; i < 12; i++){
        float fi = float(i), t = (fi+0.6)/12.0, ang = a0 + fi*2.39996;
        vec2 o = vec2(cos(ang), sin(ang))*t*sr*vec2(res.y/res.x, 1.0);
        vec3 v = vpos(uv+o) - p; float dl = length(v);
        occ += max(0.0, dot(n, v/max(dl,1e-4)) - 0.12) * (1.0 - smoothstep(r*0.6, r*1.6, dl));
      }
      return clamp(1.0 - occ/12.0*1.9, 0.0, 1.0);
    }
    vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0); }
    vec3 toSRGB(vec3 c){ c = max(c, 0.0); return mix(c*12.92, 1.055*pow(c, vec3(1.0/2.4))-0.055, step(0.0031308, c)); }
    vec3 realPath(){
      vec2 c = vUv-0.5;
      vec2 uv = vUv + vec2(sin(vUv.y*38.0+time*9.0), cos(vUv.x*31.0+time*7.0))*0.0012*fear;
      vec3 col = fxaa(uv);
      if (fear > 0.02) { vec2 ca = c*dot(c,c)*0.03*fear; col.r = mix(col.r, texture2D(tColor, uv+ca).r, 0.8); col.b = mix(col.b, texture2D(tColor, uv-ca).b, 0.8); }
      float d = ld(uv);
      if (aoAmt > 0.0 && d < far*0.95) col *= mix(1.0, ssao(uv, d), aoAmt);
      col += texture2D(tBloom, vUv).rgb*bloomAmt;
      col *= exposure*warm;
      col = aces(col);
      float l = dot(col, vec3(0.2126,0.7152,0.0722));
      col = mix(vec3(l), col, sat);
      col += flash*vec3(0.95,0.92,0.85);
      col = mix(col, col*vec3(1.4,0.35,0.3), red);
      float v = smoothstep(0.98, 0.22, length(c*vec2(1.0,1.12)));
      col *= mix(vig, 1.0, v);
      col *= (1.0-black);
      col = toSRGB(col);
      col += (hash(vUv*res + fract(time*13.7)*91.0)-0.5)*grain*(1.0-black);
      return col;
    }
    void main(){
      if (real > 0.5) { gl_FragColor = vec4(realPath(), 1.0); return; }
      vec2 px = 1.3/res;
      vec2 c = vUv-0.5;
      float r2 = dot(c,c);
      vec2 uv = vUv + vec2(sin(vUv.y*38.0+time*9.0), cos(vUv.x*31.0+time*7.0))*0.0016*fear;
      vec2 ca = c*r2*(0.012+0.035*fear);
      vec3 col;
      col.r = texture2D(tColor, uv+ca).r;
      col.g = texture2D(tColor, uv).g;
      col.b = texture2D(tColor, uv-ca).b;
      float d = ld(uv);
      float de = abs(ld(uv+vec2(px.x,0.0))-d)+abs(ld(uv-vec2(px.x,0.0))-d)+abs(ld(uv+vec2(0.0,px.y))-d)+abs(ld(uv-vec2(0.0,px.y))-d);
      de /= max(d, 0.05);
      vec3 n = nr(uv);
      float ne = 4.0 - dot(n,nr(uv+vec2(px.x,0.0))) - dot(n,nr(uv-vec2(px.x,0.0))) - dot(n,nr(uv+vec2(0.0,px.y))) - dot(n,nr(uv-vec2(0.0,px.y)));
      float edge = max(smoothstep(0.035,0.1,de), smoothstep(0.2,0.6,ne));
      edge *= smoothstep(15.0, 3.0, d);
      col = mix(col, vec3(0.012,0.011,0.010), edge*0.9);
      float l = dot(col, vec3(0.299,0.587,0.114));
      col = mix(vec3(l), col, 0.8);
      col *= vec3(0.97,1.0,0.955);
      col = col/(1.0+col*0.3);
      col += flash*vec3(0.55,0.6,0.78);
      col = mix(col, col*vec3(1.5,0.3,0.26), red);
      float v = smoothstep(0.86, 0.18, length(c*vec2(1.05,1.0)));
      col *= mix(0.26, 1.0, v);
      col *= (1.0-black);
      col = pow(max(col,0.0), vec3(1.0/2.2));
      col += (hash(vUv*res + fract(time*13.7)*91.0)-0.5)*grain*(1.0-black);
      gl_FragColor = vec4(col, 1.0);
    }`,
  depthTest: false, depthWrite: false,
});
const postScene = new THREE.Scene();
const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post));

let rtColor = null, rtNormal = null;
// realistic mode: an HDR colour target, quarter-res bloom, AO from depth + normals, tone mapping in the post pass
const REAL = { on: false, ao: !IS_TOUCH, bloom: true, rtA: null, rtB: null, hdr: THREE.HalfFloatType };
function makeTargets() {
  const w = Math.max(2, Math.floor(innerWidth * PR)), h = Math.max(2, Math.floor(innerHeight * PR));
  if (rtColor) { rtColor.depthTexture.dispose(); rtColor.dispose(); rtNormal.dispose(); }
  const type = REAL.on ? REAL.hdr : THREE.UnsignedByteType;
  rtColor = new THREE.WebGLRenderTarget(w, h, { depthTexture: new THREE.DepthTexture(w, h), depthBuffer: true, type });
  rtNormal = new THREE.WebGLRenderTarget(w, h);
  post.uniforms.tColor.value = rtColor.texture;
  post.uniforms.tDepth.value = rtColor.depthTexture;
  post.uniforms.tNormal.value = rtNormal.texture;
  post.uniforms.res.value.set(w, h);
  if (REAL.on) {
    if (REAL.rtA) { REAL.rtA.dispose(); REAL.rtB.dispose(); }
    const bw = Math.max(2, w >> 2), bh = Math.max(2, h >> 2), o = { type: REAL.hdr, depthBuffer: false };
    REAL.rtA = new THREE.WebGLRenderTarget(bw, bh, o); REAL.rtB = new THREE.WebGLRenderTarget(bw, bh, o);
    post.uniforms.tBloom.value = REAL.rtA.texture;
  }
}
function updateProj() {
  const ty = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  post.uniforms.proj.value.set(ty * camera.aspect, ty);
}
function onResize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / Math.max(1, innerHeight);
  camera.updateProjectionMatrix(); updateProj();
  makeTargets();
}
const FSQ = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); const FSCENE = new THREE.Scene(); FSQ.frustumCulled = false; FSCENE.add(FSQ);
const BRIGHT = new THREE.ShaderMaterial({
  uniforms: { tSrc: { value: null }, px: { value: new THREE.Vector2() }, thr: { value: 1.0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader: `precision highp float; uniform sampler2D tSrc; uniform vec2 px; uniform float thr; varying vec2 vUv;
    void main(){ vec3 c = (texture2D(tSrc, vUv+px*vec2(-1.5,-1.5)).rgb + texture2D(tSrc, vUv+px*vec2(1.5,-1.5)).rgb + texture2D(tSrc, vUv+px*vec2(-1.5,1.5)).rgb + texture2D(tSrc, vUv+px*vec2(1.5,1.5)).rgb)*0.25;
      float l = max(c.r, max(c.g, c.b)); float w = max(0.0, l-thr)/max(l, 1e-4); gl_FragColor = vec4(min(c*w, vec3(40.0)), 1.0); }`,
  depthTest: false, depthWrite: false,
});
const BLUR = new THREE.ShaderMaterial({
  uniforms: { tSrc: { value: null }, dir: { value: new THREE.Vector2() } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader: `precision highp float; uniform sampler2D tSrc; uniform vec2 dir; varying vec2 vUv;
    void main(){ vec3 c = texture2D(tSrc, vUv).rgb*0.2270270;
      c += (texture2D(tSrc, vUv+dir*1.3846154).rgb + texture2D(tSrc, vUv-dir*1.3846154).rgb)*0.3162162;
      c += (texture2D(tSrc, vUv+dir*3.2307692).rgb + texture2D(tSrc, vUv-dir*3.2307692).rgb)*0.0702703;
      gl_FragColor = vec4(c, 1.0); }`,
  depthTest: false, depthWrite: false,
});
function fsPass(mat, target) { FSQ.material = mat; renderer.setRenderTarget(target); renderer.render(FSCENE, postCam); }
function renderBloom() {
  if (!REAL.on || !REAL.bloom || !REAL.rtA) return;
  const a = REAL.rtA, b = REAL.rtB, w = a.width, h = a.height;
  BRIGHT.uniforms.tSrc.value = rtColor.texture; BRIGHT.uniforms.px.value.set(1 / rtColor.width, 1 / rtColor.height); fsPass(BRIGHT, a);
  for (const s of [1, 2.2]) {
    BLUR.uniforms.tSrc.value = a.texture; BLUR.uniforms.dir.value.set(s / w, 0); fsPass(BLUR, b);
    BLUR.uniforms.tSrc.value = b.texture; BLUR.uniforms.dir.value.set(0, s / h); fsPass(BLUR, a);
  }
}
// a room calls this in build() to switch the whole pipeline to realistic rendering
function enableRealistic(o = {}) {
  REAL.on = true;
  // half-float colour targets need EXT_color_buffer_float/half_float; without them fall back to 8-bit
  const ext = renderer.extensions; if (!(ext.has('EXT_color_buffer_half_float') || ext.has('EXT_color_buffer_float'))) REAL.hdr = THREE.UnsignedByteType;
  const u = post.uniforms; u.real.value = 1; u.exposure.value = o.exposure ?? 1; u.aoAmt.value = REAL.ao ? (o.ao ?? 0.85) : 0; u.aoRad.value = o.aoRad ?? 0.32;
  u.bloomAmt.value = o.bloom ?? 0.6; u.vig.value = o.vig ?? 0.6; u.grain.value = o.grain ?? 0.022; u.sat.value = o.sat ?? 1;
  BRIGHT.uniforms.thr.value = o.bloomThr ?? 1.2;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  updateProj(); makeTargets();
}
// an image-based environment for reflections, captured from the room itself at a point
function envFromScene(at, sigma = 0.04) {
  const pm = new THREE.PMREMGenerator(renderer);
  const hidden = []; scene.traverse(o => { if (o.userData.noEnv && o.visible) { hidden.push(o); o.visible = false; } });
  scene.position.set(-at.x, -at.y, -at.z); scene.updateMatrixWorld(true);
  const rt = pm.fromScene(scene, sigma, 0.05, 30);
  scene.position.set(0, 0, 0); scene.updateMatrixWorld(true);
  hidden.forEach(o => o.visible = true); pm.dispose();
  return rt;
}
// height (grey canvas) -> tangent-space normal map
function heightToNormal(src, strength = 2) {
  const w = src.width, h = src.height, sg = src.getContext('2d'), d = sg.getImageData(0, 0, w, h).data;
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); const img = g.createImageData(w, h), o = img.data;
  const H = (x, y) => d[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (H(x + 1, y) - H(x - 1, y)) * strength, dy = (H(x, y + 1) - H(x, y - 1)) * strength;
    const l = Math.hypot(dx, dy, 1), i = (y * w + x) * 4;
    o[i] = (-dx / l * 0.5 + 0.5) * 255; o[i + 1] = (dy / l * 0.5 + 0.5) * 255; o[i + 2] = (1 / l * 0.5 + 0.5) * 255; o[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
}
// merge the static meshes under a root into one mesh per material (fewer draw calls); interactive parts must live elsewhere
function mergeStatic(root) {
  root.updateMatrixWorld(true);
  const buckets = new Map(), kill = [];
  const kept = o => { for (let p = o; p; p = p.parent) if (p.userData.keep) return true; return false; };
  root.traverse(o => {
    if (!o.isMesh || o.userData.iid || o.layers.mask !== 1 || !o.visible || kept(o) || o.material.isShaderMaterial || Array.isArray(o.material)) return;
    const key = o.material.uuid + (o.castShadow ? 'c' : '') + (o.receiveShadow ? 'r' : '');
    if (!buckets.has(key)) buckets.set(key, { mat: o.material, cast: o.castShadow, recv: o.receiveShadow, geos: [] });
    const g = (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()); g.applyMatrix4(o.matrixWorld);
    buckets.get(key).geos.push(g); kill.push(o);
  });
  kill.forEach(o => o.parent && o.parent.remove(o));
  for (const b of buckets.values()) {
    const attrs = ['position', 'normal', 'uv']; const out = new THREE.BufferGeometry();
    for (const a of attrs) {
      if (!b.geos.every(g => g.attributes[a])) continue;
      const size = b.geos[0].attributes[a].itemSize, total = b.geos.reduce((s, g) => s + g.attributes[a].count, 0), arr = new Float32Array(total * size);
      let off = 0; for (const g of b.geos) { arr.set(g.attributes[a].array, off); off += g.attributes[a].count * size; }
      out.setAttribute(a, new THREE.BufferAttribute(arr, size));
    }
    const m = new THREE.Mesh(out, b.mat); m.castShadow = b.cast; m.receiveShadow = b.recv; m.userData.noRay = true; scene.add(m);
  }
}
// a flat mirror: renders the room from the reflected camera into its own target
function makeMirror(w, h, { res = 512, tint = 0xdcd6c8 } = {}) {
  const rw = IS_TOUCH ? Math.round(res * 0.5) : res, rh = Math.round(rw * h / w);
  const rt = new THREE.WebGLRenderTarget(rw, rh, { type: REAL.on ? REAL.hdr : THREE.UnsignedByteType });
  const texMat = new THREE.Matrix4(), vcam = new THREE.PerspectiveCamera(); vcam.layers.enable(1);
  const spots = ctex(256, 256, (g, W2, H2) => { g.clearRect(0, 0, W2, H2); for (let i = 0; i < 70; i++) blot(g, Math.random() * W2, Math.random() < 0.6 ? (Math.random() < 0.5 ? Math.random() * 30 : H2 - Math.random() * 30) : Math.random() * H2, 4 + Math.random() * 22, 0.5, '40,34,24'); speckle(g, W2, H2, 900, 0.5, '30,25,20', 2); }, { linear: true });
  const mat = new THREE.ShaderMaterial({
    uniforms: { tMirror: { value: rt.texture }, texMat: { value: texMat }, tint: { value: new THREE.Color(tint) }, spots: { value: spots } },
    vertexShader: `uniform mat4 texMat; varying vec4 vP; varying vec2 vU; void main(){ vU = uv; vP = texMat*vec4(position,1.0); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform sampler2D tMirror; uniform sampler2D spots; uniform vec3 tint; varying vec4 vP; varying vec2 vU;
      void main(){ vec3 c = texture2DProj(tMirror, vP).rgb*tint; float s = texture2D(spots, vU).a; c *= 1.0-s*0.75; gl_FragColor = vec4(c, 1.0); }`,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.userData.noEnv = true;
  const P0 = new THREE.Vector3(), C0 = new THREE.Vector3(), N0 = new THREE.Vector3(), R = new THREE.Matrix4(), look = new THREE.Vector3(), tgt = new THREE.Vector3(), view = new THREE.Vector3();
  const plane = new THREE.Plane(), clip = new THREE.Vector4(), q = new THREE.Vector4(), fr = new THREE.Frustum(), sph = new THREE.Sphere(), pm = new THREE.Matrix4();
  m.userData.update = () => {
    if (!isShown(m)) return;
    m.updateMatrixWorld(); camera.updateMatrixWorld();
    pm.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); fr.setFromProjectionMatrix(pm);
    sph.center.setFromMatrixPosition(m.matrixWorld); sph.radius = Math.hypot(w, h) / 2; if (!fr.intersectsSphere(sph)) return;
    P0.setFromMatrixPosition(m.matrixWorld); C0.setFromMatrixPosition(camera.matrixWorld);
    R.extractRotation(m.matrixWorld); N0.set(0, 0, 1).applyMatrix4(R);
    view.subVectors(P0, C0); if (view.dot(N0) > 0) return;
    view.reflect(N0).negate().add(P0);
    R.extractRotation(camera.matrixWorld); look.set(0, 0, -1).applyMatrix4(R).add(C0);
    tgt.subVectors(P0, look).reflect(N0).negate().add(P0);
    vcam.position.copy(view); vcam.up.set(0, 1, 0).applyMatrix4(R).reflect(N0); vcam.lookAt(tgt);
    vcam.far = camera.far; vcam.near = camera.near; vcam.updateMatrixWorld(); vcam.projectionMatrix.copy(camera.projectionMatrix);
    texMat.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1); texMat.multiply(vcam.projectionMatrix); texMat.multiply(vcam.matrixWorldInverse); texMat.multiply(m.matrixWorld);
    plane.setFromNormalAndCoplanarPoint(N0, P0); plane.applyMatrix4(vcam.matrixWorldInverse);
    clip.set(plane.normal.x, plane.normal.y, plane.normal.z, plane.constant);
    const e = vcam.projectionMatrix.elements;
    q.x = (Math.sign(clip.x) + e[8]) / e[0]; q.y = (Math.sign(clip.y) + e[9]) / e[5]; q.z = -1; q.w = (1 + e[10]) / e[14];
    clip.multiplyScalar(2 / clip.dot(q)); e[2] = clip.x; e[6] = clip.y; e[10] = clip.z + 1 - 0.003; e[14] = clip.w;
    m.visible = false; renderer.setRenderTarget(rt); renderer.setClearColor(0, 1); renderer.clear(); renderer.render(scene, vcam); m.visible = true;
  };
  return m;
}
addEventListener('resize', onResize);

/* ---------------- materials & geometry helpers ---------------- */
const GRAD = (() => {
  const t = new THREE.DataTexture(new Uint8Array([30, 92, 172, 255]), 4, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t;
})();
const toon = (color, map = null, extra = {}) => new THREE.MeshToonMaterial(Object.assign({ color, map, gradientMap: GRAD }, extra));
const basic = (color, extra = {}) => new THREE.MeshBasicMaterial(Object.assign({ color }, extra));

function tiledBoxGeo(w, h, d, s = 1) {
  const g = new THREE.BoxGeometry(w, h, d); const uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * dims[f][0] / s, uv.getY(k) * dims[f][1] / s); }
  uv.needsUpdate = true; return g;
}
function mesh(geo, mat, x = 0, y = 0, z = 0, parent = scene) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
const box = (w, h, d, mat, x, y, z, parent = scene) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, parent);
const tbox = (w, h, d, mat, x, y, z, parent = scene, s = 1) => mesh(tiledBoxGeo(w, h, d, s), mat, x, y, z, parent);
const cyl = (rt, rb, h, mat, x, y, z, parent = scene, seg = 18) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z, parent);
function plane(w, h, mat, x, y, z, ry = 0, parent = scene) { const m = mesh(new THREE.PlaneGeometry(w, h), mat, x, y, z, parent); m.rotation.y = ry; m.castShadow = false; return m; }
function grp(x = 0, y = 0, z = 0, parent = scene) { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; }
// wall piece from bounds
const slab = (x0, x1, y0, y1, z0, z1, mat, s = 1.2) => tbox(x1 - x0, y1 - y0, z1 - z0, mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, scene, s);
function noRay(o) { o.traverse(c => { c.userData.noRay = true; }); return o; }
function layer1(o) { o.traverse(c => { c.layers.set(1); c.userData.noRay = true; }); return o; }

/* ---------------- canvas textures ---------------- */
function ctex(w, h, draw, opt = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = opt.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  if (opt.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(opt.repeat[0], opt.repeat[1]); }
  t.anisotropy = 4; t.userData.canvas = c; t.userData.g = g; return t;
}
function speckle(g, w, h, n, a, col = '0,0,0', s = 2) { for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${col},${Math.random() * a})`; g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * s, 1 + Math.random() * s); } }
function blot(g, x, y, r, a, col = '60,40,20') { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(.65, `rgba(${col},${a * .45})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }

/* ---------------- tweens & timers (game time) ---------------- */
const tweens = [];
const easeIO = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
function tween(dur, fn, done, ease = easeIO) { const tw = { t: 0, dur, fn, done, ease }; tweens.push(tw); fn(0); return tw; }
function stepTweens(dt) { for (let i = tweens.length - 1; i >= 0; i--) { const tw = tweens[i]; tw.t += dt; const k = Math.min(1, tw.t / tw.dur); tw.fn(tw.ease(k)); if (k >= 1) { tweens.splice(i, 1); tw.done && tw.done(); } } }
const timers = [];
function after(sec, fn) { const t = { t: sec, fn }; timers.push(t); return t; }
function stepTimers(dt) { for (let i = timers.length - 1; i >= 0; i--) { const t = timers[i]; t.t -= dt; if (t.t <= 0) { timers.splice(i, 1); t.fn(); } } }

/* ---------------- game state ---------------- */
const G = {
  mode: 'home', locked: false, freeLook: false, lockWorked: false, needClick: false, lockFromClick: false,
  yaw: 0, pitch: 0, eye: 1.62, eyeT: 1.62, crouch: false, onChair: false, carrying: false,
  bob: 0, stepAcc: 0, fear: 0, fearT: 0, black: 0, flash: 0, red: 0, uiOpen: false, panelOpen: false,
  cutscene: false, hover: null, time: 0, promptKey: '',
};
const P = { x: 0, z: 0 };
let S = null;       // persistent state, shaped by the room
let ROOM = null;    // the active room module
const keys = {};

/* ---------------- colliders ---------------- */
const colliders = [];
function addCol(id, minX, maxX, minZ, maxZ, on = true) { const c = { id, minX, maxX, minZ, maxZ, on }; colliders.push(c); return c; }
function collide(p, r, skip) {
  for (let it = 0; it < 3; it++) for (const c of colliders) {
    if (!c.on || c === skip) continue;
    const cx = clamp(p.x, c.minX, c.maxX), cz = clamp(p.z, c.minZ, c.maxZ);
    const dx = p.x - cx, dz = p.z - cz, d2 = dx * dx + dz * dz;
    if (d2 >= r * r) continue;
    if (d2 < 1e-9) {
      const l = p.x - c.minX, rr = c.maxX - p.x, t = p.z - c.minZ, b = c.maxZ - p.z, m = Math.min(l, rr, t, b);
      if (m === l) p.x = c.minX - r; else if (m === rr) p.x = c.maxX + r; else if (m === t) p.z = c.minZ - r; else p.z = c.maxZ + r;
    } else { const d = Math.sqrt(d2); p.x = cx + dx / d * r; p.z = cz + dz / d * r; }
  }
}
function boxFree(minX, maxX, minZ, maxZ, skip) {
  for (const c of colliders) { if (!c.on || c === skip) continue; if (minX < c.maxX && maxX > c.minX && minZ < c.maxZ && maxZ > c.minZ) return false; }
  return true;
}

/* ---------------- interaction ---------------- */
const INTER = new Map();
function inter(id, obj, def) { def.id = id; def.obj = obj; obj.traverse(o => { o.userData.iid = id; }); INTER.set(id, def); return def; }
const ray = new THREE.Raycaster(); ray.far = 3.2; ray.layers.enable(2);
const HITMAT = new THREE.MeshBasicMaterial({ visible: false });
// an invisible, slightly larger box around a small object so it's easier to aim at
function hitbox(id, obj, pad = 0.035) {
  obj.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(obj), s = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3());
  const q = obj.getWorldQuaternion(new THREE.Quaternion()).invert();
  const m = new THREE.Mesh(new THREE.BoxGeometry(s.x + pad * 2, s.y + pad * 2, s.z + pad * 2), HITMAT);
  obj.add(m); m.position.copy(obj.worldToLocal(c)); m.quaternion.copy(q); m.layers.set(2); m.userData.iid = id; m.userData.hit = true;
  return m;
}
const CENTER = new THREE.Vector2(0, 0);
function isShown(o) { while (o) { if (!o.visible) return false; o = o.parent; } return true; }
let RAYLIST = null;
function buildRayList() { RAYLIST = []; scene.traverse(o => { if ((o.isMesh || o.isSprite) && !o.userData.noRay && o.layers.test(ray.layers)) RAYLIST.push(o); }); }
function probe() {
  ray.setFromCamera(CENTER, camera);
  if (!RAYLIST) buildRayList();
  const hits = ray.intersectObjects(RAYLIST, false);
  for (const h of hits) {
    const o = h.object;
    if (o.userData.noRay || !isShown(o)) continue;
    const id = o.userData.iid; if (!id) return null;
    const d = INTER.get(id); if (!d) return null;
    if (d.enabled && !d.enabled()) return null;
    if (h.distance > (d.reach || 2.0)) return null;
    return d;
  }
  return null;
}
function actionsOf(d) { const a = d.actions ? d.actions() : []; return a.filter(Boolean); }
function act(i) {
  if (G.mode !== 'play' || G.uiOpen || G.cutscene) return;
  if (G.carrying) { ROOM.dropCarried && ROOM.dropCarried(); return; }
  if (ROOM.actOverride && ROOM.actOverride(i)) return;
  const d = G.hover; if (!d) return;
  const a = actionsOf(d)[i]; if (a && a.run) { a.run(); updatePrompt(true); }
}
function updatePrompt(force) {
  const el = $('#prompt');
  let key = '', html = '';
  if (G.mode === 'play' && !G.uiOpen && !G.cutscene) {
    const ov = ROOM.promptOverride && ROOM.promptOverride();
    if (ov) { key = 'ov|' + ov; html = ov; }
    else if (G.carrying) { key = 'carry'; html = `<span class="nm">${esc(G.carrying.name)}</span><span class="act"><kbd>E</kbd>Set it down</span>`; }
    else if (G.hover) {
      const d = G.hover, acts = actionsOf(d), nm = typeof d.name === 'function' ? d.name() : d.name;
      const note = d.note ? d.note() : '';
      key = d.id + '|' + nm + '|' + acts.map(a => a.label).join('|') + '|' + note;
      html = `<span class="nm">${esc(nm)}</span>` + acts.map((a, i) => `<span class="act"><kbd>${i === 0 ? 'E' : 'R'}</kbd>${esc(a.label)}</span>`).join('') + (note ? `<span class="note">${esc(note)}</span>` : '');
    } else if (G.onChair) { key = 'chair'; html = `<span class="act"><kbd>Space</kbd>Step down</span>`; }
  }
  if (force || key !== G.promptKey) { G.promptKey = key; el.innerHTML = html; }
  $('#cross').classList.toggle('on', !!G.hover);
  if (G.touch) touchRefresh();
}

/* ---------------- HUD helpers ---------------- */
let subsTimer = null;
function subtitle(who, text, ms = 4200) {
  const el = $('#subs');
  el.innerHTML = (who ? `<b>${esc(who)}</b>` : '') + text;
  clearTimeout(subsTimer);
  if (ms > 0) subsTimer = setTimeout(() => { el.innerHTML = ''; }, ms);
}
function clearSubs() { clearTimeout(subsTimer); $('#subs').innerHTML = ''; }
function toast(msg, ms = 3800) {
  const box = $('#toast'); const d = document.createElement('div'); d.innerHTML = msg; box.appendChild(d);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => d.remove(), ms);
}

/* ---------------- mouse look ---------------- */
// With mouse capture (pointer lock) the mouse turns the view like any desktop game. Pages that host the game
// in a frame often refuse capture, or ignore the request. Then the game switches to free look: just move the
// mouse to turn (no clicking or dragging), push it against the edge of the window to keep turning, and a
// click only ever means "use this". Each capture request is handled exactly once.
let lockReq = 0;
const FL = { x: -1, y: -1, inside: true, armed: false, ex: 0, told: false };
function lockPointer(force) {
  if (G.touch || G.locked || (G.freeLook && !force)) return;
  const id = ++lockReq; G.lockPending = id;
  try {
    const p = canvas.requestPointerLock();
    if (p && p.catch) p.catch(() => onLockError(id));
  } catch (e) { onLockError(id); return; }
  setTimeout(() => { if (G.lockPending === id && !G.locked && G.mode === 'play') onLockError(id); }, 900);
}
function onLockError(id) {
  if (!id || G.lockPending !== id) return;
  const fromClick = G.lockFromClick;
  G.lockPending = 0; G.lockFromClick = false;
  // Browsers only capture the mouse straight after a click, and Chrome refuses for about a second after
  // Esc released it. Once capture has worked on this page, a refusal just means "click again" (the
  // "Click to carry on" hint shows); free look is only for pages that never allow capture (some frames).
  if (fromClick && !G.lockWorked) startFreeLook();
}
function startFreeLook() {
  if (G.touch) return;
  G.freeLook = true; G.needClick = false; $('#clickhint').hidden = true;
  FL.x = -1; FL.armed = false;
  if (!FL.told && G.mode === 'play') { FL.told = true; toast('Move the mouse to look around &mdash; no need to click. Push it against the edge of the window to keep turning.', 8000); }
}
document.addEventListener('pointerlockerror', () => onLockError(G.lockPending));
document.addEventListener('pointerlockchange', () => {
  G.locked = document.pointerLockElement === canvas;
  if (G.locked) { G.lockPending = 0; G.lockWorked = true; G.freeLook = false; G.needClick = false; G.lockFromClick = false; $('#clickhint').hidden = true; }
  // the player let go of the mouse (Esc, switching windows): pause, even mid-cutscene (pausing stops game time).
  // When the game let go itself (a panel, a scare), it isn't a pause.
  else if (G.mode === 'play' && !G.uiOpen && !G.releasing) { G.escPauseAt = performance.now(); openPause(); }
  G.releasing = false;
});
function releasePointer() { if (document.pointerLockElement) { G.releasing = true; try { document.exitPointerLock(); } catch (e) { G.releasing = false; } } FL.x = -1; FL.armed = false; }
// after a panel closes. Esc never counts as a click for the browser, so closing with Esc leaves the
// "Click to carry on" hint instead of asking for the mouse (the request would only be refused).
function resumeLook(byEsc) {
  if (G.mode !== 'play' || G.touch) return;
  FL.x = -1; FL.armed = false;
  if (G.freeLook || byEsc) return;
  lockPointer();
}
// "Click to carry on": shown whenever you're playing on a computer without the mouse captured
function clickHintTick() {
  const want = G.mode === 'play' && !G.touch && !G.freeLook && !G.locked && !G.uiOpen && !G.cutscene && !G.lockPending && !document.hidden;
  const el = $('#clickhint');
  if (el.hidden === want) el.hidden = !want;
  G.needClick = want;
}

canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('mousedown', e => {
  if (G.touch) return;
  canvas.focus();
  if (G.mode !== 'play' || G.uiOpen) return;
  if (!G.locked && !G.freeLook) { G.lockFromClick = true; lockPointer(); return; }
  if (e.button === 0) act(0); else if (e.button === 2) act(1);
  // capture worked earlier in this session and dropped out: quietly try again
  if (G.freeLook && G.lockWorked && !G.lockPending) lockPointer(true);
});
addEventListener('mousemove', e => {
  FL.inside = true;
  if (G.mode !== 'play' || G.uiOpen) { FL.x = -1; return; }
  let dx = 0, dy = 0, s = 0.0022;
  if (G.locked) { dx = e.movementX; dy = e.movementY; }
  else if (G.freeLook) {
    if (FL.x < 0) { FL.x = e.clientX; FL.y = e.clientY; return; }
    dx = e.clientX - FL.x; dy = e.clientY - FL.y; FL.x = e.clientX; FL.y = e.clientY; s = 0.0034;
  } else return;
  if (G.cutscene) return;
  if (Math.abs(dx) > 300 || Math.abs(dy) > 300) return;
  G.yaw -= dx * s; G.pitch = clamp(G.pitch - dy * s, -1.45, 1.45);
});
// the mouse leaving the window (or the page losing focus) stops edge turning until it comes back to the middle
document.documentElement.addEventListener('mouseleave', () => { FL.inside = false; FL.x = -1; FL.armed = false; });
addEventListener('blur', () => { FL.inside = false; FL.x = -1; FL.armed = false; });
// free look: keep turning while the pointer rests against an edge of the window (called every frame)
function freeLookTick(dt) {
  let ex = 0, ey = 0;
  const on = G.freeLook && !G.locked && !G.touch && G.mode === 'play' && !G.uiOpen && !G.cutscene && FL.inside && FL.x >= 0;
  if (on) {
    const Wd = innerWidth, Ht = innerHeight, zx = Math.max(44, Wd * 0.07), zy = Math.max(36, Ht * 0.08);
    if (FL.x < zx) ex = (zx - FL.x) / zx; else if (FL.x > Wd - zx) ex = -(FL.x - (Wd - zx)) / zx;
    if (FL.y < zy) ey = (zy - FL.y) / zy; else if (FL.y > Ht - zy) ey = -(FL.y - (Ht - zy)) / zy;
    // only once the pointer has been in the middle: closing a panel with the mouse at the edge doesn't spin you round
    if (!ex && !ey) FL.armed = true;
    if (!FL.armed) ex = ey = 0;
    ex = clamp(ex, -1, 1); ey = clamp(ey, -1, 1);
    G.yaw += ex * (0.6 + 1.6 * Math.abs(ex)) * dt; G.pitch = clamp(G.pitch + ey * (0.4 + 0.9 * Math.abs(ey)) * dt, -1.45, 1.45);
  }
  FL.ex = lerp(FL.ex, ex, Math.min(1, dt * 10));
  const el = $('#edgeL'), er = $('#edgeR');
  if (el) { el.style.opacity = Math.max(0, FL.ex).toFixed(2); er.style.opacity = Math.max(0, -FL.ex).toFixed(2); }
  const cur = on ? 'none' : '';
  if (canvas.style.cursor !== cur) canvas.style.cursor = cur;
}

addEventListener('keydown', e => {
  if (e.code === 'Tab') { e.preventDefault(); if (G.mode === 'play' && !G.cutscene) { if (UI.kind === 'notebook') UI.close(); else if (!UI.kind || UI.kind === 'hints') openNotebook(); } return; }
  if (G.mode !== 'play') return;
  if (UI.kind) {
    if (e.code === 'Escape') {
      e.preventDefault();
      // the same Esc press that released the mouse (some browsers pass it on too) must not close the pause it opened
      if (UI.kind === 'pause' && performance.now() - (G.escPauseAt || 0) < 450) return;
      UI.close(false, false, true); return;
    }
    if (e.code === 'KeyH' && UI.kind === 'hints') { UI.close(); return; }
    if (e.code === 'KeyE' && UI.closeOnE && !e.repeat) { UI.close(); return; }
    UI.onKey && UI.onKey(e);
    return;
  }
  if (G.panelOpen) { if (e.code === 'Escape' || (e.code === 'KeyE' && !e.repeat)) { closePanel(false, e.code === 'Escape'); return; } }
  if (e.code === 'Escape') { if (!e.repeat && !G.locked) openPause(); return; }   // works during cutscenes too
  keys[e.code] = true;
  if (e.repeat || G.cutscene) return;
  if (G.panelOpen) return;
  if (e.code === 'KeyE') act(0);
  else if (e.code === 'KeyR') act(1);
  else if (e.code === 'KeyC' || e.code === 'ControlLeft') ROOM.toggleCrouch && ROOM.toggleCrouch();
  else if (e.code === 'KeyF') ROOM.toggleFlash && ROOM.toggleFlash();
  else if (e.code === 'Space') { e.preventDefault(); ROOM.stepDown && ROOM.stepDown(); }
  else if (e.code === 'KeyQ') ROOM.dropHeld && ROOM.dropHeld();
  else if (e.code === 'KeyH') openHints();
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

/* ---------------- UI shell ---------------- */
const UI = {
  kind: null, closeOnE: false, onKey: null, onClose: null,
  show(kind, html, { cls = 'ui-card', closeOnE = false, onClose = null, onKey = null } = {}) {
    if (UI.kind) UI.close(true, true);
    if (G.panelOpen) closePanel(true);
    UI.kind = kind; UI.closeOnE = closeOnE; UI.onClose = onClose; UI.onKey = onKey;
    const card = $('#card'); card.className = 'card ' + cls; card.innerHTML = html;
    $('#overlay').hidden = false; G.uiOpen = true;
    for (const k in keys) keys[k] = false;
    releasePointer();
    const x = card.querySelector('.x'); if (x) x.onclick = () => UI.close();
    const f = card.querySelector('[autofocus]'); card.tabIndex = -1; (f || card).focus({ preventScroll: true });
    updatePrompt(true);
  },
  close(silent, replacing, byEsc) {
    if (!UI.kind) return;
    const cb = UI.onClose, always = UI.kind === 'phone', wasPause = UI.kind === 'pause'; UI.kind = null; UI.onClose = null; UI.onKey = null;
    $('#overlay').hidden = true; $('#card').innerHTML = ''; G.uiOpen = false;
    if (cb && (!replacing || always)) cb();
    if (wasPause) wakeAudio();
    if (!silent && !UI.kind && !G.panelOpen) resumeLook(byEsc);
  },
};
$('#overlay').addEventListener('mousedown', e => { if (e.target.id === 'overlay' && UI.kind !== 'pause') UI.close(); });

function openPanel(html, bind) {
  if (UI.kind) UI.close(true);
  const p = $('#panel'); p.innerHTML = html; p.hidden = false; G.panelOpen = true; G.uiOpen = true; $('#app').classList.add('panel-open');
  for (const k in keys) keys[k] = false;
  releasePointer(); bind && bind(p); updatePrompt(true);
}
function closePanel(silent, byEsc) {
  if (!G.panelOpen) return;
  $('#panel').hidden = true; $('#panel').innerHTML = ''; G.panelOpen = false; G.uiOpen = false; $('#app').classList.remove('panel-open');
  ROOM.onPanelClose && ROOM.onPanelClose();
  if (!silent) resumeLook(byEsc);
}

function openPause() {
  if (G.mode !== 'play' || UI.kind) return;
  const K = ROOM.keys || [['Move', 'W A S D'], ['Look', 'Mouse'], ['Interact', 'E or click'], ['Other action', 'R or right-click'], ['Run', 'Shift'], ['Crouch', 'C'], ['Notebook', 'Tab'], ['Hints', 'H']];
  UI.show('pause', `
    <h2>Paused</h2><p class="sub">Mystery #${ROOM.n || 1} &middot; ${esc(fmtTime(S.elapsed))} in the room &middot; ${S.hints} hint${S.hints === 1 ? '' : 's'} taken</p>
    <div class="row"><button class="btn primary" id="pRes" autofocus>Resume</button><button class="btn" id="pHint">Hints</button><button class="btn" id="pNb">Notebook</button></div>
    ${G.touch ? `<div class="pkeys"><div><span>Walk</span><b>Left thumb</b></div><div><span>Look</span><b>Drag, right thumb</b></div><div><span>Use things</span><b>Buttons, bottom right</b></div><div><span>Hints &middot; notebook</span><b>Buttons, top right</b></div></div>` : `<div class="pkeys">${K.map(([a, k]) => `<div><span>${a}</span><b>${k}</b></div>`).join('')}</div>`}
    <label class="pvol">Volume <input type="range" id="pVol" min="0" max="1" step="0.05" value="${A.vol}"></label>
    <div class="plinks"><button class="linkbtn" id="pQuit">${HOST.mr() ? 'Back to the corridor' : 'Quit to all mysteries'}</button><button class="linkbtn" id="pRestart">Start this room over</button>${HOST.mr() && HOST.mr().openShare ? '<button class="linkbtn" id="pShare">Send this room to a friend</button>' : ''}${HOST.mr() && HOST.mr().feedback ? '<button class="linkbtn" id="pFb">Send feedback</button>' : ''}</div>`, { cls: 'ui-card pz' });
  G.pauseAt = performance.now();
  if ($('#pShare')) $('#pShare').onclick = () => shareRoom(ROOM.id, 'pause');
  $('#pQuit').onclick = () => { flushSave(); reloadInto(null); };
  $('#pRes').onclick = () => UI.close();
  $('#pNb').onclick = () => openNotebook();
  $('#pHint').onclick = () => openHints();
  $('#pVol').oninput = e => setVolume(+e.target.value);
  if ($('#pFb')) $('#pFb').onclick = () => HOST.mr().feedback({ room: ROOM.id, from: 'pause', state: hostState() });
  $('#pRestart').onclick = () => {
    const b = $('#pRestart');
    if (b.dataset.sure) { store.del(ROOM.saveKey); G.mode = 'end'; reloadInto(ROOM.id); }
    else { b.dataset.sure = '1'; b.textContent = G.touch ? 'Tap again to start over' : 'Click again to start over'; }
  };
}

function fmtTime(sec) { sec = Math.floor(sec); const m = Math.floor(sec / 60), s = sec % 60; return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; }

/* ---------------- notebook ---------------- */
function openNotebook() {
  const docs = S.docs.map(id => ROOM.DOCS[id] ? `<li><button data-doc="${id}">${esc(ROOM.DOCS[id].title)}</button></li>` : '').join('') || '<li class="muted">Nothing yet.</li>';
  const items = S.inv.map(id => { const it = ROOM.ITEMS[id]; return it ? `<li><button data-item="${id}">${esc(it.name)}</button>${ROOM.invNote ? ROOM.invNote(id) : ''}</li>` : ''; }).join('') || '<li class="muted">Empty pockets.</li>';
  const heard = S.heard.map(id => { const h = ROOM.HEARD[id]; return h ? `<li>${esc(h.title)}<div class="tr">${h.text}</div></li>` : ''; }).join('') || '<li class="muted">Nothing yet.</li>';
  UI.show('notebook', `<button class="x">Close &middot; Tab</button><h2>Notebook</h2><p class="sub">Everything you've read, heard and picked up. It won't tell you what matters.</p>
    <div class="nb"><div><h3>Read</h3><ul>${docs}</ul></div><div><h3>Carrying</h3><ul>${items}</ul></div><div style="grid-column:1/-1"><h3>Heard</h3><ul>${heard}</ul></div></div>`);
  $('#card').querySelectorAll('[data-doc]').forEach(b => b.onclick = () => ROOM.openDoc(b.dataset.doc, 'notebook'));
  $('#card').querySelectorAll('[data-item]').forEach(b => b.onclick = () => ROOM.inspectItem(b.dataset.item, 'notebook'));
}

/* ---------------- hints ---------------- */
function openHints() {
  if (G.mode !== 'play') return;
  const topics = ROOM.HINTS.map(h => ({ h, st: h.when(S) })).filter(o => o.st !== 'hidden');
  topics.sort((a, b) => (a.st === 'solved') - (b.st === 'solved'));
  const body = topics.map(({ h, st }) => {
    const n = S.hintTiers[h.id] || 0;
    const shown = h.tiers.slice(0, n).map(t => `<li>${t}</li>`).join('');
    const btn = st === 'solved' ? '<span class="muted" style="font-size:11px;letter-spacing:.08em;text-transform:uppercase">Done</span>'
      : n < h.tiers.length ? `<button class="btn" data-h="${h.id}">${n === 0 ? 'Show a nudge' : n === h.tiers.length - 1 ? 'Show the answer' : 'Show the next hint'}</button>` : '';
    return `<div class="hint ${st}"><h4>${esc(h.title)} <small>${n}/${h.tiers.length}</small></h4>${shown ? `<ol>${shown}</ol>` : ''}${btn}</div>`;
  }).join('');
  UI.show('hints', `<button class="x">Close &middot; H</button><h2>Hints</h2><p class="sub">Unlimited. Each one goes a little further, and the last one is the answer. Taken so far: ${S.hints}.</p>${body}`);
  $('#card').querySelectorAll('[data-h]').forEach(b => b.onclick = () => {
    const id = b.dataset.h; S.hintTiers[id] = (S.hintTiers[id] || 0) + 1; S.hints++; save(); openHints();
  });
}

/* ---------------- inventory HUD ---------------- */
function renderInv(newId) {
  const inv = S.inv.filter(id => !(ROOM.invHidden && ROOM.invHidden(id)));
  $('#inv').innerHTML = (inv.length ? '<em>Pockets</em>' : '') + inv.map(id => `<span class="${id === newId ? 'new' : ''}">${esc(ROOM.ITEMS[id]?.short || ROOM.ITEMS[id]?.name || id)}</span>`).join('');
}
function give(id, quiet) {
  if (S.inv.includes(id)) return;
  S.inv.push(id); renderInv(id);
  if (!quiet) toast(`Picked up: <b>${esc(ROOM.ITEMS[id].name)}</b>${S.inv.length === 1 ? '<br>Things you pick up go in your pockets, listed at the bottom left. They\'re used automatically when you interact with the right thing. ' + (G.touch ? 'The notebook shows them all.' : '<kbd>Tab</kbd> shows them all.') : ' &middot; in your pockets'}`, S.inv.length === 1 ? 7000 : 3800);
  save();
}
const has = id => S.inv.includes(id);
function flag(k, v = true) { S.flags[k] = v; save(); }

/* ---------------- saving ---------------- */
let saveT = 0;
function save() { saveT = 0.4; }
function flushSave() { if (!S || !ROOM) return; S.player = { x: P.x, z: P.z, yaw: G.yaw, pitch: G.pitch }; if (BODY.on) { S.player.y = BODY.ground ? BODY.y : (S.player.y || 0); S.player.cr = BODY.crouch; if (ROOM.savePlayer) ROOM.savePlayer(S.player); } store.set(ROOM.saveKey, S); }
// phones rarely send beforeunload: also save when the page is hidden (app switch, lock screen, a call)
addEventListener('beforeunload', () => { if (G.mode === 'play') flushSave(); });
addEventListener('pagehide', () => { if (G.mode === 'play') flushSave(); });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    if (G.mode === 'play') { flushSave(); if (!UI.kind) { if (typeof touchRelease === 'function') touchRelease(); openPause(); } }
    // nothing should keep playing in the background
    if (A.ctx && A.ctx.state === 'running') { A.hidPaused = true; A.ctx.suspend().catch(() => {}); }
  } else if (A.hidPaused) { A.hidPaused = false; wakeAudio(); }
});
// the audio context can be suspended or "interrupted" (iOS after a call): wake it on the next chance
function wakeAudio() { try { if (A.ctx && A.ctx.state !== 'running' && !document.hidden) A.ctx.resume().catch(() => {}); } catch (e) {} }

/* ---------------- look-away helper ---------------- */
const _v = new THREE.Vector3();
function inView(obj, margin = 1.1) {
  obj.getWorldPosition(_v); _v.project(camera);
  if (_v.z > 1 || _v.z < -1) return false;
  return Math.abs(_v.x) < margin && Math.abs(_v.y) < margin;
}


