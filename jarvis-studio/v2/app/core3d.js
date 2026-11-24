// The Hub's 3D nucleus: a particle sphere with orbit rings, a scanning beam and one glowing node per mission.
// Drag to rotate (with inertia), idle auto-rotation, click a node to open it. Paused when the Hub is hidden.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const STATUS_COL = { brief: 0x6f9fae, lavorazione: 0xffb648, revisione: 0xff5b4f, approvato: 0x3be38c };

export function createCore(canvas, labelsEl, { onPick } = {}) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' }); }
  catch (e) { return null; }
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setClearColor(0x020a0d, 1);
  renderer.toneMapping = THREE.NoToneMapping;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020a0d);
  
  const cam = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
  cam.position.set(0, 0.4, 9.2);
  const world = new THREE.Group(); scene.add(world);
  const globe = new THREE.Group(); world.add(globe);

  // particle sphere (fibonacci) with shader twinkle and a travelling wave
  const N = 5200, R = 2.3;
  const pos = new Float32Array(N * 3), seed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * 2.399963;
    pos[i * 3] = Math.cos(th) * r * R; pos[i * 3 + 1] = y * R; pos[i * 3 + 2] = Math.sin(th) * r * R; seed[i] = Math.random();
  }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
  const pUni = { uT: { value: 0 }, uPix: { value: renderer.getPixelRatio() } };
  const pMat = new THREE.ShaderMaterial({
    uniforms: pUni, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float seed;uniform float uT;uniform float uPix;varying float vA;varying float vS;
      void main(){vec3 p=position;float w=sin(p.y*2.4-uT*1.6+seed*.6)*.5+.5;p*=1.0+w*.035;
      vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
      float tw=.55+.45*sin(uT*2.2+seed*40.);vA=tw*(.35+w*.65);vS=seed;gl_PointSize=(1.1+seed*1.4+w*1.1)*uPix*(9./-mv.z);}`,
    fragmentShader: `varying float vA;varying float vS;void main(){vec2 c=gl_PointCoord-.5;float d=length(c);if(d>.5)discard;
      vec3 col=mix(vec3(.16,.75,.95),vec3(.75,.97,1.),vS*vS);gl_FragColor=vec4(col,vA*.55*smoothstep(.5,.15,d));}`,
  });
  globe.add(new THREE.Points(pg, pMat));
  // inner glow shell (fresnel)
  const shell = new THREE.Mesh(new THREE.SphereGeometry(R * 0.985, 64, 48), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.FrontSide,
    vertexShader: `varying vec3 n;varying vec3 v;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);v=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,
    fragmentShader: `varying vec3 n;varying vec3 v;void main(){float f=pow(1.-max(dot(n,v),0.),2.6);gl_FragColor=vec4(vec3(.06,.42,.6)*f,f*.32);}`,
  }));
  globe.add(shell);
  // latitude lines
  const latMat = new THREE.LineBasicMaterial({ color: 0x1d8ea6, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false });
  for (const lat of [-0.6, -0.3, 0, 0.3, 0.6]) {
    const r = Math.cos(lat) * R * 1.003, y = Math.sin(lat) * R * 1.003, pts = [];
    for (let i = 0; i <= 128; i++) { const a = i / 128 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r)); }
    globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), latMat));
  }
  // orbit rings (tilted) + tick marks
  const rings = new THREE.Group(); world.add(rings);
  const ringDefs = [[3.05, 0.012, 0.35, 0.2], [3.45, 0.008, -0.5, 0.9], [3.9, 0.006, 0.15, -0.6]];
  for (const [rr, w, tx, tz] of ringDefs) {
    const m = new THREE.Mesh(new THREE.TorusGeometry(rr, w, 8, 220), new THREE.MeshBasicMaterial({ color: 0x43e5ff, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.rotation.set(Math.PI / 2 + tx, 0, tz); rings.add(m);
  }
  // scanning beam: a thin bright band sweeping vertically across the sphere
  const beam = new THREE.Mesh(new THREE.TorusGeometry(R * 1.01, 0.012, 6, 160), new THREE.MeshBasicMaterial({ color: 0xbff6ff, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }));
  beam.rotation.x = Math.PI / 2; globe.add(beam);
  // equator energy line (the jagged "signal" across the sphere)
  const sigN = 200, sigPos = new Float32Array(sigN * 3);
  const sigGeo = new THREE.BufferGeometry(); sigGeo.setAttribute('position', new THREE.BufferAttribute(sigPos, 3));
  const signal = new THREE.Line(sigGeo, new THREE.LineBasicMaterial({ color: 0x9dff7a, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
  world.add(signal);
  // background star dust
  const dN = 900, dPos = new Float32Array(dN * 3);
  for (let i = 0; i < dN; i++) { const r = 8 + Math.random() * 30, a = Math.random() * 6.283, b = Math.acos(2 * Math.random() - 1); dPos[i * 3] = r * Math.sin(b) * Math.cos(a); dPos[i * 3 + 1] = r * Math.cos(b) * 0.6; dPos[i * 3 + 2] = -Math.abs(r * Math.sin(b) * Math.sin(a)); }
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  scene.add(new THREE.Points(dGeo, new THREE.PointsMaterial({ color: 0x2a7d92, size: 0.05, transparent: true, opacity: 0.7, depthWrite: false })));

  // mission nodes
  const nodeGroup = new THREE.Group(); world.add(nodeGroup);
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,255,255,.6)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  let nodes = []; // {id, sprite, core, line, phase, label}
  function setMissions(list) {
    for (const n of nodes) { nodeGroup.remove(n.obj); n.label.remove(); }
    nodes = [];
    list.slice(0, 40).forEach((p, i) => {
      const col = STATUS_COL[p.status] || 0x43e5ff;
      const obj = new THREE.Group();
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: col, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); sp.scale.setScalar(0.42);
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), new THREE.MeshBasicMaterial({ color: col }));
      obj.add(sp, core);
      // latitude/longitude from index (golden distribution), slightly outside the sphere
      const k = (i + 0.5) / Math.max(1, Math.min(40, list.length)), lat = Math.asin(1.6 * k - 0.8), lon = i * 2.399963;
      const rr = R * 1.12; obj.userData.base = new THREE.Vector3(Math.cos(lat) * Math.cos(lon) * rr, Math.sin(lat) * rr, Math.cos(lat) * Math.sin(lon) * rr);
      obj.position.copy(obj.userData.base);
      // stalk from the sphere surface
      const s0 = obj.userData.base.clone().multiplyScalar(R / rr);
      const stalk = new THREE.Line(new THREE.BufferGeometry().setFromPoints([s0, obj.userData.base]), new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending }));
      nodeGroup.add(stalk);
      nodeGroup.add(obj);
      const label = document.createElement('div'); label.className = 'nodeLbl'; label.textContent = (p.format || '?') + ' · ' + (p.title || 'Missione');
      label.addEventListener('click', () => onPick && onPick(p.id));
      labelsEl.append(label);
      nodes.push({ id: p.id, obj, stalk, label, phase: Math.random() * 6.28, col });
    });
  }
  // composer + bloom
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, cam));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.85, 0.45, 0.42); if(!window.__noBloom)composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // interaction: drag rotate with inertia, hover/pick
  let rotY = 0, rotX = -0.12, velY = reduce ? 0 : 0.0025, velX = 0, dragging = false, lastX = 0, lastY = 0, moved = 0, idleT = 0;
  const ray = new THREE.Raycaster(); const mouse = new THREE.Vector2(); let hover = null;
  const toNdc = (e) => { const r = canvas.getBoundingClientRect(); mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); };
  canvas.addEventListener('pointerdown', (e) => { dragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => {
    toNdc(e);
    if (dragging) { const dx = e.clientX - lastX, dy = e.clientY - lastY; moved += Math.abs(dx) + Math.abs(dy); velY = dx * 0.0045; velX = dy * 0.003; rotY += velY; rotX = Math.max(-0.9, Math.min(0.9, rotX + velX)); lastX = e.clientX; lastY = e.clientY; idleT = 0; }
  });
  const end = (e) => {
    if (!dragging) return; dragging = false;
    if (moved < 6) { toNdc(e); ray.setFromCamera(mouse, cam); const hit = ray.intersectObjects(nodes.map(n => n.obj), true)[0]; if (hit) { const n = nodes.find(n => n.obj === hit.object.parent || n.obj === hit.object); if (n && onPick) onPick(n.id); } }
  };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', () => { dragging = false; });
  canvas.addEventListener('pointerleave', () => { mouse.set(9, 9); });

  let running = false, raf = 0, t0 = performance.now(), last = t0, w = 0, h = 0, highlight = null, focusT = 0;
  function resize() {
    const r = canvas.getBoundingClientRect(); const nw = Math.max(1, Math.round(r.width)), nh = Math.max(1, Math.round(r.height));
    if (nw === w && nh === h) return; w = nw; h = nh;
    renderer.setSize(w, h, false); composer.setSize(w, h); bloom.setSize(w / 2, h / 2);
    cam.aspect = w / h; cam.position.z = w / h < 1 ? Math.min(14, 9.2 / (w / h) * 0.95) : 9.2; cam.updateProjectionMatrix();
  }
  const v3 = new THREE.Vector3();
  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now; const t = (now - t0) / 1000;
    resize();
    if (!dragging) { idleT += dt; velY += ((reduce ? 0 : 0.0022) - velY) * Math.min(1, dt * (idleT > 1.5 ? 1.2 : 0.3)); velX *= Math.pow(0.02, dt); rotY += velY * (dt * 60); rotX += velX * (dt * 60); rotX += (-0.12 - rotX) * dt * 0.4; }
    world.rotation.set(rotX, rotY, 0);
    rings.children.forEach((m, i) => { m.rotation.z += dt * (0.08 + i * 0.05) * (i % 2 ? -1 : 1); });
    pUni.uT.value = t;
    const by = Math.sin(t * 0.55) * R * 0.95; beam.position.y = by; const br = Math.sqrt(Math.max(0.0001, R * R - by * by)) * 1.01; beam.scale.setScalar(br / (R * 1.01)); beam.material.opacity = 0.12 + 0.25 * Math.abs(Math.cos(t * 0.55));
    for (let i = 0; i < sigN; i++) { const x = -R * 1.9 + (i / (sigN - 1)) * R * 3.8; const env = Math.exp(-Math.pow(x / (R * 0.95), 2) * 1.8); const y = env * (Math.sin(x * 9 + t * 7) * 0.12 + Math.sin(x * 23 - t * 11) * 0.06 + Math.sin(x * 3.1 + t * 2.3) * 0.08); sigPos[i * 3] = x; sigPos[i * 3 + 1] = y; sigPos[i * 3 + 2] = R * 0.02; }
    sigGeo.attributes.position.needsUpdate = true; signal.rotation.y = -rotY;
    // nodes pulse; hover
    ray.setFromCamera(mouse, cam); const hit = ray.intersectObjects(nodes.map(n => n.obj), true)[0];
    hover = hit ? nodes.find(n => n.obj === hit.object.parent || n.obj === hit.object) : null; canvas.style.cursor = hover ? 'pointer' : 'grab';
    const r = canvas.getBoundingClientRect();
    for (const n of nodes) {
      const s = 1 + 0.18 * Math.sin(t * 2.4 + n.phase) + (hover === n || highlight === n.id ? 0.6 : 0);
      n.obj.children[0].scale.setScalar(0.42 * s);
      n.obj.getWorldPosition(v3); const facing = v3.clone().normalize().dot(cam.position.clone().normalize());
      v3.project(cam);
      const vis = facing > -0.15 && v3.z < 1;
      n.label.style.display = vis ? '' : 'none';
      if (vis) { const lw = n.label.offsetWidth || 120; n.label.style.left = Math.max(lw / 2 + 4, Math.min(r.width - lw / 2 - 4, (v3.x + 1) / 2 * r.width)) + 'px'; n.label.style.top = ((1 - v3.y) / 2 * r.height) + 'px'; n.label.style.opacity = String(Math.max(0.25, Math.min(1, facing + 0.6))); n.label.style.borderLeftColor = '#' + n.col.toString(16).padStart(6, '0'); }
    }
    composer.render(dt);
  }
  return {
    setMissions,
    highlight(id) { highlight = id; },
    start() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); },
    stop() { running = false; cancelAnimationFrame(raf); },
    get running() { return running; },
  };
}
