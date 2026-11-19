// Local, bundled three.js scene. No CDN dependency. Source is bundled with esbuild.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createSpatialAssetMonolith } from "./create-spatial-asset-monolith.js";

const host = document.getElementById("modelStage");
const status = document.getElementById("sceneStatus");
const switcher = document.getElementById("modelSwitch");
const modelsNode = document.getElementById("orbital-models");

function setStatus(message) {
  if (status) status.textContent = message;
}

function models() {
  try {
    return JSON.parse(modelsNode?.textContent || "[]");
  } catch {
    return [];
  }
}

async function init() {
  if (!host || !window.WebGL2RenderingContext) {
    setStatus("WebGL2 unavailable · poster active");
    return;
  }

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.id = "orbital-scene-canvas";
  host.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
  camera.position.set(0, 0.12, 4.6);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x111111, 2.35));
  const key = new THREE.DirectionalLight(0xffffff, 3.1);
  key.position.set(2.8, 3.4, 2.2);
  scene.add(key);
  const blueRim = new THREE.PointLight(0x0070f3, 2.2, 7);
  blueRim.position.set(-2.2, 0.6, -1.2);
  scene.add(blueRim);

  const grid = new THREE.GridHelper(7, 28, 0x0070f3, 0x333333);
  grid.name = "blueprint_floor";
  grid.position.y = -1.22;
  grid.material.transparent = true;
  grid.material.opacity = 0.22;
  scene.add(grid);

  const monolith = createSpatialAssetMonolith();
  scene.add(monolith);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.055;
  controls.enablePan = false;
  controls.minDistance = 3.2;
  controls.maxDistance = 6.2;
  controls.autoRotate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  controls.autoRotateSpeed = 0.65;
  controls.target.set(0, -0.02, 0);

  const pointer = { x: 0, y: 0 };
  let scrollProgress = 0;
  let active = monolith;
  const loader = new GLTFLoader();
  const catalogue = models();

  const fit = (object) => {
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const s = 2.25 / Math.max(size.x, size.y, size.z || 1);
    object.scale.setScalar(s);
    const center = box.getCenter(new THREE.Vector3());
    object.position.sub(center.multiplyScalar(s));
  };

  const activate = (object, label) => {
    if (active && active !== object) scene.remove(active);
    active = object;
    scene.add(active);
    setStatus(label);
  };

  const showMonolith = () => {
    monolith.scale.setScalar(1);
    monolith.position.set(0, 0, 0);
    activate(monolith, "00 / procedural monolith · WebGL2");
  };

  const showGlb = async (entry, index) => {
    if (!entry?.url) return;
    setStatus(`${String(index).padStart(2, "0")} / loading ${entry.name}`);
    try {
      const gltf = await loader.loadAsync(entry.url);
      fit(gltf.scene);
      gltf.scene.name = `catalogue_model_${index}`;
      activate(gltf.scene, `${String(index).padStart(2, "0")} / ${entry.name} · ${entry.license}`);
    } catch {
      setStatus("model unavailable · procedural fallback");
      showMonolith();
    }
  };

  if (switcher) {
    const monoButton = document.createElement("button");
    monoButton.type = "button";
    monoButton.textContent = "00";
    monoButton.title = "Procedural monolith";
    monoButton.addEventListener("click", showMonolith);
    switcher.appendChild(monoButton);
    catalogue.slice(0, 4).forEach((entry, i) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = String(i + 1).padStart(2, "0");
      button.title = entry.name;
      button.addEventListener("click", () => showGlb(entry, i + 1));
      switcher.appendChild(button);
    });
  }

  const resize = () => {
    const box = host.getBoundingClientRect();
    const width = Math.max(1, box.width);
    const height = Math.max(1, box.height);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(host);
  resize();

  host.addEventListener("pointermove", (event) => {
    const box = host.getBoundingClientRect();
    pointer.x = ((event.clientX - box.left) / box.width - 0.5) * 2;
    pointer.y = ((event.clientY - box.top) / box.height - 0.5) * 2;
    const readout = document.getElementById("sceneCoords");
    if (readout) readout.textContent = `${pointer.x.toFixed(2)} / ${pointer.y.toFixed(2)}`;
  });

  window.addEventListener("scroll", () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress = max > 0 ? window.scrollY / max : 0;
  }, { passive: true });

  let visible = true;
  new IntersectionObserver((entries) => { visible = entries[0]?.isIntersecting ?? true; }).observe(host);

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clock = new THREE.Clock();
  const render = () => {
    const t = clock.getElapsedTime();
    if (visible && !document.hidden) {
      monolith.rotation.y = Math.sin(t * 0.24) * 0.11 + pointer.x * 0.16 + scrollProgress * 0.55;
      monolith.rotation.x = Math.sin(t * 0.18) * 0.025 + pointer.y * 0.045;
      camera.position.x += (pointer.x * 0.22 - camera.position.x) * 0.035;
      camera.position.y += (0.12 - pointer.y * 0.12 - camera.position.y) * 0.035;
      camera.lookAt(0, -0.02, 0);
      controls.update();
      renderer.render(scene, camera);
    }
    if (!reduced) requestAnimationFrame(render);
  };
  render();
  if (reduced) {
    controls.autoRotate = false;
    renderer.render(scene, camera);
  }

  window.ORBITAL_SCENE_READY = true;
  setStatus("00 / procedural monolith · WebGL2 · three.js 0.187.0");
}

init().catch(() => setStatus("scene failed · poster active"));
