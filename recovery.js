/**
 * ForensicLab Deleted File Recovery Workspace Module
 * Implements Step-by-Step Interactive Forensic Recovery Procedure
 * Flowchart: START -> Select File -> Verify File -> Check Metadata -> Recover File -> Add to Recovered -> Update Timeline -> Show Success & Score -> STOP
 */
import { store } from '../state.js';
import { getIcon } from '../utils/icons.js';
import { showToast } from '../utils/toast.js';

let currentWizardStep = 1; // 1 to 7
let step2Verified = false;
let step3Verified = false;
let isCarving = false;
let carveComplete = false;
let timelineLogged = false;

export function initRecoveryModule(appNavigate) {
  renderRecovery(appNavigate);

  store.subscribe((state, prop) => {
    if (prop === 'activeScenario' || prop === 'filesRecovered' || prop === 'selectedFileId') {
      renderRecovery(appNavigate);
    }
  });
}

export function renderRecovery(appNavigate) {
  const container = document.getElementById('recovery-content');
  if (!container) return;

  const { activeScenario, filesRecovered, selectedFileId } = store.state;

  if (!activeScenario) {
    container.innerHTML = `
      <div style="text-align:center; padding:60px; color:var(--text-muted);">
        No active forensic scenario loaded. Please select a scenario first.
      </div>
    `;
    return;
  }

  // Get all deleted and corrupted files from scenario
  const deletedFiles = activeScenario.files.filter(f => 
    f.status === 'DELETED' || 
    f.status === 'CORRUPTED' || 
    f.status === 'RECOVERABLE' || 
    f.status === 'RECOVERED' || 
    f.status === 'SALVAGED' || 
    filesRecovered.includes(f.id)
  );
  const selectedFile = selectedFileId ? deletedFiles.find(f => f.id === selectedFileId) || deletedFiles[0] : deletedFiles[0];

  const isAlreadyRecovered = selectedFile ? filesRecovered.includes(selectedFile.id) : false;

  container.innerHTML = `
    <div class="recovery-container">
      <!-- Recovery Banner Header -->
      <div class="recovery-banner">
        <div>
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
            <span class="badge badge-deleted">DATA CARVING SUITE</span>
            <span style="font-family:var(--font-mono); font-size:0.75rem; color:var(--cyan-glow);">MFT & Inode Carving Engine v4.2</span>
          </div>
          <h1 style="font-size:1.5rem; font-weight:800; color:#fff;">
            Deleted & Corrupted File Recovery Procedure
          </h1>
          <p style="color:var(--text-secondary); font-size:0.85rem; max-width:750px; margin-top:4px;">
            Interactive step-by-step forensic procedure: Verify orphaned inode records, inspect MACB metadata, carve fragmented/corrupted data streams, update incident timelines, and inspect recovered content.
          </p>
        </div>

        <div style="text-align:right;">
          <div style="font-size:0.75rem; color:var(--text-muted);">Salvage Ledger</div>
          <div style="font-family:var(--font-mono); font-size:1.4rem; color:var(--teal-accent); font-weight:800;">
            ${filesRecovered.length} / ${deletedFiles.length} Recovered
          </div>
        </div>
      </div>

      <!-- VISUAL FLOWCHART BAR -->
      <div class="recovery-flowchart-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="font-size:0.72rem; font-weight:700; color:var(--cyan-glow); text-transform:uppercase; letter-spacing:0.06em;">
            Forensic Recovery Flowchart Pipeline
          </span>
          <span style="font-family:var(--font-mono); font-size:0.7rem; color:var(--text-muted);">
            Step ${currentWizardStep} of 7
          </span>
        </div>

        <div class="flowchart-nodes">
          <div class="flow-step-node ${currentWizardStep >= 1 ? (currentWizardStep > 1 ? 'completed' : 'active') : ''}">
            <span>START</span>
          </div>
          <span class="flow-arrow">➔</span>

          <div class="flow-step-node ${currentWizardStep >= 1 ? (currentWizardStep > 1 ? 'completed' : 'active') : ''}">
            <span>1. Select File</span>
          </div>
          <span class="flow-arrow">➔</span>

          <div class="flow-step-node ${currentWizardStep >= 2 ? (currentWizardStep > 2 ? 'completed' : 'active') : ''}">
            <span>2. Verify File</span>
          </div>
          <span class="flow-arrow">➔</span>

          <div class="flow-step-node ${currentWizardStep >= 3 ? (currentWizardStep > 3 ? 'completed' : 'active') : ''}">
            <span>3. Check Metadata</span>
          </div>
          <span class="flow-arrow">➔</span>

          <div class="flow-step-node ${currentWizardStep >= 4 ? (currentWizardStep > 4 ? 'completed' : 'active') : ''}">
            <span>4. Recover File</span>
          </div>
          <span class="flow-arrow">➔</span>

          <div class="flow-step-node ${currentWizardStep >= 5 ? (currentWizardStep > 5 ? 'completed' : 'active') : ''}">
            <span>5. Add to Recovered</span>
          </div>
          <span class="flow-arrow">➔</span>

          <div class="flow-step-node ${currentWizardStep >= 6 ? (currentWizardStep > 6 ? 'completed' : 'active') : ''}">
            <span>6. Update Timeline</span>
          </div>
          <span class="flow-arrow">➔</span>

          <div class="flow-step-node ${currentWizardStep >= 7 ? 'completed' : ''}">
            <span>7. Success & Score</span>
          </div>
          <span class="flow-arrow">➔</span>

          <div class="flow-step-node ${currentWizardStep === 7 ? 'completed' : ''}">
            <span>STOP</span>
          </div>
        </div>
      </div>

      <!-- ACTIVE STEP-BY-STEP PROCEDURE PANEL -->
      ${renderActiveWizardStep(selectedFile, isAlreadyRecovered, appNavigate)}

      <!-- Main Workspace: Deleted Table + Selected Inode Inspector -->
      <div style="display:grid; grid-template-columns: 1fr 380px; gap: 20px;">
        <!-- Left: Detected Deleted Inodes Table -->
        <div class="card" style="padding:0; overflow:hidden;">
          <div style="padding:16px 20px; border-bottom:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center;">
            <div style="font-weight:700; font-size:0.95rem; color:#fff; display:flex; align-items:center; gap:8px;">
              <span style="color:var(--rose-danger); width:18px; height:18px;">${getIcon('trash')}</span>
              Detected Deleted & Corrupted Inodes Pool (MFT / Slack)
            </div>
            <span class="badge badge-deleted">${deletedFiles.length} Inodes Detected</span>
          </div>

          <div class="table-wrapper" style="border:none; border-radius:0;">
            <table class="cyber-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Original Path</th>
                  <th>Size</th>
                  <th>Deleted Timestamp</th>
                  <th>Recoverability</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Procedure</th>
                </tr>
              </thead>
              <tbody>
                ${deletedFiles.map(file => {
                  const isRec = filesRecovered.includes(file.id);
                  const isSel = selectedFile && selectedFile.id === file.id;
                  const isCorrupt = file.status === 'CORRUPTED' || !file.recoverable;

                  let recoverabilityBadge = `<span class="badge badge-recoverable">Full (100%)</span>`;
                  if (!file.recoverable) {
                    recoverabilityBadge = `<span class="badge badge-corrupted">Residual (Salvageable)</span>`;
                  } else if (file.name.includes('partially')) {
                    recoverabilityBadge = `<span class="badge badge-suspicious">Partial (60%)</span>`;
                  }

                  let statusText = isRec ? 
                    `<span class="badge badge-valid">${isCorrupt ? 'SALVAGED' : 'RECOVERED'}</span>` : 
                    `<span class="badge ${file.status === 'CORRUPTED' ? 'badge-corrupted' : 'badge-deleted'}">${file.status}</span>`;

                  return `
                    <tr class="recovery-row ${isSel ? 'selected' : ''}" data-file-id="${file.id}" style="cursor:pointer;">
                      <td style="font-weight:600; color:${isRec ? '#34d399' : (isCorrupt ? '#f87171' : '#fb7185')};">
                        ${file.name}
                      </td>
                      <td style="font-family:var(--font-mono); font-size:0.72rem; color:var(--text-muted);">${file.path}</td>
                      <td style="font-family:var(--font-mono); font-size:0.75rem;">${file.size}</td>
                      <td style="font-family:var(--font-mono); font-size:0.75rem; color:var(--text-muted);">${file.deleted || 'N/A'}</td>
                      <td>${recoverabilityBadge}</td>
                      <td>
                        <span class="badge ${file.importance === 'HIGH' ? 'badge-priority-high' : 'badge-priority-low'}">${file.importance}</span>
                      </td>
                      <td>${statusText}</td>
                      <td>
                        <button class="btn btn-sm ${isSel ? 'btn-primary' : 'btn-secondary'} select-target-btn" data-file-id="${file.id}">
                          ${isSel ? 'Active Target' : 'Select'}
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Right: Inode & Fragment Detail Card -->
        <div class="card" style="display:flex; flex-direction:column; justify-content:space-between;">
          ${selectedFile ? `
            <div>
              <div class="card-header">
                <div class="card-title">
                  <div class="card-title-icon">${getIcon('cpu')}</div>
                  Cluster & Inode Inspector
                </div>
                <span class="badge ${filesRecovered.includes(selectedFile.id) ? 'badge-valid' : (selectedFile.status === 'CORRUPTED' ? 'badge-corrupted' : 'badge-deleted')}">
                  ${filesRecovered.includes(selectedFile.id) ? (selectedFile.status === 'CORRUPTED' || !selectedFile.recoverable ? 'SALVAGED' : 'RECOVERED') : (selectedFile.status === 'CORRUPTED' ? 'CORRUPT' : 'PURGED')}
                </span>
              </div>

              <div style="display:flex; flex-direction:column; gap:12px; font-size:0.8rem;">
                <div style="background:rgba(10,16,30,0.7); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:10px;">
                  <div style="color:var(--text-muted); font-size:0.7rem; text-transform:uppercase;">Target Identifier</div>
                  <div style="font-weight:700; color:#fff; font-size:0.9rem; word-break:break-all;">${selectedFile.name}</div>
                  <div style="font-family:var(--font-mono); font-size:0.72rem; color:var(--cyan-glow); margin-top:2px;">Simulated Hash: ${selectedFile.hash}</div>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:0.75rem;">
                  <div style="background:rgba(15,23,42,0.6); padding:8px; border-radius:4px; border:1px solid var(--border-subtle);">
                    <span style="color:var(--text-muted);">Deletion / Incident Time:</span>
                    <div style="font-family:var(--font-mono); color:#fff; margin-top:2px;">${selectedFile.deleted || selectedFile.modified || 'N/A'}</div>
                  </div>
                  <div style="background:rgba(15,23,42,0.6); padding:8px; border-radius:4px; border:1px solid var(--border-subtle);">
                    <span style="color:var(--text-muted);">File Signature:</span>
                    <div style="font-family:var(--font-mono); color:var(--teal-accent); margin-top:2px;">.${selectedFile.type} MAGIC</div>
                  </div>
                </div>

                <div>
                  <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; font-weight:700; margin-bottom:4px;">
                    Simulated Inode Forensic Notes
                  </div>
                  <div style="background:rgba(5,10,20,0.8); border:1px solid var(--border-subtle); border-radius:4px; padding:10px; color:#cbd5e1; font-size:0.75rem; line-height:1.45;">
                    ${escapeHtml(selectedFile.anomalyNotes || 'Standard deleted pointer in NTFS MFT Record #40921. Unallocated cluster chain intact.')}
                  </div>
                </div>

                <div>
                  <div style="font-size:0.72rem; color:var(--cyan-glow); text-transform:uppercase; font-weight:700; margin-bottom:4px;">
                    Carved Fragment Header
                  </div>
                  <div class="hex-dump-container" style="max-height:95px; overflow-y:auto;">
                    ${formatHexDump(selectedFile.hexData ? selectedFile.hexData.split('\n').slice(0, 2).join('\n') : '00 00 00 00  ....')}
                  </div>
                </div>

                <div>
                  <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; font-weight:700; margin-bottom:4px; display:flex; justify-content:space-between; align-items:center;">
                    <span>Decoded File Stream</span>
                    ${isAlreadyRecovered ? `<span class="badge badge-valid" style="font-size:0.6rem;">${selectedFile.status === 'CORRUPTED' || !selectedFile.recoverable ? 'SALVAGED' : 'RECOVERED'}</span>` : ''}
                  </div>
                  <div class="preview-box" style="max-height:110px; overflow-y:auto; font-size:0.75rem; white-space:pre-wrap; background:rgba(5,10,20,0.85); border:1px solid var(--border-subtle); padding:8px; border-radius:4px; color:#cbd5e1; word-break:break-word;">
                    ${escapeHtml(selectedFile.contentPreview || 'No decoded text stream available. Inspect raw hex data.')}
                  </div>
                </div>
              </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:8px; margin-top:16px; padding-top:12px; border-top:1px solid var(--border-subtle);">
              <button id="reset-wizard-step-btn" class="btn btn-secondary w-full" style="font-size:0.75rem;">
                Restart Step-by-Step Procedure for This File
              </button>
            </div>
          ` : `
            <div style="color:var(--text-muted); text-align:center; padding:40px;">
              Select a file to begin the step-by-step recovery procedure.
            </div>
          `}
        </div>
      </div>
    </div>
  `;

  // Attach event handlers
  container.querySelectorAll('.recovery-row').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      const fId = row.getAttribute('data-file-id');
      store.selectFile(fId);
      currentWizardStep = 1;
      step2Verified = false;
      step3Verified = false;
      carveComplete = false;
      timelineLogged = false;
      renderRecovery(appNavigate);
    });
  });

  container.querySelectorAll('.select-target-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const fId = btn.getAttribute('data-file-id');
      store.selectFile(fId);
      currentWizardStep = 1;
      step2Verified = false;
      step3Verified = false;
      carveComplete = false;
      timelineLogged = false;
      renderRecovery(appNavigate);
    });
  });

  const resetWizardBtn = document.getElementById('reset-wizard-step-btn');
  if (resetWizardBtn) {
    resetWizardBtn.addEventListener('click', () => {
      currentWizardStep = 1;
      step2Verified = false;
      step3Verified = false;
      carveComplete = false;
      timelineLogged = false;
      renderRecovery(appNavigate);
    });
  }

  // Bind Wizard Navigation Buttons
  bindWizardActionButtons(selectedFile, appNavigate);
}

/**
 * Render the Active Step of the Procedure
 */
function renderActiveWizardStep(selectedFile, isAlreadyRecovered, appNavigate) {
  if (!selectedFile) {
    return `
      <div class="wizard-step-container" style="text-align:center; padding:30px;">
        <h3 style="color:#fff;">Step 1: Select a Deleted or Corrupted File</h3>
        <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:6px;">
          Choose a target from the table below to initiate the step-by-step recovery procedure.
        </p>
      </div>
    `;
  }

  const isCorrupted = selectedFile.status === 'CORRUPTED' || !selectedFile.recoverable;

  if (currentWizardStep === 1) {
    return `
      <div class="wizard-step-container">
        <div class="wizard-step-header">
          <div class="wizard-step-title">
            <span class="badge badge-active">STEP 1</span>
            <span>Select Target: <strong class="text-cyan">${selectedFile.name}</strong></span>
          </div>
          <span class="badge ${isCorrupted ? 'badge-corrupted' : (selectedFile.status === 'DELETED' ? 'badge-deleted' : 'badge-valid')}">${selectedFile.status}</span>
        </div>
        <div class="wizard-step-body">
          <p style="font-size:0.85rem; color:#cbd5e1; margin-bottom:12px;">
            The investigator initiates the recovery procedure by designating an orphaned or damaged file record from the file system's unallocated directory slack table.
          </p>
          <div class="wizard-diagnostic-box">
            [STEP 1 TARGET SELECTED]
            <br>File Name: ${selectedFile.name}
            <br>Original Path: ${selectedFile.path}
            <br>File Type: ${selectedFile.type} (${selectedFile.size})
            <br>Integrity Classification: <span style="color:${isCorrupted ? 'var(--rose-danger)' : 'var(--teal-accent)'};">${isCorrupted ? 'Damaged / Overwritten Clusters (Salvage Mode Required)' : 'Standard Deleted Inode (Carve Mode Ready)'}</span>
            <br>Deletion/Incident Timestamp: ${selectedFile.deleted || selectedFile.modified || '2026-09-16 21:13'}
            <br>Target Importance: ${selectedFile.importance}
          </div>
        </div>
        <div class="wizard-actions">
          <span style="color:var(--text-muted); font-size:0.75rem;">Next: Verify Inode & Sector Exists</span>
          <button id="wizard-step1-next-btn" class="btn btn-primary">
            Step 1 Complete: Verify File Exists in Target List ➔
          </button>
        </div>
      </div>
    `;
  }

  if (currentWizardStep === 2) {
    return `
      <div class="wizard-step-container">
        <div class="wizard-step-header">
          <div class="wizard-step-title">
            <span class="badge badge-active">STEP 2</span>
            <span>Verify File Inode & Clusters: <strong class="text-cyan">${selectedFile.name}</strong></span>
          </div>
          <span class="badge ${isCorrupted ? 'badge-corrupted' : 'badge-deleted'}">${isCorrupted ? 'CORRUPT INODE' : 'INODE LOOKUP'}</span>
        </div>
        <div class="wizard-step-body">
          <p style="font-size:0.85rem; color:#cbd5e1; margin-bottom:12px;">
            Perform unallocated MFT record and inode allocation lookup to confirm that the file record exists and evaluate sector cluster integrity.
          </p>
          <div class="wizard-diagnostic-box" id="step2-log-box">
            ${step2Verified ? `
              <span style="color:var(--green-success);">[✓] INODE & SECTOR AUDIT COMPLETED:</span>
              <br>• Target located in file record: ${selectedFile.path}${selectedFile.name}
              <br>• MFT Inode Record: #40921 (Extents mapped)
              <br>• Sector Health: ${isCorrupted ? 
                '<strong style="color:var(--rose-danger);">BLOCK CORRUPTION DETECTED (Zeroed sectors / wiper tool pattern). Deep Carve Salvage mode required.</strong>' : 
                '<strong style="color:var(--teal-accent);">FULL (100% INTACT CLUSTER CHAIN)</strong>'}
              <br>• Verification Status: File record confirmed in file system structure. Ready for metadata check.
            ` : `
              [READY TO QUERY]
              <br>Click 'Execute Inode Verification' to query NTFS/Ext4 unallocated slack structures...
            `}
          </div>
        </div>
        <div class="wizard-actions">
          <button id="wizard-step-back-btn" class="btn btn-secondary">⮜ Back to Step 1</button>
          ${!step2Verified ? `
            <button id="wizard-step2-verify-btn" class="btn btn-primary">
              Execute Inode Verification Check
            </button>
          ` : `
            <button id="wizard-step2-next-btn" class="btn btn-primary">
              Step 2 Complete: Check File Metadata ➔
            </button>
          `}
        </div>
      </div>
    `;
  }

  if (currentWizardStep === 3) {
    return `
      <div class="wizard-step-container">
        <div class="wizard-step-header">
          <div class="wizard-step-title">
            <span class="badge badge-active">STEP 3</span>
            <span>Check File Metadata & Magic Headers: <strong class="text-cyan">${selectedFile.name}</strong></span>
          </div>
          <span class="badge ${isCorrupted ? 'badge-suspicious' : 'badge-recoverable'}">MACB AUDIT</span>
        </div>
        <div class="wizard-step-body">
          <p style="font-size:0.85rem; color:#cbd5e1; margin-bottom:12px;">
            Audit Modified, Accessed, Created, and Deleted (MACB) timestamps and verify magic byte headers before initiating sector carving.
          </p>
          <div class="wizard-diagnostic-box">
            [MACB TIMESTAMP AUDIT]
            <br>[M] Modified: ${selectedFile.modified || 'None'}
            <br>[A] Accessed: ${selectedFile.accessed || 'None'}
            <br>[C] Created:  ${selectedFile.created || 'None'}
            <br>[B] Deleted:  ${selectedFile.deleted || 'None'}
            <br>Simulated Hash: <span style="color:var(--cyan-glow);">${selectedFile.hash}</span>
            <br>Header Signature: <span style="color:${isCorrupted ? 'var(--rose-danger)' : 'var(--teal-accent)'};">${selectedFile.type} MAGIC (First 16 bytes: ${selectedFile.hexData ? selectedFile.hexData.split('\n')[0].slice(0, 23) : '00 00 00 00'})</span>
            <br>Integrity Diagnosis: ${isCorrupted ? 
              '<span style="color:var(--amber-warning);">Damaged header detected. Residual fragment recovery enabled for carving.</span>' : 
              '<span style="color:var(--green-success);">Intact magic bytes match standard format specification.</span>'}
            <br>Audit Finding: ${escapeHtml(selectedFile.anomalyNotes || 'Standard deleted record in NTFS MFT.')}
          </div>
        </div>
        <div class="wizard-actions">
          <button id="wizard-step-back-btn" class="btn btn-secondary">⮜ Back to Step 2</button>
          <button id="wizard-step3-next-btn" class="btn btn-primary">
            Step 3 Complete: Carve & Recover File ➔
          </button>
        </div>
      </div>
    `;
  }

  if (currentWizardStep === 4) {
    const targetStatusText = isCorrupted ? 'SALVAGED ARTIFACT' : 'RECOVERED';
    const originalStatusText = selectedFile.status === 'CORRUPTED' ? 'CORRUPTED' : 'DELETED';

    return `
      <div class="wizard-step-container">
        <div class="wizard-step-header">
          <div class="wizard-step-title">
            <span class="badge badge-active">STEP 4</span>
            <span>Change Status: ${originalStatusText} ➔ ${targetStatusText} (Carve & Reconstruct)</span>
          </div>
          <span class="badge ${carveComplete || isAlreadyRecovered ? 'badge-valid' : (isCorrupted ? 'badge-corrupted' : 'badge-deleted')}">
            ${carveComplete || isAlreadyRecovered ? `STATUS: ${targetStatusText}` : `STATUS: ${originalStatusText}`}
          </span>
        </div>
        <div class="wizard-step-body">
          <p style="font-size:0.85rem; color:#cbd5e1; margin-bottom:12px;">
            ${isCorrupted ? 
              'Execute deep fragment carving across damaged clusters. Isolate residual data strings, zeroed sector markers, and salvage available forensic artifacts.' : 
              'Execute data carving across contiguous and fragmented unallocated clusters. Reconstruct headers, rebuild the byte stream, and change status from Deleted to Recovered.'}
          </p>

          <div id="wizard-carve-progress-wrapper" style="display:${isCarving || carveComplete ? 'block' : 'none'}; margin-bottom:14px;">
            <div class="progress-track" style="margin-bottom:8px;">
              <div id="wizard-carve-fill" class="progress-fill" style="width:${carveComplete ? '100%' : '0%'};"></div>
            </div>
          </div>

          <div class="wizard-diagnostic-box" id="wizard-carve-terminal">
            ${carveComplete || isAlreadyRecovered ? `
              <span style="color:var(--green-success);">[✓] CARVE & RECONSTRUCTION COMPLETE:</span>
              <br>• Assembled stream size: ${selectedFile.size}
              <br>• Status transitioned: <span style="text-decoration:line-through; color:var(--rose-danger);">${originalStatusText}</span> ➔ <strong style="color:var(--green-success);">${targetStatusText}</strong>
              <br>• Salvaged data stream verified against simulated hash <strong style="color:var(--cyan-glow);">${selectedFile.hash}</strong>
            ` : `
              [READY TO CARVE]
              <br>Click '${isCorrupted ? 'Execute Deep Sector Carving & Salvage Residual Artifact' : 'Execute Sector Carving & Change Status'}' to reconstruct ${selectedFile.name}...
            `}
          </div>
        </div>
        <div class="wizard-actions">
          <button id="wizard-step-back-btn" class="btn btn-secondary" ${isCarving ? 'disabled' : ''}>⮜ Back to Step 3</button>
          ${!carveComplete && !isAlreadyRecovered ? `
            <button id="wizard-step4-carve-btn" class="btn btn-primary">
              ${isCorrupted ? 'Execute Deep Sector Carving & Salvage Residual Artifact' : 'Execute Sector Carving & Change Status'}
            </button>
          ` : `
            <button id="wizard-step4-next-btn" class="btn btn-primary">
              Step 4 Complete: Add to Recovered Files ➔
            </button>
          `}
        </div>
      </div>
    `;
  }

  if (currentWizardStep === 5) {
    return `
      <div class="wizard-step-container">
        <div class="wizard-step-header">
          <div class="wizard-step-title">
            <span class="badge badge-active">STEP 5</span>
            <span>Add to Recovered Files & Evidence Bench</span>
          </div>
          <span class="badge badge-valid">INVENTORY COMMIT</span>
        </div>
        <div class="wizard-step-body">
          <p style="font-size:0.85rem; color:#cbd5e1; margin-bottom:12px;">
            Commit the restored file stream into the Recovered Files Inventory and stage it into the Evidence Bench for court-admissible chain-of-custody tracking.
          </p>
          <div class="wizard-diagnostic-box">
            [RECOVERED FILES INVENTORY RECEIPT]
            <br>Item: ${selectedFile.name}
            <br>Source Path: ${selectedFile.path}
            <br>Allocated Extents: Inode #40921
            <br>Cryptographic Signature: <span style="color:var(--cyan-glow);">${selectedFile.hash}</span>
            <br>Integrity Status: ${isCorrupted ? '<span style="color:var(--amber-warning);">SALVAGED ARTIFACT / WIPER RESIDUAL RECORD</span>' : '<span style="color:var(--teal-accent);">VERIFIED SHA-256</span>'}
            <br>Chain-of-Custody: Staged in Investigator Evidence Bench
          </div>
        </div>
        <div class="wizard-actions">
          <button id="wizard-step-back-btn" class="btn btn-secondary">⮜ Back to Step 4</button>
          <button id="wizard-step5-next-btn" class="btn btn-primary">
            Step 5 Complete: Update Recovery Time in Timeline ➔
          </button>
        </div>
      </div>
    `;
  }

  if (currentWizardStep === 6) {
    return `
      <div class="wizard-step-container">
        <div class="wizard-step-header">
          <div class="wizard-step-title">
            <span class="badge badge-active">STEP 6</span>
            <span>Update Recovery Time in Incident Timeline</span>
          </div>
          <span class="badge badge-valid">TIMELINE LOG</span>
        </div>
        <div class="wizard-step-body">
          <p style="font-size:0.85rem; color:#cbd5e1; margin-bottom:12px;">
            Log the forensic recovery event and exact timestamp into the investigation timeline to establish chronological auditability.
          </p>
          <div class="wizard-diagnostic-box">
            ${timelineLogged ? `
              <span style="color:var(--green-success);">[✓] TIMELINE EVENT RECORDED:</span>
              <br>• Timestamp: ${new Date().toLocaleTimeString()}
              <br>• Title: ${isCorrupted ? 'Artifact Salvage: ' : 'Recovered: '}${selectedFile.name}
              <br>• Description: ${isCorrupted ? 
                `Investigator salvaged residual corrupted fragments (${selectedFile.size}) from damaged sectors. Hash: ${selectedFile.hash}` : 
                `Investigator successfully salvaged ${selectedFile.size} from unallocated cluster space. Hash: ${selectedFile.hash}`}
              <br>• Status: Placed into case incident chronology.
            ` : `
              [READY TO LOG TIMELINE EVENT]
              <br>Click 'Record Recovery Time in Timeline' to stamp this recovery event into your investigation sequence...
            `}
          </div>
        </div>
        <div class="wizard-actions">
          <button id="wizard-step-back-btn" class="btn btn-secondary">⮜ Back to Step 5</button>
          ${!timelineLogged ? `
            <button id="wizard-step6-log-btn" class="btn btn-primary">
              Record Recovery Time in Timeline
            </button>
          ` : `
            <button id="wizard-step6-next-btn" class="btn btn-primary">
              Step 6 Complete: View Success & Update Score ➔
            </button>
          `}
        </div>
      </div>
    `;
  }

  if (currentWizardStep === 7) {
    return `
      <div class="wizard-step-container" style="border-color:var(--green-success); box-shadow:0 0 24px rgba(16,185,129,0.25);">
        <div class="wizard-step-header">
          <div class="wizard-step-title">
            <span class="badge badge-valid">STEP 7</span>
            <span style="color:var(--green-success);">${isCorrupted ? 'Forensic Carve Salvaged & Score Updated!' : 'Recovery Successful & Trainee Score Updated!'}</span>
          </div>
          <span class="badge badge-valid">PROCEDURE COMPLETE</span>
        </div>
        <div class="wizard-step-body">
          <div style="background:linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(6,78,59,0.2) 100%); border:1px solid rgba(16,185,129,0.4); border-radius:var(--radius-sm); padding:18px; text-align:center; margin-bottom:16px;">
            <div style="width:44px; height:44px; color:var(--green-success); margin:0 auto 8px;">
              ${getIcon('checkCircle')}
            </div>
            <h2 style="color:#fff; font-size:1.25rem; margin-bottom:4px;">${isCorrupted ? 'CORRUPT ARTIFACT SALVAGED' : 'RECOVERY SUCCESSFUL'}</h2>
            <div style="font-size:0.85rem; color:#a7f3d0; font-family:var(--font-mono);">
              File: ${selectedFile.name} (${selectedFile.size})
            </div>
            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">
              Simulated SHA-256 Hash: <strong style="color:var(--cyan-glow);">${selectedFile.hash}</strong>
            </div>
          </div>

          <!-- RECOVERED CONTENT VIEWER (Directly fulfilling user request to see content in the file) -->
          <div style="margin: 16px 0; background: rgba(10, 16, 30, 0.9); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); overflow: hidden;">
            <div style="display:flex; justify-content:space-between; align-items:center; padding: 10px 16px; background: rgba(6, 182, 212, 0.08); border-bottom: 1px solid var(--border-subtle);">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="color:var(--cyan-glow); width:18px; height:18px;">${getIcon('fileText')}</span>
                <span style="font-weight:700; font-size:0.85rem; color:#fff; text-transform:uppercase; letter-spacing:0.04em;">
                  Recovered File Content (${selectedFile.type})
                </span>
              </div>
              <span class="badge ${isCorrupted ? 'badge-corrupted' : 'badge-valid'}">
                ${isCorrupted ? 'RESIDUAL CARVED ARTIFACT' : 'INTACT BYTE STREAM'}
              </span>
            </div>

            <div style="padding: 14px 16px;">
              <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:6px; font-weight:600; text-transform:uppercase;">
                Decoded Content Preview
              </div>
              <div class="preview-box" style="background: rgba(2, 6, 23, 0.95); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 14px; font-family: var(--font-mono); font-size: 0.82rem; color: #e2e8f0; line-height: 1.5; white-space: pre-wrap; word-break: break-word; max-height: 200px; overflow-y: auto;">
${escapeHtml(selectedFile.contentPreview || 'No decoded ASCII/UTF-8 content stream found. Raw sector hex view below.')}
              </div>

              <!-- Salvaged Hex Dump -->
              <div style="margin-top: 14px;">
                <div style="font-size:0.75rem; color:var(--cyan-glow); margin-bottom:6px; font-weight:600; text-transform:uppercase; display:flex; justify-content:space-between;">
                  <span>Carved Sector Stream (Offset 0x0000)</span>
                  <span style="color:var(--text-muted); font-size:0.7rem;">HASH: ${selectedFile.hash}</span>
                </div>
                <div class="hex-dump-container" style="max-height: 120px; overflow-y: auto;">
                  ${formatHexDump(selectedFile.hexData)}
                </div>
              </div>
            </div>
          </div>

          <div class="wizard-diagnostic-box">
            [INVESTIGATION SCORE UPDATE]
            <br>• Recovery Accuracy: <strong style="color:var(--green-success);">+35 Points Awarded</strong>
            <br>• Evidence Locker: 1 Item staged and classified
            <br>• Incident Timeline: Chronological recovery audit event recorded
            <br>• Total Recovered / Salvaged Files: <strong style="color:var(--teal-accent);">${store.state.filesRecovered.length} Files</strong>
          </div>
        </div>
        <div class="wizard-actions">
          <button id="wizard-recover-another-btn" class="btn btn-secondary">
            ⮌ Recover Another Deleted / Corrupted File
          </button>
          <div style="display:flex; gap:10px;">
            <button id="wizard-goto-timeline-btn" class="btn btn-cyber-outline">
              View Updated Timeline ➔
            </button>
            <button id="wizard-goto-evidence-btn" class="btn btn-primary">
              View Evidence Bench ➔
            </button>
          </div>
        </div>
      </div>
    `;
  }

  return '';
}

/**
 * Bind Action Handlers for Step-by-Step Flow
 */
function bindWizardActionButtons(selectedFile, appNavigate) {
  // Step 1: Next
  const step1NextBtn = document.getElementById('wizard-step1-next-btn');
  if (step1NextBtn) {
    step1NextBtn.addEventListener('click', () => {
      currentWizardStep = 2;
      step2Verified = false;
      renderRecovery(appNavigate);
    });
  }

  // Step 2: Verify
  const step2VerifyBtn = document.getElementById('wizard-step2-verify-btn');
  if (step2VerifyBtn && selectedFile) {
    step2VerifyBtn.addEventListener('click', () => {
      step2Verified = true;
      const isCorrupted = selectedFile.status === 'CORRUPTED' || !selectedFile.recoverable;
      const msg = isCorrupted ? 
        `Cluster degradation audited: Residual blocks located for ${selectedFile.name}` : 
        `Confirmed inode record for ${selectedFile.name}`;
      showToast('Inode Verification Passed', msg, 'success');
      renderRecovery(appNavigate);
    });
  }

  const step2NextBtn = document.getElementById('wizard-step2-next-btn');
  if (step2NextBtn) {
    step2NextBtn.addEventListener('click', () => {
      currentWizardStep = 3;
      renderRecovery(appNavigate);
    });
  }

  // Step 3: Next
  const step3NextBtn = document.getElementById('wizard-step3-next-btn');
  if (step3NextBtn) {
    step3NextBtn.addEventListener('click', () => {
      currentWizardStep = 4;
      carveComplete = false;
      isCarving = false;
      renderRecovery(appNavigate);
    });
  }

  // Step 4: Carve & Reconstruct / Salvage
  const step4CarveBtn = document.getElementById('wizard-step4-carve-btn');
  if (step4CarveBtn && selectedFile) {
    step4CarveBtn.addEventListener('click', () => {
      isCarving = true;
      const fill = document.getElementById('wizard-carve-fill');
      const terminal = document.getElementById('wizard-carve-terminal');
      const progressWrap = document.getElementById('wizard-carve-progress-wrapper');
      if (progressWrap) progressWrap.style.display = 'block';

      const isCorrupted = selectedFile.status === 'CORRUPTED' || !selectedFile.recoverable;

      let pct = 0;
      const intv = setInterval(() => {
        pct += 25;
        if (fill) fill.style.width = pct + '%';
        if (terminal) {
          if (!isCorrupted) {
            if (pct === 25) terminal.innerHTML = `> Carving cluster chain 0x48A020 -> 0x48A048...`;
            else if (pct === 50) terminal.innerHTML = `> Reconstructing ${selectedFile.type} header and magic markers...`;
            else if (pct === 75) terminal.innerHTML = `> Validating integrity against simulated hash ${selectedFile.hash}...`;
            else if (pct >= 100) terminal.innerHTML = `> Status updated: DELETED ➔ RECOVERED!`;
          } else {
            if (pct === 25) terminal.innerHTML = `> Scanning damaged clusters & zeroed sectors 0x7FA100...`;
            else if (pct === 50) terminal.innerHTML = `> Anti-forensic wiper pattern detected: isolating readable byte fragments...`;
            else if (pct === 75) terminal.innerHTML = `> Assembling residual forensic artifact stream & calculating salvage hash ${selectedFile.hash}...`;
            else if (pct >= 100) terminal.innerHTML = `> Status updated: CORRUPTED ➔ SALVAGED FORENSIC ARTIFACT!`;
          }
        }
        if (pct >= 100) {
          clearInterval(intv);
          isCarving = false;
          carveComplete = true;
          store.recoverFile(selectedFile.id);
          const toastMsg = isCorrupted ? 
            `${selectedFile.name} residual artifact salvaged into forensic inventory` : 
            `${selectedFile.name} status changed to RECOVERED`;
          showToast('Status Updated', toastMsg, 'success');
          renderRecovery(appNavigate);
        }
      }, 350);
    });
  }

  const step4NextBtn = document.getElementById('wizard-step4-next-btn');
  if (step4NextBtn) {
    step4NextBtn.addEventListener('click', () => {
      currentWizardStep = 5;
      renderRecovery(appNavigate);
    });
  }

  // Step 5: Next
  const step5NextBtn = document.getElementById('wizard-step5-next-btn');
  if (step5NextBtn && selectedFile) {
    step5NextBtn.addEventListener('click', () => {
      const isCorrupted = selectedFile.status === 'CORRUPTED' || !selectedFile.recoverable;
      store.addEvidence(selectedFile.id, isCorrupted ? 'Residual artifact carved from damaged/wiped clusters' : 'Carved from unallocated disk clusters');
      showToast('Inventory Updated', `${selectedFile.name} staged in Evidence Bench`, 'success');
      currentWizardStep = 6;
      timelineLogged = false;
      renderRecovery(appNavigate);
    });
  }

  // Step 6: Log Timeline Event
  const step6LogBtn = document.getElementById('wizard-step6-log-btn');
  if (step6LogBtn && selectedFile) {
    step6LogBtn.addEventListener('click', () => {
      const isCorrupted = selectedFile.status === 'CORRUPTED' || !selectedFile.recoverable;
      const recoveryEvent = {
        id: `rec_evt_${selectedFile.id}_${Date.now()}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fullTimestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        title: `${isCorrupted ? 'Artifact Salvage: ' : 'Recovery Attempt: '}${selectedFile.name}`,
        description: isCorrupted ? 
          `Investigator salvaged residual corrupted fragments (${selectedFile.size}) from damaged sectors. Hash: ${selectedFile.hash}` : 
          `Investigator successfully salvaged ${selectedFile.name} (${selectedFile.size}) from unallocated clusters. Simulated hash: ${selectedFile.hash}`,
        sourceFile: selectedFile.name,
        isPivotal: selectedFile.importance === 'HIGH'
      };
      store.addTimelineEvent(recoveryEvent);
      timelineLogged = true;
      showToast('Timeline Updated', `Recovery event logged at ${recoveryEvent.time}`, 'info');
      renderRecovery(appNavigate);
    });
  }

  const step6NextBtn = document.getElementById('wizard-step6-next-btn');
  if (step6NextBtn) {
    step6NextBtn.addEventListener('click', () => {
      currentWizardStep = 7;
      showToast('Recovery Successful', 'Trainee score & XP updated (+35 pts)', 'success');
      renderRecovery(appNavigate);
    });
  }

  // Step 7: Actions
  const recoverAnotherBtn = document.getElementById('wizard-recover-another-btn');
  if (recoverAnotherBtn) {
    recoverAnotherBtn.addEventListener('click', () => {
      currentWizardStep = 1;
      step2Verified = false;
      step3Verified = false;
      carveComplete = false;
      timelineLogged = false;
      renderRecovery(appNavigate);
    });
  }

  const gotoTimelineBtn = document.getElementById('wizard-goto-timeline-btn');
  if (gotoTimelineBtn) {
    gotoTimelineBtn.addEventListener('click', () => {
      appNavigate('timeline');
    });
  }

  const gotoEvidenceBtn = document.getElementById('wizard-goto-evidence-btn');
  if (gotoEvidenceBtn) {
    gotoEvidenceBtn.addEventListener('click', () => {
      appNavigate('evidence');
    });
  }

  // Step Back
  const backBtn = document.getElementById('wizard-step-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (currentWizardStep > 1) {
        currentWizardStep--;
        renderRecovery(appNavigate);
      }
    });
  }
}

function formatHexDump(hexString) {
  if (!hexString) return '<div class="hex-line">00000000: 00 00 00 00  ....</div>';
  const lines = hexString.split('\n');
  return lines.map((line, idx) => {
    const offset = (idx * 16).toString(16).padStart(8, '0').toUpperCase();
    return `<div class="hex-line"><span class="hex-offset">${offset}:</span> <span class="hex-bytes">${escapeHtml(line)}</span></div>`;
  }).join('');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
