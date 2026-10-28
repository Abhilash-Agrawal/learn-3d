import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165/build/three.module.js';
import { SceneManager } from './core/SceneManager.js';
import { Lighting } from './core/Lighting.js';
import { City } from './city/City.js';
// import { IncidentManager } from './incidents/IncidentManager.js';
// import { UnitManager } from './units/UnitManager.js';
// import { UIManager } from './ui/UIManager.js';
// import { WeatherSystem } from './effects/WeatherSystem.js';
import { DayNightCycle } from './effects/DayNightCycle.js';
import { SelectionManager } from './core/SelectionManager.js';
import { CameraController } from './core/CameraController.js';
// WebGL renderer will be created later
// import { Actor } from './actor/Actor.js';
import { CityEditor } from './editor/CityEditor.js';

function showError(msg) {
  const div = document.createElement('div');
  div.style.cssText = 'position:fixed;top:20px;left:20px;right:20px;background:#EF4444;color:#fff;padding:20px;border-radius:8px;font-family:monospace;z-index:9999;white-space:pre-wrap';
  div.textContent = msg;
  document.body.appendChild(div);
  console.error(msg);
}

function checkWebGLSupport() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) {
    return { supported: false, reason: 'WebGL not supported' };
  }
  
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown';
  const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown';
  
  return { supported: true, renderer, vendor };
}

class SirenApp {
  constructor() {
    try {
      const webgl = checkWebGLSupport();
      if (!webgl.supported) {
        throw new Error(webgl.reason);
      }
      console.log('WebGL:', webgl.renderer, webgl.vendor);
      
      this.canvas = document.getElementById('canvas');
      this.uiOverlay = document.getElementById('ui-overlay');
      
      if (!this.canvas) throw new Error('Canvas not found');
      if (!this.uiOverlay) throw new Error('UI overlay not found');
      
      this.sceneManager = new SceneManager(this.canvas);
      this.lighting = new Lighting(this.sceneManager.scene);
this.city = new City(this.sceneManager.scene, 0);  // No auto-generated buildings
      this.highway = new Highway(this.city.materials);
      this.highway.generate();
      this.scene.add(this.highway.mesh);
      
      // this.incidentManager = new IncidentManager(this.sceneManager.scene, this.city);
      // this.unitManager = new UnitManager(this.sceneManager.scene, this.city);
      // this.weatherSystem = new WeatherSystem(this.sceneManager.scene, this.lighting);
      this.dayNightCycle = new DayNightCycle(this.sceneManager.scene, this.lighting);
      
      this.camera = this.sceneManager.camera;
      this.camera.position.set(0, 40, 60);
      this.camera.lookAt(0, 0, 0);
      this.cameraController = new CameraController(this.camera, this.canvas);
      this.selectionManager = new SelectionManager(this.sceneManager.scene, this.camera, this.city);
      
      this.editor = new CityEditor(
        this.sceneManager.scene,
        this.city,
        this.camera,
        this.canvas,
        () => {} // onChange callback
      );
      
      this.clock = new THREE.Clock();
      this.running = true;
      this.lastTime = 0;
      
      this.init();
      this.animate();
    } catch (e) {
      showError('Constructor error: ' + e.message + '\n' + e.stack);
    }
  }
  
  init() {
    try {
      // City generation deferred - start with just highway
      // this.city.generate();
      // this.incidentManager.spawnInitialIncidents();
      // this.unitManager.spawnInitialUnits();
      // this.uiManager.init();
      
      window.addEventListener('resize', () => this.onResize());
      document.addEventListener('visibilitychange', () => {
        this.running = !document.hidden;
        if (this.running) this.animate();
      });
    } catch (e) {
      showError('Init error: ' + e.message + '\n' + e.stack);
    }
  }
  
  onResize() {
    try {
      this.sceneManager.onResize();
      // this.uiManager.onResize();
    } catch (e) {
      showError('Resize error: ' + e.message);
    }
  }
  
  animate(time = 0) {
    if (!this.running) return;
    
    requestAnimationFrame((t) => this.animate(t));
    
    try {
      const delta = this.clock.getDelta();
      const elapsed = this.clock.getElapsedTime();
      
      this.city.update(delta, elapsed);
      // this.incidentManager.update(delta, elapsed, this.unitManager);
      // this.unitManager.update(delta, elapsed, this.incidentManager, this.city);
      // this.weatherSystem.update(delta, elapsed);
      this.dayNightCycle.update(delta, elapsed);
      this.cameraController.update();
      this.selectionManager.update(delta, elapsed);
      // this.uiManager.update(delta, elapsed);
      
      this.editor.update(delta);
      
      this.sceneManager.render();
    } catch (e) {
      showError('Animation error: ' + e.message + '\n' + e.stack);
      this.running = false;
    }
  }
}

let app;
document.addEventListener('DOMContentLoaded', () => {
  try {
    app = new SirenApp();
    window.sirenApp = app;
  } catch (e) {
    showError('DOMContentLoaded error: ' + e.message + '\n' + e.stack);
  }
});

export { SirenApp };