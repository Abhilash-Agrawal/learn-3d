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
import { CSS2DRenderer } from './lib/CSS2DRenderer.js';
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
      this.city = new City(this.sceneManager.scene);
      // this.incidentManager = new IncidentManager(this.sceneManager.scene, this.city);
      // this.unitManager = new UnitManager(this.sceneManager.scene, this.city);
      // this.weatherSystem = new WeatherSystem(this.sceneManager.scene, this.lighting);
      this.dayNightCycle = new DayNightCycle(this.sceneManager.scene, this.lighting);
      this.selectionManager = new SelectionManager(this.sceneManager.scene, null, this.city);
      
      this.camera = this.sceneManager.camera;
      this.camera.position.set(0, 40, 60);
      this.camera.lookAt(0, 0, 0);
      
      this.editor = new CityEditor(
        this.sceneManager.scene,
        this.city,
        this.camera,
        this.canvas,
        () => {} // onChange callback
      );
      
      this.css2dRenderer = new CSS2DRenderer();
      this.css2dRenderer.setSize(window.innerWidth, window.innerHeight);
      this.css2dRenderer.domElement.style.position = 'absolute';
      this.css2dRenderer.domElement.style.top = '0';
      this.css2dRenderer.domElement.style.left = '0';
      this.css2dRenderer.domElement.style.pointerEvents = 'none';
      document.body.appendChild(this.css2dRenderer.domElement);
      
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
      this.city.generate();
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
      this.css2dRenderer.setSize(window.innerWidth, window.innerHeight);
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
      this.selectionManager.update(delta, elapsed);
      // this.uiManager.update(delta, elapsed);
      
      this.editor.update(delta);
      
      this.sceneManager.render();
      this.css2dRenderer.render(this.sceneManager.scene, this.sceneManager.camera);
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