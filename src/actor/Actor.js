import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165/build/three.module.js';

export class Actor {
  constructor(scene, city) {
    this.scene = scene;
    this.city = city;
    
    this.mesh = new THREE.Group();
    this.bodyGroup = new THREE.Group();
    this.position = new THREE.Vector3(0, 0, 0);
    this.rotation = 0;
    this.speed = 10;
    
    this.keys = { forward: false, backward: false, left: false, right: false };
    
    this.createVisuals();
    this.bindKeys();
  }
  
  createVisuals() {
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6, roughness: 0.7, metalness: 0.2, flatShading: true
    });
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xffdbac, roughness: 0.8, metalness: 0.1, flatShading: true
    });
    const hatMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a, roughness: 0.5, metalness: 0.3, flatShading: true
    });
    const shoeMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e, roughness: 0.8, metalness: 0.2, flatShading: true
    });
    
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.8, 2.5, 8, 16), bodyMat);
    torso.position.y = 4.5;
    torso.castShadow = true;
    this.bodyGroup.add(torso);
    
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.85, 16, 16), skinMat);
    head.position.y = 7.2;
    head.castShadow = true;
    this.bodyGroup.add(head);
    
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.5, 24), hatMat);
    hat.position.y = 7.7;
    this.bodyGroup.add(hat);
    
    this.legs = [];
    for (let i = -1; i <= 1; i += 2) {
      const leg = new THREE.Group();
      leg.position.set(i * 0.35, 3.2, 0);
      
      const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 1.2, 6, 12), bodyMat);
      thigh.position.y = -0.6;
      thigh.castShadow = true;
      leg.add(thigh);
      
      const calf = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 1.3, 6, 12), bodyMat);
      calf.position.y = -2.0;
      calf.castShadow = true;
      leg.add(calf);
      
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.35, 0.9), shoeMat);
      shoe.position.set(0, -2.85, 0.15);
      shoe.castShadow = true;
      leg.add(shoe);
      
      leg.userData = { thigh, calf, side: i };
      this.bodyGroup.add(leg);
      this.legs.push(leg);
    }
    
    this.arms = [];
    for (let i = -1; i <= 1; i += 2) {
      const arm = new THREE.Group();
      arm.position.set(i * 1.0, 5.3, 0);
      
      const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 1.0, 6, 12), bodyMat);
      upper.position.y = -0.5;
      upper.castShadow = true;
      arm.add(upper);
      
      const lower = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.9, 6, 12), skinMat);
      lower.position.y = -1.45;
      lower.castShadow = true;
      arm.add(lower);
      
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), skinMat);
      hand.position.y = -2.0;
      hand.scale.set(1, 0.7, 1);
      hand.castShadow = true;
      arm.add(hand);
      
      arm.userData = { upper, lower, hand, side: i };
      this.bodyGroup.add(arm);
      this.arms.push(arm);
    }
    
    const indicator = new THREE.Mesh(
      new THREE.ConeGeometry(0.6, 1.5, 8),
      new THREE.MeshBasicMaterial({ color: 0xfbbf24, emissive: 0xf59e0b, emissiveIntensity: 0.8, transparent: true, opacity: 0.9 })
    );
    indicator.position.y = 8.5;
    indicator.rotation.x = -Math.PI / 2;
    this.directionIndicator = indicator;
    this.bodyGroup.add(indicator);
    
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(2, 2.5, 32),
      new THREE.MeshBasicMaterial({ color: 0x3b82f6, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.1;
    this.groundRing = ring;
    this.bodyGroup.add(ring);
    
    this.mesh.add(this.bodyGroup);
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);
    
    this.walkCycle = 0;
  }
  
  bindKeys() {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
  }
  
  onKeyDown(e) {
    switch (e.code) {
      case 'ArrowUp': case 'KeyW': this.keys.forward = true; break;
      case 'ArrowDown': case 'KeyS': this.keys.backward = true; break;
      case 'ArrowLeft': case 'KeyA': this.keys.left = true; break;
      case 'ArrowRight': case 'KeyD': this.keys.right = true; break;
    }
  }
  
  onKeyUp(e) {
    switch (e.code) {
      case 'ArrowUp': case 'KeyW': this.keys.forward = false; break;
      case 'ArrowDown': case 'KeyS': this.keys.backward = false; break;
      case 'ArrowLeft': case 'KeyA': this.keys.left = false; break;
      case 'ArrowRight': case 'KeyD': this.keys.right = false; break;
    }
  }
  
  update(delta) {
    const dir = new THREE.Vector3();
    if (this.keys.forward) dir.z = -1;
    if (this.keys.backward) dir.z = 1;
    if (this.keys.left) dir.x = -1;
    if (this.keys.right) dir.x = 1;
    
    const isMoving = dir.length() > 0;
    
    if (isMoving) {
      dir.normalize();
      this.rotation = Math.atan2(dir.x, dir.z);
      this.position.addScaledVector(dir, this.speed * delta);
      this.walkCycle += delta * 12;
    } else {
      this.walkCycle = 0;
    }
    
    this.clampToBounds();
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotation;
    this.animateLimbs(isMoving);
  }
  
  clampToBounds() {
    const bounds = this.city.getCityBounds();
    const margin = 50;
    this.position.x = THREE.MathUtils.clamp(this.position.x, bounds.min.x + margin, bounds.max.x - margin);
    this.position.z = THREE.MathUtils.clamp(this.position.z, bounds.min.z + margin, bounds.max.z - margin);
  }
  
  animateLimbs(isMoving) {
    if (!this.legs || !this.arms) return;
    
    const phase = this.walkCycle;
    
    this.legs.forEach((leg, i) => {
      const ud = leg.userData;
      const legPhase = phase + (ud.side === 1 ? Math.PI : 0);
      if (isMoving) {
        ud.thigh.rotation.x = Math.sin(legPhase) * 0.7;
        ud.calf.rotation.x = Math.max(0, Math.sin(legPhase + 0.5) * 0.8);
      } else {
        ud.thigh.rotation.x *= 0.9;
        ud.calf.rotation.x *= 0.9;
      }
    });
    
    this.arms.forEach((arm, i) => {
      const ud = arm.userData;
      const armPhase = phase + (ud.side === 1 ? Math.PI : 0);
      if (isMoving) {
        ud.upper.rotation.x = -Math.sin(armPhase) * 0.6;
        ud.lower.rotation.x = Math.sin(armPhase) * 0.3;
      } else {
        ud.upper.rotation.x *= 0.9;
        ud.lower.rotation.x *= 0.9;
      }
    });
    
    if (this.bodyGroup) {
      if (isMoving) {
        this.bodyGroup.position.y = Math.sin(phase * 2) * 0.08;
        this.bodyGroup.rotation.z = Math.sin(phase) * 0.03;
      } else {
        this.bodyGroup.position.y *= 0.9;
        this.bodyGroup.rotation.z *= 0.9;
      }
    }
    
    if (this.groundRing) {
      this.groundRing.rotation.z += 0.1;
      this.groundRing.material.opacity = 0.4 + Math.sin(this.walkCycle * 2) * 0.2;
    }
    
    if (this.directionIndicator) {
      this.directionIndicator.rotation.z = -this.rotation;
    }
  }
  
  getPosition() { return this.position.clone(); }
  getMesh() { return this.mesh; }
}