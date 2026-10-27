import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165/build/three.module.js';

export class CameraController {
  constructor(camera, canvas) {
    this.camera = camera;
    this.canvas = canvas;
    
    this.target = new THREE.Vector3(0, 0, 0);
    this.distance = 30;
    this.azimuth = Math.PI / 4;
    this.polar = Math.PI / 3;
    
    this.minDistance = 10;
    this.maxDistance = 100;
    this.minPolar = 0.3;
    this.maxPolar = Math.PI / 2 - 0.1;
    
    this.isMouseDown = false;
    this.isRightMouseDown = false;
    this.lastMouse = new THREE.Vector2();
    
    this.followTarget = null;
    this.followHeight = 15;
    this.followDistance = 25;
    
    this.bindEvents();
  }
  
  bindEvents() {
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  
  onMouseDown(e) {
    if (e.button === 0) this.isMouseDown = true;
    if (e.button === 2) this.isRightMouseDown = true;
    this.lastMouse.set(e.clientX, e.clientY);
  }
  
  onMouseMove(e) {
    const dx = e.clientX - this.lastMouse.x;
    const dy = e.clientY - this.lastMouse.y;
    
    if (this.isRightMouseDown) {
      this.azimuth -= dx * 0.005;
      this.polar = THREE.MathUtils.clamp(this.polar - dy * 0.005, this.minPolar, this.maxPolar);
    } else if (this.isMouseDown) {
      this.pan(-dx * 0.5, -dy * 0.5);
    }
    
    this.lastMouse.set(e.clientX, e.clientY);
  }
  
  onMouseUp(e) {
    this.isMouseDown = false;
    this.isRightMouseDown = false;
  }
  
  onWheel(e) {
    e.preventDefault();
    this.distance = THREE.MathUtils.clamp(this.distance + e.deltaY * 0.05, this.minDistance, this.maxDistance);
  }
  
  pan(dx, dy) {
    const right = new THREE.Vector3();
    right.setFromSpherical(new THREE.Spherical(1, Math.PI / 2, this.azimuth + Math.PI / 2));
    right.y = 0;
    right.normalize();
    
    const forward = new THREE.Vector3();
    forward.setFromSpherical(new THREE.Spherical(1, Math.PI / 2, this.azimuth));
    forward.y = 0;
    forward.normalize();
    
    this.target.addScaledVector(right, dx * this.distance * 0.001);
    this.target.addScaledVector(forward, dy * this.distance * 0.001);
  }
  
  setFollowTarget(object) {
    this.followTarget = object;
  }
  
  clearFollowTarget() {
    this.followTarget = null;
  }
  
  update() {
    if (this.followTarget) {
      const targetPos = this.followTarget.position;
      const targetRot = this.followTarget.rotation.y || 0;
      
      this.target.lerp(targetPos, 0.1);
      
      const offset = new THREE.Vector3(
        -Math.sin(targetRot) * this.followDistance,
        this.followHeight,
        -Math.cos(targetRot) * this.followDistance
      );
      
      const desiredPos = targetPos.clone().add(offset);
      this.camera.position.lerp(desiredPos, 0.1);
      this.camera.lookAt(this.target);
    } else {
      const pos = new THREE.Vector3().setFromSpherical(
        new THREE.Spherical(this.distance, this.polar, this.azimuth)
      );
      this.camera.position.lerp(this.target.clone().add(pos), 0.1);
      this.camera.lookAt(this.target);
    }
  }
  
  getCamera() {
    return this.camera;
  }
}