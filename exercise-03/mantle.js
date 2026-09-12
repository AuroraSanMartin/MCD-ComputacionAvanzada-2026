import * as THREE from "three";

const container = document.querySelector("#mantle-visual");
const heroPanel = document.querySelector(".hero-panel");
const airQualityGlow = document.querySelector(".air-quality-glow");
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
let leftEyeValue = 0;
let rightEyeValue = 0;
let visualOverload = false;
let visualOverloadIntensity = 0;
let airQuality = 0;
let flickerFactor = 1;
let nextFlickerChange = 0;
let leftLowLightFlicker = 1;
let rightLowLightFlicker = 1;
let leftLowLightTarget = 1;
let rightLowLightTarget = 1;
let leftEyeChanged = false;
let rightEyeChanged = false;
let previousFrameTime = 0;
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
const leftGradientColor = new THREE.Color(0x8db99c);
const rightGradientColor = new THREE.Color(0x8db99c);
const baseColor = new THREE.Color();
const finalColor = new THREE.Color();
for (let index = 0; index < geometry.attributes.position.count; index++) {
  const y = basePositions[index * 3 + 1];
  const height = THREE.MathUtils.clamp((y + 3) / 6, 0, 1);
  const invertedHeight = 1 - height;
  const visibility = THREE.MathUtils.smoothstep(invertedHeight, 0.04, 0.78);
  baseColor.copy(backgroundColor).lerp(mantleColor, visibility);
  vertexColors[index * 3] = baseColor.r;
  vertexColors[index * 3 + 1] = baseColor.g;
  vertexColors[index * 3 + 2] = baseColor.b;
}
geometry.setAttribute("color", new THREE.BufferAttribute(vertexColors, 3));

function updateSensorValues(event) {
  const nextLeftValue = Number(event.detail.oidoIzq) || 0;
  const nextRightValue = Number(event.detail.oidoDer) || 0;
  leftEyeValue = Number(event.detail.ojoIzq) || 0;
  rightEyeValue = Number(event.detail.ojoDer) || 0;
  visualOverload = Boolean(event.detail.visualOverload);
  visualOverloadIntensity = Number(event.detail.visualOverloadIntensity) || 0;
  airQuality = Number(event.detail.airQuality) || 0;
  leftEyeChanged = Boolean(event.detail.leftEyeChanged);
  rightEyeChanged = Boolean(event.detail.rightEyeChanged);

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
  const colors = geometry.attributes.color;
  removeExpiredWaves(leftWaves, time);
  removeExpiredWaves(rightWaves, time);
  const frameDelta = previousFrameTime === 0 ? 16 : Math.min(50, time - previousFrameTime);
  previousFrameTime = time;
  const smoothFactor = 1 - Math.exp(-frameDelta / 140);
  const airQualityBlur = THREE.MathUtils.smoothstep(airQuality, 700, 1500) * 24;
  container.style.setProperty("--mantle-blur", `${airQualityBlur.toFixed(2)}px`);
  const airQualityIntensity = THREE.MathUtils.smoothstep(airQuality, 800, 1500);
  const glowSize = airQualityIntensity * Math.min(heroPanel.clientWidth, heroPanel.clientHeight) * 1.15;
  airQualityGlow.style.setProperty("--air-quality-glow-size", `${glowSize.toFixed(1)}px`);
  airQualityGlow.style.setProperty("--air-quality-glow-opacity", (airQualityIntensity * 0.8).toFixed(3));

  const leftEyeLight = 1 - Math.min(1, leftEyeValue / 4095);
  const rightEyeLight = 1 - Math.min(1, rightEyeValue / 4095);
  const leftLowLightAmount = THREE.MathUtils.smoothstep(leftEyeLight, 0.35, 0.8);
  const rightLowLightAmount = THREE.MathUtils.smoothstep(rightEyeLight, 0.35, 0.8);
  if (leftEyeChanged) {
    leftLowLightTarget = selectLowLightLevel(leftLowLightAmount);
  }
  if (rightEyeChanged) {
    rightLowLightTarget = selectLowLightLevel(rightLowLightAmount);
  }
  leftEyeChanged = false;
  rightEyeChanged = false;
  leftLowLightFlicker = THREE.MathUtils.lerp(leftLowLightFlicker, leftLowLightTarget, smoothFactor);
  rightLowLightFlicker = THREE.MathUtils.lerp(rightLowLightFlicker, rightLowLightTarget, smoothFactor);

  if (visualOverload && time >= nextFlickerChange) {
    const flickerLevels = [1, 0.75, 0.25, 0];
    const randomLevel = flickerLevels[Math.floor(Math.random() * flickerLevels.length)];
    flickerFactor = THREE.MathUtils.lerp(1, randomLevel, visualOverloadIntensity);
    nextFlickerChange = time + 25 + Math.random() * (110 - visualOverloadIntensity * 75);
  } else if (!visualOverload) {
    flickerFactor = 1;
  }

  for (let index = 0; index < positions.count; index++) {
    const x = basePositions[index * 3];
    const y = basePositions[index * 3 + 1];
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

    const isLeftGradient = x < 0;
    const eyeLevel = 1 - Math.min(1, (isLeftGradient ? leftEyeValue : rightEyeValue) / 4095);
    const centerFade = Math.abs(x) / 7;
    const lowLightFlicker = isLeftGradient ? leftLowLightFlicker : rightLowLightFlicker;
    const gradientStrength = Math.min(1, eyeLevel) * centerFade ** 0.7 * flickerFactor * lowLightFlicker;
    const height = THREE.MathUtils.clamp((y + 3) / 6, 0, 1);
    const baseVisibility = THREE.MathUtils.smoothstep(1 - height, 0.04, 0.78);
    baseColor.copy(backgroundColor).lerp(mantleColor, baseVisibility);
    finalColor.copy(baseColor).lerp(
      isLeftGradient ? leftGradientColor : rightGradientColor,
      gradientStrength
    );
    colors.setXYZ(index, finalColor.r, finalColor.g, finalColor.b);
  }
  const leftScreenOpacity = Math.min(0.62, leftEyeLight * 0.62 * flickerFactor * leftLowLightFlicker);
  const rightScreenOpacity = Math.min(0.62, rightEyeLight * 0.62 * flickerFactor * rightLowLightFlicker);
  heroPanel.style.setProperty("--left-gradient-opacity", leftScreenOpacity.toFixed(3));
  heroPanel.style.setProperty("--right-gradient-opacity", rightScreenOpacity.toFixed(3));
  positions.needsUpdate = true;
  colors.needsUpdate = true;
}

function selectLowLightLevel(amount) {
  if (amount <= 0) return 1;
  const levels = [1, 0.75, 0.25, 0];
  const randomLevel = levels[Math.floor(Math.random() * levels.length)];
  return THREE.MathUtils.lerp(1, randomLevel, amount);
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
