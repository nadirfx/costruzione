// The studio core: a holographic globe (wire grid + point surface + atmosphere), three tilted orbit rings with ticks,
// six department beacons on the main orbit. A beacon lights up and fires an arc into the core while its agents work.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { DEPTS } from './org.js';

export function createStudio(canvas, labelsEl, { onPick, deptInfo } = {}) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(36, 1, 0.1, 200);
  const world = new THREE.Group(); scene.add(world);
  const R = 2.05;
  const CY = new THREE.Color(0x3fd0ff), CY2 = new THREE.Color(0x9ff0ff), HOT = new THREE.Color(0xffa24a);
  const add = (m) => { m.material.depthWrite = false; m.material.transparent = true; m.material.blending = THREE.AdditiveBlending; return m; };

  // globe: point surface (fibonacci) with a slow wave
  const N = 4200, pos = new Float32Array(N * 3), seed = new Float32Array(N);
  for (let i = 0; i < N; i++) { const y = 1 - i / (N - 1) * 2, r = Math.sqrt(1 - y * y), th = i * 2.399963; pos[i * 3] = Math.cos(th) * r * R; pos[i * 3 + 1] = y * R; pos[i * 3 + 2] = Math.sin(th) * r * R; seed[i] = Math.random(); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
  const pUni = { uT: { value: 0 }, uPix: { value: renderer.getPixelRatio() } };
  const globe = new THREE.Group(); world.add(globe);
  globe.add(new THREE.Points(pg, new THREE.ShaderMaterial({ uniforms: pUni, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'attribute float seed;uniform float uT;uniform float uPix;varying float vA;void main(){vec3 p=position;float w=sin(p.y*3.0-uT*1.4+seed*.5)*.5+.5;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;vA=(.25+.75*w)*(.55+.45*sin(uT*2.+seed*30.));gl_PointSize=(1.0+seed*1.3+w)*uPix*(8./-mv.z);}',
    fragmentShader: 'varying float vA;void main(){vec2 c=gl_PointCoord-.5;float d=length(c);if(d>.5)discard;gl_FragColor=vec4(vec3(.3,.82,1.)*vA*.75,smoothstep(.5,.1,d));}' })));
  // wire grid
  const gridMat = new THREE.LineBasicMaterial({ color: 0x2aa8e0, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false });
  for (let k = -5; k <= 5; k++) { const lat = k / 6 * Math.PI / 2, r = Math.cos(lat) * R * 1.002, y = Math.sin(lat) * R * 1.002, pts = []; for (let i = 0; i <= 120; i++) { const a = i / 120 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r)); } globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat)); }
  for (let k = 0; k < 12; k++) { const lo = k / 12 * Math.PI, pts = []; for (let i = 0; i <= 120; i++) { const a = i / 120 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(lo) * Math.sin(a) * R * 1.002, Math.cos(a) * R * 1.002, Math.sin(lo) * Math.sin(a) * R * 1.002)); } globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat)); }
  // atmosphere
  globe.add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.04, 64, 48), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
    vertexShader: 'varying vec3 n;varying vec3 v;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);v=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
    fragmentShader: 'varying vec3 n;varying vec3 v;void main(){float f=pow(1.-abs(dot(n,v)),3.0);gl_FragColor=vec4(vec3(.15,.6,1.)*f*1.3,f);}' })));
  // scan ring travelling up and down
  const scan = add(new THREE.Mesh(new THREE.TorusGeometry(R * 1.01, 0.008, 6, 160), new THREE.MeshBasicMaterial({ color: CY2, opacity: 0.8 })));
  scan.rotation.x = Math.PI / 2; globe.add(scan);
  // orbit rings with ticks
  const rings = new THREE.Group(); world.add(rings);
  const ringDefs = [[R * 1.42, 0.0, 0.0, 0.9], [R * 1.62, 0.28, 0.5, 0.45], [R * 1.86, -0.22, -0.7, 0.3]];
  const ringObjs = ringDefs.map(([rr, tx, tz, op], i) => {
    const g = new THREE.Group(); g.rotation.set(Math.PI / 2 + tx, 0, tz); rings.add(g);
    g.add(add(new THREE.Mesh(new THREE.TorusGeometry(rr, i ? 0.005 : 0.009, 6, 220), new THREE.MeshBasicMaterial({ color: CY, opacity: op }))));
    const tk = []; const n = i ? 90 : 144; for (let j = 0; j < n; j++) { const a = j / n * Math.PI * 2, l = j % 6 === 0 ? 0.11 : 0.045; tk.push(new THREE.Vector3(Math.cos(a) * rr, Math.sin(a) * rr, 0), new THREE.Vector3(Math.cos(a) * (rr + l), Math.sin(a) * (rr + l), 0)); }
    g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(tk), new THREE.LineBasicMaterial({ color: CY, transparent: true, opacity: op * 0.6, blending: THREE.AdditiveBlending, depthWrite: false })));
    return g;
  });
  // dust
  const dN = 700, dPos = new Float32Array(dN * 3);
  for (let i = 0; i < dN; i++) { const r = 5 + Math.random() * 16, a = Math.random() * 6.283, b = Math.acos(2 * Math.random() - 1); dPos[i * 3] = r * Math.sin(b) * Math.cos(a); dPos[i * 3 + 1] = r * Math.cos(b) * 0.6; dPos[i * 3 + 2] = r * Math.sin(b) * Math.sin(a); }
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  scene.add(new THREE.Points(dGeo, new THREE.PointsMaterial({ color: 0x3a9fd8, size: 0.03, transparent: true, opacity: 0.6, depthWrite: false })));

  // department beacons on the main orbit
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.3, 'rgba(255,255,255,.4)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const orbit = ringObjs[0];
  const beacons = DEPTS.map((d, i) => {
    const col = new THREE.Color(d.color); const a = i / DEPTS.length * Math.PI * 2 + 0.3; const rr = ringDefs[0][0];
    const o = new THREE.Group(); o.position.set(Math.cos(a) * rr, Math.sin(a) * rr, 0); orbit.add(o);
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), new THREE.MeshBasicMaterial({ color: col }));
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: col, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending })); halo.scale.setScalar(0.7);
    const ring = add(new THREE.Mesh(new THREE.RingGeometry(0.18, 0.2, 40), new THREE.MeshBasicMaterial({ color: col, opacity: 0.7, side: THREE.DoubleSide })));
    o.add(core, halo, ring);
    // arc from the beacon into the core, lit while working
    const arcPts = []; for (let k = 0; k <= 40; k++) { const u = k / 40; const p = new THREE.Vector3(Math.cos(a) * rr * (1 - u), Math.sin(a) * rr * (1 - u), Math.sin(u * Math.PI) * 0.9); arcPts.push(p); }
    const arc = new THREE.Line(new THREE.BufferGeometry().setFromPoints(arcPts), new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); orbit.add(arc);
    const pulse = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: col, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); pulse.scale.setScalar(0.35); orbit.add(pulse);
    const lbl = document.createElement('button'); lbl.type = 'button'; lbl.className = 'nodeLbl'; lbl.style.setProperty('--c', d.color);
    lbl.innerHTML = '<b></b><span></span>'; lbl.querySelector('b').textContent = d.name;
    lbl.addEventListener('click', () => onPick && onPick(d.key));
    lbl.addEventListener('pointerenter', () => { hoverPause = true; }); lbl.addEventListener('pointerleave', () => { hoverPause = false; });
    labelsEl.append(lbl);
    return { d, o, core, halo, ring, arc, arcPts, pulse, lbl, work: 0, target: 0, a };
  });

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, cam));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.9, 0.55, 0.15);
  if (!window.__noBloom) composer.addPass(bloom);
  composer.addPass(new OutputPass());

  let rotY = 0.5, tilt = 0.32, vel = reduce ? 0 : 0.0018, drag = false, lx = 0, ly = 0, moved = 0, idle = 0, hoverPause = false;
  canvas.addEventListener('pointerdown', (e) => { drag = true; moved = 0; lx = e.clientX; ly = e.clientY; try { canvas.setPointerCapture(e.pointerId); } catch (x) { } });
  canvas.addEventListener('pointermove', (e) => { if (!drag) return; const dx = e.clientX - lx, dy = e.clientY - ly; moved += Math.abs(dx) + Math.abs(dy); vel = dx * 0.004; rotY += vel; tilt = Math.max(-0.1, Math.min(0.75, tilt + dy * 0.003)); lx = e.clientX; ly = e.clientY; idle = 0; });
  const up = () => { drag = false; };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);

  let running = false, raf = 0, last = performance.now(), t0 = last, w = 0, h = 0, selected = null, flow = 0;
  function resize() {
    const r = canvas.getBoundingClientRect(); const nw = Math.max(1, Math.round(r.width)), nh = Math.max(1, Math.round(r.height));
    if (nw === w && nh === h) return; w = nw; h = nh;
    renderer.setSize(w, h, false); composer.setSize(w, h); bloom.setSize(w / 2, h / 2); cam.aspect = w / h;
    cam.position.set(0, 0, w / h < 0.9 ? 16 : w / h < 1.25 ? 13 : 11.5); cam.updateProjectionMatrix();
  }
  const v = new THREE.Vector3();
  function frame(now) {
    if (!running) return; raf = requestAnimationFrame(frame);
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; const t = (now - t0) / 1000;
    resize();
    if (!drag) { idle += dt; vel += ((reduce || hoverPause ? 0 : 0.0018) - vel) * Math.min(1, dt * (idle > 1.2 ? 1.5 : 0.4)); rotY += (hoverPause ? 0 : vel) * dt * 60; }
    world.rotation.set(tilt, 0, 0); globe.rotation.y = rotY; rings.rotation.y = rotY * 0.35;
    ringObjs[1].rotation.z += dt * 0.05; ringObjs[2].rotation.z -= dt * 0.035;
    pUni.uT.value = t;
    const sy = Math.sin(t * 0.45) * R * 0.96; scan.position.y = sy; const sr = Math.sqrt(Math.max(1e-4, R * R - sy * sy)) / R; scan.scale.setScalar(sr); scan.material.opacity = 0.25 + 0.5 * Math.abs(Math.cos(t * 0.45));
    flow += dt * 0.6;
    const r = canvas.getBoundingClientRect();
    for (const B of beacons) {
      B.work += (B.target - B.work) * Math.min(1, dt * 3);
      const sel = selected === B.d.key ? 1 : 0;
      B.core.rotation.y += dt * (0.8 + 2.5 * B.work); B.core.scale.setScalar(1 + 0.35 * B.work + 0.2 * sel);
      B.halo.material.opacity = 0.35 + 0.5 * B.work + 0.2 * sel + 0.08 * Math.sin(t * 3 + B.a * 4); B.halo.scale.setScalar(0.6 + 0.5 * B.work);
      B.ring.rotation.z += dt * 1.2; B.ring.scale.setScalar(1 + 0.25 * Math.sin(t * 2.5 + B.a) * (0.3 + B.work));
      B.ring.lookAt(cam.position);
      B.arc.material.opacity = 0.75 * B.work;
      const u = (((flow + B.a) % 1) + 1) % 1; const i = Math.min(40, Math.max(0, Math.floor(u * 40))); B.pulse.position.copy(B.arcPts[i]); B.pulse.material.opacity = B.work * Math.sin(u * Math.PI);
      B.o.getWorldPosition(v); const behind = v.clone().sub(cam.position).dot(cam.getWorldDirection(new THREE.Vector3())) < 0;
      v.project(cam); const vis = v.z < 1 && !behind;
      B.lbl.style.display = vis ? '' : 'none';
      if (vis) { const hw = (B.lbl.offsetWidth || 80) / 2 + 6; B.lbl.style.left = Math.max(hw, Math.min(r.width - hw, (v.x + 1) / 2 * r.width)) + 'px'; B.lbl.style.top = ((1 - v.y) / 2 * r.height) + 'px'; }
    }
    composer.render(dt);
  }
  return {
    setWork(map) {
      for (const B of beacons) { const info = deptInfo ? deptInfo(B.d.key) : { text: '' }; B.lbl.querySelector('span').textContent = info.text || info; B.target = info.busy ? 1 : 0; B.lbl.classList.toggle('work', !!info.busy); }
    },
    select(k) { selected = k; for (const B of beacons) B.lbl.classList.toggle('sel', B.d.key === k); },
    start() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); },
    stop() { running = false; cancelAnimationFrame(raf); },
    get running() { return running; },
  };
}
