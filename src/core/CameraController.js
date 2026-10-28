import * as THREE from 'three';

export class CameraController {
  constructor(camera, canvas) {
    this.camera = camera;
    this.canvas = canvas;
    
    this.target = new THREE.Vector3(0, 0, 0);
    const spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(this.target));
    this.distance = spherical.radius;
    this.azimuth = spherical.theta;
    this.polar = spherical.phi;
    
    this.minDistance = 10;
    this.maxDistance = 1000;
    this.minPolar = 0.05;
    this.maxPolar = Math.PI - 0.05;
    
    this.isMouseDown = false;
    this.isRightMouseDown = false;
    this.lastMouse = new THREE.Vector2();
    
    this.followTarget = null;
    this.followHeight = 15;
    this.followDistance = 25;
    
    this.bindEvents();
  }
  
  bindEvents() {
    this.canvas.style.touchAction = 'none';
    this.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    this.canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));
    this.canvas.addEventListener('pointerup', (e) => this.onPointerUp(e));
    this.canvas.addEventListener('pointercancel', (e) => this.onPointerUp(e));
    this.canvas.addEventListener('lostpointercapture', () => this.onPointerUp());
    this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  
  onPointerDown(e) {
    if (e.button !== 0 && e.button !== 2) return;
    this.isMouseDown = true;
    this.isRightMouseDown = e.button === 2;
    this.canvas.setPointerCapture(e.pointerId);
    this.lastMouse.set(e.clientX, e.clientY);
  }
  
  onPointerMove(e) {
    if (!this.isMouseDown && !this.isRightMouseDown) return;
    const dx = e.clientX - this.lastMouse.x;
    const dy = e.clientY - this.lastMouse.y;
    
    this.azimuth -= dx * 0.01;
    this.polar = THREE.MathUtils.clamp(this.polar - dy * 0.01, this.minPolar, this.maxPolar);
    
    this.lastMouse.set(e.clientX, e.clientY);
  }
  
  onPointerUp(e) {
    this.isMouseDown = false;
    this.isRightMouseDown = false;
    if (e?.pointerId !== undefined && this.canvas.hasPointerCapture(e.pointerId)) {
      this.canvas.releasePointerCapture(e.pointerId);
    }
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