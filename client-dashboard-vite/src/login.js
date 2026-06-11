import { supabase } from './supabaseClient.js';
import { withToast } from './utils/asyncUtils.js';

export async function handleLogin(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw error;
  }

  window.location.replace('/index.html');
}

export function setupLoginForm() {
  const form = document.getElementById('login-form');

  if (!form) {
    console.warn('[login.js] Login form not found');
    return;
  }

  const { show } = withToast();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      await handleLogin(email, password);
    } catch (error) {
      console.error('[login.js] Login failed:', error);
      show(`Login failed: ${error.message}`, 'error');
    }
  });
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupLoginForm);
} else {
  setupLoginForm();
}