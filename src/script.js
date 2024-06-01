import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { moonData, planetData } from "./planetData";
import { createSaturnRing } from "./createSaturnRing";
import { createStars } from "./createStars";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

// 1,000,000km = 1
let sec2day = 1;
const textureLoader = new THREE.TextureLoader();

const sec2daySpeed = [
  0, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 2, 3, 4, 5, 6, 7, 8,
  9, 10, 20, 30, 40, 50, 100, 200, 300, 365,
];

const radiusRatios = [1, 5, 10, 50, 100, 500, 1000, 5000];
let radiusRatioIndex = 6;

const increaseSpeed = () => {
  for (let i = 0; i < sec2daySpeed.length - 1; i++) {
    if (sec2daySpeed[i] <= sec2day && sec2day < sec2daySpeed[i + 1]) {
      sec2day = sec2daySpeed[i + 1];
      return;
    }
  }
};

const decreaseSpeed = () => {
  for (let i = 1; i < sec2daySpeed.length; i++) {
    if (sec2daySpeed[i - 1] < sec2day && sec2day <= sec2daySpeed[i]) {
      sec2day = sec2daySpeed[i - 1];
      return;
    }
  }
};

const body = document.querySelector("body");
const canvas = document.querySelector("canvas.webgl");
const sec2dayLabel = document.querySelector("#speed");
const scaleLabel = document.querySelector("#scale");
const updateSec2day = (value) => {
  sec2dayLabel.innerText = `1 second: ${value.toFixed(2)} day`;
};
const updateScale = (value) => {
  scaleLabel.innerText = `The planet radius is scaled up ${value} times for better visibility.`;
};

updateScale(radiusRatios[radiusRatioIndex]);

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

const setCameraPosition = (planetIndex) => {
  const scale = radiusRatios[radiusRatioIndex];
  const planetX = planetMeshes[planetIndex].position.x;
  const planetZ = planetMeshes[planetIndex].position.z;
  const angle = Math.atan2(planetZ, planetX);
  const distance = Math.sqrt(planetX ** 2 + planetZ ** 2) + 0.4 * scale;
  camera.position.x = Math.cos(angle) * distance;
  camera.position.z = Math.sin(angle) * distance;
  camera.position.y = 0.05 * scale;
};

const focusPlanet = (planetIndex) => {
  sec2day = planetIndex < 4 ? 0.01 : 0.05;
  setTimeout(() => {
    setCameraPosition(planetIndex);
  }, 50);
};

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
    case "Digit2":
    case "Digit3":
    case "Digit4":
    case "Digit5":
    case "Digit6":
    case "Digit7":
    case "Digit8":
      focusedPlanet = Number(event.code[5]);
      focusPlanet(focusedPlanet - 1);
      updateSec2day(sec2day);
      break;
    case "Digit0":
      focusedPlanet = 0;
      break;
    case "ArrowUp":
      increaseSpeed();
      updateSec2day(sec2day);
      break;
    case "ArrowDown":
      decreaseSpeed();
      updateSec2day(sec2day);
      break;
    case "KeyU":
      if (radiusRatioIndex < radiusRatios.length - 1) {
        radiusRatioIndex++;
      }
      updateScale(radiusRatios[radiusRatioIndex]);
      break;
    case "KeyD":
      if (radiusRatioIndex > 0) {
        radiusRatioIndex--;
      }
      updateScale(radiusRatios[radiusRatioIndex]);
      break;
  }
});

// Scene
const scene = new THREE.Scene();
// scene.fog = new THREE.Fog(0xcccccc, 10, 500);

const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff);
pointLight.intensity = 20;
pointLight.decay = 0.25;
scene.add(pointLight);

textureLoader.load("/stars_background.jpeg", (starsTexture) => {
  starsTexture.colorSpace = THREE.SRGBColorSpace;
  starsTexture.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = starsTexture;
  scene.environment = starsTexture;
});

/**
 * Objects
 */

createStars(scene);

const planetMeshes = [];
const pointers = [];

planetData.forEach((planet, index) => {
  const orbit = new THREE.Mesh(
    // new THREE.TorusGeometry(planet.distance, planet.orbitWidth, 12, 96),
    new THREE.RingGeometry(planet.distance, planet.distance, 1024),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      opacity: 0.1,
      transparent: true,
      wireframe: true,
    })
  );
  orbit.rotation.x = Math.PI / 2;
  scene.add(orbit);

  const unit = planet.distance * 0.00005;
  const pointer = new THREE.Mesh(
    new THREE.ConeGeometry(0.5 * unit, 2 * unit, 12),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      opacity: 0.5,
      transparent: true,
    })
  );
  pointer.rotation.x = Math.PI;
  scene.add(pointer);
  pointers.push(pointer);

  const texture = textureLoader.load(planet.texture, function (texture) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
  });
  texture.colorSpace = THREE.SRGBColorSpace;
  const newPlanet = new THREE.Mesh(
    new THREE.SphereGeometry(planet.radius, 32, 32),
    new THREE.MeshLambertMaterial({
      map: texture,
    })
  );

  if (planet.name === "Saturn") {
    const saturn = new THREE.Group();
    const ring = createSaturnRing(planet);
    saturn.add(newPlanet);
    saturn.add(ring);
    scene.add(saturn);

    saturn.rotation.x = planet.tilted;
    planetMeshes.push(saturn);
    return;
  }
  newPlanet.rotation.x = planet.tilted;
  scene.add(newPlanet);
  planetMeshes.push(newPlanet);
});

const sunTexture = textureLoader.load("textures/sun.jpeg");
sunTexture.colorSpace = THREE.SRGBColorSpace;
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(0.7, 32, 32),

  new THREE.MeshBasicMaterial({
    map: sunTexture,
    side: THREE.DoubleSide,
  })
);
scene.add(sun);

const moonTexture = textureLoader.load(moonData.texture);
moonTexture.colorSpace = THREE.SRGBColorSpace;
const moon = new THREE.Mesh(
  new THREE.SphereGeometry(moonData.radius, 32, 32),
  new THREE.MeshLambertMaterial({
    map: moonTexture,
    side: THREE.DoubleSide,
  })
);

scene.add(moon);

const moonOrbit = new THREE.Mesh(
  new THREE.RingGeometry(moonData.distance, moonData.distance, 128),
  new THREE.MeshBasicMaterial({
    color: 0xffffff,
    opacity: 0.1,
    transparent: true,
    wireframe: true,
  })
);
moonOrbit.rotation.x = Math.PI / 2;
scene.add(moonOrbit);

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
  0.01,
  10000000
);
camera.position.y = 80;
camera.position.z = 120;

scene.add(camera);

const controls = new OrbitControls(camera, canvas);
controls.rotateSpeed = 0.1;
controls.zoomSpeed = 0.2;
controls.enableDamping = true;
controls.maxDistance = 300000;
controls.minDistance = 1.5;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// rotation animation

const getX = (period, distance) =>
  Math.sin((Date.now() / 1000 / period) * sec2day * (2 * Math.PI)) * distance;
const getZ = (period, distance) =>
  Math.cos((Date.now() / 1000 / period) * sec2day * (2 * Math.PI)) * distance;
const getRotation = (period) =>
  (Date.now() / 1000 / period) * sec2day * (2 * Math.PI);

const animate = () => {
  const scale = radiusRatios[radiusRatioIndex];
  sun.rotation.y = (Date.now() / 1000 / 27) * sec2day * (2 * Math.PI);

  planetMeshes.forEach((planet, index) => {
    const data = planetData[index];
    planet.position.x = getX(data.revolutionPeriod, data.distance);
    planet.position.z = getZ(data.revolutionPeriod, data.distance);
    planet.rotation.y = getRotation(data.rotationPeriod);
    planet.scale.set(scale, scale, scale);
  });
  const earth = planetMeshes[2];

  moon.position.x =
    earth.position.x + getX(moonData.revolutionPeriod, moonData.distance);
  moon.position.z =
    earth.position.z + getZ(moonData.revolutionPeriod, moonData.distance);
  moon.rotation.y = getRotation(moonData.rotationPeriod) + Math.PI / 2;
  moon.scale.set(scale, scale, scale);

  moonOrbit.position.x = earth.position.x;
  moonOrbit.position.z = earth.position.z;

  pointers.forEach((pointer, index) => {
    const data = planetData[index];
    pointer.position.x = getX(data.revolutionPeriod, data.distance);
    pointer.position.z = getZ(data.revolutionPeriod, data.distance);

    const pointerScale = 200;
    pointer.position.y =
      data.radius * 2 * scale + data.distance * 0.00005 * pointerScale * 1.1;
    pointer.scale.set(pointerScale, pointerScale, pointerScale);
  });

  controls.update();
  // camera.position.x = planetMeshes[1].position.x;
  // camera.position.z = planetMeshes[1].position.z;
  // camera.position.y = 20;
  // camera.lookAt(planetMeshes[1].position);
  renderer.render(scene, camera);

  requestAnimationFrame(animate);
};
animate();
