/**
 * ForensicLab Auth Module
 */
import { store } from '../state.js';
import { showToast } from '../utils/toast.js';
import { scenario1 } from '../scenarios/scenario1_usb.js';

export function initAuthModule(appNavigate) {
  const loginForm = document.getElementById('login-form');
  const usernameInput = document.getElementById('login-username');
  const passwordInput = document.getElementById('login-password');
  const demoBtn = document.getElementById('login-demo-btn');
  const errorBox = document.getElementById('login-error-msg');

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = usernameInput.value.trim();
      const password = passwordInput.value.trim();

      if (!username) {
        if (errorBox) {
          errorBox.textContent = 'Please enter an investigator username of your choice.';
          errorBox.style.display = 'block';
        }
        showToast('Input Required', 'Please enter your username', 'warning');
        return;
      }

      if (!password) {
        if (errorBox) {
          errorBox.textContent = 'Please enter a password of your choice.';
          errorBox.style.display = 'block';
        }
        showToast('Input Required', 'Please enter your password', 'warning');
        return;
      }

      if (errorBox) errorBox.style.display = 'none';
      store.login(username);
      showToast('Authentication Verified', `Welcome to ForensicLab, ${username}!`, 'success');
      appNavigate('dashboard');
    });
  }

  // Quick Demo Mode button
  if (demoBtn) {
    demoBtn.addEventListener('click', () => {
      const username = (usernameInput.value.trim()) || 'trainee';
      store.login(username);
      // Preload Scenario 1 for instant evaluation
      store.startScenario(scenario1);
      showToast('Demo Mode Activated', `Loaded USB Evidence Recovery scenario for ${username}`, 'info');
      appNavigate('explorer');
    });
  }
}
