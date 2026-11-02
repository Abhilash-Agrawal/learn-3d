import * as THREE from 'three';

export function createRoadRibbonGeometry(curve, width, segments, height) {
  const positions = [];
  const indices = [];
  const halfWidth = width / 2;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    const side = new THREE.Vector3(tangent.z, 0, -tangent.x).normalize();

    positions.push(
      point.x + side.x * halfWidth, height, point.z + side.z * halfWidth,
      point.x - side.x * halfWidth, height, point.z - side.z * halfWidth
    );

    if (i < segments) {
      const current = i * 2;
      indices.push(current, current + 1, current + 2, current + 1, current + 3, current + 2);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
