import './style.css';
import { initAuth, guardPage, logout } from './auth.js';
import { fetchClients, addClient } from './services/clientService.js';
import { buildFilterPanel } from './filterPanel.js';
import { buildClientCard } from './clientCard.js';
import { buildEmptyState } from './emptyState.js';
import { createContainerState } from './utils/asyncUtils.js';
import { openAddClientModal } from './addClientModal.js';

async function buildDashboard(authSnapshot) {
  const app = document.getElementById('app');
  app.replaceChildren();

  const isAdmin = authSnapshot.role === 'Admin';
  const authUser = authSnapshot.user;
  const wrapper = document.createElement('div');
  wrapper.className = 'min-h-screen flex flex-col bg-gray-50';

  // Navigation
  const nav = document.createElement('nav');
  nav.className = 'bg-white border-b border-gray-200 sticky top-0 z-10';
  nav.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16 items-center">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">T</div>
          <span class="text-xl font-bold text-gray-900 tracking-tight">Trycon Builtcare</span>
        </div>
        <div class="flex items-center space-x-4">
          <span class="hidden sm:inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold uppercase tracking-wider">${authSnapshot.role || 'User'}</span>
          ${isAdmin ? `
          <button id="add-client-btn" class="hidden sm:inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            <span>Register New Client</span>
          </button>
          ` : ''}
          <button id="logout-btn" class="text-gray-500 hover:text-red-600 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          </button>
        </div>
      </div>
    </div>
  `;
  wrapper.appendChild(nav);
  wrapper.querySelector('#logout-btn').onclick = logout;
  const addClientBtn = wrapper.querySelector('#add-client-btn');
  if (addClientBtn) {
    addClientBtn.onclick = () => openAddClientModal(handleAddClientSuccess);
  }

  const content = document.createElement('div');
  content.className = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full';

  // Client List Container
  const clientListContainer = document.createElement('div');
  clientListContainer.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
  const containerState = createContainerState(clientListContainer);

  // Pagination State
  let currentPage = 0;
  const pageSize = 20;
  let totalCount = 0;

  const paginationContainer = document.createElement('div');
  paginationContainer.className = 'flex justify-between items-center mt-8 py-4 border-t border-gray-200';
  paginationContainer.innerHTML = `
    <button id="prev-btn" class="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
      Previous
    </button>
    <span id="page-info" class="text-sm text-gray-700"></span>
    <button id="next-btn" class="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
      Next
    </button>
  `;

  const prevBtn = paginationContainer.querySelector('#prev-btn');
  const nextBtn = paginationContainer.querySelector('#next-btn');
  const pageInfo = paginationContainer.querySelector('#page-info');

  async function updatePage(newPage) {
    currentPage = newPage;
    containerState.start('Loading clients...');
    try {
      const filters = filterPanel.getFilters?.() || {};
      const { data, count } = await fetchClients({ filters, page: currentPage, pageSize });
      totalCount = count;
      renderClients(data);
      updatePaginationUI();
    } catch (err) {
      containerState.fail(err.message);
    }
  }

  prevBtn.onclick = () => updatePage(currentPage - 1);
  nextBtn.onclick = () => updatePage(currentPage + 1);

  function updatePaginationUI() {
    const totalPages = Math.ceil(totalCount / pageSize);
    prevBtn.disabled = currentPage === 0;
    nextBtn.disabled = (currentPage + 1) >= totalPages || totalCount === 0;
    pageInfo.textContent = totalCount > 0 
      ? `Page ${currentPage + 1} of ${totalPages || 1} (${totalCount} total)`
      : 'No clients found';
    
    paginationContainer.style.display = totalCount > 0 ? 'flex' : 'none';
  }

  let hasActiveFilters = false;

  function renderClients(clients) {
    clientListContainer.replaceChildren();
    if (!clients || clients.length === 0) {
      const kind = hasActiveFilters ? 'noFilterResults' : 'noRecords';
      const onAction = hasActiveFilters
        ? () => filterPanel.reset()
        : () => openAddClientModal(handleAddClientSuccess);
      clientListContainer.appendChild(buildEmptyState(kind, onAction));
      return;
    }
    clients.forEach(c => clientListContainer.appendChild(buildClientCard(c, isAdmin, authUser?.id, handleDeleteClient)));
  }

  function handleDeleteClient(deletedClientId) {
    const card = clientListContainer.querySelector(`[data-client-id="${deletedClientId}"]`);
    if (card) {
      card.style.transition = 'opacity 0.3s, transform 0.3s';
      card.style.opacity = '0';
      card.style.transform = 'scale(0.95)';
      setTimeout(() => {
        card.remove();
        totalCount--;
        updatePaginationUI();
        if (clientListContainer.children.length === 0) {
          const kind = hasActiveFilters ? 'noFilterResults' : 'noRecords';
          const onAction = hasActiveFilters
            ? () => filterPanel.reset()
            : () => openAddClientModal(handleAddClientSuccess);
          clientListContainer.appendChild(buildEmptyState(kind, onAction));
        }
      }, 300);
    }
  }

  function handleAddClientSuccess(newClient) {
    currentPage = 0;
    containerState.start('Loading clients...');
    fetchClients({ page: currentPage, pageSize })
      .then(({ data, count }) => {
        totalCount = count;
        renderClients(data);
        updatePaginationUI();
      })
      .catch(err => containerState.fail(err.message));
  }

  // Filter Panel Integration
  const filterPanel = buildFilterPanel(async (filters) => {
    hasActiveFilters = Object.keys(filters).length > 0;
    currentPage = 0; // Reset to first page on filter change
    containerState.start('Updating clients...');
    try {
      const { data, count } = await fetchClients({ filters, page: currentPage, pageSize });
      totalCount = count;
      renderClients(data);
      updatePaginationUI();
    } catch (err) {
      containerState.fail(err.message);
    }
  });

  content.append(filterPanel, clientListContainer, paginationContainer);
  wrapper.appendChild(content);
  app.appendChild(wrapper);

  // Initial Load
  containerState.start('Loading clients...');
  try {
    const { data, count } = await fetchClients({ page: currentPage, pageSize });
    totalCount = count;
    renderClients(data);
    updatePaginationUI();
  } catch (err) {
    containerState.fail(err.message);
  }
}

async function boot() {
  await initAuth();
  try {
    const auth = await guardPage();
    buildDashboard(auth);
    document.body.classList.remove('auth-loading');
  } catch (err) {
    console.error('Boot error:', err);
  }
}

document.addEventListener('DOMContentLoaded', boot);
