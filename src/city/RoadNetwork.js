import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165/build/three.module.js';
import { Tower } from './buildings/Tower.js';
import { ResidentialBlock } from './buildings/ResidentialBlock.js';
import { Park } from './buildings/Park.js';
import { FireStation } from './buildings/FireStation.js';
import { PoliceStation } from './buildings/PoliceStation.js';
import { Hospital } from './buildings/Hospital.js';

export class RoadNetwork {
  constructor(scene, materials, cityBounds) {
    this.scene = scene;
    this.materials = materials;
    this.cityBounds = cityBounds;
    this.mesh = new THREE.Group();
    this.blockSize = 80;
    this.roads = [];
    this.buildings = [];
  }
  
  generate() {
    this.createMainRoad();
    this.createCrossStreets();
    this.createBuildingsAlongRoads();
    this.createParks();
  }
  
  createMainRoad() {
    const roadLength = 800;
    const laneWidth = 3.7;
    const lanesPerDirection = 2;
    const medianWidth = 3;
    const shoulderWidth = 2.5;
    const totalWidth = (lanesPerDirection * 2 * laneWidth) + medianWidth + (shoulderWidth * 2);
    
    const asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x374151, roughness: 0.9, metalness: 0.02, flatShading: true
    });
    
    const roadGeom = new THREE.BoxGeometry(totalWidth, 0.3, roadLength);
    const roadMesh = new THREE.Mesh(roadGeom, asphaltMat);
    roadMesh.position.set(0, 0.15, 0);
    roadMesh.receiveShadow = true;
    this.mesh.add(roadMesh);
    
    const shoulderMat = new THREE.MeshStandardMaterial({
      color: 0x4b5563, roughness: 0.95, metalness: 0, flatShading: true
    });
    const shoulderGeom = new THREE.BoxGeometry(shoulderWidth, 0.2, roadLength);
    
    for (let dir = -1; dir <= 1; dir += 2) {
      const shoulder = new THREE.Mesh(shoulderGeom, shoulderMat);
      shoulder.position.set(dir * (totalWidth/2 - shoulderWidth/2), 0.1, 0);
      shoulder.receiveShadow = true;
      this.mesh.add(shoulder);
    }
    
    const medianGeom = new THREE.BoxGeometry(medianWidth, 0.4, roadLength);
    const medianMat = new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.9, flatShading: true });
    const median = new THREE.Mesh(medianGeom, medianMat);
    median.position.set(0, 0.2, 0);
    median.receiveShadow = true;
    this.mesh.add(median);
    
    this.addRoadMarkings(roadLength, totalWidth, laneWidth, lanesPerDirection, medianWidth, shoulderWidth);
    
    this.roads.push({
      type: 'main',
      centerLine: { x: 0, z: 0 },
      direction: 'z',
      length: roadLength,
      width: totalWidth,
      lanes: lanesPerDirection * 2
    });
  }
  
  createCrossStreets() {
    const spacing = this.blockSize;
    const roadLength = 600;
    const streetWidth = 16;
    
    const streetMat = new THREE.MeshStandardMaterial({
      color: 0x374151, roughness: 0.9, metalness: 0.02, flatShading: true
    });
    
    const lineMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24, roughness: 0.3, metalness: 0.7, emissive: 0xf59e0b, emissiveIntensity: 0.3, flatShading: true
    });
    
    for (let x = -320; x <= 320; x += spacing) {
      const streetGeom = new THREE.BoxGeometry(streetWidth, 0.25, roadLength);
      const streetMesh = new THREE.Mesh(streetGeom, streetMat);
      streetMesh.position.set(x, 0.125, 0);
      streetMesh.receiveShadow = true;
      this.mesh.add(streetMesh);
      
      const centerLineGeom = new THREE.BoxGeometry(0.2, 0.16, roadLength);
      const centerLine = new THREE.Mesh(centerLineGeom, lineMat);
      centerLine.position.set(x, 0.2, 0);
      this.mesh.add(centerLine);
      
      const edgeGeom = new THREE.BoxGeometry(0.15, 0.16, roadLength);
      for (let side = -1; side <= 1; side += 2) {
        const edge = new THREE.Mesh(edgeGeom, lineMat);
        edge.position.set(x + side * streetWidth/2, 0.2, 0);
        this.mesh.add(edge);
      }
      
      this.roads.push({
        type: 'cross',
        centerLine: { x, z: 0 },
        direction: 'x',
        length: roadLength,
        width: streetWidth,
        lanes: 2
      });
    }
    
    for (let z = -240; z <= 240; z += spacing) {
      const streetGeom = new THREE.BoxGeometry(800, 0.25, streetWidth);
      const streetMesh = new THREE.Mesh(streetGeom, streetMat);
      streetMesh.position.set(0, 0.125, z);
      streetMesh.receiveShadow = true;
      this.mesh.add(streetMesh);
      
      const centerLineGeom = new THREE.BoxGeometry(800, 0.16, 0.2);
      const centerLine = new THREE.Mesh(centerLineGeom, lineMat);
      centerLine.position.set(0, 0.2, z);
      this.mesh.add(centerLine);
      
      const edgeGeom = new THREE.BoxGeometry(800, 0.16, 0.15);
      for (let side = -1; side <= 1; side += 2) {
        const edge = new THREE.Mesh(edgeGeom, lineMat);
        edge.position.set(0, 0.2, z + side * streetWidth/2);
        this.mesh.add(edge);
      }
      
      this.roads.push({
        type: 'cross',
        centerLine: { x: 0, z },
        direction: 'z',
        length: 800,
        width: streetWidth,
        lanes: 2
      });
    }
  }
  
  addRoadMarkings(roadLength, totalWidth, laneWidth, lanesPerDirection, medianWidth, shoulderWidth) {
    const lineHeight = 0.16;
    
    const yellowLineMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24, roughness: 0.3, metalness: 0.6, emissive: 0xf59e0b, emissiveIntensity: 0.4, flatShading: true
    });
    const whiteLineMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: 0.3, metalness: 0.7, emissive: 0xffffff, emissiveIntensity: 0.3, flatShading: true
    });
    const dashedWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: 0.4, metalness: 0.6, emissive: 0xffffff, emissiveIntensity: 0.15, flatShading: true
    });
    
    const dashedLength = 4;
    const dashedGap = 6;
    
    for (let dir = -1; dir <= 1; dir += 2) {
      const medianEdge = dir * medianWidth / 2;
      
      for (let lane = 0; lane < lanesPerDirection; lane++) {
        if (lane < lanesPerDirection - 1) {
          const lineX = medianEdge + dir * (lane + 1) * laneWidth;
          for (let z = -roadLength/2; z < roadLength/2; z += dashedLength + dashedGap) {
            const lineGeom = new THREE.BoxGeometry(0.15, lineHeight, dashedLength);
            const lineMesh = new THREE.Mesh(lineGeom, dashedWhiteMat);
            lineMesh.position.set(lineX, lineHeight/2, z + dashedLength/2);
            this.mesh.add(lineMesh);
          }
        }
        
        if (lane === 0) {
          const yellowX = medianEdge + dir * 0.15;
          const yellowGeom = new THREE.BoxGeometry(0.15, lineHeight, roadLength);
          for (let offsetDir = -1; offsetDir <= 1; offsetDir += 2) {
            const yellowMesh = new THREE.Mesh(yellowGeom, yellowLineMat);
            yellowMesh.position.set(yellowX + offsetDir * 0.3, lineHeight/2, 0);
            this.mesh.add(yellowMesh);
          }
        }
        
        if (lane === lanesPerDirection - 1) {
          const edgeX = medianEdge + dir * lanesPerDirection * laneWidth;
          const edgeGeom = new THREE.BoxGeometry(0.2, lineHeight, roadLength);
          const edgeMesh = new THREE.Mesh(edgeGeom, whiteLineMat);
          edgeMesh.position.set(edgeX, lineHeight/2, 0);
          this.mesh.add(edgeMesh);
        }
      }
      
      const shoulderLineX = dir * (medianWidth/2 + lanesPerDirection * laneWidth);
      const shoulderLineGeom = new THREE.BoxGeometry(0.15, lineHeight, roadLength);
      const shoulderLineMesh = new THREE.Mesh(shoulderLineGeom, whiteLineMat);
      shoulderLineMesh.position.set(shoulderLineX, lineHeight/2, 0);
      this.mesh.add(shoulderLineMesh);
    }
    
    const centerYellowGeom = new THREE.BoxGeometry(0.3, lineHeight, roadLength);
    const centerYellowMesh = new THREE.Mesh(centerYellowGeom, yellowLineMat);
    centerYellowMesh.position.set(0, lineHeight/2, 0);
    this.mesh.add(centerYellowMesh);
  }
  
  createBuildingsAlongRoads() {
    const buildingTypes = ['tower', 'residential', 'park', 'fireStation', 'policeStation', 'hospital'];
    
    for (let i = 0; i < this.roads.length; i++) {
      const road = this.roads[i];
      if (road.type === 'main') continue;
      
      const blockCount = Math.floor(road.length / this.blockSize);
      const start = -road.length / 2 + this.blockSize / 2;
      
      for (let b = 0; b < blockCount; b++) {
        const offset = start + b * this.blockSize;
        const sideOffset = this.blockSize * 0.6;
        
        for (let s = -1; s <= 1; s += 2) {
          if (Math.random() < 0.7) {
            const type = buildingTypes[Math.floor(Math.random() * buildingTypes.length)];
            let x, z;
            
            if (road.direction === 'x') {
              x = road.centerLine.x + offset;
              z = road.centerLine.z + s * sideOffset;
            } else {
              x = road.centerLine.x + s * sideOffset;
              z = road.centerLine.z + offset;
            }
            
            if (x < this.cityBounds.min.x + 50 || x > this.cityBounds.max.x - 50 ||
                z < this.cityBounds.min.z + 50 || z > this.cityBounds.max.z - 50) {
              continue;
            }
            
            this.createBuilding(type, x, z);
          }
        }
      }
    }
  }
  
  createBuilding(type, x, z) {
    if (type === 'tower') {
      const tower = new Tower(this.materials);
      const height = 40 + Math.random() * 80;
      tower.generate(x, z, height);
      this.scene.add(tower.mesh);
      this.buildings.push(tower);
    } else if (type === 'residential') {
      const block = new ResidentialBlock(this.materials);
      block.generate(x, z);
      this.scene.add(block.mesh);
      this.buildings.push(block);
    } else if (type === 'park') {
      const park = new Park(this.materials);
      const size = 30 + Math.random() * 30;
      park.generate(x, z, size);
      this.scene.add(park.mesh);
      this.buildings.push(park);
    } else if (type === 'fireStation') {
      const station = new FireStation(this.materials);
      station.generate(x, z);
      this.scene.add(station.mesh);
      this.buildings.push(station);
    } else if (type === 'policeStation') {
      const station = new PoliceStation(this.materials);
      station.generate(x, z);
      this.scene.add(station.mesh);
      this.buildings.push(station);
    } else if (type === 'hospital') {
      const hospital = new Hospital(this.materials);
      hospital.generate(x, z);
      this.scene.add(hospital.mesh);
      this.buildings.push(hospital);
    }
  }
  
  createParks() {
    const parkLocations = [
      { x: -200, z: -200, size: 60 },
      { x: 200, z: -200, size: 50 },
      { x: -200, z: 200, size: 50 },
      { x: 200, z: 200, size: 60 }
    ];
    
    for (let i = 0; i < parkLocations.length; i++) {
      const loc = parkLocations[i];
      const park = new Park(this.materials);
      park.generate(loc.x, loc.z, loc.size);
      this.scene.add(park.mesh);
      this.buildings.push(park);
    }
  }
  
  getRoads() {
    return this.roads;
  }
  
  getBuildings() {
    return this.buildings;
  }
}