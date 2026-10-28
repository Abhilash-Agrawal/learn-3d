import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165/build/three.module.js';

export class Ground {
  constructor(materials) {
    this.materials = materials;
    this.mesh = null;
  }
  
  generate(bounds) {
    const width = bounds.max.x - bounds.min.x;
    const depth = bounds.max.z - bounds.min.z;
    const centerX = (bounds.max.x + bounds.min.x) / 2;
    const centerZ = (bounds.max.z + bounds.min.z) / 2;
    
    const geometry = new THREE.PlaneGeometry(width, depth, 50, 50);
    geometry.rotateX(-Math.PI / 2);
    
    const positions = geometry.attributes.position;
    const colors = new Float32Array(positions.count * 3);
    
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getY(i);
      
      const noise = this.noise2D(x * 0.01, z * 0.01) * 0.5;
      const variation = (Math.random() - 0.5) * 0.3;
      
      const baseColor = new THREE.Color(0x477a38);
      const lightColor = new THREE.Color(0x65984a);
      const color = baseColor.clone().lerp(lightColor, THREE.MathUtils.clamp(noise + variation + 0.25, 0, 1));
      
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 1,
      metalness: 0,
      flatShading: true
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(centerX, 0, centerZ);
    this.mesh.receiveShadow = true;
  }
  
  noise2D(x, y) {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }
}