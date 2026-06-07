const EMPTY_STATE_CONFIG = {
  noRecords: {
    title: 'No clients yet',
    description: 'Get started by registering your first client.',
    actionLabel: 'Register New Client',
    iconSvg: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />`,
  },
  noFilterResults: {
    title: 'No matching clients',
    description: 'No clients match the current filters. Try adjusting your search criteria.',
    actionLabel: 'Clear Filters',
    iconSvg: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v3m0 0v3m0-3h3m-3 0H7.5" />`,
  },
};

export function buildEmptyState(kind, onAction) {
  const config = EMPTY_STATE_CONFIG[kind];

  if (!config) {
    throw new Error(`Unknown empty state kind: "${kind}". Use "noRecords" or "noFilterResults".`);
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'col-span-full flex items-center justify-center py-16';
  wrapper.setAttribute('role', 'status');

  const card = document.createElement('div');
  card.className = 'bg-white rounded-xl border border-dashed border-gray-300 shadow-sm w-full max-w-sm mx-auto p-8 text-center';

  const iconBox = document.createElement('div');
  iconBox.className = 'mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50';
  iconBox.setAttribute('aria-hidden', 'true');
  iconBox.innerHTML = `<svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">${config.iconSvg}</svg>`;

  const title = document.createElement('h3');
  title.className = 'text-lg font-semibold text-gray-900';
  title.textContent = config.title;

  const description = document.createElement('p');
  description.className = 'mt-2 text-sm text-gray-500 max-w-xs mx-auto';
  description.textContent = config.description;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all';
  button.textContent = config.actionLabel;

  if (onAction) {
    button.addEventListener('click', onAction);
  }

  card.append(iconBox, title, description, button);
  wrapper.appendChild(card);

  return wrapper;
}
