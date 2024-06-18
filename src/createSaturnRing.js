import * as THREE from "three";

export const createSaturnRing = (planet) => {
  const texture = new THREE.TextureLoader().load(
    "textures/8k_saturn_ring_alpha.png"
  );
  texture.colorSpace = THREE.SRGBColorSpace;

  const geometry = new THREE.RingGeometry(1.2, 2.4, 64);

  // Adjust UV mapping
  const uv = geometry.attributes.uv.array;
  for (let i = 0; i < uv.length; i += 2) {
    const u = uv[i];
    const v = uv[i + 1];
    const distance = Math.pow(Math.pow(u - 0.5, 2) + Math.pow(v - 0.5, 2), 0.5);
    uv[i] = (distance - 0.25) * 4;
  }

  // Update the UVs
  geometry.attributes.uv.needsUpdate = true;

  // Create the material
  const material = new THREE.MeshLambertMaterial({
    map: texture,
    side: THREE.DoubleSide,
    transparent: true,
  });

  // Create the mesh
  const ring = new THREE.Mesh(geometry, material);
  ring.rotation.x = Math.PI / 2;

  return ring;
};
