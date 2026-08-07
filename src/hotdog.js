/* ============================================================
   Hotdog Party — interactive 3D hotdog background
   ------------------------------------------------------------
   The whole hotdog is generated in code (no model files to host):
   a 2D cross-section is swept along a curved spine, so the bun is
   one continuous loaf with a groove that the sausage sits inside.

   Usage:
     import { mountHotdog } from './assets/hotdog.js';
     mountHotdog({ canvas: document.getElementById('bg-canvas'),
                   accent: 0xff8c1a, mode: 'hero' });
   ============================================================ */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function mountHotdog({
  canvas,
  accent   = 0xff8c1a,   // particle + rim light colour
  mode     = 'hero',     // 'hero' (big, below the title) | 'ambient' (dim backdrop)
  exposure = 1.05,
} = {}) {

  const ambientMode = mode === 'ambient';

  /* ---------- renderer / scene ---------- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x141414);
  renderer.outputColorSpace    = THREE.SRGBColorSpace;
  renderer.toneMapping         = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = ambientMode ? exposure * 0.5 : exposure;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, innerWidth/innerHeight, 0.1, 100);
  camera.position.set(0, 0.6, 9.2);
  camera.lookAt(0, 0, 0);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  /* ---------- lighting ---------- */
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));

  const key = new THREE.DirectionalLight(0xfff2e0, 2.6);
  key.position.set(4, 7, 6);
  scene.add(key);

  const warm = new THREE.DirectionalLight(accent, 1.15);
  warm.position.set(-6, 1.5, 3.5);
  scene.add(warm);

  const cool = new THREE.DirectionalLight(0x5588cc, 0.45);
  cool.position.set(-2, -4, -5);
  scene.add(cool);

  const rim = new THREE.PointLight(accent, 26, 22, 2);
  rim.position.set(0, 2.5, -5);
  scene.add(rim);

  /* ---------- sweep a closed 2D section along a 3D spine ----------
     Section coords: x → world Z (width), y → in-plane normal (up).  */
  function sweep(section, segments, spineFn, scaleFn, colorFn) {
    const n = section.length;
    const pos = [], uv = [], col = [], idx = [];
    const Z = new THREE.Vector3(0,0,1);
    const T = new THREE.Vector3(), N = new THREE.Vector3(), v = new THREE.Vector3();
    const eps = 1e-3;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const c = spineFn(t);
      T.copy(spineFn(Math.min(1, t+eps))).sub(spineFn(Math.max(0, t-eps))).normalize();
      N.crossVectors(Z, T).normalize();
      const s = scaleFn(t);

      for (let j = 0; j < n; j++) {
        const p = section[j];
        v.copy(c).addScaledVector(Z, p.x*s).addScaledVector(N, p.y*s);
        pos.push(v.x, v.y, v.z);
        uv.push(j/n, t);
        if (colorFn) { const cc = colorFn(j, t); col.push(cc.r, cc.g, cc.b); }
      }
    }
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < n; j++) {
        const j2 = (j+1) % n;
        const a = i*n+j, b = i*n+j2, c2 = (i+1)*n+j2, d = (i+1)*n+j;
        idx.push(a, b, d, b, c2, d);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv',       new THREE.Float32BufferAttribute(uv, 2));
    if (colorFn) g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  /* ---------- the hotdog ---------- */
  const hotdog = new THREE.Group();
  const LEN = 4.0, BOW = 0.34;
  const spine = t => new THREE.Vector3(
    (t - 0.5) * LEN,
    BOW * Math.pow(2*t - 1, 2) - BOW * 0.34,
    0
  );

  // bun cross-section: rounded loaf with a groove cut into the top
  const W = 0.60, GROOVE = 0.30, SHOULDER = 0.05, LOBE = 0.30, DEPTH = 0.56;

  function bunSection() {
    const pts = [], crumb = [];
    const lobeCx = (W + GROOVE)/2, lobeRx = (W - GROOVE)/2;
    const LOBE_N = 26, GROOVE_N = 20, UNDER_N = 46;

    for (let i = 0; i <= LOBE_N; i++) {          // right lobe
      const a = Math.PI * (i/LOBE_N);
      pts.push(new THREE.Vector2(lobeCx + lobeRx*Math.cos(a), SHOULDER + LOBE*Math.sin(a)));
      crumb.push(i/LOBE_N > 0.72 ? (i/LOBE_N - 0.72)/0.28 : 0);
    }
    for (let i = 1; i < GROOVE_N; i++) {         // groove floor
      const u = i/GROOVE_N;
      pts.push(new THREE.Vector2(GROOVE*(1 - 2*u), SHOULDER - 0.11*Math.sin(Math.PI*u)));
      crumb.push(1);
    }
    for (let i = 0; i <= LOBE_N; i++) {          // left lobe
      const a = Math.PI - Math.PI*(i/LOBE_N);
      pts.push(new THREE.Vector2(-lobeCx - lobeRx*Math.cos(a), SHOULDER + LOBE*Math.sin(a)));
      crumb.push(i/LOBE_N < 0.28 ? 1 - (i/LOBE_N)/0.28 : 0);
    }
    for (let i = 1; i < UNDER_N; i++) {          // rounded underside
      const a = Math.PI + Math.PI*(i/UNDER_N);
      pts.push(new THREE.Vector2(W*Math.cos(a), SHOULDER + DEPTH*Math.sin(a)));
      crumb.push(-Math.sin(Math.PI*(i/UNDER_N)));
    }
    return { pts, crumb };
  }

  const BUN = bunSection();
  const bunTaper = t => Math.pow(1 - Math.pow(Math.abs(2*t - 1), 4.2), 0.30);

  const CRUST   = new THREE.Color(0xeda253);
  const TOASTED = new THREE.Color(0xc47f34);
  const CRUMB   = new THREE.Color(0xf7e7c4);
  const bunColor = j => {
    const k = BUN.crumb[j];
    return k >= 0 ? CRUST.clone().lerp(CRUMB, k*k)
                  : CRUST.clone().lerp(TOASTED, -k*0.8);
  };

  hotdog.add(new THREE.Mesh(
    sweep(BUN.pts, 150, spine, bunTaper, bunColor),
    new THREE.MeshPhysicalMaterial({
      vertexColors:true, roughness:0.74, metalness:0.0,
      clearcoat:0.14, clearcoatRoughness:0.8,
      sheen:0.5, sheenColor:new THREE.Color(0xffd9a0),
      side:THREE.DoubleSide,
    })
  ));

  // sausage
  const circle = Array.from({length:40}, (_, i) => {
    const a = (i/40) * Math.PI * 2;
    return new THREE.Vector2(Math.cos(a), Math.sin(a));
  });
  const sausageSpine = t => { const c = spine(0.045 + t*0.91); c.y += 0.27; return c; };
  const R = 0.30;
  const sausageTaper = t => R * Math.pow(1 - Math.pow(Math.abs(2*t - 1), 7), 0.28);

  hotdog.add(new THREE.Mesh(
    sweep(circle, 140, sausageSpine, sausageTaper),
    new THREE.MeshPhysicalMaterial({
      color:0xd9622f, roughness:0.38, metalness:0.0,
      clearcoat:0.55, clearcoatRoughness:0.35, sheen:0.3,
      side:THREE.DoubleSide,
    })
  ));

  // condiment ribbons
  function condiment({ color, amp, freq, phase, lift, radius, span }) {
    const pts = [];
    for (let i = 0; i <= 240; i++) {
      const t  = i/240;
      const ts = span[0] + t*(span[1] - span[0]);
      const c  = sausageSpine((ts - 0.045)/0.91);
      const w  = Math.sin(t*Math.PI*2*freq + phase);
      const r  = sausageTaper((ts - 0.045)/0.91);
      pts.push(new THREE.Vector3(c.x, c.y + (r + lift)*(0.72 + 0.28*(1 - Math.abs(w))), w*amp));
    }
    return new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 300, radius, 12, false),
      new THREE.MeshPhysicalMaterial({ color, roughness:0.16, metalness:0.0,
                                       clearcoat:1.0, clearcoatRoughness:0.08 })
    );
  }
  hotdog.add(condiment({ color:0xf0b12a, amp:0.20, freq:9, phase:0,             lift:0.02, radius:0.052, span:[0.10,0.90] }));
  hotdog.add(condiment({ color:0xd42112, amp:0.15, freq:9, phase:Math.PI*0.9,   lift:0.05, radius:0.040, span:[0.11,0.89] }));

  hotdog.rotation.set(0.42, 0, 0.30);
  hotdog.scale.setScalar(ambientMode ? 1.0 : 1.15);
  // In ambient mode it sits deep in the scene and off to one side, so page
  // copy stays readable on top of it.
  if (ambientMode) { hotdog.position.x = 2.3; hotdog.position.z = -6.0; }
  scene.add(hotdog);

  /* ---------- responsive framing ---------- */
  let baseZ = 9.2, zoom = 0, HOTDOG_Y = -1.78;
  const HALF_FOV = THREE.MathUtils.degToRad(camera.fov / 2);

  function frame() {
    const aspect = innerWidth / innerHeight;
    const tall   = aspect < 1;
    const needed = (tall ? 5.4 : 6.6) / (2*Math.tan(HALF_FOV)*aspect);
    baseZ = Math.min(21, Math.max(9.2, needed));
    camera.position.z = baseZ + zoom;
    HOTDOG_Y = ambientMode ? -1.5 : -(tall ? 0.46 : 0.56) * baseZ * Math.tan(HALF_FOV);
  }
  frame();

  /* ---------- ember particles ---------- */
  const P = 140;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(P*3), pSize = new Float32Array(P), pVel = [];
  for (let i = 0; i < P; i++) {
    pPos[i*3]   = (Math.random() - 0.5) * 22;
    pPos[i*3+1] = (Math.random() - 0.5) * 14;
    pPos[i*3+2] = (Math.random() - 0.5) * 12 - 4;
    pSize[i]    = 0.6 + Math.random()*2.2;
    pVel.push([ (Math.random()-0.5)*0.0025, 0.004 + Math.random()*0.009 ]);
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('size',     new THREE.BufferAttribute(pSize, 1));

  scene.add(new THREE.Points(pGeo, new THREE.ShaderMaterial({
    transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
    uniforms:{ uColor:{ value:new THREE.Color(accent) } },
    vertexShader:`
      attribute float size; varying float vA;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position,1.0);
        gl_PointSize = size * (90.0 / -mv.z);
        gl_Position  = projectionMatrix * mv;
        vA = clamp(1.0 - (-mv.z / 18.0), 0.05, 0.55);
      }`,
    fragmentShader:`
      uniform vec3 uColor; varying float vA;
      void main(){
        float d = length(gl_PointCoord - 0.5) * 2.0;
        gl_FragColor = vec4(uColor, smoothstep(1.0, 0.0, d) * vA);
      }`,
  })));

  /* ---------- interaction ---------- */
  let dragging = false, prev = {x:0,y:0};
  let targetY = 0, targetX = 0.42, auto = true, timer = null;
  const BASE_X = 0.42;

  const start = (x,y) => { dragging = true; auto = false; clearTimeout(timer); prev = {x,y}; };
  const move  = (x,y) => {
    if (!dragging) return;
    targetY += (x - prev.x) * 0.008;
    targetX  = Math.max(-0.6, Math.min(1.2, targetX + (y - prev.y) * 0.005));
    prev = {x,y};
  };
  const end = () => { dragging = false; timer = setTimeout(() => auto = true, 2600); };

  canvas.addEventListener('mousedown',  e => start(e.clientX, e.clientY));
  addEventListener('mousemove', e => move(e.clientX, e.clientY));
  addEventListener('mouseup', end);
  canvas.addEventListener('touchstart', e => start(e.touches[0].clientX, e.touches[0].clientY), {passive:true});
  canvas.addEventListener('touchmove',  e => move(e.touches[0].clientX, e.touches[0].clientY),  {passive:true});
  canvas.addEventListener('touchend', end);

  if (!ambientMode) {
    addEventListener('wheel', e => {
      zoom = Math.max(-3, Math.min(5, zoom + e.deltaY * 0.004));
      camera.position.z = baseZ + zoom;
    }, {passive:true});
  }

  /* ---------- loop ---------- */
  const clock = new THREE.Clock();
  const spinSpeed = ambientMode ? 0.0022 : 0.0045;

  (function tick(){
    requestAnimationFrame(tick);
    const t = clock.getElapsedTime();

    if (auto) { targetY += spinSpeed; targetX += (BASE_X - targetX) * 0.01; }

    hotdog.rotation.y += (targetY - hotdog.rotation.y) * 0.055;
    hotdog.rotation.x += (targetX - hotdog.rotation.x) * 0.055;
    hotdog.rotation.z  = 0.30 + Math.sin(t * 0.4) * 0.05;
    hotdog.position.y  = HOTDOG_Y + Math.sin(t*0.55)*0.10 + Math.sin(t*1.13)*0.035;

    const a = pGeo.attributes.position.array;
    for (let i = 0; i < P; i++) {
      a[i*3]   += pVel[i][0];
      a[i*3+1] += pVel[i][1];
      if (a[i*3+1] > 7) { a[i*3+1] = -7; a[i*3] = (Math.random()-0.5)*22; }
    }
    pGeo.attributes.position.needsUpdate = true;

    rim.position.x = Math.sin(t*0.35) * 5.5;
    rim.position.z = Math.cos(t*0.35) * 5.5 - 1.5;

    renderer.render(scene, camera);
  })();

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    frame();
  });

  return { scene, camera, renderer, hotdog };
}
