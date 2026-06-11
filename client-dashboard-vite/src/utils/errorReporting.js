import { supabase } from '../supabaseClient.js';

const ERROR_DISPLAY_DURATION = 5000;

export function createErrorDisplay() {
  const container = document.createElement('div');
  container.className = 'fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm';
  container.setAttribute('role', 'alert');
  container.setAttribute('aria-live', 'assertive');
  document.body.appendChild(container);

  function show(message, type = 'error') {
    const colors = type === 'error'
      ? 'bg-red-50 border-red-200 text-red-700'
      : type === 'warning'
        ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
        : 'bg-blue-50 border-blue-200 text-blue-700';

    const el = document.createElement('div');
    el.className = `${colors} border rounded-lg px-4 py-3 text-sm font-medium shadow-lg transform transition-all duration-300 translate-x-full opacity-0`;

    el.innerHTML = `
      <div class="flex items-start gap-2">
        <span class="flex-1">${message}</span>
        <button class="flex-shrink-0 hover:opacity-70 transition-opacity" aria-label="Dismiss">&times;</button>
      </div>
    `;

    el.querySelector('button').onclick = () => dismiss(el);
    container.appendChild(el);

    requestAnimationFrame(() => {
      el.classList.remove('translate-x-full', 'opacity-0');
      el.classList.add('translate-x-0', 'opacity-100');
    });

    setTimeout(() => dismiss(el), ERROR_DISPLAY_DURATION);
  }

  function dismiss(el) {
    el.classList.remove('translate-x-0', 'opacity-100');
    el.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => el.remove(), 300);
  }

  return { show, dismiss: () => container.replaceChildren() };
}

export function reportError(error, context) {
  const errorReport = {
    message: error.message || String(error),
    stack: error.stack,
    context,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  };

  if (import.meta.env.DEV) {
    console.error('[ErrorReport]', errorReport);
    return;
  }

  supabase
    .from('error_logs')
    .insert([errorReport])
    .then(() => {})
    .catch(() => {});

  if (navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(errorReport)], { type: 'application/json' });
    navigator.sendBeacon('/api/errors', blob);
  }
}

export function withErrorBoundary(fn, context) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      reportError(error, context);
      throw error;
    }
  };
}