import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// 1,000,000km = 1

// Canvas
const body = document.querySelector("body");
const canvas = document.querySelector("canvas.webgl");

let focusedPlanet = 0;

addEventListener("resize", () => {
  // Update sizes
  sizes.width = innerWidth;
  sizes.height = innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

addEventListener("keydown", (event) => {
  switch (event.code) {
    case "KeyF":
      const fullscreenElement =
        document.fullscreenElement || document.webkitFullscreenElement;
      if (!fullscreenElement) {
        body.requestFullscreen
          ? body.requestFullscreen()
          : body.webkitRequestFullscreen?.();
      } else {
        document.exitFullscreen
          ? document.exitFullscreen()
          : document.webkitExitFullscreen?.();
      }
      break;
    case "Digit1":
      focusedPlanet = 1;
      break;
    case "Digit2":
      focusedPlanet = 2;
      break;
    case "Digit3":
      focusedPlanet = 3;
      break;
    case "Digit4":
      focusedPlanet = 4;
      break;
    case "Digit5":
      focusedPlanet = 5;
      break;
    case "Digit6":
      focusedPlanet = 6;
      break;
    case "Digit7":
      focusedPlanet = 7;
      break;
    case "Digit8":
      focusedPlanet = 8;
      break;
    case "Digit0":
      focusedPlanet = 0;
      break;
  }
});

// Scene
const scene = new THREE.Scene();

/**
 * Objects
 */

for (let i = 0; i < 5000; i++) {
  const geometry = new THREE.SphereGeometry(500 + Math.random() * 20);
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
  });
  const mesh = new THREE.Mesh(geometry, material);

  // random position in sphere
  let randomRadius = Math.pow(1.4 + Math.random(), 6) * 50000;
  let randomAngle1 = Math.random() * Math.PI * 2;
  let randomAngle2 = Math.random() * Math.PI - Math.PI / 2;
  let x = Math.cos(randomAngle1) * Math.cos(randomAngle2) * randomRadius;
  let y = Math.sin(randomAngle2) * randomRadius;
  let z = Math.sin(randomAngle1) * Math.cos(randomAngle2) * randomRadius;

  mesh.position.x = x;
  mesh.position.y = y;
  mesh.position.z = z;
  scene.add(mesh);
}

const planetData = [
  {
    name: "Mercury",
    color: 0x7b7879,
    radius: 0.0024,
    distance: 58,
    period: 88,
    radiusRatio: 100,
  },
  {
    name: "Venus",
    color: 0xba731f,
    radius: 0.00605,
    distance: 108,
    period: 225,
    radiusRatio: 100,
  },
  {
    name: "Earth",
    color: 0x0c325e,
    radius: 0.0064,
    distance: 150,
    period: 365,
    radiusRatio: 100,
  },
  {
    name: "Mars",
    color: 0x9e3a2f,
    radius: 0.0034,
    distance: 228,
    period: 687,
    radiusRatio: 100,
  },
  {
    name: "Jupiter",
    color: 0x9e3a2f,
    radius: 0.069,
    distance: 778,
    period: 4333,
    radiusRatio: 100,
  },
  {
    name: "Saturn",
    color: 0xc3a27b,
    radius: 0.058,
    distance: 1427,
    period: 10759,
    radiusRatio: 100,
  },
  {
    name: "Uranus",
    color: 0xc6edf0,
    radius: 0.025,
    distance: 2871,
    period: 30687,
    radiusRatio: 100,
  },
  {
    name: "Neptune",
    color: 0x4775fb,
    radius: 0.0246,
    distance: 4498,
    period: 60190,
    radiusRatio: 100,
  },
];

const planetMeshes = [];
const pointers = [];

planetData.forEach((planet, index) => {
  const newPlanet = new THREE.Mesh(
    new THREE.SphereGeometry(planet.radius * planet.radiusRatio),
    new THREE.MeshBasicMaterial({ color: planet.color })
  );
  scene.add(newPlanet);
  planetMeshes.push(newPlanet);

  const orbit = new THREE.Mesh(
    new THREE.TorusGeometry(planet.distance, 0.0003 * planet.distance, 12, 96),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      opacity: 0.7,
      transparent: true,
    })
  );
  orbit.rotation.x = Math.PI / 2;
  scene.add(orbit);

  // 단위 영어로:
  const unit = planet.distance * 0.005;
  const pointer = new THREE.Mesh(
    new THREE.ConeGeometry(0.5 * unit, 2 * unit, 12),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      opacity: 0.5,
      transparent: true,
    })
  );
  pointer.rotation.x = Math.PI;
  pointer.position.x = planet.distance;
  pointer.position.y = planet.radiusRatio * planet.radius + 3 * unit;
  scene.add(pointer);
  pointers.push(pointer);
});

const sun = new THREE.Mesh(
  new THREE.SphereGeometry(0.7),
  new THREE.MeshBasicMaterial({ color: 0xf0f01e })
);
scene.add(sun);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(
  50,
  sizes.width / sizes.height,
  0.1,
  10000000
);
camera.position.y = 80;
camera.position.z = 120;
scene.add(camera);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// rotation animation

const animate = () => {
  planetMeshes.forEach((planet, index) => {
    const data = planetData[index];
    planet.position.x =
      Math.sin(Date.now() / (data.period * 10)) * data.distance;
    planet.position.z =
      Math.cos(Date.now() / (data.period * 10)) * data.distance;
  });

  pointers.forEach((pointer, index) => {
    const data = planetData[index];
    pointer.position.x =
      Math.sin(Date.now() / (data.period * 10)) * data.distance;
    pointer.position.z =
      Math.cos(Date.now() / (data.period * 10)) * data.distance;
  });

  if (focusedPlanet) {
    const planetPosition = planetMeshes[focusedPlanet - 1].position;
    // 1.2 * planetposition
    const distRatio = focusedPlanet < 6 ? 1.5 : 1.2;
    const yRatio = focusedPlanet < 6 ? 0.25 : 0.05;
    camera.position.x = planetPosition.x * distRatio;
    camera.position.y = planetPosition.length() * yRatio;
    camera.position.z = planetPosition.z * distRatio;
    camera.lookAt(planetMeshes[focusedPlanet - 1].position);
  }

  controls.update();
  renderer.render(scene, camera);

  requestAnimationFrame(animate);
};
animate();
