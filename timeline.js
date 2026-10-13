/**
 * ForensicLab Timeline Reconstruction Module
 */
import { store } from '../state.js';
import { getIcon } from '../utils/icons.js';
import { showToast } from '../utils/toast.js';

export function initTimelineModule(appNavigate) {
  renderTimeline(appNavigate);

  store.subscribe((state, prop) => {
    if (prop === 'activeScenario' || prop === 'timelineEvents') {
      renderTimeline(appNavigate);
    }
  });
}

export function renderTimeline(appNavigate) {
  const container = document.getElementById('timeline-content');
  if (!container) return;

  const { activeScenario, timelineEvents } = store.state;

  if (!activeScenario) {
    container.innerHTML = `
      <div style="text-align:center; padding:60px; color:var(--text-muted);">
        No active scenario loaded. Please select a scenario first.
      </div>
    `;
    return;
  }

  // Candidate events from scenario ground truth
  const groundTruth = activeScenario.groundTruthTimeline || [];
  const selectedEventIds = timelineEvents.map(e => e.id);

  // Available candidate events not yet added
  const availableCandidates = groundTruth.filter(e => !selectedEventIds.includes(e.id));

  // Compute live match accuracy
  const accuracy = calculateLiveTimelineAccuracy(timelineEvents, groundTruth);

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 20px;">
      <div>
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
          <span class="badge badge-priority-high">CHRONOLOGICAL RECONSTRUCTION</span>
          <span style="font-family:var(--font-mono); font-size:0.75rem; color:var(--cyan-glow);">Incident Temporal Correlation Tool</span>
        </div>
        <h1 style="font-size:1.5rem; font-weight:800; color:#fff;">
          Forensic Incident Timeline Builder
        </h1>
        <p style="color:var(--text-secondary); font-size:0.85rem; max-width:750px; margin-top:4px;">
          Assemble disparate log events, file timestamp modifications, and USB traces into a coherent chronological sequence of unauthorized actions.
        </p>
      </div>

      <div style="display:flex; align-items:center; gap:16px;">
        <div style="text-align:right;">
          <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Sequence Accuracy</div>
          <div style="font-family:var(--font-mono); font-size:1.4rem; color:${accuracy >= 80 ? 'var(--teal-accent)' : (accuracy >= 50 ? 'var(--amber-warning)' : 'var(--rose-danger)')}; font-weight:800;">
            ${accuracy}% Match
          </div>
        </div>
        <button id="save-timeline-btn" class="btn btn-primary">
          <span style="width:16px;height:16px;">${getIcon('checkCircle')}</span>
          Validate Reconstructed Sequence
        </button>
      </div>
    </div>

    <!-- Dual Column Workspace: Candidate Events Bank + Trainee Reconstructed Sequence -->
    <div class="timeline-workspace">
      <!-- Left: Event Candidates Bank -->
      <div class="timeline-panel">
        <div class="card-header" style="margin-bottom:12px;">
          <div class="card-title">
            <div class="card-title-icon">${getIcon('database')}</div>
            Discovered Temporal Clues & Log Entries
          </div>
          <span class="badge badge-active">${availableCandidates.length} Available</span>
        </div>

        <p style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:12px;">
          Click the <strong style="color:var(--cyan-glow);">[+] Add</strong> button to place an event into your investigation timeline.
        </p>

        <div class="timeline-list">
          ${availableCandidates.length === 0 ? `
            <div style="text-align:center; padding:40px; color:var(--text-muted); font-size:0.8rem;">
              All discovered candidate events have been placed in the timeline sequence.
            </div>
          ` : availableCandidates.map(evt => `
            <div class="timeline-event-card">
              <div class="timeline-time-badge">${evt.time}</div>
              <div class="timeline-event-body">
                <div class="timeline-event-title">${evt.title}</div>
                <div class="timeline-event-desc">${evt.description}</div>
                <div style="font-family:var(--font-mono); font-size:0.68rem; color:var(--text-muted); margin-top:4px;">
                  Artifact Source: <span style="color:var(--teal-accent);">${evt.sourceFile}</span>
                </div>
              </div>
              <button class="btn btn-sm btn-cyber-outline add-event-btn" data-event-id="${evt.id}">
                + Add
              </button>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Right: Trainee Chronological Timeline Builder -->
      <div class="timeline-panel" style="border-color: rgba(0, 240, 255, 0.35);">
        <div class="card-header" style="margin-bottom:12px;">
          <div class="card-title">
            <div class="card-title-icon text-cyan">${getIcon('clock')}</div>
            <span>Reconstructed Case Sequence (<strong class="text-cyan">${timelineEvents.length}</strong> Events)</span>
          </div>
          <button id="clear-timeline-btn" class="btn btn-sm btn-secondary" style="font-size:0.7rem;">
            Reset Sequence
          </button>
        </div>

        <p style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:12px;">
          Use the <strong style="color:var(--cyan-glow);">▲ / ▼</strong> controls to arrange events in correct chronological order.
        </p>

        <div class="timeline-list">
          ${timelineEvents.length === 0 ? `
            <div style="text-align:center; padding:40px; color:var(--text-muted); font-size:0.8rem; border:2px dashed var(--border-subtle); border-radius:var(--radius-sm); margin:auto 0;">
              Your timeline is currently empty.<br>Add candidate events from the left panel to begin temporal reconstruction.
            </div>
          ` : timelineEvents.map((evt, idx) => `
            <div class="timeline-event-card in-sequence">
              <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; width:24px; font-weight:800; font-family:var(--font-mono); color:var(--cyan-glow);">
                #${idx + 1}
              </div>
              <div class="timeline-time-badge">${evt.time}</div>
              <div class="timeline-event-body">
                <div class="timeline-event-title">${evt.title}</div>
                <div class="timeline-event-desc">${evt.description}</div>
                <div style="font-family:var(--font-mono); font-size:0.68rem; color:var(--text-muted); margin-top:2px;">
                  ${evt.fullTimestamp}
                </div>
              </div>

              <!-- Reorder Controls -->
              <div class="timeline-controls">
                <button class="timeline-arrow-btn move-up-btn" data-index="${idx}" ${idx === 0 ? 'disabled style="opacity:0.3;"' : ''} title="Move Earlier">
                  ▲
                </button>
                <button class="timeline-arrow-btn move-down-btn" data-index="${idx}" ${idx === timelineEvents.length - 1 ? 'disabled style="opacity:0.3;"' : ''} title="Move Later">
                  ▼
                </button>
                <button class="timeline-arrow-btn remove-event-btn" data-event-id="${evt.id}" title="Remove Event" style="color:var(--rose-danger); margin-top:2px;">
                  ✕
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  // Attach handlers
  container.querySelectorAll('.add-event-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const evtId = btn.getAttribute('data-event-id');
      const eventObj = groundTruth.find(e => e.id === evtId);
      if (eventObj) {
        store.addTimelineEvent(eventObj);
        showToast('Timeline Event Added', eventObj.title, 'info');
      }
    });
  });

  container.querySelectorAll('.remove-event-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const evtId = btn.getAttribute('data-event-id');
      store.removeTimelineEvent(evtId);
    });
  });

  container.querySelectorAll('.move-up-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-index'), 10);
      store.moveTimelineEvent(idx, idx - 1);
    });
  });

  container.querySelectorAll('.move-down-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-index'), 10);
      store.moveTimelineEvent(idx, idx + 1);
    });
  });

  const clearBtn = document.getElementById('clear-timeline-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      store.state.timelineEvents = [];
      store.notify('timelineEvents');
      showToast('Timeline Cleared', 'Reset reconstructed sequence', 'info');
    });
  }

  const saveBtn = document.getElementById('save-timeline-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      showToast('Timeline Validated', `Current sequence accuracy: ${accuracy}%`, accuracy >= 80 ? 'success' : 'warning');
    });
  }
}

export function calculateLiveTimelineAccuracy(userEvents, groundTruth) {
  if (!userEvents || userEvents.length === 0 || !groundTruth || groundTruth.length === 0) {
    return 0;
  }

  let correctPairs = 0;
  let totalPairs = 0;

  // Evaluate pairwise order consistency
  for (let i = 0; i < userEvents.length; i++) {
    for (let j = i + 1; j < userEvents.length; j++) {
      totalPairs++;
      const idA = userEvents[i].id;
      const idB = userEvents[j].id;

      const trueIdxA = groundTruth.findIndex(e => e.id === idA);
      const trueIdxB = groundTruth.findIndex(e => e.id === idB);

      if (trueIdxA !== -1 && trueIdxB !== -1 && trueIdxA < trueIdxB) {
        correctPairs++;
      }
    }
  }

  const orderScore = totalPairs > 0 ? (correctPairs / totalPairs) * 70 : 0;
  const coverageScore = (userEvents.length / groundTruth.length) * 30;

  return Math.min(100, Math.round(orderScore + coverageScore));
}
