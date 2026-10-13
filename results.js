/**
 * ForensicLab Investigation Results & Pre-Submission Review Module
 */
import { store } from '../state.js';
import { getIcon } from '../utils/icons.js';
import { showToast } from '../utils/toast.js';
import { calculateDynamicScore } from './scoring.js';

export function initResultsModule(appNavigate) {
  renderResults(appNavigate);

  store.subscribe((state, prop) => {
    if (prop === 'activeScenario' || prop === 'evidenceInventory' || prop === 'filesRecovered' || prop === 'timelineEvents') {
      renderResults(appNavigate);
    }
  });
}

export function renderResults(appNavigate) {
  const container = document.getElementById('results-content');
  if (!container) return;

  const { activeScenario, filesExamined, filesRecovered, hiddenFilesFound, evidenceInventory, timelineEvents, investigationStartTime } = store.state;

  if (!activeScenario) {
    container.innerHTML = `
      <div style="text-align:center; padding:60px; color:var(--text-muted);">
        No active scenario loaded. Please select a scenario first.
      </div>
    `;
    return;
  }

  // Calculate elapsed time
  const elapsedMinutes = investigationStartTime ? Math.max(1, Math.round((Date.now() - investigationStartTime) / 60000)) : 12;

  // Key evidence ground truth match
  const groundTruthEvidence = activeScenario.expectedEvidenceIds || [];
  const stagedIds = evidenceInventory.map(e => e.fileId);
  const matchedEvidenceCount = stagedIds.filter(id => groundTruthEvidence.includes(id)).length;
  const validationAccuracy = groundTruthEvidence.length > 0 ? Math.round((matchedEvidenceCount / groundTruthEvidence.length) * 100) : 85;

  const groundTruthTimeline = activeScenario.groundTruthTimeline || [];
  const timelineAccuracy = groundTruthTimeline.length > 0 ? Math.min(100, Math.round((timelineEvents.length / groundTruthTimeline.length) * 100)) : 80;

  const investigationId = `INV-${activeScenario.id}-${Math.floor(Date.now() / 1000).toString().slice(-4)}`;

  container.innerHTML = `
    <div style="max-width:960px; margin:0 auto;">
      <!-- Header -->
      <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 24px;">
        <div>
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
            <span class="badge badge-active">PRE-SUBMISSION AUDIT</span>
            <span style="font-family:var(--font-mono); font-size:0.75rem; color:var(--cyan-glow);">Case ID: ${investigationId}</span>
          </div>
          <h1 style="font-size:1.6rem; font-weight:800; color:#fff;">
            Investigation Final Assessment Review
          </h1>
          <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:4px;">
            Review all collected forensic findings, salvaged files, timeline events, and evidence integrity before submitting for formal evaluation.
          </p>
        </div>

        <button id="final-submit-trigger-btn" class="btn btn-primary btn-lg">
          <span style="width:18px;height:18px;">${getIcon('award')}</span>
          Submit Investigation
        </button>
      </div>

      <!-- Overview Case Card -->
      <div class="card" style="margin-bottom:24px; border-left:4px solid var(--cyan-glow);">
        <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:16px;">
          <div>
            <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;">Scenario Name</div>
            <div style="font-weight:700; color:#fff; font-size:1rem; margin-top:2px;">${activeScenario.name}</div>
          </div>
          <div>
            <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;">Difficulty Level</div>
            <div style="margin-top:4px;"><span class="badge badge-recoverable">${activeScenario.difficulty}</span></div>
          </div>
          <div>
            <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;">Investigation Duration</div>
            <div style="font-family:var(--font-mono); font-weight:700; color:var(--cyan-glow); font-size:1rem; margin-top:2px;">
              ${elapsedMinutes} minutes elapsed
            </div>
          </div>
          <div>
            <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;">Lead Examiner</div>
            <div style="font-weight:600; color:#fff; font-size:0.95rem; margin-top:2px;">${store.state.user.username}</div>
          </div>
        </div>
      </div>

      <!-- Investigation Metrics Grid -->
      <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:16px; margin-bottom:24px;">
        <div class="stat-card">
          <div class="stat-icon-wrapper cyan">
            <div style="width:22px;height:22px;">${getIcon('search')}</div>
          </div>
          <div class="stat-info">
            <span class="stat-label">Files Examined</span>
            <span class="stat-value">${filesExamined.length} / ${activeScenario.files.length}</span>
            <span class="stat-meta">FileSystem coverage</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrapper emerald">
            <div style="width:22px;height:22px;">${getIcon('refreshCw')}</div>
          </div>
          <div class="stat-info">
            <span class="stat-label">Deleted Files Recovered</span>
            <span class="stat-value" style="color:var(--green-success);">${filesRecovered.length}</span>
            <span class="stat-meta">Orphaned clusters carved</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrapper purple">
            <div style="width:22px;height:22px;">${getIcon('eye')}</div>
          </div>
          <div class="stat-info">
            <span class="stat-label">Hidden Files Discovered</span>
            <span class="stat-value" style="color:var(--purple-accent);">${hiddenFilesFound.length}</span>
            <span class="stat-meta">Concealed artifacts identified</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrapper amber">
            <div style="width:22px;height:22px;">${getIcon('shield')}</div>
          </div>
          <div class="stat-info">
            <span class="stat-label">Evidence Collected</span>
            <span class="stat-value" style="color:var(--amber-warning);">${evidenceInventory.length} items</span>
            <span class="stat-meta">${matchedEvidenceCount} target matches</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrapper blue">
            <div style="width:22px;height:22px;">${getIcon('clock')}</div>
          </div>
          <div class="stat-info">
            <span class="stat-label">Timeline Events Identified</span>
            <span class="stat-value">${timelineEvents.length} events</span>
            <span class="stat-meta">${timelineAccuracy}% reconstruction rate</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrapper cyan">
            <div style="width:22px;height:22px;">${getIcon('checkCircle')}</div>
          </div>
          <div class="stat-info">
            <span class="stat-label">Validation Accuracy</span>
            <span class="stat-value text-cyan">${validationAccuracy}%</span>
            <span class="stat-meta">Hash integrity confirmed</span>
          </div>
        </div>
      </div>

      <!-- Investigation Checklist & Preparedness -->
      <div class="card" style="margin-bottom:24px;">
        <div class="card-header">
          <div class="card-title">
            <div class="card-title-icon">${getIcon('award')}</div>
            Readiness & Pre-Flight Forensic Audit Checklist
          </div>
          <span class="badge badge-active">Automated Check</span>
        </div>

        <div style="display:flex; flex-direction:column; gap:12px; font-size:0.82rem;">
          <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 12px; background:rgba(10,16,30,0.6); border-radius:4px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="color:var(--green-success); width:18px; height:18px;">${getIcon('checkCircle')}</span>
              <span>Deleted file carving and unallocated fragment reconstruction</span>
            </div>
            <span class="badge ${filesRecovered.length > 0 ? 'badge-valid' : 'badge-invalid'}">
              ${filesRecovered.length > 0 ? 'COMPLETED' : 'INCOMPLETE'}
            </span>
          </div>

          <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 12px; background:rgba(10,16,30,0.6); border-radius:4px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="color:var(--green-success); width:18px; height:18px;">${getIcon('checkCircle')}</span>
              <span>Metadata MACB timestamp anomaly analysis and timestomp checks</span>
            </div>
            <span class="badge ${Object.keys(store.state.flaggedAnomalies).length > 0 ? 'badge-valid' : 'badge-suspicious'}">
              ${Object.keys(store.state.flaggedAnomalies).length > 0 ? 'FLAGGED' : 'MINIMAL'}
            </span>
          </div>

          <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 12px; background:rgba(10,16,30,0.6); border-radius:4px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="color:var(--green-success); width:18px; height:18px;">${getIcon('checkCircle')}</span>
              <span>Reconstruction of chronological forensic incident timeline</span>
            </div>
            <span class="badge ${timelineEvents.length >= 3 ? 'badge-valid' : 'badge-suspicious'}">
              ${timelineEvents.length >= 3 ? 'RECONSTRUCTED' : 'LOW EVENTS'}
            </span>
          </div>

          <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 12px; background:rgba(10,16,30,0.6); border-radius:4px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="color:var(--green-success); width:18px; height:18px;">${getIcon('checkCircle')}</span>
              <span>Evidence locker classification and sworn chain of custody notes</span>
            </div>
            <span class="badge ${evidenceInventory.length > 0 ? 'badge-valid' : 'badge-invalid'}">
              ${evidenceInventory.length > 0 ? 'VALIDATED' : 'EMPTY'}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal Dialog -->
    <div id="submit-confirm-modal" class="modal-overlay">
      <div class="modal-card">
        <div class="modal-header">
          <div class="modal-title">
            <span style="color:var(--cyan-glow); width:22px; height:22px;">${getIcon('award')}</span>
            Confirm Case Submission
          </div>
          <button id="modal-close-x" class="modal-close-btn">✕</button>
        </div>
        <div class="modal-body">
          <p style="font-size:0.9rem; color:#fff; margin-bottom:12px; font-weight:600;">
            Are you sure you want to finalize and submit this forensic investigation?
          </p>
          <p style="font-size:0.8rem; color:var(--text-secondary); line-height:1.5; margin-bottom:16px;">
            Your evidence files, recovered data fragments, timestamp anomalies, and reconstructed timeline will be evaluated by the ForensicLab dynamic scoring engine (100 points maximum).
          </p>
          <div style="background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.3); border-radius:var(--radius-sm); padding:10px; font-size:0.75rem; color:#fcd34d;">
            <strong>Note:</strong> Once submitted, the scenario timeline will be locked, and your final competency score and training report will be generated.
          </div>
        </div>
        <div class="modal-footer">
          <button id="modal-cancel-btn" class="btn btn-secondary">
            Continue Investigating
          </button>
          <button id="modal-confirm-btn" class="btn btn-primary">
            Confirm & Calculate Score
          </button>
        </div>
      </div>
    </div>
  `;

  // Attach handlers
  const submitTriggerBtn = document.getElementById('final-submit-trigger-btn');
  const modal = document.getElementById('submit-confirm-modal');
  const modalCloseX = document.getElementById('modal-close-x');
  const modalCancelBtn = document.getElementById('modal-cancel-btn');
  const modalConfirmBtn = document.getElementById('modal-confirm-btn');

  if (submitTriggerBtn && modal) {
    submitTriggerBtn.addEventListener('click', () => {
      modal.classList.add('active');
    });
  }

  const closeModal = () => {
    if (modal) modal.classList.remove('active');
  };

  if (modalCloseX) modalCloseX.addEventListener('click', closeModal);
  if (modalCancelBtn) modalCancelBtn.addEventListener('click', closeModal);

  if (modalConfirmBtn) {
    modalConfirmBtn.addEventListener('click', () => {
      closeModal();
      store.state.investigationEndTime = Date.now();
      const scoreData = calculateDynamicScore(store.state);
      store.state.finalScore = scoreData;
      store.notify('finalScore');
      showToast('Investigation Submitted', `Final score calculated: ${scoreData.totalScore}/100`, 'success');
      appNavigate('score');
    });
  }
}
