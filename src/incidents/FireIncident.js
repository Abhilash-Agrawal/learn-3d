import * as THREE from 'three';

export class FireIncident {
  constructor(scene, city, id, position) {
    this.scene = scene;
    this.city = city;
    this.id = id;
    this.type = 'fire';
    this.status = 'reported';
    this.severity = Math.random() < 0.3 ? 'major' : 'minor';
    this.progress = 0;
    this.closeTimer = 0;
    
    this.mesh = new THREE.Group();
    this.mesh.position.copy(position);
    this.mesh.position.y = 0;
    this.mesh.userData = { selectable: true, entity: this, type: 'incident' };
    
    this.building = null;
    this.smokeParticles = [];
    this.fireParticles = [];
    this.light = null;
    
    this.createVisuals();
    this.findNearestBuilding();
  }
  
  createVisuals() {
    const baseGeom = new THREE.CylinderGeometry(6, 8, 0.5, 8);
    const baseMesh = new THREE.Mesh(baseGeom, new THREE.MeshStandardMaterial({
      color: 0x1F2937,
      roughness: 0.9,
      flatShading: true
    }));
    baseMesh.position.y = 0.25;
    this.mesh.add(baseMesh);
    
    const smokeCount = this.severity === 'major' ? 15 : 8;
    for (let i = 0; i < smokeCount; i++) {
      this.createSmokeParticle(i);
    }
    
    const fireCount = this.severity === 'major' ? 10 : 5;
    for (let i = 0; i < fireCount; i++) {
      this.createFireParticle(i);
    }
    
    this.light = new THREE.PointLight(0xEF4444, this.severity === 'major' ? 3 : 1.5, 30);
    this.light.position.set(0, 5, 0);
    this.light.castShadow = false;
    this.mesh.add(this.light);
    
    this.pulseLight();
  }
  
  createSmokeParticle(index) {
    const size = 2 + Math.random() * 3;
    const geom = new THREE.SphereGeometry(size, 8, 6);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x1F2937,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
      flatShading: true
    });
    const particle = new THREE.Mesh(geom, mat);
    
    particle.userData = {
      offset: new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 8,
        (Math.random() - 0.5) * 4
      ),
      speed: 0.5 + Math.random() * 1,
      drift: (Math.random() - 0.5) * 0.3,
      size: size,
      baseOpacity: 0.3 + Math.random() * 0.3
    };
    
    particle.position.copy(particle.userData.offset);
    this.mesh.add(particle);
    this.smokeParticles.push(particle);
  }
  
  createFireParticle(index) {
    const size = 0.5 + Math.random() * 1;
    const geom = new THREE.SphereGeometry(size, 6, 6);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xFF6B00,
      transparent: true,
      opacity: 0.8,
      depthWrite: false
    });
    const particle = new THREE.Mesh(geom, mat);
    
    particle.userData = {
      offset: new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        Math.random() * 4,
        (Math.random() - 0.5) * 6
      ),
      flickerSpeed: 5 + Math.random() * 10,
      phase: Math.random() * Math.PI * 2,
      baseSize: size
    };
    
    particle.position.copy(particle.userData.offset);
    this.mesh.add(particle);
    this.fireParticles.push(particle);
  }
  
  pulseLight() {
    const pulse = () => {
      if (this.light && this.status !== 'closed') {
        this.light.intensity = (this.severity === 'major' ? 3 : 1.5) * (0.7 + Math.random() * 0.6);
        setTimeout(pulse, 100 + Math.random() * 200);
      }
    };
    pulse();
  }
  
  findNearestBuilding() {
    let nearest = null;
    let minDist = Infinity;
    
    this.city.getBuildings().forEach(building => {
      const dist = this.mesh.position.distanceTo(building.getPosition());
      if (dist < minDist) {
        minDist = dist;
        nearest = building;
      }
    });
    
    this.building = nearest;
  }
  
  update(delta, elapsed, unitManager) {
    if (this.status === 'reported' || this.status === 'dispatched') {
      this.animateParticles(delta, elapsed);
    } else if (this.status === 'onscene' || this.status === 'contained') {
      this.progress += delta * (this.severity === 'major' ? 0.02 : 0.05);
      this.animateParticles(delta, elapsed, this.progress);
      
      if (this.progress >= 1) {
        this.status = 'contained';
        setTimeout(() => {
          this.status = 'closed';
        }, 3000);
      }
    } else if (this.status === 'closed') {
      this.closeTimer += delta;
      this.animateParticles(delta, elapsed, 1);
    }
    
    this.mesh.rotation.y += delta * 0.1;
  }
  
  animateParticles(delta, elapsed, progress = 0) {
    const intensity = 1 - progress;
    
    this.smokeParticles.forEach(particle => {
      const ud = particle.userData;
      particle.position.y += ud.speed * delta * intensity;
      particle.position.x += ud.drift * delta;
      
      if (particle.position.y > ud.offset.y + 15) {
        particle.position.copy(ud.offset);
        particle.position.y = ud.offset.y;
      }
      
      particle.material.opacity = ud.baseOpacity * intensity * (0.5 + Math.sin(elapsed * 2 + ud.offset.x) * 0.3);
      particle.scale.setScalar(1 + particle.position.y * 0.05);
    });
    
    this.fireParticles.forEach(particle => {
      const ud = particle.userData;
      const flicker = Math.sin(elapsed * ud.flickerSpeed + ud.phase);
      particle.scale.setScalar(ud.baseSize * (0.7 + flicker * 0.3) * intensity);
      particle.material.opacity = 0.8 * intensity * (0.6 + flicker * 0.4);
      particle.position.y = ud.offset.y + Math.sin(elapsed * 3 + ud.phase) * 0.5 * intensity;
    });
    
    if (this.light) {
      this.light.intensity *= intensity;
      if (intensity < 0.1) this.light.intensity = 0;
    }
  }
  
  getPosition() {
    return this.mesh.position.clone();
  }
  
  getRingScale() {
    return this.severity === 'major' ? 1.5 : 1;
  }
}