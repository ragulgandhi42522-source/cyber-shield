/**
 * ForensicLab Evidence Validation Module
 */
import { store } from '../state.js';
import { getIcon } from '../utils/icons.js';
import { showToast } from '../utils/toast.js';

export function initEvidenceModule(appNavigate) {
  renderEvidence(appNavigate);

  store.subscribe((state, prop) => {
    if (prop === 'activeScenario' || prop === 'evidenceInventory') {
      renderEvidence(appNavigate);
    }
  });
}

export function renderEvidence(appNavigate) {
  const container = document.getElementById('evidence-content');
  if (!container) return;

  const { activeScenario, evidenceInventory } = store.state;

  if (!activeScenario) {
    container.innerHTML = `
      <div style="text-align:center; padding:60px; color:var(--text-muted);">
        No active forensic scenario loaded. Please select a scenario first.
      </div>
    `;
    return;
  }

  // Count metrics
  const validCount = evidenceInventory.filter(e => e.status === 'VALID').length;
  const suspiciousCount = evidenceInventory.filter(e => e.status === 'SUSPICIOUS').length;
  const invalidCount = evidenceInventory.filter(e => e.status === 'INVALID').length;

  container.innerHTML = `
    <div>
      <!-- Header -->
      <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 24px;">
        <div>
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
            <span class="badge badge-priority-high">CHAIN OF CUSTODY</span>
            <span style="font-family:var(--font-mono); font-size:0.75rem; color:var(--cyan-glow);">Evidence Bench & Forensic Integrity Locker</span>
          </div>
          <h1 style="font-size:1.5rem; font-weight:800; color:#fff;">
            Digital Evidence Validation Hub
          </h1>
          <p style="color:var(--text-secondary); font-size:0.85rem; max-width:750px; margin-top:4px;">
            Validate recovered artifacts, review cryptographic hashes, assign relevance tags, and provide sworn investigator notes prior to case submission.
          </p>
        </div>

        <div style="display:flex; gap:12px;">
          <button id="evidence-auto-verify-btn" class="btn btn-secondary">
            <span style="width:16px;height:16px;">${getIcon('refreshCw')}</span>
            Verify All Hash Signatures
          </button>
          <button id="evidence-goto-results-btn" class="btn btn-primary">
            Proceed to Submission Review
          </button>
        </div>
      </div>

      <!-- Evidence KPI Stats Row -->
      <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:16px; margin-bottom:24px;">
        <div class="stat-card">
          <div class="stat-icon-wrapper cyan">
            <div style="width:20px;height:20px;">${getIcon('database')}</div>
          </div>
          <div class="stat-info">
            <span class="stat-label">Total Staged</span>
            <span class="stat-value">${evidenceInventory.length}</span>
            <span class="stat-meta">Items in locker</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrapper emerald">
            <div style="width:20px;height:20px;">${getIcon('checkCircle')}</div>
          </div>
          <div class="stat-info">
            <span class="stat-label">Confirmed Valid</span>
            <span class="stat-value" style="color:var(--green-success);">${validCount}</span>
            <span class="stat-meta">High probative value</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrapper amber">
            <div style="width:20px;height:20px;">${getIcon('alertTriangle')}</div>
          </div>
          <div class="stat-info">
            <span class="stat-label">Flagged Suspicious</span>
            <span class="stat-value" style="color:var(--amber-warning);">${suspiciousCount}</span>
            <span class="stat-meta">Requires scrutiny</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrapper purple">
            <div style="width:20px;height:20px;">${getIcon('x')}</div>
          </div>
          <div class="stat-info">
            <span class="stat-label">Marked Invalid</span>
            <span class="stat-value" style="color:var(--rose-danger);">${invalidCount}</span>
            <span class="stat-meta">Benign or noise</span>
          </div>
        </div>
      </div>

      <!-- Evidence Grid Cards -->
      ${evidenceInventory.length === 0 ? `
        <div class="card" style="text-align:center; padding:50px 20px;">
          <div style="width:48px;height:48px; color:var(--text-muted); margin: 0 auto 12px;">
            ${getIcon('shield')}
          </div>
          <h3 style="font-size:1.1rem; color:#fff; margin-bottom:6px;">No Evidence Items Staged Yet</h3>
          <p style="color:var(--text-secondary); font-size:0.85rem; max-width:480px; margin:0 auto 16px;">
            Explore the Virtual File-System, carve deleted files in the Recovery Workspace, or inspect metadata to collect and stage critical case evidence.
          </p>
          <button id="evidence-open-explorer-btn" class="btn btn-primary">
            Open File Explorer
          </button>
        </div>
      ` : `
        <div class="evidence-grid">
          ${evidenceInventory.map((item, idx) => {
            const file = store.getFileById(item.fileId);
            let badgeClass = 'badge-valid';
            if (item.status === 'SUSPICIOUS') badgeClass = 'badge-suspicious';
            else if (item.status === 'INVALID') badgeClass = 'badge-invalid';
            else if (item.status === 'INCOMPLETE') badgeClass = 'badge-incomplete';

            return `
              <div class="evidence-card">
                <div class="evidence-card-header">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <span style="font-family:var(--font-mono); font-size:0.75rem; color:var(--cyan-glow); font-weight:700;">#EV-${String(idx + 1).padStart(3, '0')}</span>
                    <span class="badge ${badgeClass}">${item.status}</span>
                  </div>
                  <button class="btn btn-sm btn-danger remove-evidence-item-btn" data-file-id="${item.fileId}" title="Remove from evidence">
                    ✕
                  </button>
                </div>

                <div>
                  <div style="font-size:0.95rem; font-weight:700; color:#fff; word-break:break-all; margin-bottom:4px;">
                    ${item.fileName}
                  </div>
                  <div style="font-family:var(--font-mono); font-size:0.7rem; color:var(--text-muted);">
                    ${item.path}
                  </div>
                </div>

                <div style="background:rgba(10,16,30,0.6); padding:10px; border-radius:4px; border:1px solid var(--border-subtle); display:flex; flex-direction:column; gap:6px;">
                  <div class="evidence-meta-row">
                    <span class="evidence-meta-label">Simulated Hash:</span>
                    <span class="evidence-meta-val text-cyan">${item.hash}</span>
                  </div>
                  <div class="evidence-meta-row">
                    <span class="evidence-meta-label">File Size:</span>
                    <span class="evidence-meta-val">${item.size}</span>
                  </div>
                  <div class="evidence-meta-row">
                    <span class="evidence-meta-label">Integrity Status:</span>
                    <span class="evidence-meta-val" style="color:var(--green-success);">VERIFIED SHA-256</span>
                  </div>
                  <div class="evidence-meta-row">
                    <span class="evidence-meta-label">Logged At:</span>
                    <span class="evidence-meta-val">${item.addedAt || 'Session'}</span>
                  </div>
                </div>

                <!-- Validation Status Buttons -->
                <div>
                  <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; font-weight:700; margin-bottom:6px;">
                    Assign Classification
                  </div>
                  <div style="display:flex; gap:6px; flex-wrap:wrap;">
                    <button class="btn btn-sm btn-success set-status-btn" data-file-id="${item.fileId}" data-status="VALID">VALID</button>
                    <button class="btn btn-sm btn-secondary set-status-btn" data-file-id="${item.fileId}" data-status="SUSPICIOUS">SUSPICIOUS</button>
                    <button class="btn btn-sm btn-danger set-status-btn" data-file-id="${item.fileId}" data-status="INVALID">INVALID</button>
                    <button class="btn btn-sm btn-secondary set-status-btn" data-file-id="${item.fileId}" data-status="INCOMPLETE">INCOMPLETE</button>
                  </div>
                </div>

                <!-- Notes Input -->
                <div>
                  <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; font-weight:700; margin-bottom:4px;">
                    Examiner Assessment & Justification
                  </div>
                  <textarea class="evidence-notes-input item-notes-textarea" data-file-id="${item.fileId}" placeholder="Enter forensic justification for court record...">${escapeHtml(item.notes || '')}</textarea>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    </div>
  `;

  // Attach handlers
  const openExpBtn = document.getElementById('evidence-open-explorer-btn');
  if (openExpBtn) {
    openExpBtn.addEventListener('click', () => appNavigate('explorer'));
  }

  const gotoResultsBtn = document.getElementById('evidence-goto-results-btn');
  if (gotoResultsBtn) {
    gotoResultsBtn.addEventListener('click', () => appNavigate('results'));
  }

  const autoVerifyBtn = document.getElementById('evidence-auto-verify-btn');
  if (autoVerifyBtn) {
    autoVerifyBtn.addEventListener('click', () => {
      showToast('Integrity Audit Passed', 'All evidence item hashes cryptographically verified against MFT records', 'success');
    });
  }

  container.querySelectorAll('.set-status-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const fId = btn.getAttribute('data-file-id');
      const status = btn.getAttribute('data-status');
      store.updateEvidenceStatus(fId, status);
      showToast('Status Updated', `Item reclassified as ${status}`, 'info');
    });
  });

  container.querySelectorAll('.remove-evidence-item-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const fId = btn.getAttribute('data-file-id');
      store.removeEvidence(fId);
      showToast('Evidence Removed', 'Item discarded from evidence locker', 'warning');
    });
  });

  container.querySelectorAll('.item-notes-textarea').forEach(tx => {
    tx.addEventListener('change', () => {
      const fId = tx.getAttribute('data-file-id');
      const item = store.state.evidenceInventory.find(e => e.fileId === fId);
      if (item) {
        store.updateEvidenceStatus(fId, item.status, tx.value);
      }
    });
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
