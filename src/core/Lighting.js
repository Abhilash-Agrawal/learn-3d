import * as THREE from 'three';

export class Lighting {
  constructor(scene) {
    this.scene = scene;
    this.timeOfDay = 0.5;
    this.isDay = true;
    
    this.ambientLight = null;
    this.sunLight = null;
    this.moonLight = null;
    this.hemisphereLight = null;
    this.fogColor = new THREE.Color(0x111827);
    
    this.init();
  }
  
  init() {
    this.hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x1a1a2e, 0.6);
    this.scene.add(this.hemisphereLight);
    
    this.sunLight = new THREE.DirectionalLight(0xFFF8E7, 2.5);
    this.sunLight.position.set(100, 200, 100);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 500;
    this.sunLight.shadow.camera.left = -250;
    this.sunLight.shadow.camera.right = 250;
    this.sunLight.shadow.camera.top = 250;
    this.sunLight.shadow.camera.bottom = -250;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);
    
    this.moonLight = new THREE.DirectionalLight(0x88aaff, 0.3);
    this.moonLight.position.set(-100, 200, -100);
    this.moonLight.castShadow = true;
    this.moonLight.shadow.mapSize.width = 512;
    this.moonLight.shadow.mapSize.height = 1024;
    this.moonLight.shadow.camera.near = 10;
    this.moonLight.shadow.camera.far = 500;
    this.moonLight.shadow.camera.left = -250;
    this.moonLight.shadow.camera.right = 250;
    this.moonLight.shadow.camera.top = 250;
    this.moonLight.shadow.camera.bottom = -250;
    this.moonLight.intensity = 0;
    this.scene.add(this.moonLight);
    
    this.ambientLight = new THREE.AmbientLight(0x404060, 0.4);
    this.scene.add(this.ambientLight);
    
    this.updateLighting();
  }
  
  setTimeOfDay(time) {
    this.timeOfDay = THREE.MathUtils.clamp(time, 0, 1);
    this.isDay = this.timeOfDay > 0.25 && this.timeOfDay < 0.75;
    this.updateLighting();
  }
  
  toggleDayNight() {
    this.timeOfDay = this.isDay ? 0.85 : 0.35;
    this.isDay = !this.isDay;
    this.updateLighting();
  }
  
  updateLighting() {
    const dayProgress = this.timeOfDay;
    const sunAngle = (dayProgress - 0.25) * Math.PI * 2;
    const moonAngle = sunAngle + Math.PI;
    
    const sunHeight = Math.sin(sunAngle);
    const moonHeight = Math.sin(moonAngle);
    
    this.sunLight.position.set(
      Math.cos(sunAngle) * 300,
      Math.max(sunHeight * 300, -50),
      Math.sin(sunAngle) * 300
    );
    
    this.moonLight.position.set(
      Math.cos(moonAngle) * 300,
      Math.max(moonHeight * 300, -50),
      Math.sin(moonAngle) * 300
    );
    
    if (this.isDay) {
      const intensity = THREE.MathUtils.clamp(sunHeight * 2.5, 0, 2.5);
      this.sunLight.intensity = intensity;
      this.sunLight.color.setHSL(0.1, 0.8, 0.5 + sunHeight * 0.3);
      
      this.moonLight.intensity = 0;
      this.hemisphereLight.intensity = 0.6 + sunHeight * 0.4;
      this.hemisphereLight.color.setHSL(0.55, 0.6, 0.6);
      this.hemisphereLight.groundColor.setHSL(0.6, 0.3, 0.15);
      this.ambientLight.intensity = 0.3 + sunHeight * 0.3;
      this.ambientLight.color.setHSL(0.1, 0.3, 0.4);
      
      this.fogColor.setHSL(0.55, 0.15, 0.12);
    } else {
      this.sunLight.intensity = 0;
      
      const intensity = THREE.MathUtils.clamp(-moonHeight * 0.5, 0, 0.5);
      this.moonLight.intensity = intensity;
      this.moonLight.color.setHSL(0.58, 0.4, 0.4);
      
      this.hemisphereLight.intensity = 0.2;
      this.hemisphereLight.color.setHSL(0.58, 0.3, 0.2);
      this.hemisphereLight.groundColor.setHSL(0.6, 0.2, 0.08);
      this.ambientLight.intensity = 0.15;
      this.ambientLight.color.setHSL(0.58, 0.2, 0.2);
      
      this.fogColor.setHSL(0.58, 0.2, 0.06);
    }
    
    this.scene.fog.color.copy(this.fogColor);
    this.scene.background.copy(this.fogColor);
  }
  
  getSunLight() {
    return this.sunLight;
  }
  
  getMoonLight() {
    return this.moonLight;
  }
  
  getTimeOfDay() {
    return this.timeOfDay;
  }
  
  isDaytime() {
    return this.isDay;
  }
}