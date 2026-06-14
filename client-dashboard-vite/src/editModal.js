import { updateClient, updateProfile } from './services/clientService.js';
import { createInlineError, withButtonLoading, preventDuplicate } from './utils/asyncUtils.js';

export function openEditModal(client, activeProfile, onUpdateSuccess) {
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200';
  
  const modalContent = document.createElement('div');
  modalContent.className = 'bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200';
  
  modalContent.innerHTML = `
    <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
      <h2 class="text-xl font-bold text-gray-900">Edit Profile</h2>
      <button id="close-modal" class="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
    </div>
    <form id="edit-client-form" class="p-6 space-y-4">
      <div class="pb-2">
        <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Client Info</h3>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Client Name</label>
          <input type="text" name="buyer_name" required class="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" value="${client.buyer_name}">
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
          <input type="text" name="phone" required class="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" value="${client.phone}">
        </div>
      </div>
      <div class="pt-3 border-t border-gray-100 pb-2">
        <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Profile Details</h3>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Site Location</label>
          <input type="text" name="site_location" required class="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" value="${activeProfile.site_location}">
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Rate (₹)</label>
          <input type="number" name="rate" required min="0" step="0.01" class="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" value="${activeProfile.rate}">
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Quantity</label>
          <input type="number" name="quantity_value" required min="0" step="0.01" class="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" value="${activeProfile.quantity_value}">
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Grand Total (₹)</label>
          <input type="text" name="grand_total" readonly class="w-full rounded-lg border-gray-100 bg-gray-50 border p-2.5 text-sm font-bold text-blue-600 outline-none transition-all cursor-not-allowed" value="${(activeProfile.rate * activeProfile.quantity_value).toFixed(2)}">
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Unit</label>
          <select name="quantity_type" required class="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white">
            <option value="">Select unit</option>
            ${['RFT', 'Panel', 'RMT', 'Cement', 'Post'].map(t =>
              `<option value="${t}" ${activeProfile.quantity_type === t ? 'selected' : ''}>${t}</option>`
            ).join('')}
          </select>
        </div>
      </div>
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
        <textarea name="notes" rows="3" class="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none">${activeProfile.notes || ''}</textarea>
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

  const rateInput = form.querySelector('input[name="rate"]');
  const qtyInput = form.querySelector('input[name="quantity_value"]');
  const totalInput = form.querySelector('input[name="grand_total"]');

  const updateGrandTotal = () => {
    const rate = parseFloat(rateInput.value) || 0;
    const qty = parseFloat(qtyInput.value) || 0;
    totalInput.value = (rate * qty).toFixed(2);
  };

  rateInput.addEventListener('input', updateGrandTotal);
  qtyInput.addEventListener('input', updateGrandTotal);

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
    const clientUpdates = {
      buyer_name: formData.get('buyer_name'),
      phone: formData.get('phone'),
    };

    const profileUpdates = {
      site_location: formData.get('site_location'),
      rate: parseFloat(formData.get('rate')),
      quantity_value: parseFloat(formData.get('quantity_value')),
      quantity_type: formData.get('quantity_type'),
      notes: formData.get('notes'),
    };

    const updatedClient = await updateClient(client.id, clientUpdates, client.updated_at);
    const updatedProfile = await updateProfile(activeProfile.id, profileUpdates, activeProfile.updated_at, client.id);

    onUpdateSuccess(updatedClient, updatedProfile);
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