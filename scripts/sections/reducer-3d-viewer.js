/**
 * Three.js reducer geometry viewer for the Siemens thesis page.
 *
 * Renders both the legacy two-step reducer and the redesigned C² quintic
 * reducer as procedurally generated geometries (axisymmetric lathe). The
 * user can:
 *   - Drag to rotate
 *   - Press T to toggle between legacy and redesigned
 *   - Slide to reveal cross-section
 *
 * Three.js is loaded from CDN only when [data-reducer-3d-viewer] is on
 * the page. Falls back gracefully if WebGL isn't available.
 */

const THREE_CDN = "https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js";
const CONTROLS_CDN = "https://cdn.jsdelivr.net/npm/three@0.166.1/examples/jsm/controls/OrbitControls.js";

let THREE, OrbitControls;

async function loadThree() {
  if (THREE && OrbitControls) return;
  const [t, c] = await Promise.all([
    import(THREE_CDN),
    import(CONTROLS_CDN),
  ]);
  THREE = t;
  OrbitControls = c.OrbitControls;
}

// ── Geometry generators ───────────────────────────────────────────────────
function legacyProfile() {
  // Inlet 35.05 → first step at 11.25 → second step at 6.0 mm radius.
  // Z axis runs along the rig; we draw a profile (z, r) and revolve.
  const r = (mm) => mm / 35.05 * 0.5; // normalize so radius ≤ 0.5
  const z = (mm) => mm / 50.0 * 1.0;
  const points = [];
  points.push(new THREE.Vector2(r(0),     z(0)));
  points.push(new THREE.Vector2(r(35.05), z(0)));   // outer top of inlet
  points.push(new THREE.Vector2(r(35.05), z(15)));  // travel along inlet
  points.push(new THREE.Vector2(r(11.25), z(15)));  // abrupt step inward
  points.push(new THREE.Vector2(r(11.25), z(28)));
  points.push(new THREE.Vector2(r(6.0),   z(28)));  // second abrupt step
  points.push(new THREE.Vector2(r(6.0),   z(45)));
  points.push(new THREE.Vector2(r(0),     z(45)));
  return points;
}

function quinticProfile() {
  // Smooth 150 mm quintic C² contraction from 35.05 → 6.0 mm.
  // We sample along the profile and compute a quintic with zero
  // slope+curvature endpoints: f(t) = 6t^5 - 15t^4 + 10t^3
  const r = (mm) => mm / 35.05 * 0.5;
  const z = (mm) => mm / 50.0 * 1.0;
  const points = [];
  points.push(new THREE.Vector2(r(0),     z(0)));
  points.push(new THREE.Vector2(r(35.05), z(0)));
  // Smoothly drop radius along 150 mm of length, but we compress to ~45mm
  // to keep visual proportion with the legacy.
  const steps = 24;
  const startMm = 15, endMm = 42;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const ease = 6 * t ** 5 - 15 * t ** 4 + 10 * t ** 3;
    const radiusMm = 35.05 - (35.05 - 6.0) * ease;
    const zMm = startMm + (endMm - startMm) * t;
    points.push(new THREE.Vector2(r(radiusMm), z(zMm)));
  }
  points.push(new THREE.Vector2(r(6.0), z(45)));
  points.push(new THREE.Vector2(r(0),   z(45)));
  return points;
}

function buildMesh(profilePts, color) {
  const geom = new THREE.LatheGeometry(profilePts, 64, 0, Math.PI * 2);
  geom.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.7,
    roughness: 0.35,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.92,
  });
  return new THREE.Mesh(geom, mat);
}

// ── Public entry ──────────────────────────────────────────────────────────
export async function init() {
  const host = document.querySelector("[data-reducer-3d-viewer]");
  if (!host) return null;

  try {
    await loadThree();
  } catch (err) {
    console.warn("[reducer-3d] three.js failed to load:", err);
    return null;
  }

  // Test WebGL
  const tester = document.createElement("canvas").getContext("webgl");
  if (!tester) {
    host.innerHTML = `<p class="muted">3D viewer requires WebGL.</p>`;
    return null;
  }

  host.innerHTML = `
    <div class="reducer-3d-stage" data-reducer-3d-stage></div>
    <div class="reducer-3d-controls">
      <button type="button" data-reducer-3d-toggle data-state="redesigned">
        Showing: <strong>Redesigned C² quintic</strong>
      </button>
      <span class="reducer-3d-hint">Drag to rotate. T to toggle.</span>
    </div>
  `;
  const stage = host.querySelector("[data-reducer-3d-stage]");

  const scene = new THREE.Scene();
  scene.background = null;
  const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.1, 100);
  camera.position.set(1.6, 0.7, 1.9);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  const r = stage.getBoundingClientRect();
  renderer.setSize(r.width, r.width * 9 / 16, false);
  stage.appendChild(renderer.domElement);

  // Lighting
  const hemi = new THREE.HemisphereLight(0xddeeff, 0x101820, 0.7);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(2, 2, 2);
  scene.add(dir);
  const back = new THREE.PointLight(0xfbbf24, 0.6, 8);
  back.position.set(-1, -0.4, -1);
  scene.add(back);

  const legacyMesh = buildMesh(legacyProfile(), 0xd0622c);
  const redesignedMesh = buildMesh(quinticProfile(), 0x65d6c9);
  legacyMesh.rotation.x = Math.PI / 2;
  redesignedMesh.rotation.x = Math.PI / 2;
  legacyMesh.position.x = -0.5;
  redesignedMesh.position.x = -0.5;
  scene.add(redesignedMesh);
  legacyMesh.visible = false;
  scene.add(legacyMesh);

  // Orbit controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.set(0, 0, 0);
  controls.minDistance = 1.2;
  controls.maxDistance = 4;

  // Toggle handler
  const toggleBtn = host.querySelector("[data-reducer-3d-toggle]");
  let showing = "redesigned";
  const setMesh = (which) => {
    showing = which;
    legacyMesh.visible = which === "legacy";
    redesignedMesh.visible = which === "redesigned";
    toggleBtn.dataset.state = which;
    toggleBtn.innerHTML = `Showing: <strong>${which === "legacy" ? "Legacy two-step" : "Redesigned C² quintic"}</strong>`;
  };
  toggleBtn.addEventListener("click", () => setMesh(showing === "legacy" ? "redesigned" : "legacy"));
  document.addEventListener("keydown", (e) => {
    if (e.key === "t" || e.key === "T") {
      if (host.getBoundingClientRect().top < window.innerHeight) {
        setMesh(showing === "legacy" ? "redesigned" : "legacy");
      }
    }
  });

  // Resize
  const ro = new ResizeObserver(() => {
    const rect = stage.getBoundingClientRect();
    renderer.setSize(rect.width, rect.width * 9 / 16, false);
    camera.aspect = (rect.width) / (rect.width * 9 / 16);
    camera.updateProjectionMatrix();
  });
  ro.observe(stage);

  // Render loop
  let raf;
  let visible = false;
  const io = new IntersectionObserver((entries) => {
    visible = entries[0]?.isIntersecting || false;
    if (visible) loop();
  }, { threshold: 0.1 });
  io.observe(host);

  const loop = () => {
    if (!visible) return;
    controls.update();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  };

  return {
    destroy() {
      io.disconnect(); ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
      controls.dispose();
      renderer.dispose();
      legacyMesh.geometry.dispose(); legacyMesh.material.dispose();
      redesignedMesh.geometry.dispose(); redesignedMesh.material.dispose();
      host.innerHTML = "";
    },
  };
}

export function destroy(inst) { inst?.destroy?.(); }
