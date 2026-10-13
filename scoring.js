/**
 * ForensicLab Scoring Engine & Feedback Module
 */
import { store } from '../state.js';
import { getIcon } from '../utils/icons.js';
import { calculateLiveTimelineAccuracy } from './timeline.js';

export function calculateDynamicScore(state) {
  const { activeScenario, filesRecovered, flaggedAnomalies, timelineEvents, evidenceInventory, filesExamined } = state;

  if (!activeScenario) {
    return {
      recoveryScore: 0,
      metadataScore: 0,
      timelineScore: 0,
      evidenceScore: 0,
      efficiencyScore: 0,
      totalScore: 0,
      strengths: [],
      improvements: [],
      recommendations: []
    };
  }

  // Ratio of recoverable deleted files actually recovered
  const deletedFiles = activeScenario.files.filter(f => f.status === 'DELETED' || f.status === 'RECOVERABLE' || f.status === 'RECOVERED' || f.status === 'CORRUPTED' || f.status === 'SALVAGED');
  const recoverableDeleted = deletedFiles.filter(f => f.recoverable);
  const actualRecovered = filesRecovered.length;
  
  let recoveryScore = 0;
  if (recoverableDeleted.length > 0) {
    const recoveryRatio = Math.min(1, actualRecovered / recoverableDeleted.length);
    recoveryScore = Math.round(recoveryRatio * 35);
  } else {
    recoveryScore = 30;
  }

  // 2. Metadata Analysis (20 points)
  // Correctly flagging suspicious anomalies (timestomping, hidden files, deleted evidence)
  const flaggedCount = Object.keys(flaggedAnomalies).length;
  const targetAnomalousFiles = activeScenario.files.filter(f => f.hidden || f.name.includes('timestomp') || (f.deleted && f.importance === 'HIGH'));
  let correctFlags = 0;
  Object.keys(flaggedAnomalies).forEach(fId => {
    if (targetAnomalousFiles.some(t => t.id === fId)) {
      correctFlags++;
    }
  });

  let metadataScore = 0;
  if (targetAnomalousFiles.length > 0) {
    metadataScore = Math.min(20, Math.round((correctFlags / targetAnomalousFiles.length) * 16) + (flaggedCount > 0 ? 4 : 0));
  } else {
    metadataScore = 16;
  }

  // 3. Timeline Reconstruction (20 points)
  const groundTruthTimeline = activeScenario.groundTruthTimeline || [];
  const timelineAccuracyPct = calculateLiveTimelineAccuracy(timelineEvents, groundTruthTimeline);
  const timelineScore = Math.round((timelineAccuracyPct / 100) * 20);

  // 4. Evidence Validation (15 points)
  const groundTruthEvidence = activeScenario.expectedEvidenceIds || [];
  const validStagedEvidence = evidenceInventory.filter(e => e.status === 'VALID' || e.status === 'SUSPICIOUS');
  let matchedEvidence = 0;
  validStagedEvidence.forEach(e => {
    if (groundTruthEvidence.includes(e.fileId)) matchedEvidence++;
  });

  let evidenceScore = 0;
  if (groundTruthEvidence.length > 0) {
    const validRatio = matchedEvidence / groundTruthEvidence.length;
    evidenceScore = Math.min(15, Math.round(validRatio * 15));
  } else {
    evidenceScore = 12;
  }

  // 5. Investigation Efficiency (10 points)
  // Exploration ratio: examining directories and checking files without excessive false positives
  const totalFiles = activeScenario.files.length;
  const examRatio = filesExamined.length / totalFiles;
  let efficiencyScore = 5;
  if (examRatio >= 0.3 && examRatio <= 0.95) efficiencyScore = 10;
  else if (examRatio > 0.1) efficiencyScore = 8;

  // Add baseline floor if completed nicely
  const totalScore = Math.min(100, Math.max(25, recoveryScore + metadataScore + timelineScore + evidenceScore + efficiencyScore));

  // Dynamic feedback synthesis
  const strengths = [];
  const improvements = [];
  const recommendations = [];

  if (recoveryScore >= 25) {
    strengths.push(`Successfully recovered ${actualRecovered} deleted file artifacts using MFT sector carving.`);
  } else {
    improvements.push(`Missed ${Math.max(1, recoverableDeleted.length - actualRecovered)} key recoverable deleted documents in slack space.`);
  }

  if (metadataScore >= 14) {
    strengths.push('Identified and logged critical MACB timestamp anomalies and timestomped records.');
  } else {
    improvements.push('Did not flag several anomalous MACB timestamps between Created and Modified headers.');
  }

  if (timelineScore >= 15) {
    strengths.push(`Reconstructed chronological attack sequence with high temporal consistency (${timelineAccuracyPct}% accuracy).`);
  } else {
    improvements.push('Timeline sequence has out-of-order execution events or missed the initial attack vector.');
  }

  if (evidenceScore >= 11) {
    strengths.push('Validated high-probative digital evidence and maintained proper chain-of-custody notes.');
  } else {
    improvements.push('Some critical key evidence files were omitted or incorrectly classified as irrelevant.');
  }

  // Training Recommendations
  recommendations.push('Practice identifying deleted files by correlating file status, MACB timestamps, and evidence priority.');
  recommendations.push('Always check $STANDARD_INFORMATION vs $FILE_NAME timestamps to detect anti-forensic timestomping.');
  recommendations.push('Correlate USB device mount events with rapid batch deletions to prove exfiltration intent.');

  return {
    recoveryScore,
    metadataScore,
    timelineScore,
    evidenceScore,
    efficiencyScore,
    totalScore,
    strengths,
    improvements,
    recommendations
  };
}

export function initScoringModule(appNavigate) {
  renderScore(appNavigate);

  store.subscribe((state, prop) => {
    if (prop === 'finalScore') {
      renderScore(appNavigate);
    }
  });
}

export function renderScore(appNavigate) {
  const container = document.getElementById('score-content');
  if (!container) return;

  const { activeScenario, finalScore } = store.state;

  if (!finalScore || !activeScenario) {
    container.innerHTML = `
      <div style="text-align:center; padding:60px; color:var(--text-muted);">
        No completed investigation to score yet. Please complete and submit an investigation.
      </div>
    `;
    return;
  }

  const { recoveryScore, metadataScore, timelineScore, evidenceScore, efficiencyScore, totalScore, strengths, improvements, recommendations } = finalScore;

  // SVG Circular progress math (radius: 70, circumference = 2 * PI * 70 = ~440)
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (totalScore / 100) * circumference;

  let scoreColor = 'var(--cyan-glow)';
  let scoreClass = 'text-cyan';
  if (totalScore >= 80) { scoreColor = 'var(--teal-accent)'; scoreClass = 'text-teal'; }
  else if (totalScore < 60) { scoreColor = 'var(--rose-danger)'; scoreClass = 'text-rose'; }

  container.innerHTML = `
    <div style="max-width:960px; margin:0 auto; padding-bottom:40px;">
      <!-- Header -->
      <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 24px;">
        <div>
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
            <span class="badge badge-valid">EVALUATION CERTIFIED</span>
            <span style="font-family:var(--font-mono); font-size:0.75rem; color:var(--cyan-glow);">${activeScenario.name} (${activeScenario.difficulty})</span>
          </div>
          <h1 style="font-size:1.6rem; font-weight:800; color:#fff;">
            Forensic Investigation Competency Score
          </h1>
          <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:4px;">
            Performance evaluation based on data carving precision, metadata analysis, temporal accuracy, and evidentiary rigor.
          </p>
        </div>

        <div style="display:flex; gap:12px;">
          <button id="score-review-btn" class="btn btn-secondary">
            Review Findings
          </button>
          <button id="score-generate-report-btn" class="btn btn-primary">
            <span style="width:16px;height:16px;">${getIcon('fileText')}</span>
            Generate Forensic Report
          </button>
        </div>
      </div>

      <!-- Hero Score Card with Circular Progress Ring -->
      <div class="card" style="margin-bottom:24px; background:linear-gradient(135deg, rgba(13,21,39,0.9) 0%, rgba(16,26,48,0.9) 100%); border-color:var(--border-bright);">
        <div style="display:flex; align-items:center; justify-content:space-around; flex-wrap:wrap; gap:24px; padding:12px 0;">
          <!-- Circular Ring -->
          <div class="progress-ring-container">
            <svg width="180" height="180" viewBox="0 0 180 180">
              <circle
                cx="90"
                cy="90"
                r="${radius}"
                fill="none"
                stroke="rgba(30, 41, 59, 0.6)"
                stroke-width="12"
              />
              <circle
                class="progress-ring-circle"
                cx="90"
                cy="90"
                r="${radius}"
                fill="none"
                stroke="${scoreColor}"
                stroke-width="12"
                stroke-linecap="round"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="${strokeDashoffset}"
                style="filter: drop-shadow(0 0 8px ${scoreColor});"
              />
            </svg>
            <div class="progress-ring-text">
              <span class="progress-ring-val ${scoreClass}">${totalScore}</span>
              <span class="progress-ring-sub">/ 100 PTS</span>
            </div>
          </div>

          <!-- Score Breakdown Rubric Bars -->
          <div style="flex:1; min-width:320px; display:flex; flex-direction:column; gap:12px;">
            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:4px;">
                <span style="font-weight:600; color:#fff;">Deleted File Recovery Accuracy</span>
                <span style="font-family:var(--font-mono); color:var(--cyan-glow);">${recoveryScore} / 35 pts</span>
              </div>
              <div class="progress-track" style="height:6px;">
                <div class="progress-fill" style="width:${(recoveryScore / 35) * 100}%;"></div>
              </div>
            </div>

            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:4px;">
                <span style="font-weight:600; color:#fff;">Metadata & Anomaly Analysis</span>
                <span style="font-family:var(--font-mono); color:var(--teal-accent);">${metadataScore} / 20 pts</span>
              </div>
              <div class="progress-track" style="height:6px;">
                <div class="progress-fill" style="width:${(metadataScore / 20) * 100}%; background:linear-gradient(90deg, #00dfa2, #10b981);"></div>
              </div>
            </div>

            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:4px;">
                <span style="font-weight:600; color:#fff;">Chronological Timeline Reconstruction</span>
                <span style="font-family:var(--font-mono); color:var(--blue-glow);">${timelineScore} / 20 pts</span>
              </div>
              <div class="progress-track" style="height:6px;">
                <div class="progress-fill" style="width:${(timelineScore / 20) * 100}%; background:linear-gradient(90deg, #3b82f6, #60a5fa);"></div>
              </div>
            </div>

            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:4px;">
                <span style="font-weight:600; color:#fff;">Evidence Validation & Chain-of-Custody</span>
                <span style="font-family:var(--font-mono); color:var(--purple-accent);">${evidenceScore} / 15 pts</span>
              </div>
              <div class="progress-track" style="height:6px;">
                <div class="progress-fill" style="width:${(evidenceScore / 15) * 100}%; background:linear-gradient(90deg, #8b5cf6, #c084fc);"></div>
              </div>
            </div>

            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:4px;">
                <span style="font-weight:600; color:#fff;">Investigation Efficiency</span>
                <span style="font-family:var(--font-mono); color:var(--amber-warning);">${efficiencyScore} / 10 pts</span>
              </div>
              <div class="progress-track" style="height:6px;">
                <div class="progress-fill" style="width:${(efficiencyScore / 10) * 100}%; background:linear-gradient(90deg, #f59e0b, #fbbf24);"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Qualitative Feedback Sections -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:24px;">
        <!-- What You Did Well -->
        <div class="card" style="border-top:3px solid var(--green-success);">
          <div class="card-header">
            <div class="card-title">
              <span style="color:var(--green-success); width:18px; height:18px;">${getIcon('checkCircle')}</span>
              What You Did Well
            </div>
            <span class="badge badge-valid">Competent</span>
          </div>
          <ul style="display:flex; flex-direction:column; gap:10px; padding-left:18px; font-size:0.82rem; color:#cbd5e1; line-height:1.5;">
            ${strengths.length > 0 ? strengths.map(s => `<li>${escapeHtml(s)}</li>`).join('') : '<li>Completed the core investigation procedure.</li>'}
          </ul>
        </div>

        <!-- Areas to Improve -->
        <div class="card" style="border-top:3px solid var(--amber-warning);">
          <div class="card-header">
            <div class="card-title">
              <span style="color:var(--amber-warning); width:18px; height:18px;">${getIcon('alertTriangle')}</span>
              Areas to Improve
            </div>
            <span class="badge badge-suspicious">Notice</span>
          </div>
          <ul style="display:flex; flex-direction:column; gap:10px; padding-left:18px; font-size:0.82rem; color:#cbd5e1; line-height:1.5;">
            ${improvements.length > 0 ? improvements.map(imp => `<li>${escapeHtml(imp)}</li>`).join('') : '<li>No significant deficits observed.</li>'}
          </ul>
        </div>
      </div>

      <!-- Training Recommendations -->
      <div class="card" style="border-top:3px solid var(--cyan-glow); margin-bottom:24px;">
        <div class="card-header">
          <div class="card-title">
            <div class="card-title-icon">${getIcon('award')}</div>
            Forensic Training & Methodology Recommendations
          </div>
          <span class="badge badge-recoverable">Action Plan</span>
        </div>
        <div style="display:flex; flex-direction:column; gap:8px; font-size:0.82rem; color:#cbd5e1; line-height:1.5;">
          ${recommendations.map(r => `
            <div style="display:flex; align-items:flex-start; gap:8px;">
              <span style="color:var(--cyan-glow); margin-top:2px;">•</span>
              <span>${escapeHtml(r)}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Action Navigation Buttons -->
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <button id="score-retry-scenario-btn" class="btn btn-secondary">
          <span style="width:16px;height:16px;">${getIcon('refreshCw')}</span>
          Retry Scenario
        </button>

        <div style="display:flex; gap:12px;">
          <button id="score-next-scenario-btn" class="btn btn-cyber-outline">
            Next Scenario Module
          </button>
          <button id="score-view-report-bottom-btn" class="btn btn-primary">
            <span style="width:16px;height:16px;">${getIcon('printer')}</span>
            View Formal Forensic Report
          </button>
        </div>
      </div>
    </div>
  `;

  // Attach handlers
  const reviewBtn = document.getElementById('score-review-btn');
  if (reviewBtn) reviewBtn.addEventListener('click', () => appNavigate('results'));

  const genReportBtn = document.getElementById('score-generate-report-btn');
  if (genReportBtn) genReportBtn.addEventListener('click', () => appNavigate('report'));

  const viewReportBottomBtn = document.getElementById('score-view-report-bottom-btn');
  if (viewReportBottomBtn) viewReportBottomBtn.addEventListener('click', () => appNavigate('report'));

  const retryBtn = document.getElementById('score-retry-scenario-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      store.startScenario(activeScenario);
      appNavigate('explorer');
    });
  }

  const nextBtn = document.getElementById('score-next-scenario-btn');
  if (nextBtn) nextBtn.addEventListener('click', () => appNavigate('scenarios'));
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
