// The studio in 3D: one glass platform per department, its agents as lights that wake up when they work,
// light running along the links Direzione → production → Qualità while missions are in progress.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { DEPTS, AGENTS } from './org.js';

const POS = {
  dir: [0, 2.15, 0, 0.95],
  wri: [-2.5, 0.25, 2.3, 0.85], snd: [2.5, 0.25, 2.3, 0.85], edt: [2.5, 0.25, -2.3, 0.85], mot: [-2.5, 0.25, -2.3, 0.85],
  qa: [0, -1.7, 0, 1.45],
};
const LINKS = [['dir', 'wri'], ['dir', 'mot'], ['dir', 'snd'], ['dir', 'edt'], ['wri', 'qa'], ['mot', 'qa'], ['snd', 'qa'], ['edt', 'qa']];

export function createStudio(canvas, labelsEl, { onPick, deptInfo } = {}) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  const cam = new THREE.PerspectiveCamera(34, 1, 0.1, 200);
  scene.add(new THREE.HemisphereLight(0xfff1e6, 0x0b0d14, 0.55));
  const key = new THREE.DirectionalLight(0xffe2cf, 1.1); key.position.set(4, 8, 6); scene.add(key);
  const world = new THREE.Group(); scene.add(world);

  // floor: a polar grid that fades out
  const grid = new THREE.Group(); grid.position.y = -2.55; world.add(grid);
  const gm = new THREE.LineBasicMaterial({ color: 0x3a3f4d, transparent: true, opacity: 0.35 });
  for (let r = 1; r <= 7; r++) { const pts = []; for (let i = 0; i <= 160; i++) { const a = i / 160 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)); } const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gm.clone()); l.material.opacity = 0.32 * (1 - r / 8); grid.add(l); }
  for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(Math.cos(a), 0, Math.sin(a)), new THREE.Vector3(Math.cos(a) * 7, 0, Math.sin(a) * 7)]), new THREE.LineBasicMaterial({ color: 0x3a3f4d, transparent: true, opacity: 0.12 })); grid.add(l); }
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  const pool = new THREE.Mesh(new THREE.CircleGeometry(5.5, 64), new THREE.MeshBasicMaterial({ map: glowTex, color: 0xec8a5e, transparent: true, opacity: 0.08, depthWrite: false, blending: THREE.AdditiveBlending }));
  pool.rotation.x = -Math.PI / 2; pool.position.y = -2.54; world.add(pool);

  // dust
  const dN = 420, dPos = new Float32Array(dN * 3);
  for (let i = 0; i < dN; i++) { const r = 2 + Math.random() * 9, a = Math.random() * 6.283; dPos[i * 3] = Math.cos(a) * r; dPos[i * 3 + 1] = -2.4 + Math.random() * 6.5; dPos[i * 3 + 2] = Math.sin(a) * r; }
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({ color: 0xf6c4a8, size: 0.03, transparent: true, opacity: 0.55, depthWrite: false }));
  world.add(dust);

  // departments
  const depts = {};
  for (const d of DEPTS) {
    const [x, y, z, r] = POS[d.key]; const col = new THREE.Color(d.color);
    const g = new THREE.Group(); g.position.set(x, y, z); world.add(g);
    const plat = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.02, 0.12, 72), new THREE.MeshPhysicalMaterial({ color: 0x151925, metalness: 0.35, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.18, envMapIntensity: 0.9 }));
    g.add(plat);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(r * 1.01, 0.016, 8, 120), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85 }));
    rim.rotation.x = Math.PI / 2; rim.position.y = 0.06; g.add(rim);
    const halo = new THREE.Mesh(new THREE.CircleGeometry(r * 1.55, 48), new THREE.MeshBasicMaterial({ map: glowTex, color: col, transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending }));
    halo.rotation.x = -Math.PI / 2; halo.position.y = 0.07; g.add(halo);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.55, r * 0.9, 2.2, 40, 1, true), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    beam.position.y = 1.15; g.add(beam);
    const ags = AGENTS.filter(a => a.dept === d.key).map((a, i, arr) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.095, 24, 16), new THREE.MeshStandardMaterial({ color: 0x222633, emissive: col, emissiveIntensity: 0.6, roughness: 0.3, metalness: 0.2 }));
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: col, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending })); sp.scale.setScalar(0.55);
      const o = new THREE.Group(); o.add(m, sp); g.add(o);
      return { key: a.key, o, m, sp, phase: i / arr.length * Math.PI * 2, rr: r * (arr.length === 1 ? 0 : 0.5) };
    });
    depts[d.key] = { d, g, plat, rim, halo, beam, ags, r, label: null, work: 0, target: 0 };
  }
  // links with travelling light
  const links = LINKS.map(([a, b]) => {
    const A = depts[a].g.position, B = depts[b].g.position;
    const mid = A.clone().add(B).multiplyScalar(0.5); mid.y += 0.35;
    const curve = new THREE.QuadraticBezierCurve3(A.clone(), mid, B.clone());
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.01, 6, false), new THREE.MeshBasicMaterial({ color: 0x5b5f6c, transparent: true, opacity: 0.5 }));
    world.add(tube);
    const pulses = [0, 1, 2].map((k) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(depts[b].d.color), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); s.scale.setScalar(0.28); world.add(s); return { s, off: k / 3 }; });
    return { a, b, curve, tube, pulses };
  });

  // labels (rotation pauses while the pointer is on one, so it is easy to tap)
  let hoverPause = false;
  for (const k in depts) {
    const D = depts[k]; const lbl = document.createElement('button'); lbl.type = 'button'; lbl.className = 'nodeLbl'; lbl.style.setProperty('--c', D.d.color);
    lbl.innerHTML = '<b></b><span></span>'; lbl.querySelector('b').textContent = D.d.name;
    lbl.addEventListener('click', () => onPick && onPick(k)); lbl.addEventListener('pointerenter', () => { hoverPause = true; }); lbl.addEventListener('pointerleave', () => { hoverPause = false; }); labelsEl.append(lbl); D.label = lbl;
  }

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, cam));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.55, 0.5, 0.55);
  if (!window.__noBloom) composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // interaction: drag to orbit, tap a platform to open it
  let az = 0.02, el_ = 0.24, vaz = reduce ? 0 : 0.0016, drag = false, lx = 0, ly = 0, moved = 0, idle = 0;
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2(9, 9);
  const toNdc = (e) => { const r = canvas.getBoundingClientRect(); mouse.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); };
  canvas.addEventListener('pointerdown', (e) => { drag = true; moved = 0; lx = e.clientX; ly = e.clientY; try { canvas.setPointerCapture(e.pointerId); } catch (x) { } });
  canvas.addEventListener('pointermove', (e) => { toNdc(e); if (!drag) return; const dx = e.clientX - lx, dy = e.clientY - ly; moved += Math.abs(dx) + Math.abs(dy); vaz = -dx * 0.0045; az += vaz; el_ = Math.max(0.08, Math.min(0.7, el_ + dy * 0.003)); lx = e.clientX; ly = e.clientY; idle = 0; });
  const up = (e) => { if (!drag) return; drag = false; if (moved < 6) { toNdc(e); ray.setFromCamera(mouse, cam); const hit = ray.intersectObjects(Object.values(depts).map(D => D.plat), false)[0]; if (hit) { const k = Object.keys(depts).find(k => depts[k].plat === hit.object); k && onPick && onPick(k); } } };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', () => { drag = false; });
  canvas.addEventListener('pointerleave', () => mouse.set(9, 9));

  let running = false, raf = 0, last = performance.now(), t0 = last, w = 0, h = 0, flow = 0, selected = null;
  function resize() {
    const r = canvas.getBoundingClientRect(); const nw = Math.max(1, Math.round(r.width)), nh = Math.max(1, Math.round(r.height));
    if (nw === w && nh === h) return; w = nw; h = nh;
    renderer.setSize(w, h, false); composer.setSize(w, h); bloom.setSize(w / 2, h / 2); cam.aspect = w / h; cam.updateProjectionMatrix();
  }
  const v = new THREE.Vector3();
  function frame(now) {
    if (!running) return; raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now; const t = (now - t0) / 1000;
    resize();
    if (!drag) { idle += dt; vaz += ((reduce || hoverPause ? 0 : 0.0016) - vaz) * Math.min(1, dt * (idle > 1.2 ? 1.5 : 0.4)); az += (hoverPause ? 0 : vaz) * dt * 60; }
    const asp = w / h; const dist = asp < 0.8 ? 21 : asp < 1.2 ? 16 : asp > 1.8 ? 12 : 13;
    cam.position.set(Math.sin(az) * Math.cos(el_) * dist, Math.sin(el_) * dist + 0.3, Math.cos(az) * Math.cos(el_) * dist); cam.lookAt(0, 0.3, 0);
    ray.setFromCamera(mouse, cam); const hov = ray.intersectObjects(Object.values(depts).map(D => D.plat), false)[0];
    canvas.style.cursor = hov ? 'pointer' : (drag ? 'grabbing' : 'grab');
    const r = canvas.getBoundingClientRect();
    for (const k in depts) {
      const D = depts[k]; D.work += (D.target - D.work) * Math.min(1, dt * 3);
      const hot = hov && hov.object === D.plat ? 1 : 0; const sel = selected === k ? 1 : 0;
      D.halo.material.opacity = 0.14 + 0.34 * D.work + 0.12 * hot + 0.14 * sel + 0.04 * Math.sin(t * 2 + D.r);
      D.rim.material.opacity = 0.55 + 0.45 * Math.max(D.work, hot, sel);
      D.beam.material.opacity = 0.07 * D.work * (0.75 + 0.25 * Math.sin(t * 3));
      D.g.position.y = POS[k][1] + Math.sin(t * 0.8 + D.r * 3) * 0.04;
      for (const A of D.ags) {
        const a = A.phase + t * (0.35 + 0.5 * D.work);
        A.o.position.set(Math.cos(a) * A.rr, 0.34 + Math.sin(t * 2 + A.phase) * 0.05 + 0.12 * A.busy, Math.sin(a) * A.rr);
        const b = A.busy || 0; A.m.material.emissiveIntensity = 0.55 + 2.2 * b * (0.7 + 0.3 * Math.sin(t * 7)); A.sp.material.opacity = 0.35 + 0.55 * b; A.sp.scale.setScalar(0.5 + 0.45 * b);
      }
      D.g.getWorldPosition(v); v.y += k === 'qa' ? -0.62 : k === 'dir' ? 0.95 : 0.85; v.project(cam);
      const vis = v.z < 1; D.label.style.display = vis ? '' : 'none';
      if (vis) { D.label.style.left = ((v.x + 1) / 2 * r.width) + 'px'; D.label.style.top = ((1 - v.y) / 2 * r.height) + 'px'; }
    }
    flow += dt * 0.35;
    for (const L of links) {
      const act = Math.max(depts[L.a].work, depts[L.b].work, globalFlow);
      L.tube.material.opacity = 0.28 + 0.4 * act;
      for (const P of L.pulses) { const u = (flow + P.off) % 1; L.curve.getPoint(u, P.s.position); P.s.material.opacity = act * Math.sin(u * Math.PI) * 0.9; }
    }
    dust.rotation.y += dt * 0.01;
    composer.render(dt);
  }
  let globalFlow = 0;
  return {
    setWork(map, flowLevel) { // map: agentKey -> 0..1
      globalFlow = flowLevel || 0;
      for (const k in depts) { const D = depts[k]; let m = 0; for (const A of D.ags) { A.busy = map[A.key] ? 1 : 0; m = Math.max(m, A.busy); } D.target = m; }
      for (const k in depts) { const D = depts[k]; const info = deptInfo ? deptInfo(k) : ''; D.label.querySelector('span').textContent = info; D.label.classList.toggle('work', D.target > 0); }
    },
    select(k) { selected = k; for (const x in depts) depts[x].label.classList.toggle('sel', x === k); },
    start() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); },
    stop() { running = false; cancelAnimationFrame(raf); },
    get running() { return running; },
  };
}
