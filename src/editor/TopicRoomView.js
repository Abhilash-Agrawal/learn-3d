import * as THREE from 'three';
import { CameraController } from '../core/CameraController.js';

export class TopicRoomView {
  constructor(topicData, onClose) {
    this.topicData = topicData;
    this.onClose = onClose;
    this.frameId = null;
    this.disposed = false;
    this.actorKeys = { forward: false, backward: false, left: false, right: false };
    this.actorPosition = new THREE.Vector3();
    this.clock = new THREE.Clock();

    this.element = document.createElement('section');
    this.element.setAttribute('aria-label', `${topicData.topic} subtopic doors`);
    this.element.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 10000;
      overflow: hidden;
      background: #91a879;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    `;

    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
    this.element.appendChild(this.canvas);

    this.header = document.createElement('div');
    this.header.style.cssText = `
      position:absolute;
      top:16px;
      left:16px;
      right:16px;
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:16px;
      color:white;
      pointer-events:none;
      text-shadow:0 2px 8px rgba(0,0,0,.7);
    `;
    this.header.innerHTML = `
      <div>
        <div style="font-size:12px;opacity:.85;">${this.escapeHtml(topicData.category ?? '')} · ${Array.isArray(topicData.subtopics) ? topicData.subtopics.length : 0} subtopics</div>
        <h1 style="font-size:clamp(20px,3vw,32px);margin:4px 0;">${this.escapeHtml(topicData.topic)}</h1>
      </div>
    `;
    this.element.appendChild(this.header);

    this.backButton = document.createElement('button');
    this.backButton.type = 'button';
    this.backButton.textContent = '← Back to village';
    this.backButton.style.cssText = `
      position:absolute;
      right:16px;
      bottom:16px;
      z-index:1;
      border:1px solid rgba(255,255,255,.3);
      border-radius:8px;
      padding:12px 16px;
      background:rgba(17,24,39,.92);
      color:#fff;
      font:600 14px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
      cursor:pointer;
    `;
    this.backButton.addEventListener('click', () => this.onClose());
    this.element.appendChild(this.backButton);
    document.body.appendChild(this.element);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x9caf83);
    this.scene.fog = new THREE.Fog(0x9caf83, 180, 420);
    this.camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;

    this.scene.add(new THREE.HemisphereLight(0xfff4dc, 0x53634b, 2));
    const sunlight = new THREE.DirectionalLight(0xffedc2, 3);
    sunlight.position.set(-50, 100, 60);
    sunlight.castShadow = true;
    this.scene.add(sunlight);

    const subtopics = Array.isArray(topicData.subtopics) ? topicData.subtopics : [];
    if (subtopics.length === 0) {
      throw new Error(`Topic "${topicData.topic}" has no subtopics to display`);
    }

    const corridorRadius = this.createHallway(subtopics);
    const center = new THREE.Vector3(0, 5, 0);
    this.camera.position.set(corridorRadius * 1.7, corridorRadius * 3.2, corridorRadius * 2.2);
    this.camera.lookAt(center);
    this.cameraController = new CameraController(this.camera, this.canvas);
    this.cameraController.target.copy(center);
    const spherical = new THREE.Spherical().setFromVector3(this.camera.position.clone().sub(center));
    this.cameraController.distance = spherical.radius;
    this.cameraController.azimuth = spherical.theta;
    this.cameraController.polar = spherical.phi;
    this.cameraController.minDistance = 24;
    this.cameraController.maxDistance = corridorRadius * 8;
    this.actorBoundary = corridorRadius - 3;
    this.createActor();
    this.onKeyDown = event => this.handleActorKey(event, true);
    this.onKeyUp = event => this.handleActorKey(event, false);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    this.instructions = document.createElement('div');
    this.instructions.textContent = 'Move around with WASD or arrow keys';
    this.instructions.style.cssText = `
      position:absolute;
      left:50%;
      bottom:20px;
      transform:translateX(-50%);
      padding:10px 14px;
      border-radius:8px;
      background:rgba(17,24,39,.82);
      color:white;
      font-size:13px;
      pointer-events:none;
    `;
    this.element.appendChild(this.instructions);

    this.onResize = () => {
      if (this.disposed) return;
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    window.addEventListener('resize', this.onResize);
    this.animate();
  }

  createHallway(subtopics) {
    const doorSpacing = 14;
    const corridorRadius = Math.max(30, (subtopics.length * doorSpacing) / (Math.PI * 2));
    const floorRadius = corridorRadius + 1.5;
    const wallHeight = 14;
    const doorWidth = 6;
    const doorHeight = 9;
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xc9b99a, roughness: 1 });
    const trimMaterial = new THREE.MeshStandardMaterial({ color: 0x5b3e2b, roughness: 0.9 });
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x927653, roughness: 1 });
    const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x784b32, roughness: 0.9 });
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(floorRadius, Math.max(96, subtopics.length * 24)),
      floorMaterial
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.03;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const doorLocations = subtopics.map((subtopic, index) => ({
      subtopic,
      angle: (index / subtopics.length) * Math.PI * 2
    }));

    const doorHalfAngle = (doorWidth / 2) / corridorRadius;
    const addWallArc = (radius, startAngle, endAngle, thickness = 0.6) => {
      const arcLength = (endAngle - startAngle) * radius;
      const wallSegments = Math.max(1, Math.ceil(arcLength / 2));
      for (let segment = 0; segment < wallSegments; segment++) {
        const segmentStart = startAngle + (endAngle - startAngle) * segment / wallSegments;
        const segmentEnd = startAngle + (endAngle - startAngle) * (segment + 1) / wallSegments;
        const angle = (segmentStart + segmentEnd) / 2;
        const length = (segmentEnd - segmentStart) * radius + 0.08;
        const wall = new THREE.Mesh(
          new THREE.BoxGeometry(length, wallHeight, thickness),
          wallMaterial
        );
        wall.position.set(Math.sin(angle) * radius, wallHeight / 2, Math.cos(angle) * radius);
        wall.rotation.y = angle;
        wall.receiveShadow = true;
        this.scene.add(wall);
      }
    };

    doorLocations.forEach((location, index) => {
      const nextAngle = index === doorLocations.length - 1
        ? doorLocations[0].angle + Math.PI * 2
        : doorLocations[index + 1].angle;
      addWallArc(
        corridorRadius,
        location.angle + doorHalfAngle,
        nextAngle - doorHalfAngle
      );
    });

    doorLocations.forEach(({ subtopic, angle }, index) => {
      const x = Math.sin(angle) * corridorRadius;
      const z = Math.cos(angle) * corridorRadius;
      const door = new THREE.Group();
      door.position.set(x, 0, z);
      door.rotation.y = angle + Math.PI;
      door.userData.subtopic = subtopic;
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(doorWidth - 0.4, doorHeight - 0.2, 0.35),
        doorMaterial
      );
      panel.position.y = (doorHeight - 0.2) / 2;
      panel.castShadow = true;
      door.add(panel);

      for (const edge of [-1, 1]) {
        const jamb = new THREE.Mesh(
          new THREE.BoxGeometry(0.8, doorHeight, 0.4),
          trimMaterial
        );
        jamb.position.set(edge * (doorWidth / 2 - 0.1), doorHeight / 2, 0);
        door.add(jamb);
      }
      const header = new THREE.Mesh(
        new THREE.BoxGeometry(doorWidth + 0.4, 0.45, 0.8),
        trimMaterial
      );
      header.position.set(0, doorHeight - 0.2, 0);
      door.add(header);

      const knob = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 12, 8),
        new THREE.MeshStandardMaterial({ color: 0xd4a949, metalness: 0.65, roughness: 0.35 })
      );
      knob.position.set(doorWidth / 2 - 1, 4.2, 0.22);
      door.add(knob);

      const sign = this.createSign(String(subtopic));
      sign.position.set(x, doorHeight + 2.5, z);
      sign.scale.set(12, 3.2, 1);
      this.signs ??= [];
      this.signs.push(sign);
      this.scene.add(sign);
      door.name = `Subtopic door ${index + 1}: ${subtopic}`;
      this.scene.add(door);
    });

    for (let index = 0; index < Math.min(8, subtopics.length); index++) {
      const angle = (index / Math.min(8, subtopics.length)) * Math.PI * 2;
      const fixture = new THREE.Mesh(
        new THREE.BoxGeometry(3, 0.35, 1.2),
        new THREE.MeshStandardMaterial({
          color: 0xffedc2,
          emissive: 0xffd77a,
          emissiveIntensity: 1.2
        })
      );
      fixture.position.set(Math.sin(angle) * (corridorRadius - 5), wallHeight - 0.45, Math.cos(angle) * (corridorRadius - 5));
      fixture.rotation.y = angle;
      this.scene.add(fixture);

      const light = new THREE.PointLight(0xffdca0, 45, 38);
      light.position.set(Math.sin(angle) * (corridorRadius - 5), wallHeight - 1.5, Math.cos(angle) * (corridorRadius - 5));
      this.scene.add(light);
    }

    return corridorRadius;
  }

  createActor() {
    this.actor = new THREE.Group();
    const clothes = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.8 });
    const skin = new THREE.MeshStandardMaterial({ color: 0xf2c9a5, roughness: 0.9 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.75, 2.1, 5, 10), clothes);
    body.position.y = 2.6;
    body.castShadow = true;
    this.actor.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.72, 16, 12), skin);
    head.position.y = 4.65;
    head.castShadow = true;
    this.actor.add(head);
    const legs = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.8, 0.75), clothes);
    legs.position.y = 0.9;
    legs.castShadow = true;
    this.actor.add(legs);
    const marker = new THREE.Mesh(
      new THREE.RingGeometry(1.4, 1.7, 32),
      new THREE.MeshBasicMaterial({ color: 0x60a5fa, side: THREE.DoubleSide })
    );
    marker.rotation.x = -Math.PI / 2;
    marker.position.y = 0.05;
    this.actor.add(marker);
    this.scene.add(this.actor);
    this.actor.position.set(0, 0, 0);
  }

  handleActorKey(event, isPressed) {
    if (event.target instanceof HTMLElement &&
      (event.target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName))) {
      return;
    }
    const keyBindings = {
      ArrowUp: 'forward',
      KeyW: 'forward',
      ArrowDown: 'backward',
      KeyS: 'backward',
      ArrowLeft: 'left',
      KeyA: 'left',
      ArrowRight: 'right',
      KeyD: 'right'
    };
    const direction = keyBindings[event.code];
    if (!direction) return;
    this.actorKeys[direction] = isPressed;
    event.preventDefault();
  }

  createSign(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 192;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Unable to create room sign canvas');
    }

    context.fillStyle = '#58432f';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#e5d5b5';
    context.lineWidth = 12;
    context.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
    context.fillStyle = '#fff8e8';
    context.font = '600 44px Arial, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    const words = text.split(/\s+/);
    const lines = [];
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (context.measureText(candidate).width > canvas.width - 48 && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);

    const visibleLines = lines.slice(0, 3);
    visibleLines.forEach((value, index) => {
      context.fillText(
        value,
        canvas.width / 2,
        canvas.height / 2 + (index - (visibleLines.length - 1) / 2) * 52,
        canvas.width - 48
      );
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.SpriteMaterial({ map: texture });
    material.userData.ownedMap = true;
    const sign = new THREE.Sprite(material);
    sign.scale.set(18, 4.5, 1);
    return sign;
  }

  escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[character]);
  }

  animate() {
    if (this.disposed) return;
    this.frameId = requestAnimationFrame(() => this.animate());
    const delta = Math.min(this.clock.getDelta(), 0.05);
    const direction = new THREE.Vector3(
      Number(this.actorKeys.right) - Number(this.actorKeys.left),
      0,
      Number(this.actorKeys.forward) - Number(this.actorKeys.backward)
    );
    if (direction.lengthSq() > 0) {
      direction.normalize();
      this.actorPosition.addScaledVector(direction, 12 * delta);
      const distanceFromCenter = Math.hypot(this.actorPosition.x, this.actorPosition.z);
      if (distanceFromCenter > this.actorBoundary) {
        this.actorPosition.multiplyScalar(this.actorBoundary / distanceFromCenter);
      }
      this.actor.rotation.y = Math.atan2(direction.x, direction.z);
      this.actor.position.copy(this.actorPosition);
    }
    this.cameraController.update();
    this.signs?.forEach(sign => sign.quaternion.copy(this.camera.quaternion));
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.scene.traverse(object => {
      object.geometry?.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach(material => {
        if (material) {
          if (material.userData.ownedMap) material.map?.dispose();
          material.dispose();
        }
      });
    });
    this.renderer.dispose();
    this.element.remove();
  }
}
