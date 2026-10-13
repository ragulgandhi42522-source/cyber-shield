/**
 * ForensicLab Investigation Activity Audit Logger
 */

class ForensicLogger {
  constructor() {
    this.logs = [];
    this.listeners = [];
  }

  log(action, details = '') {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0]; // HH:MM:SS
    const entry = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      timestamp: timeStr,
      fullTime: now.toISOString(),
      action,
      details
    };

    this.logs.unshift(entry); // newest first
    this.notify(entry);
    return entry;
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify(entry) {
    this.listeners.forEach(fn => fn(entry, this.logs));
  }

  getLogs() {
    return [...this.logs];
  }

  clear() {
    this.logs = [];
    this.notify(null);
  }
}

export const logger = new ForensicLogger();
