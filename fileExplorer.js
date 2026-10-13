/**
 * ForensicLab Virtual File-System Explorer Module
 */
import { store } from '../state.js';
import { getIcon } from '../utils/icons.js';
import { showToast } from '../utils/toast.js';

let activeFilter = 'ALL';
let showHiddenChecked = true;
let showDeletedChecked = true;
let searchQuery = '';
let sortBy = 'name'; // name | date | type | size
let sortAsc = true;

export function initFileExplorerModule(appNavigate) {
  renderExplorer(appNavigate);

  // Subscribe to changes in state
  store.subscribe((state, prop) => {
    if (prop === 'activeScenario' || prop === 'currentPath' || prop === 'selectedFileId' || prop === 'filesRecovered') {
      renderExplorer(appNavigate);
    }
  });
}

export function renderExplorer(appNavigate) {
  const container = document.getElementById('explorer-content');
  if (!container) return;

  const { activeScenario, currentPath, selectedFileId, filesRecovered } = store.state;

  if (!activeScenario) {
    container.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:60vh; text-align:center;">
        <div style="width:64px; height:64px; color:var(--text-muted); margin-bottom:16px;">
          ${getIcon('database')}
        </div>
        <h2 style="font-size:1.3rem; color:#fff; margin-bottom:8px;">No Forensic Image Mounted</h2>
        <p style="color:var(--text-secondary); max-width:440px; font-size:0.85rem; margin-bottom:20px;">
          Select an investigation scenario or load Demo Mode to mount the synthetic corrupted file system.
        </p>
        <button id="explorer-load-scenarios-btn" class="btn btn-primary">
          Select Investigation Scenario
        </button>
      </div>
    `;
    const btn = document.getElementById('explorer-load-scenarios-btn');
    if (btn) btn.addEventListener('click', () => appNavigate('scenarios'));
    return;
  }

  // Predefined simulated directory hierarchy
  const directories = [
    { path: '/Users/Alex/Documents/', name: 'Documents', indent: 'tree-indent-2', parent: '/Users/Alex/' },
    { path: '/Users/Alex/Downloads/', name: 'Downloads', indent: 'tree-indent-2', parent: '/Users/Alex/' },
    { path: '/Users/Alex/Pictures/', name: 'Pictures', indent: 'tree-indent-2', parent: '/Users/Alex/' },
    { path: '/Users/Alex/Temp/', name: 'Temp', indent: 'tree-indent-2', parent: '/Users/Alex/' },
    { path: '/System/Logs/', name: 'Logs', indent: 'tree-indent-2', parent: '/System/' },
    { path: '/System/Config/', name: 'Config', indent: 'tree-indent-2', parent: '/System/' },
    { path: '/Recycle_Bin/', name: 'Recycle_Bin (MFT Slack)', indent: 'tree-indent-1', parent: '/' },
    { path: '/Hidden_Data/', name: 'Hidden_Data', indent: 'tree-indent-1', parent: '/' }
  ];

  // Filter files in current directory
  let files = activeScenario.files.filter(f => f.path === currentPath);

  // Hidden files toggle
  if (!showHiddenChecked) {
    files = files.filter(f => !f.hidden);
  }

  // Deleted files toggle
  if (!showDeletedChecked) {
    files = files.filter(f => f.status !== 'DELETED');
  }

  // Category filter
  if (activeFilter !== 'ALL') {
    files = files.filter(f => f.status === activeFilter);
  }

  // Search filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    files = files.filter(f => f.name.toLowerCase().includes(q) || f.type.toLowerCase().includes(q) || (f.contentPreview && f.contentPreview.toLowerCase().includes(q)));
  }

  // Sorting
  files.sort((a, b) => {
    let res = 0;
    if (sortBy === 'name') res = a.name.localeCompare(b.name);
    else if (sortBy === 'date') res = (a.modified || a.created || '').localeCompare(b.modified || b.created || '');
    else if (sortBy === 'type') res = a.type.localeCompare(b.type);
    else if (sortBy === 'size') res = parseInt(a.size) - parseInt(b.size);
    return sortAsc ? res : -res;
  });

  const selectedFile = selectedFileId ? activeScenario.files.find(f => f.id === selectedFileId) : files[0];

  container.innerHTML = `
    <div class="explorer-layout">
      <!-- Left: Folder Tree -->
      <div class="explorer-tree-pane">
        <div class="tree-header">
          <span>Virtual Volumes</span>
          <span class="badge badge-active" style="font-size:0.6rem;">EXT4/NTFS SIM</span>
        </div>
        <div class="tree-container">
          <div class="tree-node ${currentPath.startsWith('/Users/Alex/') ? 'active' : ''}" data-folder-path="/Users/Alex/Documents/">
            <span class="tree-icon">${getIcon('folderOpen')}</span>
            <span>/Users/Alex</span>
          </div>

          ${directories.map(d => {
            const count = activeScenario.files.filter(f => f.path === d.path).length;
            const isSelected = currentPath === d.path;
            return `
              <div class="tree-node ${d.indent} ${isSelected ? 'active' : ''}" data-folder-path="${d.path}">
                <span class="tree-icon">${getIcon(isSelected ? 'folderOpen' : 'folder')}</span>
                <span>${d.name}</span>
                <span class="tree-badge">${count}</span>
              </div>
            `;
          }).join('')}
        </div>

        <div style="margin-top:auto; padding-top:12px; border-top:1px solid var(--border-subtle); font-size:0.72rem; color:var(--text-muted);">
          <div>Mounted: <strong style="color:var(--cyan-glow);">${activeScenario.name}</strong></div>
          <div style="margin-top:2px;">Examiner: <span style="color:#fff;">${store.state.user.username}</span></div>
        </div>
      </div>

      <!-- Center: Toolbar & Files Grid -->
      <div class="explorer-center-pane">
        <div class="explorer-toolbar">
          <div class="toolbar-row-top">
            <div class="path-breadcrumb">
              <span style="color:var(--text-muted);">${getIcon('terminal')}</span>
              <span>${currentPath}</span>
            </div>
            <div class="search-input-box">
              <span class="search-icon">${getIcon('search')}</span>
              <input type="text" id="explorer-search-input" class="search-input" placeholder="Search filenames, hex, logs..." value="${escapeHtml(searchQuery)}">
            </div>
          </div>

          <div class="toolbar-row-bottom">
            <div class="filter-group">
              <button class="filter-btn ${activeFilter === 'ALL' ? 'active' : ''}" data-filter="ALL">All (${files.length})</button>
              <button class="filter-btn ${activeFilter === 'ACTIVE' ? 'active' : ''}" data-filter="ACTIVE">Active</button>
              <button class="filter-btn ${activeFilter === 'HIDDEN' ? 'active' : ''}" data-filter="HIDDEN">Hidden</button>
              <button class="filter-btn ${activeFilter === 'DELETED' ? 'active' : ''}" data-filter="DELETED">Deleted</button>
              <button class="filter-btn ${activeFilter === 'CORRUPTED' ? 'active' : ''}" data-filter="CORRUPTED">Corrupted</button>
            </div>

            <div class="toggle-toggles">
              <label class="toggle-item">
                <input type="checkbox" id="toggle-hidden-checkbox" ${showHiddenChecked ? 'checked' : ''}>
                <span>Show Hidden</span>
              </label>
              <label class="toggle-item">
                <input type="checkbox" id="toggle-deleted-checkbox" ${showDeletedChecked ? 'checked' : ''}>
                <span>Show Deleted / Slack</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Files List Table -->
        <div class="explorer-file-list">
          <table class="cyber-table">
            <thead>
              <tr>
                <th style="width: 32px;"></th>
                <th style="cursor:pointer;" id="sort-col-name">File Name ${sortBy === 'name' ? (sortAsc ? '▲' : '▼') : ''}</th>
                <th style="cursor:pointer;" id="sort-col-type">Type ${sortBy === 'type' ? (sortAsc ? '▲' : '▼') : ''}</th>
                <th style="cursor:pointer;" id="sort-col-size">Size ${sortBy === 'size' ? (sortAsc ? '▲' : '▼') : ''}</th>
                <th style="cursor:pointer;" id="sort-col-date">Modified ${sortBy === 'date' ? (sortAsc ? '▲' : '▼') : ''}</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${files.length === 0 ? `
                <tr>
                  <td colspan="8" style="text-align:center; padding:32px; color:var(--text-muted);">
                    No files found matching filter criteria in this directory.
                  </td>
                </tr>
              ` : files.map(file => {
                const isSelected = selectedFile && selectedFile.id === file.id;
                let statusBadge = `<span class="badge badge-active">ACTIVE</span>`;
                if (file.status === 'HIDDEN') statusBadge = `<span class="badge badge-hidden">HIDDEN</span>`;
                else if (file.status === 'DELETED') statusBadge = `<span class="badge badge-deleted">DELETED</span>`;
                else if (file.status === 'CORRUPTED') statusBadge = `<span class="badge badge-corrupted">CORRUPTED</span>`;
                else if (file.status === 'RECOVERABLE') statusBadge = `<span class="badge badge-recoverable">RECOVERED</span>`;

                let priorityBadge = `<span class="badge badge-priority-low">LOW</span>`;
                if (file.importance === 'HIGH') priorityBadge = `<span class="badge badge-priority-high">HIGH</span>`;
                else if (file.importance === 'MEDIUM') priorityBadge = `<span class="badge badge-priority-med">MED</span>`;

                const isRecovered = filesRecovered.includes(file.id);

                return `
                  <tr class="file-row ${isSelected ? 'selected' : ''}" data-file-id="${file.id}" style="cursor:pointer;">
                    <td>
                      <div style="width:16px; height:16px; color:${file.status === 'DELETED' ? 'var(--rose-danger)' : (file.hidden ? 'var(--purple-accent)' : 'var(--cyan-glow)')};">
                        ${getIcon(file.type === 'DOCX' || file.type === 'TXT' || file.type === 'LOG' ? 'fileText' : (file.status === 'DELETED' ? 'trash' : 'file'))}
                      </div>
                    </td>
                    <td style="font-weight:600; color:${file.hidden ? '#c084fc' : (file.status === 'DELETED' ? '#fb7185' : '#fff')};">
                      ${file.name}
                    </td>
                    <td style="font-family:var(--font-mono); font-size:0.75rem; color:var(--text-muted);">${file.type}</td>
                    <td style="font-family:var(--font-mono); font-size:0.75rem;">${file.size}</td>
                    <td style="font-family:var(--font-mono); font-size:0.75rem; color:var(--text-muted);">${file.modified || file.created}</td>
                    <td>${statusBadge}</td>
                    <td>${priorityBadge}</td>
                    <td>
                      <div style="display:flex; gap:6px;">
                        <button class="btn btn-sm btn-secondary quick-inspect-btn" data-file-id="${file.id}" title="Inspect Metadata">
                          Inspect
                        </button>
                        ${(file.status === 'DELETED' || file.status === 'CORRUPTED') && !isRecovered ? `
                          <button class="btn btn-sm btn-success quick-recover-btn" data-file-id="${file.id}" title="${file.status === 'CORRUPTED' ? 'Salvage Corrupted File' : 'Recover Deleted File'}">
                            ${file.status === 'CORRUPTED' ? 'Salvage' : 'Recover'}
                          </button>
                        ` : ''}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Right: Preview Pane & Hex Viewer -->
      <div class="explorer-preview-pane">
        ${selectedFile ? `
          <div class="preview-header">
            <span>Inspector Preview</span>
            <span class="badge ${selectedFile.importance === 'HIGH' ? 'badge-priority-high' : 'badge-priority-low'}">${selectedFile.importance}</span>
          </div>

          <div class="preview-content">
            <!-- File Info Header Card -->
            <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 10px;">
              <div style="font-size: 0.9rem; font-weight: 700; color: #fff; word-break: break-all; margin-bottom: 4px;">
                ${selectedFile.name}
              </div>
              <div style="font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono);">
                ${selectedFile.path}
              </div>
            </div>

            <!-- Content Preview Block -->
            <div>
              <div style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px;">
                Decoded Content Preview
              </div>
              <div class="preview-box">
                ${escapeHtml(selectedFile.contentPreview || 'No direct text stream decoded. Raw cluster view below.')}
              </div>
            </div>

            <!-- Hex Dump Section -->
            <div>
              <div style="font-size: 0.72rem; font-weight: 700; color: var(--cyan-glow); text-transform: uppercase; margin-bottom: 6px; display:flex; justify-content:space-between;">
                <span>Hex / Sector Dump</span>
                <span style="font-family:var(--font-mono); font-size:0.65rem;">OFFSET 0x0000</span>
              </div>
              <div class="hex-dump-container">
                ${formatHexDump(selectedFile.hexData)}
              </div>
            </div>

            <!-- Fast Action Buttons -->
            <div style="display:flex; flex-direction:column; gap:8px; margin-top:auto; padding-top:12px;">
              <button id="preview-deep-meta-btn" class="btn btn-secondary w-full" data-file-id="${selectedFile.id}">
                <span style="width:14px;height:14px;">${getIcon('search')}</span>
                Deep Metadata Analysis
              </button>
              ${(selectedFile.status === 'DELETED' || selectedFile.status === 'CORRUPTED') && !filesRecovered.includes(selectedFile.id) ? `
                <button id="preview-recover-btn" class="btn btn-primary w-full" data-file-id="${selectedFile.id}">
                  <span style="width:14px;height:14px;">${getIcon('refreshCw')}</span>
                  ${selectedFile.status === 'CORRUPTED' ? 'Initiate Forensic Salvage & Recovery' : 'Initiate File Carving & Recovery'}
                </button>
              ` : `
                <button id="preview-add-evidence-btn" class="btn btn-cyber-outline w-full" data-file-id="${selectedFile.id}">
                  <span style="width:14px;height:14px;">${getIcon('shield')}</span>
                  Stage on Evidence Bench
                </button>
              `}
            </div>
          </div>
        ` : `
          <div style="color:var(--text-muted); text-align:center; padding-top:40px;">
            Select a file to inspect metadata and hex signatures.
          </div>
        `}
      </div>
    </div>
  `;

  // Attach event handlers
  // Tree navigation
  container.querySelectorAll('.tree-node').forEach(node => {
    node.addEventListener('click', () => {
      const path = node.getAttribute('data-folder-path');
      if (path) store.setCurrentPath(path);
    });
  });

  // Row selection
  container.querySelectorAll('.file-row').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('button')) return; // ignore click on buttons
      const fId = row.getAttribute('data-file-id');
      store.selectFile(fId);
    });
  });

  // Filter buttons
  container.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeFilter = btn.getAttribute('data-filter');
      renderExplorer(appNavigate);
    });
  });

  // Toggles
  const hiddenCheck = document.getElementById('toggle-hidden-checkbox');
  if (hiddenCheck) {
    hiddenCheck.addEventListener('change', (e) => {
      showHiddenChecked = e.target.checked;
      renderExplorer(appNavigate);
    });
  }

  const deletedCheck = document.getElementById('toggle-deleted-checkbox');
  if (deletedCheck) {
    deletedCheck.addEventListener('change', (e) => {
      showDeletedChecked = e.target.checked;
      renderExplorer(appNavigate);
    });
  }

  // Search input
  const searchInput = document.getElementById('explorer-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderExplorer(appNavigate);
    });
  }

  // Sort handlers
  const sortColName = document.getElementById('sort-col-name');
  if (sortColName) {
    sortColName.addEventListener('click', () => {
      if (sortBy === 'name') sortAsc = !sortAsc;
      else { sortBy = 'name'; sortAsc = true; }
      renderExplorer(appNavigate);
    });
  }
  const sortColDate = document.getElementById('sort-col-date');
  if (sortColDate) {
    sortColDate.addEventListener('click', () => {
      if (sortBy === 'date') sortAsc = !sortAsc;
      else { sortBy = 'date'; sortAsc = true; }
      renderExplorer(appNavigate);
    });
  }
  const sortColType = document.getElementById('sort-col-type');
  if (sortColType) {
    sortColType.addEventListener('click', () => {
      if (sortBy === 'type') sortAsc = !sortAsc;
      else { sortBy = 'type'; sortAsc = true; }
      renderExplorer(appNavigate);
    });
  }
  const sortColSize = document.getElementById('sort-col-size');
  if (sortColSize) {
    sortColSize.addEventListener('click', () => {
      if (sortBy === 'size') sortAsc = !sortAsc;
      else { sortBy = 'size'; sortAsc = true; }
      renderExplorer(appNavigate);
    });
  }

  // Quick Action Buttons
  container.querySelectorAll('.quick-inspect-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const fId = btn.getAttribute('data-file-id');
      store.selectFile(fId);
      store.reviewMetadata(fId);
      appNavigate('metadata');
    });
  });

  container.querySelectorAll('.quick-recover-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const fId = btn.getAttribute('data-file-id');
      store.selectFile(fId);
      appNavigate('recovery');
    });
  });

  const deepMetaBtn = document.getElementById('preview-deep-meta-btn');
  if (deepMetaBtn) {
    deepMetaBtn.addEventListener('click', () => {
      const fId = deepMetaBtn.getAttribute('data-file-id');
      store.reviewMetadata(fId);
      appNavigate('metadata');
    });
  }

  const previewRecoverBtn = document.getElementById('preview-recover-btn');
  if (previewRecoverBtn) {
    previewRecoverBtn.addEventListener('click', () => {
      const fId = previewRecoverBtn.getAttribute('data-file-id');
      if (fId) store.selectFile(fId);
      appNavigate('recovery');
    });
  }

  const previewEvidenceBtn = document.getElementById('preview-add-evidence-btn');
  if (previewEvidenceBtn) {
    previewEvidenceBtn.addEventListener('click', () => {
      const fId = previewEvidenceBtn.getAttribute('data-file-id');
      store.addEvidence(fId);
      showToast('Evidence Staged', 'File added to Evidence Bench', 'success');
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
