/**
 * ForensicLab Global Investigation State Manager
 */
import { logger } from './logger.js';

const STORAGE_KEY = 'forensiclab_investigation_state_v1';

class StateStore {
  constructor() {
    this.listeners = [];
    this.resetToDefaults();
    this.loadFromStorage();
  }

  resetToDefaults() {
    this.state = {
      user: {
        username: 'trainee',
        fullName: 'Alex Vance (Trainee #4412)',
        role: 'Digital Forensics Investigator Trainee',
        isLoggedIn: false
      },
      stats: {
        completedInvestigations: 4,
        availableInvestigations: 6,
        averageScore: 86,
        filesRecoveredTotal: 18,
        evidenceAccuracy: 91,
        trainingProgress: 68,
        history: [
          { scenario: 'RAM Acquisition 101', score: 92, date: '2026-09-18', status: 'Passed' },
          { scenario: 'Phishing Email Header Analysis', score: 88, date: '2026-09-19', status: 'Passed' },
          { scenario: 'Basic Disk Imaging', score: 84, date: '2026-09-20', status: 'Passed' },
          { scenario: 'Registry Persistence Hunting', score: 80, date: '2026-09-21', status: 'Passed' }
        ]
      },
      activeScenario: null,
      currentPath: '/Users/Alex/Documents/',
      selectedFileId: null,
      filesExamined: [],
      filesRecovered: [],
      hiddenFilesFound: [],
      metadataReviewed: [],
      flaggedAnomalies: {},
      timelineEvents: [],
      evidenceInventory: [],
      investigationStartTime: null,
      investigationEndTime: null,
      finalScore: null,
      finalFeedback: null
    };
  }

  saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = { ...this.state, ...parsed };
      }
    } catch (e) {
      console.warn('LocalStorage load failed:', e);
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify(changedProp) {
    this.saveToStorage();
    this.listeners.forEach(fn => fn(this.state, changedProp));
  }

  // Auth
  login(username) {
    const cleanName = username.trim() || 'Trainee';
    this.state.user.username = cleanName;
    this.state.user.fullName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1) + ' (Investigator)';
    this.state.user.isLoggedIn = true;
    logger.log('Investigator logged in', `User: ${cleanName}`);
    this.notify('user');
  }

  logout() {
    this.state.user.isLoggedIn = false;
    logger.log('Trainee logged out');
    this.notify('user');
  }

  // Scenario Initialization
  startScenario(scenarioData) {
    this.state.activeScenario = JSON.parse(JSON.stringify(scenarioData));
    this.state.currentPath = '/Users/Alex/Documents/';
    this.state.selectedFileId = null;
    this.state.filesExamined = [];
    this.state.filesRecovered = [];
    this.state.hiddenFilesFound = [];
    this.state.metadataReviewed = [];
    this.state.flaggedAnomalies = {};
    this.state.timelineEvents = [];
    this.state.evidenceInventory = [];
    this.state.investigationStartTime = Date.now();
    this.state.investigationEndTime = null;
    this.state.finalScore = null;
    this.state.finalFeedback = null;

    logger.log('Started investigation', `Scenario: ${scenarioData.name} (${scenarioData.difficulty})`);
    this.notify('activeScenario');
  }

  setCurrentPath(path) {
    this.state.currentPath = path;
    logger.log(`Opened folder ${path}`);
    this.notify('currentPath');
  }

  selectFile(fileId) {
    this.state.selectedFileId = fileId;
    if (fileId && !this.state.filesExamined.includes(fileId)) {
      this.state.filesExamined.push(fileId);
      const file = this.getFileById(fileId);
      if (file) {
        logger.log(`Inspected file: ${file.name}`);
        if (file.hidden && !this.state.hiddenFilesFound.includes(fileId)) {
          this.state.hiddenFilesFound.push(fileId);
          logger.log(`Discovered hidden file: ${file.name}`);
        }
      }
    }
    this.notify('selectedFileId');
  }

  recoverFile(fileId) {
    if (!this.state.activeScenario) return;
    const file = this.getFileById(fileId);
    if (!file) return;

    if (!this.state.filesRecovered.includes(fileId)) {
      this.state.filesRecovered.push(fileId);
      const isCorrupt = file.status === 'CORRUPTED' || !file.recoverable;
      file.status = isCorrupt ? 'SALVAGED' : 'RECOVERED';
      logger.log(`Recovered file: ${file.name} (${file.status})`);
      
      // Automatically stage in evidence candidate pool if important
      if (!this.state.evidenceInventory.some(e => e.fileId === fileId)) {
        this.addEvidence(fileId, isCorrupt ? 'Salvaged residual artifact from damaged/wiped sectors' : 'Recovered from deleted sectors');
      }
      this.notify('filesRecovered');
    }
  }

  reviewMetadata(fileId) {
    if (!this.state.metadataReviewed.includes(fileId)) {
      this.state.metadataReviewed.push(fileId);
      const file = this.getFileById(fileId);
      if (file) {
        logger.log(`Viewed metadata: ${file.name}`);
      }
      this.notify('metadataReviewed');
    }
  }

  toggleAnomalyFlag(fileId, note = '') {
    if (this.state.flaggedAnomalies[fileId]) {
      delete this.state.flaggedAnomalies[fileId];
      logger.log(`Removed anomaly flag for file ID: ${fileId}`);
    } else {
      this.state.flaggedAnomalies[fileId] = note || 'Flagged suspicious anomaly';
      const file = this.getFileById(fileId);
      logger.log(`Flagged suspicious metadata anomaly: ${file ? file.name : fileId}`);
    }
    this.notify('flaggedAnomalies');
  }

  // Evidence Bench
  addEvidence(fileId, notes = '') {
    const file = this.getFileById(fileId);
    if (!file) return;
    if (this.state.evidenceInventory.some(e => e.fileId === fileId)) return;

    this.state.evidenceInventory.push({
      fileId: file.id,
      fileName: file.name,
      path: file.path,
      type: file.type,
      size: file.size,
      status: file.importance === 'HIGH' ? 'VALID' : 'SUSPICIOUS',
      hash: file.hash,
      notes: notes || file.anomalyNotes || 'Collected during forensics sweep',
      verified: true,
      addedAt: new Date().toLocaleTimeString()
    });

    logger.log(`Added file to evidence: ${file.name}`);
    this.notify('evidenceInventory');
  }

  updateEvidenceStatus(fileId, newStatus, notes) {
    const item = this.state.evidenceInventory.find(e => e.fileId === fileId);
    if (item) {
      item.status = newStatus;
      if (notes !== undefined) item.notes = notes;
      logger.log(`Updated evidence status for ${item.fileName}: ${newStatus}`);
      this.notify('evidenceInventory');
    }
  }

  removeEvidence(fileId) {
    const item = this.state.evidenceInventory.find(e => e.fileId === fileId);
    this.state.evidenceInventory = this.state.evidenceInventory.filter(e => e.fileId !== fileId);
    if (item) {
      logger.log(`Removed evidence: ${item.fileName}`);
    }
    this.notify('evidenceInventory');
  }

  // Timeline
  addTimelineEvent(event) {
    if (!this.state.timelineEvents.some(e => e.id === event.id)) {
      this.state.timelineEvents.push(event);
      logger.log(`Added timeline event: ${event.title}`);
      this.notify('timelineEvents');
    }
  }

  removeTimelineEvent(eventId) {
    const evt = this.state.timelineEvents.find(e => e.id === eventId);
    this.state.timelineEvents = this.state.timelineEvents.filter(e => e.id !== eventId);
    if (evt) {
      logger.log(`Removed timeline event: ${evt.title}`);
    }
    this.notify('timelineEvents');
  }

  moveTimelineEvent(fromIndex, toIndex) {
    if (toIndex < 0 || toIndex >= this.state.timelineEvents.length) return;
    const item = this.state.timelineEvents.splice(fromIndex, 1)[0];
    this.state.timelineEvents.splice(toIndex, 0, item);
    logger.log('Reordered timeline sequence');
    this.notify('timelineEvents');
  }

  // Helpers
  getFileById(id) {
    if (!this.state.activeScenario || !this.state.activeScenario.files) return null;
    return this.state.activeScenario.files.find(f => f.id === id) || null;
  }
}

export const store = new StateStore();
