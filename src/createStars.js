import * as THREE from "three";

export const createStars = (scene) => {
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
    // let randomAngle2 = sign * adjustedRandom * Math.PI;
    let x = Math.cos(randomAngle1) * Math.cos(randomAngle2) * randomRadius;
    let y = Math.sin(randomAngle2) * randomRadius;
    let z = Math.sin(randomAngle1) * Math.cos(randomAngle2) * randomRadius;

    mesh.position.x = x;
    mesh.position.y = y;
    mesh.position.z = z;
    scene.add(mesh);
  }
};
