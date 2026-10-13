/**
 * ForensicLab Toast Notification Dispatcher
 */
import { getIcon } from './icons.js';

export function showToast(title, message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconName = 'shield';
  if (type === 'success') iconName = 'checkCircle';
  if (type === 'warning') iconName = 'alertTriangle';
  if (type === 'error') iconName = 'alertTriangle';

  toast.innerHTML = `
    <div style="width: 20px; height: 20px; color: currentColor; flex-shrink: 0;">
      ${getIcon(iconName)}
    </div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" title="Dismiss" style="width:16px;height:16px;">
      ${getIcon('x')}
    </button>
  `;

  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    dismissToast(toast);
  });

  container.appendChild(toast);

  if (duration > 0) {
    setTimeout(() => {
      dismissToast(toast);
    }, duration);
  }
}

function dismissToast(toastElement) {
  if (!toastElement || !toastElement.parentElement) return;
  toastElement.style.opacity = '0';
  toastElement.style.transform = 'translateX(40px)';
  setTimeout(() => {
    if (toastElement.parentElement) {
      toastElement.parentElement.removeChild(toastElement);
    }
  }, 200);
}
