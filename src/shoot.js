import * as THREE from "three";
import { spaceship, spaceShipScale, scene, bullets } from "./script";

export const shoot = () => {
  const position = spaceship.position.clone();
  // direction: spaceship direction
  const direction = new THREE.Vector3(0, 0.5, 1);
  direction.applyQuaternion(spaceship.quaternion);
  direction.normalize();

  const bullet = new THREE.Group();
  bullet.rotation.order = "YXZ";

  bullet.position.copy(position.addScaledVector(direction, 0.00002));
  bullet.quaternion.copy(spaceship.quaternion);
  const bulletMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.4, 12),
    new THREE.MeshPhysicalMaterial({ color: 16711680, emissive: 16711680 })
  );

  bulletMesh.rotation.x = Math.PI / 2;

  let startColor = new THREE.Color(16759637);
  let endColor = new THREE.Color(16711680);

  const step = 0.02;
  for (var i = 0; i < 1; i += step) {
    const newBullet = bulletMesh.clone();
    const scale = 0.5 + (i * i) / 3;
    newBullet.scale.set(scale, scale, scale);
    newBullet.material.opacity = 1 - Math.pow(i, 0.1);

    let color = startColor.clone().lerp(endColor, i); //;
    // newBullet.material.emissive = color;
    bullet.add(newBullet);
  }

  bullet.scale.set(spaceShipScale, spaceShipScale, spaceShipScale);

  scene.add(bullet);
  bullets.push(bullet);
};
