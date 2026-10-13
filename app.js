/**
 * ForensicLab - Main Application Orchestrator & Router
 */
import { store } from './state.js';
import { getIcon } from './utils/icons.js';
import { showToast } from './utils/toast.js';

// Module Inits & Renderers
import { initAuthModule } from './modules/auth.js';
import { initDashboardModule, renderDashboard } from './modules/dashboard.js';
import { initScenarioSelectModule, renderScenarios } from './modules/scenarioSelect.js';
import { initFileExplorerModule, renderExplorer } from './modules/fileExplorer.js';
import { initRecoveryModule, renderRecovery } from './modules/recovery.js';
import { initMetadataModule, renderMetadata } from './modules/metadata.js';
import { initTimelineModule, renderTimeline } from './modules/timeline.js';
import { initEvidenceModule, renderEvidence } from './modules/evidence.js';
import { initResultsModule, renderResults } from './modules/results.js';
import { initScoringModule, renderScore } from './modules/scoring.js';
import { initReportModule, renderReport } from './modules/report.js';

let currentScreen = 'login';
let timerInterval = null;

export function navigateTo(screenName) {
  const screens = [
    'login', 'dashboard', 'scenarios', 'explorer', 
    'recovery', 'metadata', 'timeline', 'evidence', 
    'results', 'score', 'report'
  ];

  if (!screens.includes(screenName)) {
    console.warn(`Screen ${screenName} not recognized.`);
    return;
  }

  // Auth gate
  if (screenName !== 'login' && !store.state.user.isLoggedIn) {
    screenName = 'login';
  }

  currentScreen = screenName;

  // Toggle Screen Containers
  screens.forEach(s => {
    const el = document.getElementById(`screen-${s}`);
    if (el) {
      if (s === screenName) {
        el.classList.add('active');
        el.style.display = (s === 'login') ? 'flex' : 'block';
      } else {
        el.classList.remove('active');
        el.style.display = 'none';
      }
    }
  });

  // Call screen renderer to guarantee fresh state
  if (screenName === 'dashboard') renderDashboard(navigateTo);
  else if (screenName === 'scenarios') renderScenarios(navigateTo);
  else if (screenName === 'explorer') renderExplorer(navigateTo);
  else if (screenName === 'recovery') renderRecovery(navigateTo);
  else if (screenName === 'metadata') renderMetadata(navigateTo);
  else if (screenName === 'timeline') renderTimeline(navigateTo);
  else if (screenName === 'evidence') renderEvidence(navigateTo);
  else if (screenName === 'results') renderResults(navigateTo);
  else if (screenName === 'score') renderScore(navigateTo);
  else if (screenName === 'report') renderReport(navigateTo);

  // Toggle Sidebar & TopBar visibility (Hidden on Login screen)
  const sidebar = document.getElementById('main-sidebar');
  const topbar = document.getElementById('main-topbar');

  if (screenName === 'login') {
    if (sidebar) sidebar.style.display = 'none';
    if (topbar) topbar.style.display = 'none';
  } else {
    if (sidebar) sidebar.style.display = 'flex';
    if (topbar) topbar.style.display = 'flex';
  }

  // Update active sidebar nav link
  document.querySelectorAll('.nav-item').forEach(item => {
    const target = item.getAttribute('data-nav-screen');
    if (target === screenName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Topbar Title / Breadcrumb update
  updateTopbarState();
}

function updateTopbarState() {
  const scenarioBadge = document.getElementById('topbar-scenario-pill');
  if (scenarioBadge) {
    if (store.state.activeScenario) {
      scenarioBadge.innerHTML = `
        <span style="width:7px;height:7px;background:var(--cyan-glow);border-radius:50%;box-shadow:0 0 6px var(--cyan-glow);"></span>
        <span>Case: <strong>${store.state.activeScenario.name}</strong></span>
      `;
      scenarioBadge.style.display = 'flex';
    } else {
      scenarioBadge.style.display = 'none';
    }
  }

  // Badges in sidebar
  const recoveryBadge = document.getElementById('sidebar-recovery-badge');
  if (recoveryBadge) {
    const count = store.state.filesRecovered.length;
    recoveryBadge.textContent = count;
    recoveryBadge.style.display = count > 0 ? 'inline-block' : 'none';
  }

  const evidenceBadge = document.getElementById('sidebar-evidence-badge');
  if (evidenceBadge) {
    const count = store.state.evidenceInventory.length;
    evidenceBadge.textContent = count;
    evidenceBadge.style.display = count > 0 ? 'inline-block' : 'none';
  }

  // Update sidebar user profile with custom username
  const userNameEl = document.getElementById('sidebar-user-name');
  if (userNameEl && store.state.user) {
    userNameEl.textContent = store.state.user.username;
  }

  const userAvatarEl = document.getElementById('sidebar-user-avatar');
  if (userAvatarEl && store.state.user && store.state.user.username) {
    userAvatarEl.textContent = store.state.user.username.slice(0, 2).toUpperCase();
  }
}

function startInvestigationTimer() {
  const timerElement = document.getElementById('investigation-timer-display');
  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    if (!store.state.investigationStartTime || !timerElement) {
      if (timerElement) timerElement.textContent = '00:00:00';
      return;
    }

    const elapsed = Math.floor((Date.now() - store.state.investigationStartTime) / 1000);
    const hrs = String(Math.floor(elapsed / 3600)).padStart(2, '0');
    const mins = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
    const secs = String(elapsed % 60).padStart(2, '0');
    timerElement.textContent = `${hrs}:${mins}:${secs}`;
  }, 1000);
}

// Bootstrap
document.addEventListener('DOMContentLoaded', () => {
  // Inject Sidebar Icons
  document.querySelectorAll('[data-icon]').forEach(el => {
    const iconName = el.getAttribute('data-icon');
    el.innerHTML = getIcon(iconName);
  });

  // Setup Sidebar Click Handlers
  document.querySelectorAll('.nav-item').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('data-nav-screen');
      if (target) navigateTo(target);
    });
  });

  // Logout button
  const logoutBtn = document.getElementById('sidebar-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      store.logout();
      showToast('Logged Out', 'Trainee session safely terminated', 'info');
      navigateTo('login');
    });
  }

  // Initialize Modules
  initAuthModule(navigateTo);
  initDashboardModule(navigateTo);
  initScenarioSelectModule(navigateTo);
  initFileExplorerModule(navigateTo);
  initRecoveryModule(navigateTo);
  initMetadataModule(navigateTo);
  initTimelineModule(navigateTo);
  initEvidenceModule(navigateTo);
  initResultsModule(navigateTo);
  initScoringModule(navigateTo);
  initReportModule(navigateTo);

  // Subscribe to store updates for topbar & timer
  store.subscribe((state, prop) => {
    updateTopbarState();
    if (prop === 'activeScenario') {
      startInvestigationTimer();
    }
  });

  startInvestigationTimer();

  // Initial Route: If user already logged in via persistent state, route to dashboard; else login
  if (store.state.user && store.state.user.isLoggedIn) {
    navigateTo('dashboard');
  } else {
    navigateTo('login');
  }
});
