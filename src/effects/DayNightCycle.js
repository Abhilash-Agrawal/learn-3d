import * as THREE from 'three';

export class DayNightCycle {
  constructor(scene, lighting) {
    this.scene = scene;
    this.lighting = lighting;
    this.timeOfDay = 0.5;
    this.cycleSpeed = 1 / (20 * 60);
    this.isAuto = true;
    this.stars = null;
    this.cityLights = [];
    
    this.initStars();
  }
  
  initStars() {
    const count = 400;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const brightness = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 500;
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      
      sizes[i] = 0.5 + Math.random() * 1.5;
      brightness[i] = 0.3 + Math.random() * 0.7;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('brightness', new THREE.BufferAttribute(brightness, 1));
    
    const material = new THREE.PointsMaterial({
      color: 0xFFFFFF,
      size: 1,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      sizeAttenuation: false,
      vertexColors: false
    });
    
    this.stars = new THREE.Points(geometry, material);
    this.scene.add(this.stars);
  }
  
  toggle() {
    this.isAuto = !this.isAuto;
    if (!this.isAuto) {
      this.timeOfDay = this.lighting.isDay ? 0.85 : 0.35;
      this.lighting.setTimeOfDay(this.timeOfDay);
    }
  }
  
  update(delta, elapsed) {
    if (this.isAuto) {
      this.timeOfDay += this.cycleSpeed * delta;
      if (this.timeOfDay > 1) this.timeOfDay = 0;
      this.lighting.setTimeOfDay(this.timeOfDay);
    }
    
    this.updateStars();
    this.updateCityLights();
  }
  
  updateStars() {
    const isNight = !this.lighting.isDay;
    const targetOpacity = isNight ? 0.8 : 0;
    this.stars.material.opacity += (targetOpacity - this.stars.material.opacity) * 0.02;
    
    if (isNight) {
      this.stars.rotation.y += 0.00001;
    }
  }
  
  updateCityLights() {
    const isNight = !this.lighting.isDay;
    const targetIntensity = isNight ? 1 : 0;
    
    this.scene.traverse(obj => {
      if (obj.userData.isCityLight && obj.userData.light) {
        obj.userData.light.intensity += (targetIntensity - obj.userData.light.intensity) * 0.05;
      }
      if (obj.userData.isWindow && obj.material && obj.material.emissive) {
        const targetEmissive = isNight ? 0.8 : 0.3;
        obj.material.emissiveIntensity += (targetEmissive - obj.material.emissiveIntensity) * 0.05;
      }
    });
  }
  
  setTime(time) {
    this.timeOfDay = time;
    this.lighting.setTimeOfDay(time);
  }
  
  getTimeOfDay() {
    return this.timeOfDay;
  }
  
  isDaytime() {
    return this.lighting.isDay;
  }
}