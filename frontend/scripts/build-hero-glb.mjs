import { writeFileSync, mkdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { Document, NodeIO } from '@gltf-transform/core';
import { dedup, prune, weld } from '@gltf-transform/functions';
import * as THREE from 'three';

const __dirname = dirname(fileURLToPath(import.meta.url));
const output = resolve(__dirname, '../public/models/orbital-monolith.glb');
mkdirSync(dirname(output), { recursive: true });

// A named, primitive-first lattice: one unit cuboid is reused by every beam.
// The two edge-light strips are the only emissive geometry, so the hero renderer
// can apply selective bloom to the seam without blooming the black frame.
const cube = () => {
  const p = [
    [-0.5,-0.5, 0.5], [0.5,-0.5, 0.5], [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5],
    [-0.5,-0.5,-0.5], [-0.5, 0.5,-0.5], [0.5, 0.5,-0.5], [0.5,-0.5,-0.5],
    [-0.5, 0.5,-0.5], [-0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [0.5, 0.5,-0.5],
    [-0.5,-0.5,-0.5], [0.5,-0.5,-0.5], [0.5,-0.5, 0.5], [-0.5,-0.5, 0.5],
    [0.5,-0.5,-0.5], [0.5, 0.5,-0.5], [0.5, 0.5, 0.5], [0.5,-0.5, 0.5],
    [-0.5,-0.5,-0.5], [-0.5,-0.5, 0.5], [-0.5, 0.5, 0.5], [-0.5, 0.5,-0.5],
  ];
  const n = [
    [0,0,1],[0,0,1],[0,0,1],[0,0,1],
    [0,0,-1],[0,0,-1],[0,0,-1],[0,0,-1],
    [0,1,0],[0,1,0],[0,1,0],[0,1,0],
    [0,-1,0],[0,-1,0],[0,-1,0],[0,-1,0],
    [1,0,0],[1,0,0],[1,0,0],[1,0,0],
    [-1,0,0],[-1,0,0],[-1,0,0],[-1,0,0],
  ];
  return {
    positions: new Float32Array(p.flat()),
    normals: new Float32Array(n.flat()),
    indices: new Uint16Array([
      0,1,2, 0,2,3, 4,5,6, 4,6,7,
      8,9,10, 8,10,11, 12,13,14, 12,14,15,
      16,17,18, 16,18,19, 20,21,22, 20,22,23,
    ]),
  };
};

const doc = new Document();
const asset = doc.getRoot().getAsset();
asset.generator = 'ORBITAL procedural monolith';
asset.copyright = 'CC0-1.0 · ORBITAL';
const buffer = doc.createBuffer('Monolith geometry');
const scene = doc.createScene('Studio');
const root = doc.createNode('ORBITAL lattice monolith')
  .setExtras({ orbital: { role: 'hero', license: 'CC0-1.0', procedural: true } });
scene.addChild(root);

const black = doc.createMaterial('Anodised graphite')
  .setBaseColorFactor([0.035, 0.039, 0.047, 1])
  .setMetallicFactor(0.28)
  .setRoughnessFactor(0.62);
const edge = doc.createMaterial('Blue edge light')
  .setBaseColorFactor([0.012, 0.12, 0.48, 1])
  .setEmissiveFactor([0.02, 0.28, 1.0])
  .setMetallicFactor(0.15)
  .setRoughnessFactor(0.28);

const geom = cube();
const position = doc.createAccessor('Unit cube positions', buffer)
  .setType('VEC3').setArray(geom.positions);
const normal = doc.createAccessor('Unit cube normals', buffer)
  .setType('VEC3').setArray(geom.normals);
const indices = doc.createAccessor('Unit cube indices', buffer)
  .setType('SCALAR').setArray(geom.indices);

function makeMesh(name, material) {
  const primitive = doc.createPrimitive()
    .setAttribute('POSITION', position)
    .setAttribute('NORMAL', normal)
    .setIndices(indices)
    .setMaterial(material);
  return doc.createMesh(name).addPrimitive(primitive);
}
const blackMesh = makeMesh('Graphite beam', black);
const edgeMesh = makeMesh('Edge-light strip', edge);

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const up = V(0, 1, 0);
function beam(name, a, b, thickness, mesh = blackMesh, extras = {}) {
  const direction = b.clone().sub(a);
  const length = direction.length();
  const q = new THREE.Quaternion().setFromUnitVectors(up, direction.clone().normalize());
  const node = doc.createNode(name)
    .setMesh(mesh)
    .setTranslation(a.clone().add(b).multiplyScalar(0.5).toArray())
    .setRotation([q.x, q.y, q.z, q.w])
    .setScale([thickness, length, thickness])
    .setExtras({ orbital: { primitive: 'beam', ...extras } });
  root.addChild(node);
  return node;
}

const W = 1.48, H = 2.62, D = 0.34, lean = 0.34, zF = D / 2, zB = -D / 2;
const F = {
  bl: V(-W / 2, -H / 2, zF), br: V(W / 2, -H / 2, zF),
  tl: V(-W / 2 + lean, H / 2, zF), tr: V(W / 2 + lean, H / 2, zF),
  ml: V(-W / 2 + lean / 2, 0.12, zF), mr: V(W / 2 + lean / 2, 0.12, zF),
};
const B = {
  bl: V(-W / 2, -H / 2, zB), br: V(W / 2, -H / 2, zB),
  tl: V(-W / 2 + lean, H / 2, zB), tr: V(W / 2 + lean, H / 2, zB),
  ml: V(-W / 2 + lean / 2, 0.12, zB), mr: V(W / 2 + lean / 2, 0.12, zB),
};

const t = 0.078, brace = 0.052;
for (const [side, q] of [['front', F], ['back', B]]) {
  beam(`frame-${side}-bottom`, q.bl, q.br, t);
  beam(`frame-${side}-top`, q.tl, q.tr, t);
  beam(`frame-${side}-left`, q.bl, q.tl, t);
  beam(`frame-${side}-right`, q.br, q.tr, t);
  beam(`frame-${side}-crossbar`, q.ml, q.mr, t * 0.82);
}
for (const corner of ['bl', 'br', 'tl', 'tr']) {
  beam(`depth-${corner}`, F[corner], B[corner], t * 0.78);
}
beam('brace-front-lower-a', F.bl, F.mr, brace);
beam('brace-front-lower-b', F.ml, F.br, brace);
beam('brace-front-upper-a', F.ml, F.tr, brace);
beam('brace-front-upper-b', F.tl, F.mr, brace);
beam('brace-back-lower-a', B.bl, B.mr, brace * 0.82);
beam('brace-back-upper-b', B.tl, B.mr, brace * 0.82);

const seamOffset = 0.026;
const seamLeftA = F.bl.clone().add(V(-0.006, 0, seamOffset));
const seamLeftB = F.tl.clone().add(V(-0.006, 0, seamOffset));
const seamRightA = F.br.clone().add(V(0.006, 0, seamOffset));
const seamRightB = F.tr.clone().add(V(0.006, 0, seamOffset));
beam('seam-left', seamLeftA, seamLeftB, 0.024, edgeMesh, { bloom: true });
beam('seam-right', seamRightA, seamRightB, 0.024, edgeMesh, { bloom: true });
beam('seam-top', F.tl.clone().add(V(0, 0.008, seamOffset)), F.tr.clone().add(V(0, 0.008, seamOffset)), 0.018, edgeMesh, { bloom: true });

await doc.transform(dedup(), prune(), weld());
const io = new NodeIO();
const glb = await io.writeBinary(doc);
writeFileSync(output, Buffer.from(glb));

const validate = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['--no-install', 'gltf-transform', 'validate', output],
  { cwd: resolve(__dirname, '..'), encoding: 'utf8' },
);
if (validate.status !== 0) {
  console.error(validate.stdout || validate.stderr || 'GLB validation failed');
  process.exit(validate.status || 1);
}
const bytes = statSync(output).size;
if (bytes > 1_500_000) {
  console.error(`Hero GLB is ${bytes} bytes, over the 1.5 MB budget`);
  process.exit(1);
}
console.log(`hero GLB: ${bytes} bytes, ${doc.getRoot().listNodes().length} named nodes, validated`);
