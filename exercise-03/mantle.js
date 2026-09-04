import * as THREE from "three";

const container = document.querySelector("#mantle-visual");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
const geometry = new THREE.PlaneGeometry(14, 6, 128, 48);
const WAVE_AMPLITUDE_MULTIPLIER = 20;
const material = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  wireframe: true,
  vertexColors: true,
  transparent: true,
  opacity: 0.72,
});
const mantle = new THREE.Mesh(geometry, material);
const basePositions = geometry.attributes.position.array.slice();
const vertexColors = new Float32Array(geometry.attributes.position.count * 3);
let previousLeftValue = null;
let previousRightValue = null;
const leftWaves = [];
const rightWaves = [];
const WAVE_TRAVEL_SPEED = 4.8;
const WAVE_LIFETIME = 1.7;

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);
camera.position.set(0, 4.2, 11.5);
camera.lookAt(0, 0, 0);
scene.add(mantle);

const backgroundColor = new THREE.Color(0x0b0b0c);
const mantleColor = new THREE.Color(0xe6a15c);
for (let index = 0; index < geometry.attributes.position.count; index++) {
  const y = basePositions[index * 3 + 1];
  const height = THREE.MathUtils.clamp((y + 3) / 6, 0, 1);
  const invertedHeight = 1 - height;
  const visibility = THREE.MathUtils.smoothstep(invertedHeight, 0.04, 0.78);
  const color = backgroundColor.clone().lerp(mantleColor, visibility);
  vertexColors[index * 3] = color.r;
  vertexColors[index * 3 + 1] = color.g;
  vertexColors[index * 3 + 2] = color.b;
}
geometry.setAttribute("color", new THREE.BufferAttribute(vertexColors, 3));

function updateSensorValues(event) {
  const nextLeftValue = Number(event.detail.oidoIzq) || 0;
  const nextRightValue = Number(event.detail.oidoDer) || 0;

  if (previousLeftValue !== null) {
    createWave(leftWaves, Math.abs(nextLeftValue - previousLeftValue) / 4095);
    createWave(rightWaves, Math.abs(nextRightValue - previousRightValue) / 4095);
  }

  previousLeftValue = nextLeftValue;
  previousRightValue = nextRightValue;
}

function createWave(waveList, change) {
  const amplitude = Math.min(1.8, change * 18);
  if (amplitude < 0.025) return;
  waveList.push({ createdAt: performance.now(), amplitude });
}

function updateMantle(time) {
  const positions = geometry.attributes.position;
  removeExpiredWaves(leftWaves, time);
  removeExpiredWaves(rightWaves, time);

  for (let index = 0; index < positions.count; index++) {
    const x = basePositions[index * 3];
    const distanceToCenter = Math.min(1, Math.abs(x) / 7);
    const amplitudeFalloff = distanceToCenter ** 0.85;
    const isLeftWave = x < 0;
    const distanceFromEdge = isLeftWave ? x + 7 : 7 - x;
    const waves = isLeftWave ? leftWaves : rightWaves;
    const wave = waves.reduce((total, currentWave) => {
      const age = (time - currentWave.createdAt) / 1000;
      const front = age * WAVE_TRAVEL_SPEED;
      const distanceToFront = distanceFromEdge - front;
      const envelope = Math.exp(-(distanceToFront ** 2) / 0.42);
      const phase = distanceToFront * 10;
      return total + Math.sin(phase) * envelope * currentWave.amplitude;
    }, 0) * amplitudeFalloff;
    const centerLock = Math.min(1, Math.abs(x) / 0.75);
    positions.setZ(index, wave * centerLock * 1.35 * WAVE_AMPLITUDE_MULTIPLIER);
  }
  positions.needsUpdate = true;
}

function removeExpiredWaves(waveList, time) {
  while (waveList.length > 0 && (time - waveList[0].createdAt) / 1000 > WAVE_LIFETIME) {
    waveList.shift();
  }
}

function render(time) {
  updateMantle(time);
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

function resize() {
  const width = container.clientWidth;
  const height = container.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

window.addEventListener("exercise03:sensors", updateSensorValues);
window.addEventListener("resize", resize);
requestAnimationFrame(render);
