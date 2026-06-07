import { updateClient } from './services/clientService.js';
import { createInlineError, withButtonLoading, preventDuplicate } from './utils/asyncUtils.js';

export function openEditModal(client, onUpdateSuccess) {
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200';
  
  const modalContent = document.createElement('div');
  modalContent.className = 'bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200';
  
  modalContent.innerHTML = `
    <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
      <h2 class="text-xl font-bold text-gray-900">Edit Client</h2>
      <button id="close-modal" class="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
    </div>
    <form id="edit-client-form" class="p-6 space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Client Name</label>
          <input type="text" name="buyer_name" required class="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" value="${client.buyer_name}">
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
          <input type="text" name="phone" required class="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" value="${client.phone}">
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
          <input type="email" name="email" required class="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" value="${client.email}">
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Site Location</label>
          <input type="text" name="site_location" required class="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" value="${client.site_location}">
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Rate (₹)</label>
          <input type="number" name="rate" required min="0" step="0.01" class="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" value="${client.rate}">
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Quantity</label>
          <input type="number" name="quantity_value" required min="0" step="0.01" class="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" value="${client.quantity_value}">
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Unit</label>
          <input type="text" name="quantity_type" required class="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" value="${client.quantity_type}">
        </div>
      </div>
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
        <textarea name="notes" rows="3" class="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none">${client.notes || ''}</textarea>
      </div>
      <div id="error-container" class="hidden p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100"></div>
      <div class="flex justify-end space-x-3 pt-4 border-t border-gray-100">
        <button type="button" id="cancel-edit" class="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors">Cancel</button>
        <button type="submit" id="submit-edit" class="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2">
          <span>Save Changes</span>
        </button>
      </div>
    </form>
  `;

  modalOverlay.appendChild(modalContent);
  document.body.appendChild(modalOverlay);

  const form = modalContent.querySelector('#edit-client-form');
  const errorContainer = createInlineError();
  modalContent.querySelector('#error-container').replaceWith(errorContainer.element);
  const submitBtn = modalContent.querySelector('#submit-edit');
  const closeBtn = modalContent.querySelector('#close-modal');
  const cancelBtn = modalContent.querySelector('#cancel-edit');

  const closeModal = () => {
    modalOverlay.classList.replace('fade-in', 'fade-out');
    modalContent.classList.replace('zoom-in-95', 'zoom-out-95');
    setTimeout(() => modalOverlay.remove(), 200);
  };

  closeBtn.onclick = closeModal;
  cancelBtn.onclick = closeModal;
  modalOverlay.onclick = (e) => { if (e.target === modalOverlay) closeModal(); };

  const handleSubmit = preventDuplicate(async () => {
    errorContainer.hide();

    const formData = new FormData(form);
    const updates = {
      buyer_name: formData.get('buyer_name'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      site_location: formData.get('site_location'),
      rate: parseFloat(formData.get('rate')),
      quantity_value: parseFloat(formData.get('quantity_value')),
      quantity_type: formData.get('quantity_type'),
      notes: formData.get('notes')
    };

    const updatedClient = await updateClient(client.id, updates, client.updated_at);
    onUpdateSuccess(updatedClient);
    closeModal();
  });

  form.onsubmit = async (e) => {
    e.preventDefault();
    const { startLoading, stopLoading } = withButtonLoading(submitBtn);
    startLoading();
    try {
      await handleSubmit();
    } catch (err) {
      errorContainer.show(err.message);
      stopLoading();
    }
  };
}
