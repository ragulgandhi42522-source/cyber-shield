/**
 * ForensicLab Training Dashboard Module
 */
import { store } from '../state.js';
import { logger } from '../logger.js';
import { getIcon } from '../utils/icons.js';
import { scenario1 } from '../scenarios/scenario1_usb.js';

export function initDashboardModule(appNavigate) {
  renderDashboard(appNavigate);

  // Subscribe to changes to refresh stats dynamically
  store.subscribe(() => {
    renderDashboard(appNavigate);
  });

  logger.subscribe(() => {
    renderRecentLogs();
  });
}

export function renderDashboard(appNavigate) {
  const container = document.getElementById('dashboard-content');
  if (!container) return;

  const { stats, activeScenario, user } = store.state;

  const hasActive = Boolean(activeScenario);

  container.innerHTML = `
    <!-- Top Welcome Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px;">
      <div>
        <div style="display:flex; align-items:center; gap:8px; margin-bottom: 4px;">
          <span style="font-size: 0.75rem; color: var(--cyan-glow); font-weight:700; text-transform:uppercase; letter-spacing:0.08em;">
            Operational Readiness: Level 2
          </span>
          <span class="badge badge-active">Active Session</span>
        </div>
        <h1 style="font-size: 1.6rem; font-weight: 800; color: #fff;">
          Welcome back, <span class="text-cyan">${user.username}</span>
        </h1>
        <p style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 4px;">
          Digital Forensics Training & Recovery Simulator — Sandbox Environment
        </p>
      </div>

      <div style="display: flex; gap: 12px;">
        <button id="dash-start-new-btn" class="btn btn-primary">
          <span style="width:16px; height:16px;">${getIcon('terminal')}</span>
          Start New Investigation
        </button>
        ${hasActive ? `
          <button id="dash-continue-btn" class="btn btn-cyber-outline">
            <span style="width:16px; height:16px;">${getIcon('refreshCw')}</span>
            Resume Active Case
          </button>
        ` : ''}
      </div>
    </div>

    <!-- 6 Core KPI Stat Cards -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px;">
      <div class="stat-card">
        <div class="stat-icon-wrapper cyan">
          <div style="width:24px;height:24px;">${getIcon('checkCircle')}</div>
        </div>
        <div class="stat-info">
          <span class="stat-label">Investigations Completed</span>
          <span class="stat-value">${stats.completedInvestigations}</span>
          <span class="stat-meta">Target: 10 cases</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrapper blue">
          <div style="width:24px;height:24px;">${getIcon('database')}</div>
        </div>
        <div class="stat-info">
          <span class="stat-label">Investigations Available</span>
          <span class="stat-value">${stats.availableInvestigations}</span>
          <span class="stat-meta">3 Difficulty tiers</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrapper emerald">
          <div style="width:24px;height:24px;">${getIcon('award')}</div>
        </div>
        <div class="stat-info">
          <span class="stat-label">Average Score</span>
          <span class="stat-value">${stats.averageScore}%</span>
          <span class="stat-meta text-green">Passed (+4% this week)</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrapper amber">
          <div style="width:24px;height:24px;">${getIcon('refreshCw')}</div>
        </div>
        <div class="stat-info">
          <span class="stat-label">Files Recovered</span>
          <span class="stat-value">${stats.filesRecoveredTotal}</span>
          <span class="stat-meta">Simulated fragments</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrapper purple">
          <div style="width:24px;height:24px;">${getIcon('shield')}</div>
        </div>
        <div class="stat-info">
          <span class="stat-label">Evidence Accuracy</span>
          <span class="stat-value">${stats.evidenceAccuracy}%</span>
          <span class="stat-meta">High precision</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrapper cyan">
          <div style="width:24px;height:24px;">${getIcon('cpu')}</div>
        </div>
        <div class="stat-info">
          <span class="stat-label">Training Progress</span>
          <span class="stat-value">${stats.trainingProgress}%</span>
          <span class="stat-meta">Tier 2 Investigator</span>
        </div>
      </div>
    </div>

    <!-- Active Investigation Highlight Banner -->
    ${hasActive ? `
      <div class="card" style="margin-bottom: 24px; border-left: 4px solid var(--cyan-glow); background: linear-gradient(135deg, rgba(16, 26, 48, 0.9) 0%, rgba(13, 21, 39, 0.9) 100%);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="display:flex; align-items:center; gap:8px; margin-bottom: 6px;">
              <span class="badge badge-priority-high">IN PROGRESS</span>
              <span class="badge badge-recoverable">${activeScenario.difficulty}</span>
              <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted);">${activeScenario.id}</span>
            </div>
            <h3 style="font-size: 1.15rem; color: #fff; font-weight: 700; margin-bottom: 4px;">
              ${activeScenario.name}
            </h3>
            <p style="color: var(--text-secondary); font-size: 0.82rem; max-width: 700px;">
              ${activeScenario.description}
            </p>
          </div>
          <div style="display:flex; align-items:center; gap: 16px;">
            <div style="text-align: right;">
              <div style="font-size: 0.75rem; color: var(--text-muted);">Recovered / Examined</div>
              <div style="font-family: var(--font-mono); font-size: 1.1rem; color: var(--cyan-glow); font-weight:700;">
                ${store.state.filesRecovered.length} / ${store.state.filesExamined.length} files
              </div>
            </div>
            <button id="resume-investigation-btn" class="btn btn-primary btn-lg">
              Continue Investigation
            </button>
          </div>
        </div>
      </div>
    ` : `
      <div class="card" style="margin-bottom: 24px; border: 1px dashed var(--border-bright); background: rgba(13, 21, 39, 0.4);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 style="font-size: 1.05rem; color: #fff; font-weight: 700; margin-bottom: 4px;">
              No Active Investigation Case Loaded
            </h3>
            <p style="color: var(--text-secondary); font-size: 0.82rem;">
              Select a simulated forensic scenario or load Demo Mode to begin hunting for hidden evidence.
            </p>
          </div>
          <button id="select-scenario-banner-btn" class="btn btn-primary">
            Explore Scenarios
          </button>
        </div>
      </div>
    `}

    <!-- 2 Column Layout: Training History & Live Forensic Audit Trail -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <!-- Training History -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <div class="card-title-icon">${getIcon('bookOpen')}</div>
            Verified Training History
          </div>
          <span class="badge badge-active">Recorded</span>
        </div>
        <div class="table-wrapper">
          <table class="cyber-table">
            <thead>
              <tr>
                <th>Scenario Module</th>
                <th>Score</th>
                <th>Date</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              ${stats.history.map(item => `
                <tr>
                  <td style="font-weight: 600;">${item.scenario}</td>
                  <td style="font-family: var(--font-mono); color: var(--cyan-glow);">${item.score}/100</td>
                  <td style="color: var(--text-muted); font-size: 0.75rem;">${item.date}</td>
                  <td><span class="badge badge-valid">${item.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Real-time Forensic Activity Log -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <div class="card-title-icon">${getIcon('terminal')}</div>
            Investigation Activity Audit Log
          </div>
          <span style="font-size: 0.7rem; color: var(--cyan-glow); font-family: var(--font-mono);">
            LIVE SENSOR
          </span>
        </div>
        <div id="dash-activity-log-box" class="activity-log-box">
          <!-- Populated by renderRecentLogs() -->
        </div>
      </div>
    </div>
  `;

  // Attach button event listeners
  const startNewBtn = document.getElementById('dash-start-new-btn');
  if (startNewBtn) {
    startNewBtn.addEventListener('click', () => appNavigate('scenarios'));
  }

  const continueBtn = document.getElementById('dash-continue-btn');
  if (continueBtn) {
    continueBtn.addEventListener('click', () => appNavigate('explorer'));
  }

  const resumeBtn = document.getElementById('resume-investigation-btn');
  if (resumeBtn) {
    resumeBtn.addEventListener('click', () => appNavigate('explorer'));
  }

  const exploreBannerBtn = document.getElementById('select-scenario-banner-btn');
  if (exploreBannerBtn) {
    exploreBannerBtn.addEventListener('click', () => appNavigate('scenarios'));
  }

  renderRecentLogs();
}

function renderRecentLogs() {
  const logBox = document.getElementById('dash-activity-log-box');
  if (!logBox) return;

  const logs = logger.getLogs();
  if (logs.length === 0) {
    logBox.innerHTML = `
      <div style="color: var(--text-muted); font-style: italic; text-align: center; padding-top: 30px;">
        No investigation activities recorded yet.<br>Start examining files in the Virtual File-System Explorer.
      </div>
    `;
    return;
  }

  logBox.innerHTML = logs.slice(0, 15).map(log => `
    <div class="log-entry">
      <span class="log-time">[${log.timestamp}]</span>
      <span class="log-msg">${escapeHtml(log.action)}</span>
      ${log.details ? `<span style="color: var(--text-muted); font-size: 0.7rem;">(${escapeHtml(log.details)})</span>` : ''}
    </div>
  `).join('');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
