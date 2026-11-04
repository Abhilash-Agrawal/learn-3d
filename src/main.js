import * as THREE from 'three';
import { SceneManager } from './core/SceneManager.js';
import { Lighting } from './core/Lighting.js';
import { City } from './city/City.js';
import { DayNightCycle } from './effects/DayNightCycle.js';
import { Highway } from './city/terrain/Highway.js';
import { SelectionManager } from './core/SelectionManager.js';
import { CameraController } from './core/CameraController.js';
import { CityEditor } from './editor/CityEditor.js';
import { Actor } from './actor/Actor.js';
import { TopicRoomView } from './editor/TopicRoomView.js';
import { DoorView } from './editor/DoorView.js';

function showError(message) {
  const errorElement = document.createElement('div');
  errorElement.style.cssText = 'position:fixed;top:20px;left:20px;right:20px;background:#EF4444;color:#fff;padding:20px;border-radius:8px;font-family:monospace;z-index:9999;white-space:pre-wrap';
  errorElement.textContent = message;
  document.body.appendChild(errorElement);
  console.error(message);
}

function checkWebGLSupport() {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!context) {
    return { supported: false, reason: 'WebGL not supported' };
  }

  const debugInfo = context.getExtension('WEBGL_debug_renderer_info');
  const renderer = debugInfo ? context.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown';
  const vendor = debugInfo ? context.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown';
  return { supported: true, renderer, vendor };
}

class SirenApp {
  constructor(tracksData, currentTrack) {
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
    this.city = new City(this.sceneManager.scene, 0);
    this.city.createGround();

    this.highway = new Highway(this.city.materials);
    this.highway.generate();
    this.sceneManager.scene.add(this.highway.mesh);
    this.dayNightCycle = new DayNightCycle(this.sceneManager.scene, this.lighting);

    this.camera = this.sceneManager.camera;
    this.camera.position.set(240, 220, 280);
    this.camera.lookAt(0, 0, 0);
    this.cameraController = new CameraController(this.camera, this.canvas);
    this.selectionManager = new SelectionManager(this.sceneManager.scene, this.camera, this.city);
    this.actor = new Actor(this.sceneManager.scene, this.city);
    const categories = tracksData[currentTrack].categories;
    const firstRoadZ = -((categories.length - 1) * CityEditor.TRACK_ROAD_SPACING) / 2;
    this.actor.position.set(0, 0, firstRoadZ - 35);
    this.actor.mesh.position.copy(this.actor.position);
    this.cameraController.followHeight = 15;
    this.cameraController.followDistance = 45;
    this.createPersonViewToggle();
    this.editor = new CityEditor(
      this.sceneManager.scene,
      this.city,
      this.camera,
      this.canvas,
      () => {},
      this.cameraController,
      tracksData,
      currentTrack,
      this.dayNightCycle,
      (topicData) => this.openTopicRooms(topicData),
      (doorData) => this.openDoorView(doorData)
    );

    this.clock = new THREE.Clock();
    this.running = true;
    this.init();
    this.animate();
  }

  init() {
    window.addEventListener('resize', () => this.sceneManager.onResize());
    document.addEventListener('visibilitychange', () => {
      this.running = !document.hidden;
      if (this.running) this.animate();
    });
  }

  createTrackRoads(trackName) {
    // Clear existing roads except highway
    this.city.traverse(child => {
      if (child.isMesh && child !== this.highway.mesh) {
        this.city.remove(child);
      }
    });

    const trackData = tracksData[currentTrack];
    if (!trackData) return;

    const categories = trackData.categories || [];
    const baseZ = -150;

    // Create roads based on categories
    categories.forEach((category, index) => {
      const categoryName = category.name.toLowerCase();
      const topicCount = category.topics ? category.topics.length : 0;

      // Create a road for each category
      const roadLength = 80 + topicCount * 10;
      const roadWidth = 20 + topicCount * 2;

      const roadMaterial = new THREE.MeshStandardMaterial({
        color: this.getRoadColor(categoryName),
        roughness: 0.9,
        metalness: 0.02,
        flatShading: true
      });

      const roadGeom = new THREE.BoxGeometry(roadWidth, 0.3, roadLength);
      const roadMesh = new THREE.Mesh(roadGeom, roadMaterial);
      roadMesh.position.set(0, 0.15, -150 + index * 80);
      roadMesh.receiveShadow = true;
      this.city.add(roadMesh);

      // Create center line
      const lineMaterial = new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        roughness: 0.3,
        metalness: 0.7,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.3,
        flatShading: true
      });

      const lineGeom = new THREE.BoxGeometry(0.2, 0.16, roadLength);
      const lineMesh = new THREE.Mesh(lineGeom, lineMaterial);
      lineMesh.position.set(0, 0.2, -150 + index * 80);
      this.city.add(lineMesh);

      // Create billboard for this category
      this.createBillboard(categoryName, -150 + index * 80);

      // Create houses based on topic count
      for (let i = 0; i < topicCount; i++) {
        const houseIndex = i % 4;
        const houseX = (i % 2) * 15 - 15;
        const houseZ = 5;
        const houseHeight = 12 + 4;
        const houseGeom = new THREE.BoxGeometry(15, houseHeight, 12);
        const houseMat = new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.9, metalness: 0.02, flatShading: true });
        const houseMesh = new THREE.Mesh(roadGeom, houseMat);
        houseMesh.position.set((i % 2) * 15 - 15, houseHeight / 2, 5);
        houseMesh.receiveShadow = true;
        this.city.add(houseMesh);

        // Add topic label on house
        const labelCanvas = document.createElement('canvas');
        labelCanvas.width = 512;
        labelCanvas.height = 144;
        const labelContext = labelCanvas.getContext('2d');
        if (!labelContext) throw new Error('Unable to create topic label canvas');

        context.clearRect(0, 0, labelCanvas.width, labelCanvas.height);
        context.font = '600 42px Arial, sans-serif';

        const words = String(category.name).split(/\s+/);
        let lines = [];
        for (let fontSize = 42; fontSize >= 24; fontSize -= 2) {
          context.font = `600 ${fontSize}px Arial, sans-serif`;
          lines = [];
          let line = '';

          for (const word of words) {
            const candidate = line ? `${line} ${word}` : word;
            if (context.measureText(candidate).width > labelCanvas.width - 48 && line) {
              lines.push(line);
              line = word;
            } else {
              line = candidate;
            }
          }
          if (line) lines.push(line);
          if (lines.length <= 2) break;
        }

        if (lines.length > 2) {
          lines = [lines[0], `${lines[1].slice(0, 24)}...`];
        }
        context.fillStyle = '#FFFFFF';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.font = '600 72px Arial, sans-serif';
        const lineHeight = 82;
        const firstLineY = labelCanvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;
        lines.forEach((line, index) => {
          context.fillText(line, labelCanvas.width / 2, firstLineY + index * lineHeight, labelCanvas.width - 48);
        });

        const labelTexture = new THREE.CanvasTexture(labelCanvas);
        labelTexture.colorSpace = THREE.SRGBColorSpace;
        const labelMaterial = new THREE.SpriteMaterial({
          map: labelTexture,
          transparent: true,
          depthWrite: false
        });
        labelMaterial.userData.ownedMap = true;
        const label = new THREE.Sprite(labelMaterial);
        label.name = `Topic: ${category.name}`;
        label.position.set(0, houseHeight / 2 + 11, 0);
        label.scale.set(19, 5.35, 1);
        house.add(label);
      }
    });
  }

  getRoadColor(categoryName) {
    const colors = {
      'frontend': 0x6b7280,
      'backend': 0x4b5563,
      'gen-ai': 0x7f1d1d,
      'cloud': 0x1e40af,
      'system-design': 0x6d28d9
    };
    return colors[categoryName] || 0x374151;
  }

  createPersonViewToggle() {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Person View: Off';
    button.setAttribute('aria-pressed', 'false');
    button.style.cssText = `
      position: absolute;
      top: 16px;
      right: 16px;
      padding: 10px 14px;
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 8px;
      background: rgba(17,24,39,0.92);
      color: white;
      font: 600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      cursor: pointer;
      pointer-events: auto;
      z-index: 20;
    `;
    button.addEventListener('click', () => {
      const enabled = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(enabled));
      button.textContent = `Person View: ${enabled ? 'On' : 'Off'}`;
      if (enabled) {
        this.cameraController.setFollowTarget(this.actor.mesh);
      } else {
        this.cameraController.clearFollowTarget();
      }
    });
    this.uiOverlay.appendChild(button);
    this.personViewButton = button;
  }

  openTopicRooms(topicData) {
    this.closeDoorView();
    this.closeTopicRooms();
    this.hideVillageControls();
    try {
      this.roomView = new TopicRoomView(
        topicData,
        () => this.closeTopicRooms(),
        doorData => this.openDoorView(doorData)
      );
    } catch (error) {
      this.restoreVillageControls();
      throw error;
    }
  }

  openDoorView(doorData) {
    this.closeTopicRooms();
    this.closeDoorView();
    this.hideVillageControls();
    try {
      this.doorView = new DoorView(doorData, () => this.closeDoorView());
    } catch (error) {
      this.restoreVillageControls();
      throw error;
    }
  }

  closeTopicRooms() {
    this.roomView?.dispose();
    this.roomView = null;
    this.restoreVillageControls();
  }

  closeDoorView() {
    this.doorView?.dispose();
    this.doorView = null;
    this.restoreVillageControls();
  }

  hideVillageControls() {
    if (!this.roomViewUiState) {
      this.roomViewUiState = {
        editorPanelDisplay: this.editor.panel.style.display,
        personViewButtonDisplay: this.personViewButton.style.display,
        actorEnabled: this.actor.enabled
      };
    }
    this.editor.panel.style.display = 'none';
    this.personViewButton.style.display = 'none';
    this.actor.setEnabled?.(false);
  }

  restoreVillageControls() {
    if (!this.roomViewUiState) return;
    this.editor.panel.style.display = this.roomViewUiState.editorPanelDisplay;
    this.personViewButton.style.display = this.roomViewUiState.personViewButtonDisplay;
    this.actor.setEnabled?.(this.roomViewUiState.actorEnabled);
    this.roomViewUiState = null;
  }

  animate() {
    if (!this.running) return;

    requestAnimationFrame(() => this.animate());

    try {
      const delta = this.clock.getDelta();
      const elapsed = this.clock.getElapsedTime();
      this.actor.update(delta);
      this.city.update(delta, elapsed);
      this.dayNightCycle.update(delta, elapsed);
      this.cameraController.update();
      this.selectionManager.update(delta, elapsed);
      this.editor.update(delta);
      this.sceneManager.render();
    } catch (error) {
      showError(`Animation error: ${error.message}\n${error.stack}`);
      this.running = false;
    }
  }
}

let app;
function startSirenApp(tracksData, currentTrack) {
  if (app) return app;

  try {
    app = new SirenApp(tracksData, currentTrack);
    window.sirenApp = app;
    return app;
  } catch (error) {
    showError(`App startup error: ${error.message}\n${error.stack}`);
    throw error;
  }
}

export { SirenApp, startSirenApp };
