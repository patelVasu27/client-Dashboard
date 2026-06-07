import { debounce } from './utils/debounce.js';

export function buildFilterPanel(onFilterChange) {
  const panel = document.createElement('div');
  panel.className = 'bg-white rounded-lg shadow-sm p-4 md:p-6 space-y-5 mb-8';

  const title = document.createElement('h2');
  title.className = 'text-lg font-semibold text-gray-800';
  title.textContent = 'Filters';
  panel.appendChild(title);

  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4';

  const fields = [
    { id: 'buyer_name', label: 'Buyer Name', type: 'text', placeholder: 'e.g. Acme Corp' },
    { id: 'site_location', label: 'Site Location', type: 'text', placeholder: 'e.g. Mumbai' },
    { id: 'min_rate', label: 'Rate (Min)', type: 'number', placeholder: '0' },
    { id: 'max_rate', label: 'Rate (Max)', type: 'number', placeholder: '999999' },
    { id: 'min_qty', label: 'Min Quantity', type: 'number', placeholder: '0' },
    { id: 'qty_type', label: 'Quantity Type', type: 'select', options: ['RFT', 'Panel', 'RMT', 'Cement', 'Post'] },
  ];

  const currentFilters = {};

  const handleFilterInput = debounce(() => {
    if (onFilterChange) onFilterChange(currentFilters);
  }, 400);

  function handleInput(id, value) {
    currentFilters[id] = value;
    handleFilterInput();
  }

  function resetFilters() {
    handleFilterInput.cancel();

    for (const key in currentFilters) {
      delete currentFilters[key];
    }

    grid.querySelectorAll('input, select').forEach(el => {
      el.value = '';
    });

    if (onFilterChange) onFilterChange({});
  }

  fields.forEach(field => {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex flex-col gap-1.5';

    const label = document.createElement('label');
    label.htmlFor = field.id;
    label.className = 'text-sm font-medium text-gray-700';
    label.textContent = field.label;

    if (field.type === 'select') {
      const select = document.createElement('select');
      select.id = field.id;
      select.className = 'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
      
      const placeholderOption = document.createElement('option');
      placeholderOption.value = '';
      placeholderOption.textContent = 'All Types';
      select.appendChild(placeholderOption);

      field.options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        select.appendChild(option);
      });

      select.addEventListener('change', (e) => handleInput(field.id, e.target.value));
      wrapper.append(label, select);
    } else {
      const input = document.createElement('input');
      input.type = field.type;
      input.id = field.id;
      input.placeholder = field.placeholder;
      input.className = 'w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 shadow-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
      
      input.addEventListener('input', (e) => handleInput(field.id, e.target.value));
      wrapper.append(label, input);
    }
    grid.appendChild(wrapper);
  });

  panel.appendChild(grid);

  const buttonRow = document.createElement('div');
  buttonRow.className = 'flex justify-end pt-2';

  const resetButton = document.createElement('button');
  resetButton.type = 'button';
  resetButton.className = 'rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors';
  resetButton.textContent = 'Reset All';
  resetButton.onclick = resetFilters;

  buttonRow.appendChild(resetButton);
  panel.appendChild(buttonRow);

  panel.reset = resetFilters;
  panel.getFilters = () => ({ ...currentFilters });

  return panel;
}
