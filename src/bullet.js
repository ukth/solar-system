const bullets = [];

const bulletGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 32);
const bulletMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x808080,
  emissive: 0xff0000,
});
const shoot = () => {
  const position = spaceship.position.clone();
  // direction: spaceship direction
  const direction = new THREE.Vector3(0, 0, 1);
  direction.applyQuaternion(spaceship.quaternion);
  direction.normalize();

  const bullet = new THREE.Group();
  bullet.rotation.order = "YXZ";

  bullet.position.copy(position.addScaledVector(direction, 0.00003));
  bullet.quaternion.copy(spaceship.quaternion);

  const bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial);

  bulletMesh.rotation.x = Math.PI / 2;

  let startColor = new THREE.Color(0xffbb55);
  let endColor = new THREE.Color(0xff0000);

  const step = 0.02;
  for (var i = 0; i < 1; i += step) {
    const newBullet = bulletMesh.clone();
    const scale = 1 + i * i;
    newBullet.scale.set(scale, scale, scale);
    newBullet.material = newBullet.material.clone();
    newBullet.material.opacity = 0.1;
    newBullet.material.transparent = true;

    let color = startColor.clone().lerp(endColor, i);
    newBullet.material.emissive = color;

    bullet.add(newBullet);
  }

  bullet.scale.set(spaceShipScale, spaceShipScale, spaceShipScale);

  scene.add(bullet);
  bullets.push(bullet);
};

const maxBulletDistance = 0.1;
const bulletSpeed = 0.00005;
const updateBullets = () => {
  console.log(bullets.length);
  const newBullets = [];
  bullets.forEach((bullet) => {
    const direction = new THREE.Vector3(0, 0, 1);
    direction.applyQuaternion(bullet.quaternion);
    bullet.position.addScaledVector(direction, bulletSpeed);

    const distance = bullet.position.distanceTo(spaceship.position);
    if (distance > maxBulletDistance) {
      scene.remove(bullet);
      return;
    }
    newBullets.push(bullet);
  });
  bullets.length = 0;
  bullets.push(...newBullets);
};
