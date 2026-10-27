import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165/build/three.module.js';

export class WeatherSystem {
  constructor(scene, lighting) {
    this.scene = scene;
    this.lighting = lighting;
    this.currentWeather = 'clear';
    this.rainParticles = null;
    this.fogParticles = null;
    this.waterLevel = 0;
    this.targetWaterLevel = 0;
    this.puddles = [];
    
    this.initRain();
    this.initFog();
  }
  
  initRain() {
    const count = 800;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 800;
      positions[i * 3 + 1] = Math.random() * 200 + 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 800;
      
      velocities[i * 3] = (Math.random() - 0.5) * 2;
      velocities[i * 3 + 1] = -20 - Math.random() * 10;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 2;
      
      sizes[i] = 0.1 + Math.random() * 0.2;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const material = new THREE.PointsMaterial({
      color: 0x88CCFF,
      size: 0.3,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      sizeAttenuation: true
    });
    
    this.rainParticles = new THREE.Points(geometry, material);
    this.rainParticles.visible = false;
    this.scene.add(this.rainParticles);
  }
  
  initFog() {
    const count = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const phases = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 800;
      positions[i * 3 + 1] = Math.random() * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 800;
      
      scales[i] = 20 + Math.random() * 30;
      phases[i] = Math.random() * Math.PI * 2;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));
    geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
    
    const material = new THREE.PointsMaterial({
      color: 0xFFFFFF,
      size: 1,
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
      sizeAttenuation: false
    });
    
    this.fogParticles = new THREE.Points(geometry, material);
    this.fogParticles.visible = false;
    this.scene.add(this.fogParticles);
  }
  
  setWeather(weather) {
    this.currentWeather = weather;
    
    this.rainParticles.visible = weather === 'monsoon';
    this.fogParticles.visible = weather === 'fog';
    
    this.targetWaterLevel = weather === 'monsoon' ? 3 : 0;
    
    switch (weather) {
      case 'clear':
        this.scene.fog.density = 0.0015;
        this.lighting.sunLight.intensity = this.lighting.isDay ? 2.5 : 0;
        break;
      case 'monsoon':
        this.scene.fog.density = 0.004;
        this.scene.fog.color.setHSL(0.55, 0.3, 0.15);
        if (this.lighting.isDay) this.lighting.sunLight.intensity = 0.8;
        break;
      case 'fog':
        this.scene.fog.density = 0.008;
        this.scene.fog.color.setHSL(0, 0, 0.4);
        if (this.lighting.isDay) this.lighting.sunLight.intensity = 1.2;
        break;
      case 'heatwave':
        this.scene.fog.density = 0.002;
        this.scene.fog.color.setHSL(0.1, 0.2, 0.2);
        if (this.lighting.isDay) this.lighting.sunLight.intensity = 3;
        break;
    }
  }
  
  update(delta, elapsed) {
    if (this.currentWeather === 'monsoon') {
      this.updateRain(delta);
      this.updateWaterLevel(delta);
    }
    
    if (this.currentWeather === 'fog') {
      this.updateFog(delta, elapsed);
    }
    
    if (this.currentWeather === 'heatwave') {
      this.updateHeatHaze(elapsed);
    }
  }
  
  updateRain(delta) {
    const positions = this.rainParticles.geometry.attributes.position.array;
    const velocities = this.rainParticles.geometry.attributes.velocity.array;
    
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] += velocities[i] * delta;
      positions[i + 1] += velocities[i + 1] * delta;
      positions[i + 2] += velocities[i + 2] * delta;
      
      if (positions[i + 1] < 0.5) {
        positions[i] = (Math.random() - 0.5) * 800;
        positions[i + 1] = 200 + Math.random() * 50;
        positions[i + 2] = (Math.random() - 0.5) * 800;
        
        this.createSplash(positions[i], positions[i + 2]);
      }
    }
    
    this.rainParticles.geometry.attributes.position.needsUpdate = true;
  }
  
  createSplash(x, z) {
  }
  
  updateWaterLevel(delta) {
    this.waterLevel += (this.targetWaterLevel - this.waterLevel) * delta * 0.5;
    
    this.scene.traverse(obj => {
      if (obj.userData.isRiver) {
        obj.position.y = this.waterLevel;
      }
      if (obj.userData.isLowRoad && this.waterLevel > 0) {
        obj.material.opacity = 0.5;
        obj.material.color.setHSL(0.55, 0.5, 0.2);
      }
    });
  }
  
  updateFog(delta, elapsed) {
    const positions = this.fogParticles.geometry.attributes.position.array;
    const phases = this.fogParticles.geometry.attributes.phase.array;
    
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] += Math.sin(elapsed + phases[i]) * 0.5 * delta;
      positions[i + 2] += Math.cos(elapsed + phases[i]) * 0.5 * delta;
      
      if (positions[i] > 400) positions[i] = -400;
      if (positions[i] < -400) positions[i] = 400;
      if (positions[i + 2] > 400) positions[i + 2] = -400;
      if (positions[i + 2] < -400) positions[i + 2] = 400;
    }
    
    this.fogParticles.geometry.attributes.position.needsUpdate = true;
    
    this.fogParticles.material.opacity = 0.1 + Math.sin(elapsed * 0.2) * 0.05;
  }
  
  updateHeatHaze(elapsed) {
  }
}