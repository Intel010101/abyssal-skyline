import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js';

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#01030a');
scene.fog = new THREE.Fog('#01030a', 120, 420);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(-28, 26, 52);
camera.lookAt(0, 6, 0);

const hemiLight = new THREE.HemisphereLight('#7cf3ff', '#230127', 0.6);
scene.add(hemiLight);
const dirLight = new THREE.DirectionalLight('#88ffc9', 1.4);
dirLight.position.set(50, 80, 40);
scene.add(dirLight);

const neonMaterial = new THREE.MeshStandardMaterial({
  color: '#8dfff1',
  metalness: 0.6,
  roughness: 0.2,
  emissive: '#1ec3bd',
  emissiveIntensity: 0.8,
  transparent: true,
  opacity: 0.9
});

const cityGroup = new THREE.Group();
scene.add(cityGroup);

const lanes = [-8, 0, 8];
const citySegments = 40;
const segmentLength = 8;

function buildCity() {
  cityGroup.clear();
  const geo = new THREE.BoxGeometry(6, 1, segmentLength);
  for (let i = 0; i < citySegments; i++) {
    lanes.forEach((laneX, laneIndex) => {
      const mesh = new THREE.Mesh(geo, neonMaterial.clone());
      mesh.position.set(laneX, -0.5, -i * segmentLength);
      mesh.scale.y = 0.5 + Math.random() * 4;
      mesh.material.color.setHSL(0.55 + laneIndex * 0.05, 0.9, 0.5 + Math.random() * 0.2);
      mesh.material.emissive.set(mesh.material.color).multiplyScalar(0.6);
      cityGroup.add(mesh);
    });
  }
}

buildCity();

const glowMaterial = new THREE.MeshBasicMaterial({ color: '#fff7a9' });
const playerGeo = new THREE.ConeGeometry(0.6, 2.4, 16);
playerGeo.rotateX(Math.PI / 2);
const player = new THREE.Mesh(playerGeo, new THREE.MeshStandardMaterial({
  color: '#fff6d0',
  emissive: '#ffedb4',
  emissiveIntensity: 1.2,
  metalness: 0.2,
  roughness: 0.35
}));
player.position.set(0, 1.2, 2);
scene.add(player);

const playerTrail = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.5, 4, 16, 1, true), new THREE.MeshBasicMaterial({
  color: '#ff7fd5',
  transparent: true,
  opacity: 0.4,
  side: THREE.DoubleSide
}));
playerTrail.rotation.x = Math.PI / 2;
playerTrail.position.set(0, 1, 3.5);
scene.add(playerTrail);

const ionThreads = [];
const ionGeo = new THREE.SphereGeometry(0.25, 12, 12);
const ionMat = new THREE.MeshStandardMaterial({ color: '#63ffd9', emissive: '#63ffd9', emissiveIntensity: 0.8 });
function spawnIon(zOffset = -40) {
  const mesh = new THREE.Mesh(ionGeo, ionMat.clone());
  mesh.position.set(lanes[Math.floor(Math.random() * lanes.length)], 1 + Math.random() * 1.5, zOffset);
  ionThreads.push(mesh);
  scene.add(mesh);
}
for (let i = 0; i < 12; i++) spawnIon(-i * 12);

const squads = [];
const squadGeo = new THREE.TorusGeometry(2, 0.05, 8, 64, Math.PI * 1.3);
const squadMat = new THREE.MeshBasicMaterial({ color: '#ff4dd8' });
function spawnSquad(zOffset = -60) {
  const mesh = new THREE.Mesh(squadGeo, squadMat.clone());
  mesh.rotation.x = Math.PI / 2;
  mesh.position.set(0, 1.5 + Math.random() * 2, zOffset);
  mesh.userData.speed = 14 + Math.random() * 4;
  squads.push(mesh);
  scene.add(mesh);
}
for (let i = 0; i < 6; i++) spawnSquad(-20 - i * 20);

const state = {
  altitude: 0,
  lattice: 0,
  combo: 1,
  laneIndex: 1,
  dashCooldown: 0,
  time: 0
};

const altitudeEl = document.getElementById('altitude');
const latticeEl = document.getElementById('lattice');
const comboEl = document.getElementById('combo');

function updateHud() {
  altitudeEl.textContent = `${state.altitude.toFixed(0)}m`;
  latticeEl.textContent = `${Math.min(100, state.lattice).toFixed(0)}%`;
  comboEl.textContent = `x${state.combo.toFixed(1)}`;
}

function handleResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', handleResize);

const keys = new Set();
window.addEventListener('keydown', (e) => {
  keys.add(e.code);
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') laneShift(-1);
  if (e.code === 'ArrowRight' || e.code === 'KeyD') laneShift(1);
  if (e.code === 'Space') vault();
  if (e.code === 'ShiftLeft') burst();
});
window.addEventListener('keyup', (e) => keys.delete(e.code));

function laneShift(dir) {
  state.laneIndex = THREE.MathUtils.clamp(state.laneIndex + dir, 0, lanes.length - 1);
}

function vault() {
  state.combo += 0.2;
  player.position.y = 2.4;
  setTimeout(() => (player.position.y = 1.2), 250);
}

function burst() {
  if (state.lattice < 30 || state.dashCooldown > 0) return;
  state.lattice -= 30;
  state.dashCooldown = 1.2;
  playerTrail.material.opacity = 0.9;
  setTimeout(() => (playerTrail.material.opacity = 0.4), 300);
}

let lastTime = performance.now();
function animate(now) {
  const delta = (now - lastTime) / 1000;
  lastTime = now;
  state.time += delta;
  if (state.dashCooldown > 0) state.dashCooldown -= delta;

  const targetX = lanes[state.laneIndex];
  player.position.x += (targetX - player.position.x) * 5 * delta;
  playerTrail.position.x = player.position.x;

  cityGroup.children.forEach((segment) => {
    segment.position.z += 20 * delta;
    if (segment.position.z > segmentLength) {
      segment.position.z -= citySegments * segmentLength;
      segment.scale.y = 0.5 + Math.random() * 4;
    }
  });

  ionThreads.forEach((ion) => {
    ion.position.z += 24 * delta;
    ion.rotation.y += delta;
    if (ion.position.z > 4) {
      ion.position.z -= 120;
      ion.position.x = lanes[Math.floor(Math.random() * lanes.length)];
    }
    const dist = ion.position.distanceTo(player.position);
    if (!ion.userData.collected && dist < 1.4) {
      ion.userData.collected = true;
      state.lattice = Math.min(100, state.lattice + 8);
      state.combo = Math.min(5, state.combo + 0.05);
      setTimeout(() => (ion.userData.collected = false), 200);
    }
  });

  squads.forEach((squad) => {
    squad.position.z += squad.userData.speed * delta;
    squad.rotation.z += delta * 0.3;
    if (squad.position.z > 6) {
      squad.position.z = -80 - Math.random() * 40;
      squad.position.x = THREE.MathUtils.randFloatSpread(6);
    }
  });

  state.altitude = 340 + Math.sin(state.time * 0.2) * 8;
  camera.position.y = 26 + Math.sin(state.time * 0.3) * 1.4;
  camera.lookAt(0, 6, -10);

  updateHud();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

// Touch controls for mobile
let touchStartX = null;
window.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
});
window.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) < 20) vault();
  else if (dx < 0) laneShift(-1);
  else laneShift(1);
});

// Simple debug ticker so users know build time
const buildLabel = document.getElementById('build');
buildLabel.textContent = new Date().toISOString().slice(0, 19).replace('T', ' ');
