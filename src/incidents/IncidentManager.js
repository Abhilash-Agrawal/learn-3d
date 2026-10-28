import * as THREE from 'three';
import { FireIncident } from './FireIncident.js';
import { TrafficIncident } from './TrafficIncident.js';
import { MedicalIncident } from './MedicalIncident.js';

const INCIDENT_TYPES = ['fire', 'traffic', 'medical'];
const INCIDENT_IDS = {
  fire: ['FIRE-', 'BLAZE-', 'IGN-', 'COMB-'],
  traffic: ['CRASH-', 'COLL-', 'PILE-', 'WRECK-'],
  medical: ['MED-', 'EMS-', 'AID-', 'RESC-']
};

export class IncidentManager {
  constructor(scene, city) {
    this.scene = scene;
    this.city = city;
    this.incidents = [];
    this.nextId = 1;
    this.spawnTimer = 0;
    this.spawnInterval = 15000;
    this.maxIncidents = 8;
    
    this.incidentCounter = 0;
  }
  
  spawnInitialIncidents() {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => this.spawnRandomIncident(), i * 3000);
    }
  }
  
  spawnRandomIncident() {
    if (this.incidents.length >= this.maxIncidents) return;
    
    const type = INCIDENT_TYPES[Math.floor(Math.random() * INCIDENT_TYPES.length)];
    const position = this.city.getRandomRoadPosition();
    
    this.spawnIncident(type, position);
  }
  
  spawnIncident(type, position) {
    let incident;
    const prefix = INCIDENT_IDS[type][Math.floor(Math.random() * INCIDENT_IDS[type].length)];
    const id = `${prefix}${String(this.incidentCounter++).padStart(4, '0')}`;
    
    switch (type) {
      case 'fire':
        incident = new FireIncident(this.scene, this.city, id, position);
        break;
      case 'traffic':
        incident = new TrafficIncident(this.scene, this.city, id, position);
        break;
      case 'medical':
        incident = new MedicalIncident(this.scene, this.city, id, position);
        break;
    }
    
    if (incident) {
      incident.status = 'reported';
      incident.reportedTime = Date.now();
      this.incidents.push(incident);
      this.scene.add(incident.mesh);
      
      if (window.sirenApp && window.sirenApp.uiManager) {
        window.sirenApp.uiManager.addIncidentToTracker(incident);
      }
    }
    
    return incident;
  }
  
  update(delta, elapsed, unitManager) {
    this.spawnTimer += delta * 1000;
    
    if (this.spawnTimer >= this.spawnInterval && Math.random() < 0.001 * delta * 60) {
      this.spawnRandomIncident();
      this.spawnTimer = 0;
      this.spawnInterval = 10000 + Math.random() * 20000;
    }
    
    this.incidents.forEach(incident => {
      incident.update(delta, elapsed, unitManager);
    });
    
    this.incidents = this.incidents.filter(incident => {
      if (incident.status === 'closed' && incident.closeTimer > 5) {
        this.scene.remove(incident.mesh);
        if (incident.labelObject) {
          this.scene.remove(incident.labelObject);
        }
        return false;
      }
      return true;
    });
  }
  
  getIncidents() {
    return this.incidents;
  }
  
  getIncidentById(id) {
    return this.incidents.find(i => i.id === id);
  }
  
  getActiveIncidents() {
    return this.incidents.filter(i => i.status !== 'closed');
  }
  
  getIncidentsByStatus(status) {
    return this.incidents.filter(i => i.status === status);
  }
}