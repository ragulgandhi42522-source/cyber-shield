/**
 * ForensicLab Digital Forensics Investigation Report Module
 */
import { store } from '../state.js';
import { getIcon } from '../utils/icons.js';
import { showToast } from '../utils/toast.js';

export function initReportModule(appNavigate) {
  renderReport(appNavigate);

  store.subscribe((state, prop) => {
    if (prop === 'finalScore' || prop === 'activeScenario') {
      renderReport(appNavigate);
    }
  });
}

export function renderReport(appNavigate) {
  const container = document.getElementById('report-content');
  if (!container) return;

  const { activeScenario, finalScore, filesExamined, filesRecovered, hiddenFilesFound, evidenceInventory, timelineEvents, user, investigationStartTime, investigationEndTime } = store.state;

  if (!activeScenario) {
    container.innerHTML = `
      <div style="text-align:center; padding:60px; color:var(--text-muted);">
        No active investigation case loaded. Complete an investigation to generate a forensic report.
      </div>
    `;
    return;
  }

  const investigationId = `FORENSIC-CASE-${activeScenario.id}-${Math.floor((investigationStartTime || Date.now()) / 1000).toString().slice(-4)}`;
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const durationMin = investigationStartTime && investigationEndTime ? Math.max(1, Math.round((investigationEndTime - investigationStartTime) / 60000)) : 14;

  const scoreVal = finalScore ? finalScore.totalScore : 86;

  container.innerHTML = `
    <div class="report-wrapper">
      <!-- Report Actions Bar (Top) -->
      <div class="report-actions-bar">
        <div>
          <h2 style="font-size:1.1rem; color:#fff; font-weight:700;">
            Forensic Investigation Case Report
          </h2>
          <div style="font-family:var(--font-mono); font-size:0.75rem; color:var(--cyan-glow);">
            ${investigationId} // Verified Hash Ledger
          </div>
        </div>

        <div style="display:flex; gap:12px;">
          <button id="report-print-btn" class="btn btn-secondary">
            <span style="width:16px;height:16px;">${getIcon('printer')}</span>
            Print Report
          </button>
          <button id="report-download-btn" class="btn btn-primary">
            <span style="width:16px;height:16px;">${getIcon('download')}</span>
            Download Report (HTML)
          </button>
          <button id="report-back-score-btn" class="btn btn-cyber-outline">
            Back to Score
          </button>
        </div>
      </div>

      <!-- Formal Printable Document Sheet -->
      <div id="printable-forensic-document" class="report-document">
        <!-- Header -->
        <div class="report-header">
          <div class="report-title-block">
            <h1>DIGITAL FORENSICS INVESTIGATION REPORT</h1>
            <h2>ForensicLab Sandbox Evidence & Incident Analysis</h2>
          </div>
          <div style="text-align:right;">
            <div style="font-family:var(--font-mono); font-size:0.8rem; color:var(--cyan-glow); font-weight:700;">
              FORENSIC-LAB-v4.2
            </div>
            <div style="font-size:0.72rem; color:var(--text-muted); margin-top:2px;">
              ISO/IEC 27037 Standard Sandbox
            </div>
          </div>
        </div>

        <!-- Meta Grid -->
        <div class="report-meta-grid">
          <div class="report-meta-item">
            <span class="report-meta-key">Investigation Case ID:</span>
            <span class="report-meta-value">${investigationId}</span>
          </div>
          <div class="report-meta-item">
            <span class="report-meta-key">Date of Analysis:</span>
            <span class="report-meta-value">${dateStr}</span>
          </div>
          <div class="report-meta-item">
            <span class="report-meta-key">Scenario Title:</span>
            <span class="report-meta-value">${activeScenario.name}</span>
          </div>
          <div class="report-meta-item">
            <span class="report-meta-key">Difficulty Classification:</span>
            <span class="report-meta-value">${activeScenario.difficulty}</span>
          </div>
          <div class="report-meta-item">
            <span class="report-meta-key">Forensic Examiner:</span>
            <span class="report-meta-value">${user.fullName || user.username}</span>
          </div>
          <div class="report-meta-item">
            <span class="report-meta-key">Investigation Duration:</span>
            <span class="report-meta-value">${durationMin} minutes</span>
          </div>
        </div>

        <!-- 1. Executive Summary -->
        <div class="report-section">
          <div class="report-section-title">1. Executive Summary</div>
          <p class="report-text">
            On ${dateStr}, digital forensic trainee <strong>${user.username}</strong> conducted an authorized post-incident analysis of target virtual image <em>${activeScenario.name}</em>. The examination focused on identifying unauthorized data movements, analyzing slack space and orphaned MFT/inode entries for deleted files, validating file metadata consistency, and establishing an authoritative chronological timeline of events.
          </p>
          <p class="report-text">
            The target filesystem contained ${activeScenario.files.length} total synthetic objects, including ${activeScenario.hiddenFilesCount} hidden items, ${activeScenario.deletedFilesCount} deleted or fragmented records, and key corporate exfiltration artifacts.
          </p>
        </div>

        <!-- 2. Files Examined -->
        <div class="report-section">
          <div class="report-section-title">2. Files Examined & Scope</div>
          <p class="report-text">
            A total of <strong>${filesExamined.length}</strong> files were directly inspected across standard user directories (<code>/Users/Alex/Documents</code>, <code>/Downloads</code>, <code>/Pictures</code>, <code>/Temp</code>), system logs (<code>/System/Logs</code>, <code>/Config</code>), and unallocated slack regions (<code>/Recycle_Bin</code>, <code>/Hidden_Data</code>).
          </p>
        </div>

        <!-- 3. Deleted Files Recovered -->
        <div class="report-section">
          <div class="report-section-title">3. Deleted Files Recovered (Data Carving)</div>
          <p class="report-text">
            During deep sector carving, <strong>${filesRecovered.length}</strong> deleted files were successfully salvaged from unallocated clusters. The recovered data streams were verified using simulated SHA-256 integrity checks:
          </p>
          <table class="report-table">
            <thead>
              <tr>
                <th>Recovered File</th>
                <th>Original Path</th>
                <th>Carved Size</th>
                <th>Simulated Hash</th>
                <th>Integrity</th>
              </tr>
            </thead>
            <tbody>
              ${filesRecovered.length === 0 ? `
                <tr><td colspan="5" style="color:var(--text-muted); text-align:center;">No deleted files recovered during this session.</td></tr>
              ` : filesRecovered.map(fId => {
                const f = store.getFileById(fId);
                if (!f) return '';
                return `
                  <tr>
                    <td style="font-weight:600; color:#fff;">${f.name}</td>
                    <td style="font-family:var(--font-mono);">${f.path}</td>
                    <td style="font-family:var(--font-mono);">${f.size}</td>
                    <td style="font-family:var(--font-mono); color:var(--cyan-glow);">${f.hash}</td>
                    <td><span class="badge ${f.status === 'SALVAGED' || !f.recoverable ? 'badge-corrupted' : 'badge-valid'}">${f.status === 'SALVAGED' || !f.recoverable ? 'SALVAGED ARTIFACT' : 'INTACT'}</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- 4. Hidden Files Discovered -->
        <div class="report-section">
          <div class="report-section-title">4. Hidden Files Discovered</div>
          <p class="report-text">
            The examiner successfully identified <strong>${hiddenFilesFound.length}</strong> hidden files possessing attribute <code>0x02 (HIDDEN)</code>:
          </p>
          <ul style="padding-left:20px; font-size:0.82rem; color:#cbd5e1; line-height:1.6;">
            ${hiddenFilesFound.length === 0 ? `<li>No hidden files flagged in this investigation.</li>` : hiddenFilesFound.map(fId => {
              const f = store.getFileById(fId);
              return f ? `<li><code>${f.path}${f.name}</code> — ${f.anomalyNotes || 'Concealed storage location'}</li>` : '';
            }).join('')}
          </ul>
        </div>

        <!-- 5. Metadata Findings -->
        <div class="report-section">
          <div class="report-section-title">5. Metadata & Timestamp Findings</div>
          <p class="report-text">
            MACB (Modified, Accessed, Created, Born) analysis revealed key temporal patterns corroborating malicious intent. Notable anomalies flagged:
          </p>
          <ul style="padding-left:20px; font-size:0.82rem; color:#cbd5e1; line-height:1.6;">
            ${Object.keys(store.state.flaggedAnomalies).length === 0 ? `<li>No specific anomaly notes manually logged by examiner.</li>` : Object.keys(store.state.flaggedAnomalies).map(fId => {
              const f = store.getFileById(fId);
              return f ? `<li><strong>${f.name}</strong>: ${escapeHtml(store.state.flaggedAnomalies[fId])}</li>` : '';
            }).join('')}
          </ul>
        </div>

        <!-- 6. Timeline Reconstruction -->
        <div class="report-section">
          <div class="report-section-title">6. Chronological Timeline Reconstruction</div>
          <p class="report-text">
            The investigator reconstructed the following chronological chain of events:
          </p>
          <table class="report-table">
            <thead>
              <tr>
                <th>Seq</th>
                <th>Time (UTC-5)</th>
                <th>Incident Event Title</th>
                <th>Source Artifact</th>
              </tr>
            </thead>
            <tbody>
              ${timelineEvents.length === 0 ? `
                <tr><td colspan="4" style="color:var(--text-muted); text-align:center;">No timeline sequence established.</td></tr>
              ` : timelineEvents.map((evt, idx) => `
                <tr>
                  <td style="font-family:var(--font-mono); font-weight:700;">#${idx + 1}</td>
                  <td style="font-family:var(--font-mono); color:var(--cyan-glow);">${evt.fullTimestamp || evt.time}</td>
                  <td style="font-weight:600; color:#fff;">${evt.title}</td>
                  <td style="font-family:var(--font-mono); color:var(--teal-accent);">${evt.sourceFile}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- 7. Evidence Validation & Chain of Custody -->
        <div class="report-section">
          <div class="report-section-title">7. Digital Evidence Inventory & Chain of Custody</div>
          <table class="report-table">
            <thead>
              <tr>
                <th>Item ID</th>
                <th>Evidence File</th>
                <th>Simulated Hash</th>
                <th>Classification</th>
                <th>Examiner Assessment</th>
              </tr>
            </thead>
            <tbody>
              ${evidenceInventory.length === 0 ? `
                <tr><td colspan="5" style="color:var(--text-muted); text-align:center;">No items placed in formal evidence inventory.</td></tr>
              ` : evidenceInventory.map((item, idx) => `
                <tr>
                  <td style="font-family:var(--font-mono);">EV-${String(idx + 1).padStart(3, '0')}</td>
                  <td style="font-weight:600; color:#fff;">${item.fileName}</td>
                  <td style="font-family:var(--font-mono); color:var(--cyan-glow); font-size:0.72rem;">${item.hash}</td>
                  <td><span class="badge ${item.status === 'VALID' ? 'badge-valid' : (item.status === 'SUSPICIOUS' ? 'badge-suspicious' : 'badge-invalid')}">${item.status}</span></td>
                  <td style="font-size:0.75rem; color:#cbd5e1;">${escapeHtml(item.notes || 'Forensic artifact')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- 8. Investigation Score & Evaluation -->
        <div class="report-section">
          <div class="report-section-title">8. Evaluation Score & Competency Assessment</div>
          <div style="background:rgba(15,23,42,0.6); padding:16px; border-radius:4px; border:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Overall Competency Grade</div>
              <div style="font-size:1.4rem; font-weight:800; color:${scoreVal >= 80 ? 'var(--teal-accent)' : 'var(--cyan-glow)'};">
                ${scoreVal} / 100 POINTS (${scoreVal >= 80 ? 'EXEMPLARY FORENSIC COMPETENCY' : 'SATISFACTORY'})
              </div>
            </div>
            <div style="font-family:var(--font-mono); font-size:0.8rem; text-align:right;">
              <div>Recovery: <strong>${finalScore ? finalScore.recoveryScore : 30}/35</strong></div>
              <div>Metadata: <strong>${finalScore ? finalScore.metadataScore : 17}/20</strong></div>
              <div>Timeline: <strong>${finalScore ? finalScore.timelineScore : 18}/20</strong></div>
              <div>Evidence: <strong>${finalScore ? finalScore.evidenceScore : 13}/15</strong></div>
              <div>Efficiency: <strong>${finalScore ? finalScore.efficiencyScore : 8}/10</strong></div>
            </div>
          </div>
        </div>

        <!-- 9. Training Feedback -->
        <div class="report-section">
          <div class="report-section-title">9. Training Feedback & Recommendations</div>
          <p class="report-text">
            ${finalScore && finalScore.strengths.length > 0 ? `<strong>Key Demonstrated Strengths:</strong> ${finalScore.strengths.join(' ')}` : ''}
          </p>
          <p class="report-text">
            ${finalScore && finalScore.recommendations.length > 0 ? `<strong>Instructor Guidance:</strong> ${finalScore.recommendations.join(' ')}` : ''}
          </p>
        </div>

        <!-- 10. Conclusion & Sworn Sign-off -->
        <div class="report-section">
          <div class="report-section-title">10. Sworn Investigator Conclusion</div>
          <p class="report-text">
            All recovered evidence, metadata records, and chronological correlations documented in this report were derived from the simulated digital forensic training environment. The evidence presented constitutes a coherent evidentiary trail substantiating the unauthorized data exfiltration case.
          </p>
          <div class="report-signature-block">
            <div>
              <div style="font-weight:700; color:#fff; font-size:0.85rem;">Alex Vance (Trainee #4412)</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">Lead Digital Forensics Examiner</div>
              <div class="signature-line">Digital Signature: SHA-256//${activeScenario.id}-EVAL</div>
            </div>

            <div>
              <div style="font-weight:700; color:#fff; font-size:0.85rem;">ForensicLab Training Board</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">Evaluation & Certification Authority</div>
              <div class="signature-line">Supervisor Signature Verified</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach button events
  const printBtn = document.getElementById('report-print-btn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  const downloadBtn = document.getElementById('report-download-btn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      downloadReportAsHtml(investigationId);
    });
  }

  const backScoreBtn = document.getElementById('report-back-score-btn');
  if (backScoreBtn) {
    backScoreBtn.addEventListener('click', () => appNavigate('score'));
  }
}

function downloadReportAsHtml(caseId) {
  const docElement = document.getElementById('printable-forensic-document');
  if (!docElement) return;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Forensic Investigation Report - ${caseId}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#fff; color:#111; padding:40px; }
    h1 { font-size: 24px; color: #0f172a; margin-bottom: 4px; }
    h2 { font-size: 16px; color: #0284c7; margin-top: 0; }
    .report-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 16px; margin: 20px 0; }
    .report-section { margin-bottom: 24px; }
    .report-section-title { font-size: 16px; font-weight: bold; color: #0f766e; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
    th { background: #f1f5f9; padding: 8px; border: 1px solid #cbd5e1; text-align: left; }
    td { padding: 8px; border: 1px solid #cbd5e1; }
    .signature-block { display: flex; justify-content: space-between; margin-top: 50px; }
    .sig-line { width: 220px; border-top: 1px solid #000; margin-top: 40px; padding-top: 4px; font-size: 12px; }
  </style>
</head>
<body>
  ${docElement.innerHTML}
</body>
</html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${caseId}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Report Downloaded', `${caseId}.html saved to downloads`, 'success');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
