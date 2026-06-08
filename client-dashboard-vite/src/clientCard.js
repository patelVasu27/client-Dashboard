import { updateClient, deleteClient } from './services/clientService.js';
import { openEditModal } from './editModal.js';
import { createInlineError, preventDuplicate } from './utils/asyncUtils.js';

function buildInfoItems(client) {
  return [
    { label: 'Location', value: client.site_location },
    { label: 'Rate', value: `₹${client.rate}/${client.quantity_type}` },
    { label: 'Quantity', value: `${client.quantity_value} ${client.quantity_type}` },
  ];
}

function createToggleButton() {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className =
    'mt-2 w-full text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors cursor-pointer';
  btn.textContent = 'Show Notes';
  return btn;
}

function createNotesContent(client, canEdit) {
  const container = document.createElement('div');
  container.className = 'mt-2 hidden';

  if (canEdit) {
    const textarea = document.createElement('textarea');
    textarea.className =
      'w-full min-h-[60px] max-h-[100px] rounded-md border border-gray-300 p-2 text-xs text-gray-700 resize-y focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
    textarea.value = client.notes || '';

    const errorMsg = createInlineError();
    errorMsg.element.className = 'mt-1 text-xs text-red-500 hidden';

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className =
      'mt-1 w-full rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
    saveBtn.textContent = 'Save Notes';

    const originalNotes = client.notes || '';

    const handleSave = preventDuplicate(async () => {
      errorMsg.hide();
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';

      try {
        await updateClient(client.id, { ...client, notes: textarea.value }, client.updated_at);
        client.notes = textarea.value;
        saveBtn.textContent = 'Saved';
        setTimeout(() => {
          saveBtn.textContent = 'Save Notes';
          saveBtn.disabled = false;
        }, 1500);
      } catch (err) {
        textarea.value = originalNotes;
        errorMsg.show(err.message);
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Notes';
      }
    });

    saveBtn.addEventListener('click', handleSave);

    container.append(textarea, errorMsg.element, saveBtn);
  } else {
    const view = document.createElement('div');
    view.className =
      'rounded-md bg-gray-100 p-2 text-xs text-gray-600 min-h-[28px] whitespace-pre-wrap break-words';
    view.textContent = client.notes || 'No notes';
    container.appendChild(view);
  }

  return container;
}

export function buildClientCard(client, isAdmin, currentUserId, onDelete) {
  const canEdit = isAdmin || client.created_by === currentUserId;
  
  const card = document.createElement('div');
  card.className = 'client-card perspective-1000 h-[320px] w-full';
  card.dataset.clientId = client.id;

  const inner = document.createElement('div');
  inner.className =
    'card-inner relative w-full h-full transition-transform duration-500 preserve-3d';

  const updateCardContent = (updatedClient) => {
    // Update local client object
    Object.assign(client, updatedClient);
    
    // Re-render the front and back
    renderFront();
    renderBack();
  };

  const front = document.createElement('div');
  front.className =
    'card-front absolute inset-0 backface-hidden bg-white rounded-xl shadow-md p-6 flex flex-col border border-gray-100';

  const renderFront = () => {
    front.replaceChildren();
    const header = document.createElement('div');
    header.className = 'flex justify-between items-start mb-3';

    const name = document.createElement('h3');
    name.className = 'text-lg font-bold text-gray-900 line-clamp-1';
    name.textContent = client.buyer_name;

    const total = document.createElement('div');
    total.className = 'text-blue-600 font-bold text-lg';
    total.textContent = `₹${(client.rate * client.quantity_value).toLocaleString()}`;

    header.append(name, total);

    const details = document.createElement('div');
    details.className = 'space-y-1 text-sm text-gray-600 flex-1 overflow-y-auto';

    buildInfoItems(client).forEach((item) => {
      const p = document.createElement('p');
      const label = document.createElement('span');
      label.className = 'font-medium text-gray-500';
      label.textContent = `${item.label}: `;
      p.append(label, document.createTextNode(item.value));
      details.appendChild(p);
    });

    const notesToggle = createToggleButton();
    const notesContent = createNotesContent(client, canEdit);

    notesToggle.addEventListener('click', () => {
      const isHidden = notesContent.classList.toggle('hidden');
      notesToggle.textContent = isHidden ? 'Show Notes' : 'Hide Notes';
    });

    const footer = document.createElement('div');
    footer.className =
      'mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400';
    footer.textContent = `Created by: ${client.created_by?.split('-')[0]}...`;

    front.append(header, details, notesToggle, notesContent, footer);
  };

  const back = document.createElement('div');
  back.className =
    'card-back absolute inset-0 bg-gray-50 rounded-xl shadow-md p-6 flex flex-col items-center justify-center space-y-4 border border-gray-200';

  const renderBack = () => {
    back.replaceChildren();
    const editBtn = document.createElement('button');
    editBtn.className =
      'w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors cursor-pointer';
    editBtn.textContent = 'Edit Client';
    editBtn.onclick = () => openEditModal(client, updateCardContent);

    back.appendChild(editBtn);

    if (canEdit) {
      const deleteBtn = document.createElement('button');
      deleteBtn.className =
        'w-full py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg font-medium hover:bg-red-100 transition-colors cursor-pointer';
      deleteBtn.textContent = 'Delete Client';
      deleteBtn.onclick = async () => {
        if (!confirm('Are you sure you want to delete this client?')) return;
        
        try {
          await deleteClient(client.id);
          if (onDelete) onDelete(client.id);
        } catch (err) {
          alert(`Failed to delete: ${err.message}`);
        }
      };
      back.appendChild(deleteBtn);
    }
  };

  let isFlipped = false;

  const flipCard = () => {
    isFlipped = !isFlipped;
    inner.classList.toggle('rotate-y-180');
  };

  card.addEventListener('click', (e) => {
    const target = e.target;
    if (target.closest('button') || target.closest('textarea') || target.closest('input') || target.closest('select')) {
      return;
    }
    flipCard();
  });

  renderFront();
  renderBack();

  inner.append(front, back);
  card.appendChild(inner);

  return card;
}
