import * as THREE from "three";
import { moonData, planetData } from "./planetData";
import { createSaturnRing } from "./createSaturnRing";
import { createStars } from "./createStars";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// 1,000,000km = 1
let sec2day = 1;

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const body = document.querySelector("body");
const canvas = document.querySelector("canvas.webgl");
const sec2dayLabel = document.querySelector("#speed");
const velocityLabel = document.querySelector("#velocity");
const distanceLabel = document.querySelector("#distance");
const angleLabel = document.querySelector("#angle");
const scaleLabel = document.querySelector("#scale");
const loadingBox = document.querySelector(".loading-box");

const sec2daySpeed = [
  0, 0.01, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 2, 3, 4, 5, 6,
  7, 8, 9, 10, 20, 30, 40, 50, 100, 200, 300, 365,
];
let keys = {};
let spaceShipScale = 0.00001;

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

let cameraAccelerationOffset = 0;
const maxCameraAccelerationOffset = 2;

let headingLeft = false;
let headingRight = false;

const loadingManager = new THREE.LoadingManager(
  () => {
    loadingBox.style.opacity = 0;
    setTimeout(() => {
      loadingBox.style.display = "none";
    }, 2000);
  },
  () => {
    loadingBox.style.opacity = 1;
  }
);
const textureLoader = new THREE.TextureLoader(loadingManager);

const radiusRatios = [1, 5, 10, 50, 100, 500, 1000, 5000];
let radiusRatioIndex = 4;

const planetMeshes = [];

// Scene
const scene = new THREE.Scene();
// scene.fog = new THREE.Fog(0xcccccc, 10, 500);

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(
  50,
  sizes.width / sizes.height,
  spaceShipScale / 10,
  10000000
);
camera.position.set(0, 3, -7);
camera.lookAt(new THREE.Vector3(0, 0.2, 0));

scene.add(camera);

// Sound

const listener = new THREE.AudioListener();
camera.add(listener);

// create a global audio source
const engineSound = new Audio("/sounds/engine.mp3");
engineSound.volume = 0;
engineSound.loop = true;
const engineSound2 = new Audio("/sounds/engine.mp3");
engineSound2.volume = 0;
engineSound2.loop = true;

/**
 * event listeners
 */

const onDocumentKeyDown = (event) => {
  engineSound.play();
  setTimeout(() => {
    engineSound2.play();
  }, 2000);
  switch (event.code) {
    case "KeyA":
      keys.a = true;
      headingLeft = true;
      headingRight = false;
      break;
    case "KeyD":
      keys.d = true;
      headingRight = true;
      headingLeft = false;
      break;
    case "KeyW":
      keys.w = true;
      break;
    case "KeyQ":
      keys.q = true;
      break;
    case "KeyE":
      keys.e = true;
      break;
    case "Digit1":
    case "Digit2":
    case "Digit3":
    case "Digit4":
    case "Digit5":
    case "Digit6":
    case "Digit7":
    case "Digit8":
      moveToPlanet(parseInt(event.code.replace("Digit", "")) - 1);
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
    case "KeyO":
      if (radiusRatioIndex > 0) {
        radiusRatioIndex--;
      }
      updateScale(radiusRatios[radiusRatioIndex]);
      break;
    case "Space":
      shoot();
      break;
  }
};

const onDocumentKeyUp = (event) => {
  switch (event.code) {
    case "KeyA":
      keys.a = false;
      headingLeft = false;
      break;
    case "KeyD":
      keys.d = false;
      headingRight = false;
      break;
    case "KeyW":
      keys.w = false;

      break;
    case "KeyQ":
      keys.q = false;
      break;
    case "KeyE":
      keys.e = false;
      break;
  }
};

/**
 * Lights
 */

const ambientLight = new THREE.AmbientLight(0xffffff, 1); //1
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff);
pointLight.intensity = 20;
pointLight.decay = 0.25;
scene.add(pointLight);

const updateSec2day = (value) => {
  sec2dayLabel.innerText = `1 second: ${value.toFixed(2)} day`;
};
const updateVelocity = (value) => {
  velocityLabel.innerText = `Spaceship Speed: ${(value * 250000000).toFixed(
    0
  )}km/s ${
    (value * 250000000) / 300000 > 1
      ? `(${((value * 250000000) / 300000).toFixed(0)} light speed)`
      : ""
  }`;
};
const updateDistance = (value) => {
  distanceLabel.innerText = `Distance from the sun: ${(value * 1000000).toFixed(
    0
  )}km`;
};
const updateAngle = (value) => {
  angleLabel.innerText = `Spaceship Vertical Angle: ${
    Math.abs(value) < 0.001 ? 0 : ((-value * 180) / Math.PI).toFixed(1)
  }°`;
};
const updateScale = (value) => {
  scaleLabel.innerText = `The planet radius is scaled up ${value} times for better visibility.`;
};

updateScale(radiusRatios[radiusRatioIndex]);

// const axisHelper = new THREE.AxesHelper(1);
// scene.add(axisHelper);

textureLoader.load("/textures/8k_stars_milky_way.jpg", (starsTexture) => {
  starsTexture.colorSpace = THREE.SRGBColorSpace;
  starsTexture.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = starsTexture;
  scene.environment = starsTexture;
});

/**
 * Objects
 */

createStars(scene);

const pointers = [];

const celestialGeometry = new THREE.SphereGeometry(1, 64, 32);

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
    texture.colorSpace = THREE.SRGBColorSpace;
  });

  const planetMaterial = new THREE.MeshLambertMaterial({
    map: texture,
  });

  if (planet.name === "Earth") {
    const normal = textureLoader.load("textures/2k_earth_normal_map.webp");
    planetMaterial.normalMap = normal;
    planetMaterial.normalScale = new THREE.Vector2(3, 3);
    // const specular = textureLoader.load("textures/2k_earth_specular_map.webp");
    // planetMaterial.specularMap = specular;
  }

  const newPlanet = new THREE.Mesh(celestialGeometry, planetMaterial);

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

const sunTexture = textureLoader.load("textures/2k_sun.jpg");
sunTexture.colorSpace = THREE.SRGBColorSpace;
const sun = new THREE.Mesh(
  celestialGeometry,
  new THREE.MeshBasicMaterial({
    map: sunTexture,
  })
);
sun.scale.setScalar(0.7);
scene.add(sun);

const moonTexture = textureLoader.load(moonData.texture);
moonTexture.colorSpace = THREE.SRGBColorSpace;
const moon = new THREE.Mesh(
  celestialGeometry,
  new THREE.MeshLambertMaterial({
    map: moonTexture,
  })
);
moon.scale.setScalar(moonData.radius * radiusRatios[radiusRatioIndex]);

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
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// rotation animation

const getX = (period, distance, time) =>
  Math.sin((time / period) * (2 * Math.PI)) * distance;
const getZ = (period, distance) =>
  Math.cos((time / period) * (2 * Math.PI)) * distance;
const getRotation = (period) => (time / period) * (2 * Math.PI);

let velocity = 0;
const acceleration = 1.005;
const maxVelocity = 1;
let rotationSpeed = 0;
const maxRotationSpeed = 0.002;
const rotationAcceleration = 0.00001;
const rotationDamping = 0.99;

let verticalSpeed = 0;
const maxVerticalAngle = Math.PI / 2 - Math.PI / 12; // 70도
const verticalSpeedIncrement = 0.00001;
const verticalDamping = 0.98;

let exhaust; // 추진력을 표현하는 실린더

const spaceship = new THREE.Group();

const loader = new GLTFLoader();

loader.load("/models/spaceship1.glb", function (gltf) {
  const ship = gltf.scene;
  // duck.rotation.y = Math.PI / 2;
  ship.scale.setScalar(0.5);

  spaceship.add(ship);

  // spaceship = gltf.scene;

  spaceship.position.set(0, 1, -2);
  spaceship.scale.setScalar(spaceShipScale);
  spaceship.rotation.order = "YXZ";
  scene.add(spaceship);

  updateCamera();
});

loader.load("/models/flame.glb", function (gltf) {
  exhaust = new THREE.Group();
  const flame = gltf.scene.children[0].children[0].children[5];
  flame.scale.setScalar(50);
  flame.rotation.y = -Math.PI / 2;
  flame.material.emissive = new THREE.Color(0xff7920); //b25300

  new THREE.TorusGeometry(2, 0.1 + (i * i) / 2, 20, 120);

  let startColor = new THREE.Color(0xffbb55);
  let endColor = new THREE.Color(0xff0000);

  const step = 0.02;
  for (var i = 0; i < 1; i += step) {
    const newFlame = flame.clone();
    const scale = 100 * (0.5 + (i * i) / 3);
    newFlame.scale.setScalar(scale);
    newFlame.material = newFlame.material.clone();
    newFlame.material.opacity = 1 - Math.pow(i, 0.1);
    newFlame.position.set(0, 0, i * 1);

    let color = startColor.clone().lerp(endColor, i);
    newFlame.material.emissive = color;

    exhaust.add(newFlame);
  }

  spaceship.add(exhaust);
});

let targetPosition = null;

const moveToPlanet = (index) => {
  engineSound.volume = 1;
  engineSound2.volume = 1;
  if (index >= 0 && index < planetMeshes.length) {
    const planet = planetMeshes[index];
    const direction = new THREE.Vector3();
    direction.subVectors(planet.position, spaceship.position).normalize();
    targetPosition = planet.position
      .clone()
      .addScaledVector(direction, -0.08 * radiusRatios[radiusRatioIndex]); // 행성에서 2 단위 거리 앞

    spaceship.lookAt(planet.position);
  }
};

const updateSpaceship = () => {
  if (keys.w) {
    cameraAccelerationOffset += 0.01;
    if (cameraAccelerationOffset > maxCameraAccelerationOffset) {
      cameraAccelerationOffset = maxCameraAccelerationOffset;
    }
    if (velocity < 0.0001) velocity = 0.0001;
    velocity *= acceleration;
    if (velocity > maxVelocity) velocity = maxVelocity;
  } else {
    cameraAccelerationOffset -= 0.01;
    if (cameraAccelerationOffset < 0) {
      cameraAccelerationOffset = 0;
    }
    velocity *= 0.98; // 자연 감속
  }

  if (headingLeft) {
    rotationSpeed += rotationAcceleration;
    if (rotationSpeed > maxRotationSpeed) rotationSpeed = maxRotationSpeed;
  } else if (headingRight) {
    rotationSpeed -= rotationAcceleration;
    if (rotationSpeed < -maxRotationSpeed) rotationSpeed = -maxRotationSpeed;
  } else {
    rotationSpeed *= rotationDamping; // 자연 감속
  }

  if (targetPosition) rotationSpeed = 0;

  spaceship.rotation.y += rotationSpeed;
  spaceship.rotation.z = -rotationSpeed * 200;

  if (spaceship.rotation.x + verticalSpeed > maxVerticalAngle) {
    keys.e = false;
  } else if (spaceship.rotation.x + verticalSpeed < -maxVerticalAngle) {
    keys.q = false;
  }

  if (keys.q) {
    verticalSpeed -= verticalSpeedIncrement;
  } else if (keys.e) {
    verticalSpeed += verticalSpeedIncrement;
  } else {
    verticalSpeed *= verticalDamping; // 자연 감속
  }

  if (targetPosition) verticalSpeed = 0;

  if (spaceship.rotation.x + verticalSpeed > maxVerticalAngle) {
    spaceship.rotation.x = maxVerticalAngle;
  } else if (spaceship.rotation.x + verticalSpeed < -maxVerticalAngle) {
    spaceship.rotation.x = -maxVerticalAngle;
  } else {
    spaceship.rotation.x += verticalSpeed;
  }

  updateAngle(spaceship.rotation.x);

  // 목표 위치로 이동
  if (targetPosition) {
    const direction = new THREE.Vector3();
    direction.subVectors(targetPosition, spaceship.position).normalize();
    const distance = spaceship.position.distanceTo(targetPosition);

    if (distance > 48.75) {
      velocity = maxVelocity; // 목표 위치로 이동할 때 최대 속도 사용
      spaceship.position.addScaledVector(direction, velocity);
    } else {
      targetPosition = null; // 목표 위치에 도달하면 이동 종료
    }
  } else {
    let minDistance = 10;
    let minPlanet = null;
    let minPlanetRadius = 0;

    const direction = new THREE.Vector3(0, 0, 1);
    direction.applyQuaternion(spaceship.quaternion);
    direction.normalize();

    [sun, moon, ...planetMeshes].forEach((planet) => {
      const distance = planet.position.distanceTo(spaceship.position);
      const radius = planet.scale.x;
      if (distance / radius < minDistance) {
        minDistance = distance / radius;
        minPlanet = planet;
        minPlanetRadius = radius;
      }
    });

    const ths1 = 0.00001 * minPlanetRadius;
    const ths2 = 0.0001 * minPlanetRadius;
    const ths3 = 0.001 * minPlanetRadius;

    if (minDistance < 1.01 && velocity > ths1) {
      velocity = ths1;
    } else if (minDistance < 1.1 && velocity > ths2) {
      velocity = ths2;
    } else if (minDistance < 2 && velocity > ths3) {
      velocity = ths3;
    }

    const nextPosition = spaceship.position.addScaledVector(
      direction,
      velocity
    );

    if (minPlanet && minDistance < 1) {
      // 행성 표면과 충돌
      const directionToPlanet = new THREE.Vector3();
      directionToPlanet
        .subVectors(nextPosition, minPlanet.position)
        .normalize();
      nextPosition
        .copy(minPlanet.position)
        .addScaledVector(directionToPlanet, minPlanet.scale.x);
    }

    spaceship.position.copy(nextPosition);
  }

  updateVelocity(velocity);
  // console.log(planetMeshes[0].scale);

  updateDistance(spaceship.position.distanceTo(new THREE.Vector3(0, 0, 0)));

  // 추진력 길이 업데이트
  if (exhaust) {
    exhaust.scale.set(
      0.5 + 0.1 * velocity,
      0.5 + 0.1 * velocity,
      velocity * 0.4 + 0.05
    );
    exhaust.position.set(0, 0.9, +velocity * 0.75 - 2.5);
  }

  if (!targetPosition) {
    if (keys.w) {
      engineSound.volume = Math.min(1, engineSound.volume + 0.0005);
      engineSound2.volume = Math.min(1, engineSound2.volume + 0.0005);
    } else {
      engineSound.volume = engineSound.volume * 0.99;
      engineSound2.volume = engineSound2.volume * 0.99;
    }
    if (engineSound.volume < 0.0001) {
      engineSound.volume = 0;
      engineSound2.volume = 0;
    }
  }
};

const updateCamera = () => {
  let cameraAngle = Math.PI / 7 - verticalSpeed * 60;

  const distance = 10 + 5 * velocity + cameraAccelerationOffset;
  const offset = new THREE.Vector3(
    spaceShipScale * 0, //0
    spaceShipScale * Math.sin(cameraAngle) * distance,
    spaceShipScale * -Math.cos(cameraAngle) * distance //-9
  );
  offset.applyQuaternion(spaceship.quaternion);
  camera.position.copy(spaceship.position).add(offset);
  const lookAt = new THREE.Vector3(
    spaceShipScale * -rotationSpeed * 400,
    spaceShipScale * 2,
    spaceShipScale * 2
  );
  lookAt.applyQuaternion(spaceship.quaternion);

  camera.lookAt(spaceship.position.clone().add(lookAt));
  // camera.rotation.x = verticalSpeed;
};

let time = Date.now() / 1000;
const clock = new THREE.Clock();
let oldElapsedTime = 0;

const animate = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - oldElapsedTime;
  oldElapsedTime = elapsedTime;

  time += deltaTime * sec2day;

  const scale = radiusRatios[radiusRatioIndex];
  sun.rotation.y = (time / 27) * (2 * Math.PI);

  planetMeshes.forEach((planet, index) => {
    const data = planetData[index];
    planet.position.x = getX(data.revolutionPeriod, data.distance, time);
    planet.position.z = getZ(data.revolutionPeriod, data.distance, time);
    planet.rotation.y = getRotation(data.rotationPeriod, time);
    const planetScale = data.radius * scale;
    planet.scale.setScalar(planetScale);
  });
  const earth = planetMeshes[2];

  moon.position.x =
    earth.position.x + getX(moonData.revolutionPeriod, moonData.distance, time);
  moon.position.z =
    earth.position.z + getZ(moonData.revolutionPeriod, moonData.distance, time);
  moon.rotation.y = getRotation(moonData.rotationPeriod, time) + Math.PI / 2;

  moon.scale.setScalar(scale * moonData.radius);

  moonOrbit.position.x = earth.position.x;
  moonOrbit.position.z = earth.position.z;

  pointers.forEach((pointer, index) => {
    const data = planetData[index];
    pointer.position.x = getX(data.revolutionPeriod, data.distance, time);
    pointer.position.z = getZ(data.revolutionPeriod, data.distance, time);

    const pointerScale = 200;
    pointer.position.y =
      data.radius * 2 * scale + data.distance * 0.00005 * pointerScale * 1.1;
    pointer.scale.setScalar(pointerScale);
  });

  if (spaceship) {
    updateSpaceship();
    updateCamera();
    // updateBullets();
  }

  renderer.render(scene, camera);

  requestAnimationFrame(animate);
};
animate();

addEventListener("keydown", onDocumentKeyDown, false);
addEventListener("keyup", onDocumentKeyUp, false);
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

animate();
