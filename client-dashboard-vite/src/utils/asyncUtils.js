const SPINNER_CLASSES = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-3',
};

export function createSpinner({ size = 'md', className = '' } = {}) {
  const el = document.createElement('div');
  el.className = `${SPINNER_CLASSES[size]} border-blue-600 border-t-transparent rounded-full animate-spin ${className}`;
  el.setAttribute('role', 'status');
  el.setAttribute('aria-label', 'Loading');
  return el;
}

export function createContainerState(container) {
  const defaultContent = container.innerHTML;

  function start(text = 'Loading...') {
    container.replaceChildren();
    const wrapper = document.createElement('div');
    wrapper.className = 'flex items-center justify-center py-12 text-gray-400';
    wrapper.appendChild(createSpinner({ size: 'lg' }));
    const label = document.createElement('span');
    label.className = 'ml-3 text-sm';
    label.textContent = text;
    wrapper.appendChild(label);
    container.appendChild(wrapper);
  }

  function succeed() {
    container.innerHTML = defaultContent;
  }

  function fail(message) {
    container.replaceChildren();
    const errorEl = document.createElement('div');
    errorEl.className = 'col-span-full py-12 text-center text-red-500 font-medium';
    errorEl.setAttribute('role', 'alert');
    errorEl.textContent = message;
    container.appendChild(errorEl);
  }

  return { start, succeed, fail };
}

export function createInlineError() {
  const el = document.createElement('div');
  el.className = 'hidden p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100';
  el.setAttribute('role', 'alert');

  return {
    element: el,
    show(message) {
      el.textContent = message;
      el.classList.remove('hidden');
    },
    hide() {
      el.classList.add('hidden');
      el.textContent = '';
    },
  };
}

export function preventDuplicate(action) {
  let isRunning = false;

  return async (...args) => {
    if (isRunning) return;
    isRunning = true;
    try {
      return await action(...args);
    } finally {
      isRunning = false;
    }
  };
}

export function withButtonLoading(button) {
  const originalContent = button.innerHTML;
  const originalDisabled = button.disabled;

  function startLoading(text = 'Saving...') {
    button.disabled = true;
    button.innerHTML = `<span class="flex items-center justify-center space-x-2"><svg class="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg><span>${text}</span></span>`;
  }

  function stopLoading() {
    button.disabled = originalDisabled;
    button.innerHTML = originalContent;
  }

  return { startLoading, stopLoading, originalContent };
}

export function withToast() {
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-4 right-4 z-[100] transform transition-all duration-300 translate-y-4 opacity-0';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');

  function show(message, type = 'success') {
    const colors = type === 'success'
      ? 'bg-green-600 text-white'
      : 'bg-red-600 text-white';
    toast.className = `fixed bottom-4 right-4 z-[100] transform transition-all duration-300 translate-y-0 opacity-100 ${colors} px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center space-x-2`;
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-4', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  return { show };
}
