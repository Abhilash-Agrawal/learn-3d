import * as THREE from 'three';

export class SceneManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.composer = null;
    
    try {
      this.initRenderer();
      this.initScene();
      this.initCamera();
      this.initPostProcessing();
    } catch (e) {
      console.error('SceneManager init failed:', e);
      throw new Error('WebGL initialization failed: ' + e.message + '\nThis browser/device may not support WebGL. Try:\n1. Enable hardware acceleration in browser settings\n2. Update graphics drivers\n3. Try a different browser (Chrome/Firefox)');
    }
  }
  
  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'default',
      failIfMajorPerformanceCaveat: false
    });
    
    if (!this.renderer.getContext()) {
      throw new Error('Could not create WebGL context');
    }
    
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.physicallyCorrectLights = true;
  }
  
  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111827);
    this.scene.fog = new THREE.FogExp2(0x111827, 0.0015);
  }
  
  initCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 1, 5000);
    this.camera.position.set(200, 200, 200);
    this.camera.lookAt(0, 0, 0);
  }
  
  initPostProcessing() {
  }
  
  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
  
  render() {
    this.renderer.render(this.scene, this.camera);
  }
  
  getRenderer() {
    return this.renderer;
  }
  
  getScene() {
    return this.scene;
  }
  
  getCamera() {
    return this.camera;
  }
}