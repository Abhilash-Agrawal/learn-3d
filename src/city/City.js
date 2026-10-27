import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165/build/three.module.js';
import { Tower } from './buildings/Tower.js';
import { ResidentialBlock } from './buildings/ResidentialBlock.js';
import { Park } from './buildings/Park.js';
import { FireStation } from './buildings/FireStation.js';
import { PoliceStation } from './buildings/PoliceStation.js';
import { Hospital } from './buildings/Hospital.js';
import { Ground } from './terrain/Ground.js';
import { RoadNetwork } from './RoadNetwork.js';

export class City {
  constructor(scene) {
    this.scene = scene;
    this.buildings = [];
    this.terrain = [];
    this.roads = [];
    this.stations = [];
    this.gridSize = 40;
    this.blockSize = 80;
    this.cityBounds = { min: new THREE.Vector3(-800, 0, -800), max: new THREE.Vector3(800, 0, 800) };
    
    this.materials = this.createMaterials();
  }
  
  createMaterials() {
    return {
      building: new THREE.MeshStandardMaterial({
        color: 0x6B7280,
        roughness: 0.8,
        metalness: 0.1,
        flatShading: true
      }),
      buildingDark: new THREE.MeshStandardMaterial({
        color: 0x4B5563,
        roughness: 0.85,
        metalness: 0.05,
        flatShading: true
      }),
      buildingLight: new THREE.MeshStandardMaterial({
        color: 0x9CA3AF,
        roughness: 0.75,
        metalness: 0.1,
        flatShading: true
      }),
      roof: new THREE.MeshStandardMaterial({
        color: 0x374151,
        roughness: 0.9,
        metalness: 0.05,
        flatShading: true
      }),
      roofRed: new THREE.MeshStandardMaterial({
        color: 0x7F1D1D,
        roughness: 0.8,
        metalness: 0.1,
        flatShading: true
      }),
      roofBlue: new THREE.MeshStandardMaterial({
        color: 0x1E3A8A,
        roughness: 0.8,
        metalness: 0.1,
        flatShading: true
      }),
      window: new THREE.MeshStandardMaterial({
        color: 0x3B82F6,
        roughness: 0.1,
        metalness: 0.9,
        emissive: 0x1E3A8A,
        emissiveIntensity: 0.3,
        flatShading: true
      }),
      windowLit: new THREE.MeshStandardMaterial({
        color: 0xFBBF24,
        roughness: 0.1,
        metalness: 0.9,
        emissive: 0xF59E0B,
        emissiveIntensity: 0.8,
        flatShading: true
      }),
      road: new THREE.MeshStandardMaterial({
        color: 0x1F2937,
        roughness: 0.95,
        metalness: 0.05,
        flatShading: true
      }),
      roadLine: new THREE.MeshStandardMaterial({
        color: 0xFBBF24,
        roughness: 0.2,
        metalness: 0.8,
        emissive: 0xF59E0B,
        emissiveIntensity: 0.5,
        flatShading: true
      }),
      grass: new THREE.MeshStandardMaterial({
        color: 0x2D5A2D,
        roughness: 1,
        metalness: 0,
        flatShading: true
      }),
      grassLight: new THREE.MeshStandardMaterial({
        color: 0x3D7A3D,
        roughness: 1,
        metalness: 0,
        flatShading: true
      }),
      water: new THREE.MeshStandardMaterial({
        color: 0x1E40AF,
        roughness: 0.1,
        metalness: 0.9,
        transparent: true,
        opacity: 0.8,
        flatShading: true
      }),
      waterDeep: new THREE.MeshStandardMaterial({
        color: 0x1E3A8A,
        roughness: 0.05,
        metalness: 0.95,
        transparent: true,
        opacity: 0.9,
        flatShading: true
      }),
      concrete: new THREE.MeshStandardMaterial({
        color: 0x4B5563,
        roughness: 0.9,
        metalness: 0.1,
        flatShading: true
      }),
      alertRed: new THREE.MeshStandardMaterial({
        color: 0xEF4444,
        roughness: 0.7,
        metalness: 0.2,
        emissive: 0xEF4444,
        emissiveIntensity: 0.3,
        flatShading: true
      })
    };
  }
  
  generate() {
    this.createGround();
    this.createRoadNetwork();
    this.createDowntown();
    this.createFireStation();
    this.createPoliceStation();
    this.createHospital();
    this.createResidentialAreas();
    this.createParks();
    this.createStreetDetails();
  }
  
  createGround() {
    const ground = new Ground(this.materials);
    ground.generate(this.cityBounds);
    ground.mesh.userData = { isGround: true };
    this.scene.add(ground.mesh);
    this.terrain.push(ground);
    this.ground = ground;
  }
  
  createRiver() {
    const river = new River(this.materials);
    river.generate();
    this.scene.add(river.mesh);
    this.scene.add(river.waterMesh);
    this.terrain.push(river);
  }
  
  createRoadNetwork() {
    const roadNetwork = new RoadNetwork(this.scene, this.materials, this.cityBounds);
    roadNetwork.generate();
    this.scene.add(roadNetwork.mesh);
    this.terrain.push(roadNetwork);
    
    this.roads = roadNetwork.getRoads();
    roadNetwork.getBuildings().forEach(b => this.buildings.push(b));
  }
  
  createBridge() {
    const bridge = new Bridge(this.materials);
    bridge.generate();
    this.scene.add(bridge.mesh);
    this.terrain.push(bridge);
  }
  
  createDowntown() {
    const centerX = 0;
    const centerZ = -50;
    const rows = 3;
    const cols = 4;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = centerX + (col - (cols - 1) / 2) * this.blockSize;
        const z = centerZ + (row - (rows - 1) / 2) * this.blockSize;
        
        if (Math.random() < 0.5) {
          const tower = new Tower(this.materials);
          tower.generate(x, z, 60 + Math.random() * 80);
          this.scene.add(tower.mesh);
          this.buildings.push(tower);
        }
      }
    }
  }
  
  createFireStation() {
    const station = new FireStation(this.materials);
    station.generate(-200, -200);
    this.scene.add(station.mesh);
    this.buildings.push(station);
    this.stations.push({
      id: 'FS-01',
      name: 'Central Fire Station',
      type: 'fire',
      position: new THREE.Vector3(-200, 0, -200),
      entity: station,
      bays: station.bayPositions
    });
  }
  
  createPoliceStation() {
    const station = new PoliceStation(this.materials);
    station.generate(200, -200);
    this.scene.add(station.mesh);
    this.buildings.push(station);
    this.stations.push({
      id: 'PS-01',
      name: 'Downtown Police Station',
      type: 'police',
      position: new THREE.Vector3(200, 0, -200),
      entity: station
    });
  }
  
  createHospital() {
    const hospital = new Hospital(this.materials);
    hospital.generate(0, 200);
    this.scene.add(hospital.mesh);
    this.buildings.push(hospital);
    this.stations.push({
      id: 'HS-01',
      name: 'City General Hospital',
      type: 'medical',
      position: new THREE.Vector3(0, 0, 200),
      entity: hospital,
      helipad: hospital.helipadPosition
    });
  }
  
  createResidentialAreas() {
    const areas = [
      { x: -300, z: 100, rows: 2, cols: 2 },
      { x: 300, z: 100, rows: 2, cols: 2 },
    ];
    
    areas.forEach(area => {
      for (let row = 0; row < area.rows; row++) {
        for (let col = 0; col < area.cols; col++) {
          const x = area.x + (col - (area.cols - 1) / 2) * this.blockSize * 0.8;
          const z = area.z + (row - (area.rows - 1) / 2) * this.blockSize * 0.8;
          
          if (Math.random() < 0.6) {
            const block = new ResidentialBlock(this.materials);
            block.generate(x, z);
            this.scene.add(block.mesh);
            this.buildings.push(block);
          }
        }
      }
    });
  }
  
  createParks() {
    const parks = [
      { x: -120, z: 120, size: 50 },
      { x: 0, z: -350, size: 60 }
    ];
    
    parks.forEach(park => {
      const p = new Park(this.materials);
      p.generate(park.x, park.z, park.size);
      this.scene.add(p.mesh);
      this.buildings.push(p);
    });
  }
  
  createStreetDetails() {
    const lineMaterial = this.materials.roadLine;
    
    for (let x = -360; x <= 360; x += this.blockSize) {
      if (Math.abs(x) > 200) continue;
      const geometry = new THREE.BoxGeometry(0.3, 0.1, 720);
      const line = new THREE.Mesh(geometry, lineMaterial);
      line.position.set(x, 0.11, 0);
      this.scene.add(line);
    }
    
    for (let z = -360; z <= 360; z += this.blockSize) {
      if (Math.abs(z) > 200) continue;
      const geometry = new THREE.BoxGeometry(720, 0.1, 0.3);
      const line = new THREE.Mesh(geometry, lineMaterial);
      line.position.set(0, 0.11, z);
      this.scene.add(line);
    }
  }
  
  getBuildings() {
    return this.buildings;
  }
  
  getStations() {
    return this.stations;
  }
  
  getCityBounds() {
    return this.cityBounds;
  }
  
  getNearestStation(position, type) {
    let nearest = null;
    let minDist = Infinity;
    
    this.stations.forEach(station => {
      if (station.type === type) {
        const dist = position.distanceTo(station.position);
        if (dist < minDist) {
          minDist = dist;
          nearest = station;
        }
      }
    });
    
    return nearest;
  }
  
  getRandomRoadPosition() {
    const roads = [];
    
    for (let x = -360; x <= 360; x += this.blockSize) {
      if (Math.abs(x) > 200) continue;
      roads.push({ x, z: 0, dir: 'z' });
    }
    
    for (let z = -360; z <= 360; z += this.blockSize) {
      if (Math.abs(z) > 200) continue;
      roads.push({ x: 0, z, dir: 'x' });
    }
    
    const road = roads[Math.floor(Math.random() * roads.length)];
    const offset = (Math.random() - 0.5) * 200;
    
    if (road.dir === 'z') {
      return new THREE.Vector3(road.x, 0, offset);
    } else {
      return new THREE.Vector3(offset, 0, road.z);
    }
  }
  
  isOnRoad(position) {
    const x = Math.abs(position.x);
    const z = Math.abs(position.z);
    
    for (let coord = -360; coord <= 360; coord += this.blockSize) {
      if (Math.abs(coord) > 200) continue;
      if (Math.abs(x - coord) < 20) return true;
      if (Math.abs(z - coord) < 20) return true;
    }
    
    return false;
  }
  
  findPath(start, end, avoid = []) {
    const waypoints = [start.clone()];
    
    const midX = start.x;
    const midZ = end.z;
    waypoints.push(new THREE.Vector3(midX, 0, midZ));
    waypoints.push(end.clone());
    
    return waypoints;
  }
  
  update(delta, elapsed) {
    this.buildings.forEach(building => {
      if (building.update) building.update(delta, elapsed);
    });
    
    this.terrain.forEach(terrain => {
      if (terrain.update) terrain.update(delta, elapsed);
    });
  }
  
  getRoads() {
    return this.roads;
  }
}