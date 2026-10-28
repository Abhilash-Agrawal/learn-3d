import * as THREE from 'three';

export class PoliceCar {
  constructor(scene, city, id, position) {
    this.scene = scene;
    this.city = city;
    this.id = id;
    this.type = 'police';
    this.status = 'idle';
    this.speed = 12;
    this.assignedIncident = null;
    this.path = [];
    this.pathIndex = 0;
    this.shouldRemove = false;
    this.isPatrol = false;
    this.patrolRoute = [];
    this.currentPatrolIndex = 0;
    this.homePosition = position.clone();
    
    this.mesh = new THREE.Group();
    this.mesh.position.copy(position);
    this.mesh.userData = { selectable: true, entity: this, type: 'unit' };
    
    this.createVisuals();
  }
  
  createVisuals() {
    const bodyGeom = new THREE.BoxGeometry(2.2, 1.3, 4.5);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1F2937,
      roughness: 0.7,
      metalness: 0.2,
      flatShading: true
    });
    const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
    bodyMesh.position.y = 0.8;
    bodyMesh.castShadow = true;
    this.mesh.add(bodyMesh);
    
    const whiteGeom = new THREE.BoxGeometry(2.3, 0.8, 4.6);
    const whiteMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true
    });
    const whiteMesh = new THREE.Mesh(whiteGeom, whiteMat);
    whiteMesh.position.y = 1.6;
    this.mesh.add(whiteMesh);
    
    const roofGeom = new THREE.BoxGeometry(2, 0.6, 3);
    const roofMesh = new THREE.Mesh(roofGeom, bodyMat);
    roofMesh.position.y = 2.2;
    roofMesh.castShadow = true;
    this.mesh.add(roofMesh);
    
    const windowMat = new THREE.MeshStandardMaterial({
      color: 0x1E3A8A,
      roughness: 0.1,
      metalness: 0.9,
      flatShading: true
    });
    
    const windshieldGeom = new THREE.BoxGeometry(1.8, 1, 0.1);
    const windshield = new THREE.Mesh(windshieldGeom, windowMat);
    windshield.position.set(0, 1.8, 2.4);
    this.mesh.add(windshield);
    
    const rearWindowGeom = new THREE.BoxGeometry(1.8, 1, 0.1);
    const rearWindow = new THREE.Mesh(rearWindowGeom, windowMat);
    rearWindow.position.set(0, 1.8, -2.4);
    this.mesh.add(rearWindow);
    
    const lightBarGeom = new THREE.BoxGeometry(1.5, 0.5, 1);
    const lightBarMesh = new THREE.Mesh(lightBarGeom, new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.3,
      metalness: 0.7,
      flatShading: true
    }));
    lightBarMesh.position.set(0, 2.5, 0);
    lightBarMesh.castShadow = true;
    this.mesh.add(lightBarMesh);
    
    this.lightMeshes = [];
    const redLightGeom = new THREE.BoxGeometry(0.5, 0.4, 0.6);
    const blueLightGeom = new THREE.BoxGeometry(0.5, 0.4, 0.6);
    
    const redLightMesh = new THREE.Mesh(redLightGeom, new THREE.MeshBasicMaterial({
      color: 0xEF4444,
      emissive: 0xEF4444,
      emissiveIntensity: 1
    }));
    redLightMesh.position.set(-0.5, 0.3, 0);
    lightBarMesh.add(redLightMesh);
    this.lightMeshes.push({ mesh: redLightMesh, color: 'red' });
    
    const blueLightMesh = new THREE.Mesh(blueLightGeom, new THREE.MeshBasicMaterial({
      color: 0x3B82F6,
      emissive: 0x3B82F6,
      emissiveIntensity: 1
    }));
    blueLightMesh.position.set(0.5, 0.3, 0);
    lightBarMesh.add(blueLightMesh);
    this.lightMeshes.push({ mesh: blueLightMesh, color: 'blue' });
    
    this.createWheels();
    this.createLights();
  }
  
  createWheels() {
    const wheelGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 12);
    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.8,
      flatShading: true
    });
    
    const positions = [
      [-1.2, 0.5, 1.8], [1.2, 0.5, 1.8],
      [-1.2, 0.5, -1.8], [1.2, 0.5, -1.8]
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
      light.position.set(i === 0 ? -0.8 : 0.8, 0.9, 2.5);
      light.target.position.set(i === 0 ? -0.8 : 0.8, 0, 20);
      this.mesh.add(light);
      this.mesh.add(light.target);
      this.headlights.push(light);
    }
    
    this.emergencyLights = [];
    this.lightMeshes.forEach((lm, i) => {
      const light = new THREE.PointLight(lm.color === 'red' ? 0xEF4444 : 0x3B82F6, 1, 15);
      light.position.set(lm.mesh.position.x, 2.9, 0);
      this.mesh.add(light);
      this.emergencyLights.push({ light, mesh: lm.mesh, phase: i * Math.PI });
    });
  }
  
  assignIncident(incident) {
    this.assignedIncident = incident;
    this.status = 'dispatched';
    this.isPatrol = false;
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
    
    if (this.isPatrol && !this.assignedIncident && this.status === 'idle') {
      this.status = 'patrol';
    }
  }
  
  animateWheels(delta) {
    const rotationSpeed = this.getCurrentSpeed() * 3;
    this.wheels.forEach(wheel => {
      wheel.rotation.x += rotationSpeed * delta;
    });
  }
  
  animateLights(elapsed) {
    this.lightMeshes.forEach((lm, i) => {
      const ud = this.emergencyLights[i];
      const intensity = Math.sin(elapsed * 12 + ud.phase);
      lm.mesh.visible = intensity > 0;
      ud.light.intensity = Math.max(0, intensity);
    });
  }
  
  updateMovement(delta, incidentManager) {
    if (this.path.length === 0) {
      if (this.isPatrol && this.patrolRoute.length > 0) {
        this.path = this.city.findPath(this.getPosition(), this.patrolRoute[this.currentPatrolIndex]);
        this.pathIndex = 0;
      }
      return;
    }
    
    const target = this.path[this.pathIndex];
    if (!target) return;
    
    const currentPos = this.getPosition();
    const toTarget = new THREE.Vector3().subVectors(target, currentPos);
    toTarget.y = 0;
    const distance = toTarget.length();
    
    if (distance < 3) {
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
    if (this.status === 'patrol') return this.speed * 0.4;
    return this.speed * 0.3;
  }
  
  checkCollision(newPos) {
    const bounds = this.city.getCityBounds();
    if (newPos.x < bounds.min.x + 10 || newPos.x > bounds.max.x - 10 ||
        newPos.z < bounds.min.z + 10 || newPos.z > bounds.max.z - 10) {
      return true;
    }
    return false;
  }
  
  handleCollision(direction) {
    const right = new THREE.Vector3(-direction.z, 0, direction.x);
    const testPos = this.getPosition().clone().addScaledVector(right, 4);
    
    if (!this.checkCollision(testPos)) {
      this.mesh.position.copy(testPos);
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
    return 0.8;
  }
}