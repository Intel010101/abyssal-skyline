import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js';

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#01030a');
scene.fog = new THREE.FogExp2('#020617', 0.015);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1500);
camera.position.set(-32, 30, 60);
camera.lookAt(0, 5, -10);

const hemi = new THREE.HemisphereLight('#74e8ff', '#22031f', 0.7);
scene.add(hemi);
const dir = new THREE.DirectionalLight('#7bffea', 1.2);
dir.position.set(40, 80, 30);
scene.add(dir);

const lanes = [-10, 0, 10];
const laneColor = ['#63ffd9', '#7c8dff', '#ff7bd1'];

const playerGeo = new THREE.ConeGeometry(0.8, 3, 32);
playerGeo.rotateX(Math.PI / 2);
const playerMat = new THREE.MeshStandardMaterial({
  color: '#fff5d6',
  emissive: '#ffcf8a',
  emissiveIntensity: 1.1,
  metalness: 0.4,
  roughness: 0.35
});
const player = new THREE.Mesh(playerGeo, playerMat);
player.position.set(0, 1.4, 4);
scene.add(player);

const trailGeo = new THREE.CylinderGeometry(0.25, 0.6, 4, 16, 1, true);
const trailMat = new THREE.MeshBasicMaterial({ color: '#ff66c4', transparent: true, opacity: 0.45, side: THREE.DoubleSide });
const trail = new THREE.Mesh(trailGeo, trailMat);
trail.rotation.x = Math.PI / 2;
trail.position.set(0, 1.2, 5.2);
scene.add(trail);

const cityGroup = new THREE.Group();
scene.add(cityGroup);
const segmentGeo = new THREE.BoxGeometry(8, 1, 8);
for (let i = 0; i < 60; i++) {
  lanes.forEach((laneX, idx) => {
    const mesh = new THREE.Mesh(segmentGeo, new THREE.MeshStandardMaterial({
      color: laneColor[idx],
      metalness: 0.2,
      roughness: 0.8,
      emissive: laneColor[idx],
      emissiveIntensity: 0.2
    }));
    mesh.position.set(laneX, -0.6, -i * 8);
    mesh.scale.y = 0.4 + Math.random() * 3;
    cityGroup.add(mesh);
  });
}

const ionGeo = new THREE.SphereGeometry(0.25, 16, 16);
const ionThreads = [];
function spawnIon(offset = -40) {
  const mesh = new THREE.Mesh(ionGeo, new THREE.MeshStandardMaterial({
    color: '#63ffd9',
    emissive: '#63ffd9',
    emissiveIntensity: 0.9
  }));
  mesh.position.set(lanes[Math.floor(Math.random() * lanes.length)], 1 + Math.random() * 1.5, offset);
  mesh.userData = { drift: Math.random() * Math.PI * 2 };
  scene.add(mesh);
  ionThreads.push(mesh);
}
for (let i = 0; i < 14; i++) spawnIon(-i * 12);

const railNodes = [];
const railMaterial = new THREE.MeshBasicMaterial({ color: '#ffe66d' });
const railGeo = new THREE.CylinderGeometry(0.1, 0.1, 4, 8);
for (let i = 0; i < 6; i++) {
  const lane = lanes[i % lanes.length];
  const z = -20 - i * 30;
  const node = new THREE.Mesh(railGeo, railMaterial.clone());
  node.position.set(lane, 3, z);
  node.material.color.setHSL(0.12 + i * 0.05, 0.9, 0.6);
  node.userData = { bonus: 15 + i * 5 };
  scene.add(node);
  railNodes.push(node);
}

const formationTypes = ['arc', 'spiral', 'bloom'];
const formations = [];

function spawnFormation(type) {
  const selected = type || formationTypes[Math.floor(Math.random() * formationTypes.length)];
  const group = new THREE.Group();
  const baseZ = -120 - Math.random() * 60;

  if (selected === 'arc') {
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(3 + Math.random(), 0.08, 12, 48, Math.PI * 1.1),
      new THREE.MeshBasicMaterial({ color: '#ff4dd8' })
    );
    torus.rotation.x = Math.PI / 2;
    group.add(torus);
  }

  if (selected === 'spiral') {
    for (let i = 0; i < 12; i++) {
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 12, 12),
        new THREE.MeshBasicMaterial({ color: '#5be0ff' })
      );
      const angle = i * 0.6;
      sphere.position.set(Math.cos(angle) * 2.5, 1.5 + i * 0.08, Math.sin(angle) * 2.5);
      group.add(sphere);
    }
  }

  if (selected === 'bloom') {
    for (let i = 0; i < 8; i++) {
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(1.5, 0.3),
        new THREE.MeshBasicMaterial({ color: '#ffa0ae', side: THREE.DoubleSide })
      );
      plane.rotation.y = (Math.PI / 4) * i;
      group.add(plane);
    }
  }

  group.position.set(THREE.MathUtils.randFloatSpread(6), 1.4 + Math.random(), baseZ);
  scene.add(group);
  formations.push({ group, type: selected, speed: 16 + Math.random() * 6, wobble: Math.random() * Math.PI, alive: true });
}

for (let i = 0; i < 5; i++) spawnFormation();

const state = {
  laneIndex: 1,
  altitude: 0,
  lattice: 20,
  combo: 1,
  dashCooldown: 0,
  onRail: false,
  railTimer: 0,
  distance: 0,
  integrity: 100
};

const altitudeEl = document.getElementById('altitude');
const latticeEl = document.getElementById('lattice');
const comboEl = document.getElementById('combo');
const integrityEl = document.getElementById('integrity');
const integrityStat = document.querySelector('[data-stat="integrity"]');
const buildEl = document.getElementById('build');
buildEl.textContent = 'spiral-build ' + new Date().toISOString().slice(0, 10);

function handleResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', handleResize);

function laneShift(dir) {
  state.laneIndex = THREE.MathUtils.clamp(state.laneIndex + dir, 0, lanes.length - 1);
}

function vault() {
  if (!state.onRail) {
    player.position.y = 2.4;
    state.combo += 0.15;
    setTimeout(() => {
      if (!state.onRail) player.position.y = 1.4;
    }, 220);
  }
}

function burst() {
  if (state.lattice < 25 || state.dashCooldown > 0) return;
  state.lattice -= 25;
  state.dashCooldown = 1.1;
  trail.material.opacity = 0.95;
  setTimeout(() => (trail.material.opacity = 0.45), 320);
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') laneShift(-1);
  if (e.code === 'ArrowRight' || e.code === 'KeyD') laneShift(1);
  if (e.code === 'Space') {
    e.preventDefault();
    vault();
  }
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') burst();
});

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

function updateHud() {
  altitudeEl.textContent = `${(state.altitude + 300).toFixed(0)}m`;
  latticeEl.textContent = `${Math.min(100, state.lattice).toFixed(0)}%`;
  comboEl.textContent = `x${state.combo.toFixed(1)}`;
  integrityEl.textContent = `${state.integrity.toFixed(0)}%`;
  if (integrityStat) {
    integrityStat.dataset.alert = state.integrity < 40;
  }
}

function updateRails(delta) {
  railNodes.forEach((node, idx) => {
    node.rotation.y += delta * 0.8;
    const distance = node.position.distanceTo(player.position);
    if (distance < 1.6 && !state.onRail) {
      state.onRail = true;
      state.railTimer = 1.2;
      state.combo += 0.4;
      state.lattice = Math.min(100, state.lattice + node.userData.bonus * 0.2);
      player.position.y = 3.4;
      trail.material.color.set('#7efff4');
    }
  });

  if (state.onRail) {
    state.railTimer -= delta;
    state.integrity = Math.min(100, state.integrity + delta * 18);
    if (state.railTimer <= 0) {
      state.onRail = false;
      player.position.y = 1.4;
      trail.material.color.set('#ff66c4');
    }
  }
}

function updateFormations(delta) {
  formations.forEach((formation, idx) => {
    if (!formation.alive) return;
    formation.group.position.z += formation.speed * delta;
    formation.group.position.x += Math.sin(formation.group.position.z * 0.05) * delta * 2;

    if (formation.type === 'spiral') {
      formation.group.rotation.z += delta * 0.6;
    } else if (formation.type === 'bloom') {
      formation.group.rotation.y += delta * 0.8;
    } else {
      formation.group.rotation.x += delta * 0.4;
    }

    if (formation.group.position.z > 8) {
      scene.remove(formation.group);
      formations.splice(idx, 1);
      spawnFormation();
      return;
    }

    const dist = formation.group.position.distanceTo(player.position);
    if (dist < 2.5 && !state.onRail) {
      state.combo = Math.max(1, state.combo - 0.4);
      state.lattice = Math.max(0, state.lattice - 8);
      state.integrity = Math.max(0, state.integrity - 8);
      player.position.x += Math.sin(performance.now() * 0.02) * 0.2;
    }
  });
}

function updateCity(delta) {
  cityGroup.children.forEach((mesh) => {
    mesh.position.z += 22 * delta;
    if (mesh.position.z > 10) {
      mesh.position.z -= 60 * 8;
      mesh.scale.y = 0.4 + Math.random() * 3;
    }
  });
}

function updateIons(delta) {
  ionThreads.forEach((ion) => {
    ion.position.z += 24 * delta;
    ion.userData.drift += delta * 1.2;
    ion.position.y = 1.2 + Math.sin(ion.userData.drift) * 0.4;
    if (ion.position.z > 6) {
      ion.position.z -= 140;
      ion.position.x = lanes[Math.floor(Math.random() * lanes.length)];
    }
    const dist = ion.position.distanceTo(player.position);
    if (dist < 1.2) {
      state.lattice = Math.min(100, state.lattice + 6);
      state.combo = Math.min(5, state.combo + 0.1);
      ion.position.z -= 140;
    }
  });
}

let lastTime = performance.now();
function animate(now) {
  const delta = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  const targetX = lanes[state.laneIndex];
  player.position.x += (targetX - player.position.x) * 5 * delta;
  trail.position.x = player.position.x;
  trail.position.y = player.position.y - 0.2;

  if (state.dashCooldown > 0) state.dashCooldown -= delta;
  updateRails(delta);
  updateFormations(delta);
  updateCity(delta);
  updateIons(delta);

  state.distance += 40 * delta;
  state.altitude = 320 + Math.sin(state.distance * 0.02) * 8;
  camera.position.y = 30 + Math.sin(state.distance * 0.01) * 1.6;
  camera.lookAt(0, 5, -10);

  state.lattice = Math.max(0, state.lattice - delta * 1.2 + state.combo * 0.1);
  updateHud();

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
