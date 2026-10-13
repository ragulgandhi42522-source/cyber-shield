/**
 * ForensicLab Metadata Analysis Module
 */
import { store } from '../state.js';
import { getIcon } from '../utils/icons.js';
import { showToast } from '../utils/toast.js';

export function initMetadataModule(appNavigate) {
  renderMetadata(appNavigate);

  store.subscribe((state, prop) => {
    if (prop === 'activeScenario' || prop === 'selectedFileId' || prop === 'flaggedAnomalies') {
      renderMetadata(appNavigate);
    }
  });
}

export function renderMetadata(appNavigate) {
  const container = document.getElementById('metadata-content');
  if (!container) return;

  const { activeScenario, selectedFileId, flaggedAnomalies } = store.state;

  if (!activeScenario) {
    container.innerHTML = `
      <div style="text-align:center; padding:60px; color:var(--text-muted);">
        No active scenario loaded. Please select a scenario first.
      </div>
    `;
    return;
  }

  const allFiles = activeScenario.files;
  const currentFile = selectedFileId ? allFiles.find(f => f.id === selectedFileId) || allFiles[0] : allFiles[0];

  const isFlagged = currentFile ? Boolean(flaggedAnomalies[currentFile.id]) : false;

  container.innerHTML = `
    <div>
      <!-- Header -->
      <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 24px;">
        <div>
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
            <span class="badge badge-priority-high">MACB TIMESTAMPS</span>
            <span style="font-family:var(--font-mono); font-size:0.75rem; color:var(--cyan-glow);">MFT / Ext4 Inode In-Depth Attribute Parser</span>
          </div>
          <h1 style="font-size:1.5rem; font-weight:800; color:#fff;">
            File Metadata & Anomaly Inspector
          </h1>
          <p style="color:var(--text-secondary); font-size:0.85rem; max-width:750px; margin-top:4px;">
            Examine Modified, Accessed, Created, and Born (MACB) temporal artifacts, verify cryptographic hash integrity, and identify anti-forensic timestomping or owner privilege anomalies.
          </p>
        </div>

        <div style="display:flex; gap:12px;">
          <select id="meta-file-selector" class="search-input" style="width:260px; height:38px;">
            ${allFiles.map(f => `
              <option value="${f.id}" ${currentFile && currentFile.id === f.id ? 'selected' : ''}>
                ${f.name} (${f.type})
              </option>
            `).join('')}
          </select>
        </div>
      </div>

      ${currentFile ? `
        <!-- Main Dual Panel: Metadata Ledger + Forensic Anomaly Diagnostics -->
        <div style="display:grid; grid-template-columns: 1fr 400px; gap:24px;">
          <!-- Left: Deep Metadata Sheet -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">
                <div class="card-title-icon">${getIcon('fileText')}</div>
                <span>Forensic Inode Metadata: <strong style="color:var(--cyan-glow);">${currentFile.name}</strong></span>
              </div>
              <span class="badge ${currentFile.importance === 'HIGH' ? 'badge-priority-high' : 'badge-priority-low'}">
                ${currentFile.importance} PRIORITY
              </span>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:24px;">
              <!-- File Identity Block -->
              <div style="background:rgba(15,23,42,0.6); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:16px;">
                <div style="font-size:0.75rem; font-weight:700; color:var(--cyan-glow); text-transform:uppercase; margin-bottom:12px; letter-spacing:0.05em;">
                  File Characteristics
                </div>
                <div class="evidence-meta-row" style="margin-bottom:8px;">
                  <span class="evidence-meta-label">File Name:</span>
                  <span class="evidence-meta-val" style="color:#fff; font-weight:600;">${currentFile.name}</span>
                </div>
                <div class="evidence-meta-row" style="margin-bottom:8px;">
                  <span class="evidence-meta-label">File Type:</span>
                  <span class="evidence-meta-val">${currentFile.type} Document</span>
                </div>
                <div class="evidence-meta-row" style="margin-bottom:8px;">
                  <span class="evidence-meta-label">File Size:</span>
                  <span class="evidence-meta-val">${currentFile.size}</span>
                </div>
                <div class="evidence-meta-row" style="margin-bottom:8px;">
                  <span class="evidence-meta-label">File Path:</span>
                  <span class="evidence-meta-val">${currentFile.path}</span>
                </div>
                <div class="evidence-meta-row" style="margin-bottom:8px;">
                  <span class="evidence-meta-label">Status:</span>
                  <span class="evidence-meta-val">${currentFile.status}</span>
                </div>
                <div class="evidence-meta-row">
                  <span class="evidence-meta-label">Owner / SID:</span>
                  <span class="evidence-meta-val">${currentFile.owner || 'alex.mercer (S-1-5-21)'}</span>
                </div>
              </div>

              <!-- Cryptographic & Integrity Block -->
              <div style="background:rgba(15,23,42,0.6); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:16px;">
                <div style="font-size:0.75rem; font-weight:700; color:var(--teal-accent); text-transform:uppercase; margin-bottom:12px; letter-spacing:0.05em;">
                  Cryptographic Signatures
                </div>
                <div class="evidence-meta-row" style="margin-bottom:8px;">
                  <span class="evidence-meta-label">Simulated Hash:</span>
                  <span class="evidence-meta-val text-cyan">${currentFile.hash}</span>
                </div>
                <div class="evidence-meta-row" style="margin-bottom:8px;">
                  <span class="evidence-meta-label">Hash Algorithm:</span>
                  <span class="evidence-meta-val">SHA-256 (Simulated)</span>
                </div>
                <div class="evidence-meta-row" style="margin-bottom:8px;">
                  <span class="evidence-meta-label">Hidden Flag:</span>
                  <span class="evidence-meta-val" style="color:${currentFile.hidden ? 'var(--purple-accent)' : '#fff'};">
                    ${currentFile.hidden ? 'TRUE (0x02 Hidden Attribute)' : 'FALSE'}
                  </span>
                </div>
                <div class="evidence-meta-row" style="margin-bottom:8px;">
                  <span class="evidence-meta-label">Recoverable:</span>
                  <span class="evidence-meta-val">${currentFile.recoverable ? 'Yes (Intact Clusters)' : 'No (Zeroed Sector)'}</span>
                </div>
                <div class="evidence-meta-row">
                  <span class="evidence-meta-label">Evidence Priority:</span>
                  <span class="evidence-meta-val" style="color:${currentFile.importance === 'HIGH' ? 'var(--rose-danger)' : 'var(--cyan-glow)'}; font-weight:700;">
                    ${currentFile.importance}
                  </span>
                </div>
              </div>
            </div>

            <!-- MACB Chronological Timestamp Matrix -->
            <div style="background:rgba(10,16,30,0.8); border:1px solid var(--border-bright); border-radius:var(--radius-sm); padding:16px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <div style="font-size:0.8rem; font-weight:700; color:#fff; text-transform:uppercase; letter-spacing:0.05em;">
                  MACB Timestamp Matrix (UTC-05:00)
                </div>
                <span class="badge badge-active" style="font-size:0.65rem;">$STANDARD_INFORMATION</span>
              </div>

              <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:12px;">
                <div style="background:rgba(15,23,42,0.8); padding:12px; border-radius:4px; border:1px solid var(--border-subtle);">
                  <div style="font-size:0.7rem; color:var(--text-muted); font-weight:600;">[M] MODIFIED</div>
                  <div style="font-family:var(--font-mono); font-size:0.85rem; color:#fff; margin-top:4px;">
                    ${currentFile.modified || 'None'}
                  </div>
                </div>

                <div style="background:rgba(15,23,42,0.8); padding:12px; border-radius:4px; border:1px solid var(--border-subtle);">
                  <div style="font-size:0.7rem; color:var(--text-muted); font-weight:600;">[A] ACCESSED</div>
                  <div style="font-family:var(--font-mono); font-size:0.85rem; color:#fff; margin-top:4px;">
                    ${currentFile.accessed || 'None'}
                  </div>
                </div>

                <div style="background:rgba(15,23,42,0.8); padding:12px; border-radius:4px; border:1px solid var(--border-subtle);">
                  <div style="font-size:0.7rem; color:var(--text-muted); font-weight:600;">[C] CREATED / BORN</div>
                  <div style="font-family:var(--font-mono); font-size:0.85rem; color:#fff; margin-top:4px;">
                    ${currentFile.created || 'None'}
                  </div>
                </div>

                <div style="background:rgba(15,23,42,0.8); padding:12px; border-radius:4px; border:1px solid var(--border-subtle);">
                  <div style="font-size:0.7rem; color:var(--rose-danger); font-weight:600;">[B] DELETED / PURGED</div>
                  <div style="font-family:var(--font-mono); font-size:0.85rem; color:${currentFile.deleted ? 'var(--rose-danger)' : 'var(--text-muted)'}; margin-top:4px;">
                    ${currentFile.deleted || 'Not Deleted'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right: Trainee Anomaly Flagging & Diagnostic Bench -->
          <div class="card" style="display:flex; flex-direction:column; justify-content:space-between;">
            <div>
              <div class="card-header">
                <div class="card-title">
                  <div class="card-title-icon">${getIcon('alertTriangle')}</div>
                  Anomaly Investigator
                </div>
                <span class="badge ${isFlagged ? 'badge-invalid' : 'badge-valid'}">
                  ${isFlagged ? 'FLAGGED ANOMALOUS' : 'UNFLAGGED'}
                </span>
              </div>

              <div style="margin-bottom:16px; font-size:0.8rem; color:var(--text-secondary); line-height:1.5;">
                Forensic investigators must detect suspicious timestamps, timestomping inconsistencies, unauthorized deletions, or covert hidden flags.
              </div>

              <!-- Simulated Automated Heuristic Analysis -->
              <div style="background:rgba(10,16,30,0.7); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:14px; margin-bottom:16px;">
                <div style="font-size:0.72rem; font-weight:700; color:var(--cyan-glow); text-transform:uppercase; margin-bottom:8px;">
                  Heuristic Anomaly Radar
                </div>
                <div style="font-size:0.75rem; color:#cbd5e1; line-height:1.45;">
                  ${getHeuristicAdvice(currentFile)}
                </div>
              </div>

              <!-- Trainee Custom Notes for Flagging -->
              <div>
                <label style="font-size:0.72rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:6px;">
                  Investigator Anomaly Finding
                </label>
                <textarea id="meta-flag-notes-input" class="evidence-notes-input" placeholder="Document why this metadata is suspicious (e.g. modified immediately after USB insertion, timestomping artifact, hidden archive)...">${flaggedAnomalies[currentFile.id] || currentFile.anomalyNotes || ''}</textarea>
              </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:10px; margin-top:20px; padding-top:16px; border-top:1px solid var(--border-subtle);">
              <button id="toggle-anomaly-btn" class="btn ${isFlagged ? 'btn-danger' : 'btn-primary'} w-full">
                <span style="width:16px;height:16px;">${getIcon(isFlagged ? 'x' : 'flag')}</span>
                ${isFlagged ? 'Remove Anomaly Flag' : 'Flag as Suspicious Metadata Anomaly'}
              </button>

              <button id="meta-stage-evidence-btn" class="btn btn-cyber-outline w-full">
                <span style="width:16px;height:16px;">${getIcon('shield')}</span>
                Add to Evidence Bench
              </button>
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;

  // Attach handlers
  const selector = document.getElementById('meta-file-selector');
  if (selector) {
    selector.addEventListener('change', (e) => {
      store.selectFile(e.target.value);
      store.reviewMetadata(e.target.value);
    });
  }

  const toggleAnomalyBtn = document.getElementById('toggle-anomaly-btn');
  if (toggleAnomalyBtn && currentFile) {
    toggleAnomalyBtn.addEventListener('click', () => {
      const notes = document.getElementById('meta-flag-notes-input').value;
      store.toggleAnomalyFlag(currentFile.id, notes);
      showToast(
        isFlagged ? 'Anomaly Flag Removed' : 'Metadata Flagged as Suspicious',
        `${currentFile.name} anomaly status updated`,
        isFlagged ? 'info' : 'warning'
      );
    });
  }

  const stageBtn = document.getElementById('meta-stage-evidence-btn');
  if (stageBtn && currentFile) {
    stageBtn.addEventListener('click', () => {
      const notes = document.getElementById('meta-flag-notes-input').value;
      store.addEvidence(currentFile.id, notes || 'Flagged during deep metadata review');
      showToast('Evidence Staged', `${currentFile.name} added to evidence bench`, 'success');
    });
  }
}

function getHeuristicAdvice(file) {
  if (file.name.includes('timestomp')) {
    return 'CRITICAL ANOMALY: Discrepancy between $STANDARD_INFORMATION (2020) and $FILE_NAME timestamps. Clear evidence of anti-forensic timestomping tool execution.';
  }
  if (file.hidden) {
    return 'SUSPICIOUS ATTRIBUTE: File possesses the HIDDEN flag (0x02) inside an unlinked subdirectory. May be a covert staging archive or command script.';
  }
  if (file.deleted && file.importance === 'HIGH') {
    return 'HIGH-RISK DELETION: File was purged seconds after external device activity. Likely intentional destruction of corporate evidence.';
  }
  if (file.status === 'CORRUPTED') {
    return 'BLOCK CORRUPTION: Sectors appear zeroed or overwritten by a wiping utility. Unallocated cluster parity missing.';
  }
  return 'NORMAL PATTERN: Timestamps follow typical chronological progression (Created -> Modified -> Accessed). No anti-forensic alterations detected.';
}
