import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165/build/three.module.js';
import { FireTruck } from './FireTruck.js';
import { PoliceCar } from './PoliceCar.js';
import { Ambulance } from './Ambulance.js';

const UNIT_IDS = {
  fire: ['ENG-', 'TRK-', 'RES-', 'BAT-'],
  police: ['UNIT-', 'PAT-', 'CRU-', 'INT-'],
  medical: ['AMB-', 'MED-', 'EMS-', 'PAR-']
};

export class UnitManager {
  constructor(scene, city) {
    this.scene = scene;
    this.city = city;
    this.units = [];
    this.unitCounter = 0;
    this.pathfinder = new Pathfinder(city);
  }
  
  spawnInitialUnits() {
    const stations = this.city.getStations();
    
    stations.forEach(station => {
      if (station.type === 'fire') {
        for (let i = 0; i < 2; i++) {
          this.spawnUnit('fire', station);
        }
      } else if (station.type === 'police') {
        for (let i = 0; i < 3; i++) {
          this.spawnUnit('police', station);
        }
      } else if (station.type === 'medical') {
        for (let i = 0; i < 2; i++) {
          this.spawnUnit('medical', station);
        }
      }
    });
    
    for (let i = 0; i < 4; i++) {
      this.spawnPatrolUnit('police');
    }
  }
  
  spawnUnit(type, station) {
    const prefix = UNIT_IDS[type][Math.floor(Math.random() * UNIT_IDS[type].length)];
    const id = `${prefix}${String(this.unitCounter++).padStart(3, '0')}`;
    
    let unit;
    const spawnPos = station.bays ? station.bays[Math.floor(Math.random() * station.bays.length)] : station.position.clone();
    
    switch (type) {
      case 'fire':
        unit = new FireTruck(this.scene, this.city, id, spawnPos);
        break;
      case 'police':
        unit = new PoliceCar(this.scene, this.city, id, spawnPos);
        break;
      case 'medical':
        unit = new Ambulance(this.scene, this.city, id, spawnPos);
        break;
    }
    
    if (unit) {
      unit.station = station;
      unit.homePosition = spawnPos.clone();
      this.units.push(unit);
      this.scene.add(unit.mesh);
    }
    
    return unit;
  }
  
  spawnPatrolUnit(type) {
    const prefix = UNIT_IDS[type][Math.floor(Math.random() * UNIT_IDS[type].length)];
    const id = `${prefix}${String(this.unitCounter++).padStart(3, '0')}`;
    
    let unit;
    const spawnPos = this.city.getRandomRoadPosition();
    
    switch (type) {
      case 'police':
        unit = new PoliceCar(this.scene, this.city, id, spawnPos);
        break;
    }
    
    if (unit) {
      unit.isPatrol = true;
      unit.patrolRoute = this.generatePatrolRoute();
      unit.currentPatrolIndex = 0;
      this.units.push(unit);
      this.scene.add(unit.mesh);
    }
    
    return unit;
  }
  
  generatePatrolRoute() {
    const waypoints = [];
    const count = 5 + Math.floor(Math.random() * 5);
    
    for (let i = 0; i < count; i++) {
      waypoints.push(this.city.getRandomRoadPosition());
    }
    
    return waypoints;
  }
  
  dispatchToIncident(incident, unitType) {
    const availableUnits = this.units.filter(u => 
      u.type === unitType && 
      (u.status === 'idle' || u.status === 'patrol') &&
      !u.assignedIncident
    );
    
    if (availableUnits.length === 0) return null;
    
    let nearest = null;
    let minDist = Infinity;
    
    availableUnits.forEach(unit => {
      const dist = unit.getPosition().distanceTo(incident.getPosition());
      if (dist < minDist) {
        minDist = dist;
        nearest = unit;
      }
    });
    
    if (nearest) {
      nearest.assignIncident(incident);
      incident.assignedUnit = nearest;
      incident.status = 'dispatched';
      
      const station = this.city.getNearestStation(incident.getPosition(), unitType);
      if (station && station.entity.openBay) {
        const bayIndex = station.bays.findIndex(b => b.distanceTo(nearest.getPosition()) < 5);
        if (bayIndex >= 0) station.entity.openBay(bayIndex);
      }
    }
    
    return nearest;
  }
  
  update(delta, elapsed, incidentManager, city) {
    this.units.forEach(unit => {
      unit.update(delta, elapsed, incidentManager, city, this.pathfinder);
    });
    
    this.units = this.units.filter(unit => {
      if (unit.shouldRemove) {
        this.scene.remove(unit.mesh);
        return false;
      }
      return true;
    });
  }
  
  getUnits() {
    return this.units;
  }
  
  getUnitById(id) {
    return this.units.find(u => u.id === id);
  }
  
  getUnitsByType(type) {
    return this.units.filter(u => u.type === type);
  }
  
  getAvailableUnits(type) {
    return this.units.filter(u => u.type === type && u.status === 'idle');
  }
  
  getUnitsByStatus(status) {
    return this.units.filter(u => u.status === status);
  }
}

class Pathfinder {
  constructor(city) {
    this.city = city;
    this.gridSize = 20;
    this.grid = null;
    this.buildGrid();
  }
  
  buildGrid() {
    const bounds = this.city.getCityBounds();
    const width = Math.ceil((bounds.max.x - bounds.min.x) / this.gridSize);
    const depth = Math.ceil((bounds.max.z - bounds.min.z) / this.gridSize);
    
    this.grid = {
      width,
      depth,
      minX: bounds.min.x,
      minZ: bounds.min.z,
      cells: new Array(width * depth).fill(0)
    };
    
    this.city.getBuildings().forEach(building => {
      const pos = building.getPosition();
      const gx = Math.floor((pos.x - this.grid.minX) / this.gridSize);
      const gz = Math.floor((pos.z - this.grid.minZ) / this.gridSize);
      
      if (gx >= 0 && gx < this.grid.width && gz >= 0 && gz < this.grid.depth) {
        this.grid.cells[gz * this.grid.width + gx] = 1;
      }
    });
  }
  
  findPath(start, end) {
    return this.city.findPath(start, end);
  }
  
  isWalkable(x, z) {
    const gx = Math.floor((x - this.grid.minX) / this.gridSize);
    const gz = Math.floor((z - this.grid.minZ) / this.gridSize);
    
    if (gx < 0 || gx >= this.grid.width || gz < 0 || gz >= this.grid.depth) {
      return false;
    }
    
    return this.grid.cells[gz * this.grid.width + gx] === 0;
  }
}