/**
 * ForensicLab Scenario Selection Module
 */
import { store } from '../state.js';
import { allScenarios } from '../scenarios/index.js';
import { showToast } from '../utils/toast.js';
import { getIcon } from '../utils/icons.js';

export function initScenarioSelectModule(appNavigate) {
  renderScenarios(appNavigate);
}

export function renderScenarios(appNavigate) {
  const container = document.getElementById('scenarios-content');
  if (!container) return;

  container.innerHTML = `
    <div style="margin-bottom: 24px;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom: 4px;">
        <span style="font-size: 0.75rem; color: var(--cyan-glow); font-weight:700; text-transform:uppercase; letter-spacing:0.08em;">
          Investigation Catalog
        </span>
        <span class="badge badge-valid">3 Training Scenarios Available</span>
      </div>
      <h1 style="font-size: 1.6rem; font-weight: 800; color: #fff;">
        Select Forensic Investigation Scenario
      </h1>
      <p style="color: var(--text-secondary); font-size: 0.85rem; max-width: 800px; margin-top: 4px;">
        Each sandboxed scenario presents a realistic digital forensic crime case with synthetic file structures, corrupted clusters, timestomping anomalies, and exfiltration logs.
      </p>
    </div>

    <!-- Scenarios 3-Column Grid -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
      ${allScenarios.map(sc => {
        let badgeClass = 'badge-recoverable';
        let accentBorder = 'rgba(0, 240, 255, 0.3)';
        let tierColor = 'var(--cyan-glow)';
        if (sc.difficulty === 'INTERMEDIATE') {
          badgeClass = 'badge-suspicious';
          accentBorder = 'rgba(245, 158, 11, 0.4)';
          tierColor = 'var(--amber-warning)';
        } else if (sc.difficulty === 'ADVANCED') {
          badgeClass = 'badge-invalid';
          accentBorder = 'rgba(244, 63, 94, 0.4)';
          tierColor = 'var(--rose-danger)';
        }

        const isCurrentlyActive = store.state.activeScenario && store.state.activeScenario.id === sc.id;

        return `
          <div class="card" style="border-top: 3px solid ${tierColor}; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <span class="badge ${badgeClass}">${sc.difficulty}</span>
                <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted);">${sc.id}</span>
              </div>

              <h2 style="font-size: 1.2rem; font-weight: 700; color: #fff; margin-bottom: 8px;">
                ${sc.name}
              </h2>

              <p style="color: var(--text-secondary); font-size: 0.82rem; line-height: 1.5; margin-bottom: 20px; min-height: 50px;">
                ${sc.description}
              </p>

              <!-- Scenario Specifications Grid -->
              <div style="background: rgba(10, 16, 30, 0.6); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.75rem; margin-bottom: 20px;">
                <div>
                  <span style="color: var(--text-muted);">Total Files:</span>
                  <strong style="color: #fff; font-family: var(--font-mono); margin-left: 4px;">${sc.targetFilesCount} files</strong>
                </div>
                <div>
                  <span style="color: var(--text-muted);">Est. Duration:</span>
                  <strong style="color: #fff; font-family: var(--font-mono); margin-left: 4px;">${sc.duration}</strong>
                </div>
                <div>
                  <span style="color: var(--text-muted);">Hidden Files:</span>
                  <strong style="color: var(--purple-accent); font-family: var(--font-mono); margin-left: 4px;">${sc.hiddenFilesCount} hidden</strong>
                </div>
                <div>
                  <span style="color: var(--text-muted);">XP / Max Points:</span>
                  <strong style="color: var(--teal-accent); font-family: var(--font-mono); margin-left: 4px;">+${sc.xp} XP (100 pts)</strong>
                </div>
                <div>
                  <span style="color: var(--text-muted);">Deleted Files:</span>
                  <strong style="color: var(--rose-danger); font-family: var(--font-mono); margin-left: 4px;">${sc.deletedFilesCount} deleted</strong>
                </div>
                <div>
                  <span style="color: var(--text-muted);">Key Evidence:</span>
                  <strong style="color: var(--cyan-glow); font-family: var(--font-mono); margin-left: 4px;">${sc.keyEvidenceCount} targets</strong>
                </div>
              </div>
            </div>

            <div>
              <button class="btn btn-primary w-full start-scenario-btn" data-scenario-id="${sc.id}">
                <span style="width:16px;height:16px;">${getIcon('terminal')}</span>
                ${isCurrentlyActive ? 'Continue Investigation' : 'Start Investigation'}
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  // Attach click events
  const buttons = container.querySelectorAll('.start-scenario-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const scId = btn.getAttribute('data-scenario-id');
      const sc = allScenarios.find(s => s.id === scId);
      if (sc) {
        store.startScenario(sc);
        showToast('Scenario Initialized', `Loaded ${sc.name}. File system mounted.`, 'success');
        appNavigate('explorer');
      }
    });
  });
}
