import * as THREE from 'three';

export class FireTruck {
  constructor(scene, city, id, position) {
    this.scene = scene;
    this.city = city;
    this.id = id;
    this.type = 'fire';
    this.status = 'idle';
    this.speed = 8;
    this.assignedIncident = null;
    this.path = [];
    this.pathIndex = 0;
    this.shouldRemove = false;
    this.lightTimer = 0;
    
    this.mesh = new THREE.Group();
    this.mesh.position.copy(position);
    this.mesh.userData = { selectable: true, entity: this, type: 'unit' };
    
    this.createVisuals();
  }
  
  createVisuals() {
    const bodyGeom = new THREE.BoxGeometry(3, 2.5, 8);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xEF4444,
      roughness: 0.7,
      metalness: 0.2,
      flatShading: true
    });
    const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
    bodyMesh.position.y = 1.8;
    bodyMesh.castShadow = true;
    this.mesh.add(bodyMesh);
    
    const cabGeom = new THREE.BoxGeometry(2.8, 2.2, 3.5);
    const cabMesh = new THREE.Mesh(cabGeom, bodyMat);
    cabMesh.position.set(0, 3.3, 3.5);
    cabMesh.castShadow = true;
    this.mesh.add(cabMesh);
    
    const windowMat = new THREE.MeshStandardMaterial({
      color: 0x1E3A8A,
      roughness: 0.1,
      metalness: 0.9,
      flatShading: true
    });
    
    const windshieldGeom = new THREE.BoxGeometry(2.5, 1.5, 0.1);
    const windshield = new THREE.Mesh(windshieldGeom, windowMat);
    windshield.position.set(0, 3.5, 5.2);
    this.mesh.add(windshield);
    
    const sideWindowGeom = new THREE.BoxGeometry(0.1, 1.2, 1.5);
    const leftWindow = new THREE.Mesh(sideWindowGeom, windowMat);
    leftWindow.position.set(-1.45, 3.3, 3.5);
    this.mesh.add(leftWindow);
    
    const rightWindow = leftWindow.clone();
    rightWindow.position.x = 1.45;
    this.mesh.add(rightWindow);
    
    const lightBarGeom = new THREE.BoxGeometry(2.5, 0.8, 1.5);
    const lightBarMesh = new THREE.Mesh(lightBarGeom, new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.3,
      metalness: 0.7,
      flatShading: true
    }));
    lightBarMesh.position.set(0, 4.5, 0);
    lightBarMesh.castShadow = true;
    this.mesh.add(lightBarMesh);
    
    this.lightMeshes = [];
    for (let i = 0; i < 4; i++) {
      const lightGeom = new THREE.BoxGeometry(0.5, 0.5, 0.8);
      const lightMat = new THREE.MeshBasicMaterial({
        color: 0xEF4444,
        emissive: 0xEF4444,
        emissiveIntensity: 1
      });
      const lightMesh = new THREE.Mesh(lightGeom, lightMat);
      lightMesh.position.set(-1 + i * 0.65, 0.5, 0.5);
      lightBarMesh.add(lightMesh);
      this.lightMeshes.push(lightMesh);
    }
    
    const ladderGeom = new THREE.BoxGeometry(1.5, 0.3, 6);
    const ladderMesh = new THREE.Mesh(ladderGeom, new THREE.MeshStandardMaterial({
      color: 0x6B7280,
      roughness: 0.5,
      metalness: 0.5,
      flatShading: true
    }));
    ladderMesh.position.set(0, 4.5, -2);
    this.mesh.add(ladderMesh);
    
    const hoseGeom = new THREE.CylinderGeometry(0.3, 0.3, 1, 8);
    const hoseMesh = new THREE.Mesh(hoseGeom, new THREE.MeshStandardMaterial({
      color: 0x1F2937,
      roughness: 0.9,
      flatShading: true
    }));
    hoseMesh.rotation.z = Math.PI / 2;
    hoseMesh.position.set(1.8, 1.5, -3);
    this.mesh.add(hoseMesh);
    
    this.createWheels();
    this.createLights();
  }
  
  createWheels() {
    const wheelGeom = new THREE.CylinderGeometry(0.8, 0.8, 0.6, 12);
    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.8,
      flatShading: true
    });
    
    const positions = [
      [-1.5, 0.8, 3], [1.5, 0.8, 3],
      [-1.5, 0.8, -3], [1.5, 0.8, -3]
    ];
    
    this.wheels = [];
    positions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeom, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(...pos);
      wheel.castShadow = true;
      this.mesh.add(wheel);
      this.wheels.push(wheel);
    });
  }
  
  createLights() {
    this.headlights = [];
    for (let i = 0; i < 2; i++) {
      const light = new THREE.SpotLight(0xFFF8E7, 2, 40, Math.PI / 6, 0.5);
      light.position.set(i === 0 ? -1 : 1, 1.5, 5.5);
      light.target.position.set(i === 0 ? -1 : 1, 0, 20);
      this.mesh.add(light);
      this.mesh.add(light.target);
      this.headlights.push(light);
    }
    
    this.emergencyLights = [];
    this.lightMeshes.forEach((mesh, i) => {
      const light = new THREE.PointLight(0xEF4444, 1, 15);
      light.position.copy(mesh.position);
      light.position.y += 4.5;
      this.mesh.add(light);
      this.emergencyLights.push({ light, mesh, phase: i * Math.PI / 2 });
    });
  }
  
  assignIncident(incident) {
    this.assignedIncident = incident;
    this.status = 'dispatched';
    this.path = this.city.findPath(this.getPosition(), incident.getPosition());
    this.pathIndex = 0;
  }
  
  returnToStation() {
    if (this.station) {
      this.assignedIncident = null;
      this.status = 'returning';
      this.path = this.city.findPath(this.getPosition(), this.homePosition);
      this.pathIndex = 0;
    }
  }
  
  update(delta, elapsed, incidentManager, city, pathfinder) {
    this.animateWheels(delta);
    this.animateLights(elapsed);
    this.updateMovement(delta, incidentManager);
  }
  
  animateWheels(delta) {
    const rotationSpeed = this.getCurrentSpeed() * 2;
    this.wheels.forEach(wheel => {
      wheel.rotation.x += rotationSpeed * delta;
    });
  }
  
  animateLights(elapsed) {
    this.lightMeshes.forEach((mesh, i) => {
      const ud = this.emergencyLights[i];
      const intensity = Math.sin(elapsed * 10 + ud.phase);
      mesh.visible = intensity > 0;
      ud.light.intensity = Math.max(0, intensity);
    });
  }
  
  updateMovement(delta, incidentManager) {
    if (this.path.length === 0) return;
    
    const target = this.path[this.pathIndex];
    if (!target) return;
    
    const currentPos = this.getPosition();
    const toTarget = new THREE.Vector3().subVectors(target, currentPos);
    toTarget.y = 0;
    const distance = toTarget.length();
    
    if (distance < 2) {
      this.pathIndex++;
      if (this.pathIndex >= this.path.length) {
        this.onPathComplete(incidentManager);
        return;
      }
    }
    
    if (distance > 0) {
      const direction = toTarget.normalize();
      const moveSpeed = this.getCurrentSpeed();
      
      const newPos = currentPos.clone().addScaledVector(direction, moveSpeed * delta);
      
      if (this.checkCollision(newPos)) {
        this.handleCollision(direction);
      } else {
        this.mesh.position.copy(newPos);
      }
      
      const targetRotation = Math.atan2(direction.x, direction.z);
      this.mesh.rotation.y = THREE.MathUtils.lerp(
        this.mesh.rotation.y,
        targetRotation,
        delta * 5
      );
    }
  }
  
  getCurrentSpeed() {
    if (this.status === 'enroute' || this.status === 'dispatched') return this.speed;
    if (this.status === 'patrol') return this.speed * 0.5;
    return this.speed * 0.3;
  }
  
  checkCollision(newPos) {
    const bounds = this.city.getCityBounds();
    if (newPos.x < bounds.min.x + 10 || newPos.x > bounds.max.x - 10 ||
        newPos.z < bounds.min.z + 10 || newPos.z > bounds.max.z - 10) {
      return true;
    }
    
    for (const unit of this.city.getUnits ? this.city.getUnits() : []) {
      if (unit !== this && unit.mesh) {
        const dist = newPos.distanceTo(unit.getPosition());
        if (dist < 6) return true;
      }
    }
    
    return false;
  }
  
  handleCollision(direction) {
    const right = new THREE.Vector3(-direction.z, 0, direction.x);
    const testPos = this.getPosition().clone().addScaledVector(right, 4);
    
    if (!this.checkCollision(testPos)) {
      this.mesh.position.copy(testPos);
    } else {
      const testPos2 = this.getPosition().clone().addScaledVector(right, -4);
      if (!this.checkCollision(testPos2)) {
        this.mesh.position.copy(testPos2);
      }
    }
  }
  
  onPathComplete(incidentManager) {
    if (this.assignedIncident) {
      if (this.status === 'dispatched' || this.status === 'enroute') {
        this.status = 'onscene';
        this.assignedIncident.status = 'onscene';
      } else if (this.status === 'returning') {
        this.status = 'idle';
        this.path = [];
      }
    } else if (this.isPatrol) {
      this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolRoute.length;
      this.path = this.city.findPath(this.getPosition(), this.patrolRoute[this.currentPatrolIndex]);
      this.pathIndex = 0;
    }
  }
  
  getPosition() {
    return this.mesh.position.clone();
  }
  
  getRingScale() {
    return 1;
  }
}