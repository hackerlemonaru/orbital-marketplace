// Procedural hero model for ORBITAL.
// Modeling rules applied from skillfish `tattooinmtl/omni / threejs-3d-modeler`:
// primitive-first construction, named child meshes, shared materials, readable
// silhouette, consistent scale, and metadata in group.userData.
import * as THREE from "three";

export function createSpatialAssetMonolith(options = {}) {
  const { scale = 1, blue = 0x0070f3 } = options;
  const group = new THREE.Group();
  group.name = "SpatialAssetMonolith";
  group.userData = {
    modelType: "prop",
    style: "techno",
    family: "orbital-deploy-monolith",
    generatedBy: "threejs-3d-modeler",
    version: "1.0",
    scaleReference: "2.8 units tall",
  };

  const materials = {
    black: new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.72, roughness: 0.28 }),
    white: new THREE.MeshStandardMaterial({ color: 0xededed, metalness: 0.08, roughness: 0.52 }),
    blue: new THREE.MeshStandardMaterial({ color: blue, emissive: blue, emissiveIntensity: 0.65, metalness: 0.35, roughness: 0.22 }),
    darkLine: new THREE.LineBasicMaterial({ color: 0x333333 }),
    whiteLine: new THREE.LineBasicMaterial({ color: 0xededed }),
    blueLine: new THREE.LineBasicMaterial({ color: blue }),
  };

  const add = (object, name) => {
    object.name = name;
    group.add(object);
    return object;
  };

  const base = add(new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.08, 1.18), materials.black), "base_plate");
  base.position.y = -1.18;

  // A triangular prism is a CylinderGeometry with three radial segments.
  const triangleGeometry = new THREE.CylinderGeometry(1.08, 1.08, 0.14, 3, 1, false);
  triangleGeometry.rotateX(Math.PI / 2);
  const triangleEdges = new THREE.EdgesGeometry(triangleGeometry);

  for (let i = 0; i < 3; i += 1) {
    const slice = add(
      new THREE.Mesh(triangleGeometry, i === 1 ? materials.white : materials.black),
      `triangle_slice_${i + 1}`,
    );
    slice.rotation.z = Math.PI / 6 + i * 0.045;
    slice.position.z = (i - 1) * 0.24;
    slice.scale.set(1 - i * 0.075, 1 - i * 0.075, 1);

    const outline = add(
      new THREE.LineSegments(triangleEdges, i === 2 ? materials.blueLine : materials.whiteLine),
      `triangle_outline_${i + 1}`,
    );
    outline.rotation.copy(slice.rotation);
    outline.position.copy(slice.position);
    outline.scale.copy(slice.scale);
  }

  const spine = add(new THREE.Mesh(new THREE.BoxGeometry(0.095, 2.34, 0.095), materials.white), "vertical_spine");
  spine.position.set(-0.56, 0.02, 0.34);

  const scanIndex = add(new THREE.Mesh(new THREE.BoxGeometry(0.028, 2.02, 0.035), materials.blue), "blue_scan_index");
  scanIndex.position.set(0.7, -0.02, 0.39);

  const rail = add(new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.014, 6, 64), materials.white), "index_rail");
  rail.rotation.x = Math.PI / 2;
  rail.position.y = -1.13;

  const nodeGeometry = new THREE.SphereGeometry(0.045, 12, 8);
  [
    [-0.9, -1.02], [0.9, -1.02], [0, 1.02],
  ].forEach(([x, y], i) => {
    const node = add(new THREE.Mesh(nodeGeometry, i === 2 ? materials.blue : materials.white), `alignment_node_${i + 1}`);
    node.position.set(x, y, 0.38);
  });

  group.scale.setScalar(scale);
  return group;
}
