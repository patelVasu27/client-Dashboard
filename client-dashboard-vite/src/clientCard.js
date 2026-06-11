import { updateProfile, deleteClient, deleteProfile } from './services/clientService.js';
import { openEditModal } from './editModal.js';
import { openAddProfileModal } from './addProfileModal.js';
import { createInlineError, preventDuplicate } from './utils/asyncUtils.js';

function buildInfoItemsFromProfile(profile) {
  return [
    { label: 'Location', value: profile.site_location || '' },
    { label: 'Rate', value: `₹${profile.rate || 0}/${profile.quantity_type || ''}` },
    { label: 'Quantity', value: `${profile.quantity_value || 0} ${profile.quantity_type || ''}` },
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

function createNotesContent(notes, canEdit, onSave) {
  const container = document.createElement('div');
  container.className = 'mt-2 hidden';

  if (canEdit) {
    const textarea = document.createElement('textarea');
    textarea.className =
      'w-full min-h-[60px] max-h-[100px] rounded-md border border-gray-300 p-2 text-xs text-gray-700 resize-y focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
    textarea.value = notes || '';

    const errorMsg = createInlineError();
    errorMsg.element.className = 'mt-1 text-xs text-red-500 hidden';

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className =
      'mt-1 w-full rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
    saveBtn.textContent = 'Save Notes';

    const originalNotes = notes || '';

    const handleSave = preventDuplicate(async () => {
      errorMsg.hide();
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
      try {
        await onSave(textarea.value);
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
    view.textContent = notes || 'No notes';
    container.appendChild(view);
  }

  return container;
}

export function buildClientCard(client, isAdmin, currentUserId, onDelete) {
  const canEdit = isAdmin;
  const profiles = client.purchase_profiles || [];
  let activeProfileIndex = Math.max(0, profiles.length - 1);

  const card = document.createElement('div');
  card.className = 'client-card perspective-1000 h-[360px] w-full';
  card.dataset.clientId = client.id;

  const inner = document.createElement('div');
  inner.className =
    'card-inner relative w-full h-full transition-transform duration-500 preserve-3d';

  function buildProfilePills() {
    const container = document.createElement('div');
    container.className = 'flex items-center gap-1.5 mb-3 flex-wrap';

    profiles.forEach((_, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      const isActive = index === activeProfileIndex;
      btn.className = `h-8 min-w-[32px] px-2.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
        isActive
          ? 'bg-blue-600 text-white shadow-sm'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`;
      btn.textContent = index + 1;
      btn.title = `Purchase profile ${index + 1}`;
      btn.onclick = (e) => {
        e.stopPropagation();
        activeProfileIndex = index;
        renderFront();
        renderBack();
      };
      container.appendChild(btn);
    });

    if (canEdit) {
      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className =
        'h-8 w-8 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-lg font-bold cursor-pointer';
      addBtn.innerHTML = '+';
      addBtn.title = 'Add another purchase profile';
      addBtn.onclick = (e) => {
        e.stopPropagation();
        openAddProfileModal(client.id, (newProfile) => {
          profiles.push(newProfile);
          profiles.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          activeProfileIndex = profiles.length - 1;
          renderFront();
          renderBack();
        });
      };
      container.appendChild(addBtn);
    }

    return container;
  }

  const front = document.createElement('div');
  front.className =
    'card-front absolute inset-0 backface-hidden bg-white rounded-xl shadow-md p-6 flex flex-col border border-gray-100';

  function renderFront() {
    front.replaceChildren();
    const activeProfile = profiles[activeProfileIndex] || {};
    const profileRate = +activeProfile.rate || 0;
    const profileQty = +activeProfile.quantity_value || 0;

    const header = document.createElement('div');
    header.className = 'flex justify-between items-start mb-1';

    const name = document.createElement('h3');
    name.className = 'text-lg font-bold text-gray-900 line-clamp-1';
    name.textContent = client.buyer_name;

    const totalVal = profileRate * profileQty;
    const total = document.createElement('div');
    total.className = 'text-blue-600 font-bold text-lg shrink-0 ml-3';
    total.textContent = `₹${totalVal.toLocaleString()}`;

    header.append(name, total);

    const pills = buildProfilePills();

    const details = document.createElement('div');
    details.className = 'space-y-1 text-sm text-gray-600 flex-1 overflow-y-auto';

    buildInfoItemsFromProfile(activeProfile).forEach((item) => {
      const p = document.createElement('p');
      const label = document.createElement('span');
      label.className = 'font-medium text-gray-500';
      label.textContent = `${item.label}: `;
      p.append(label, document.createTextNode(item.value));
      details.appendChild(p);
    });

    const notesToggle = createToggleButton();
    const notesSaveHandler = async (value) => {
      const result = await updateProfile(
        activeProfile.id,
        { notes: value },
        activeProfile.updated_at,
        client.id
      );
      activeProfile.notes = value;
      activeProfile.updated_at = result.updated_at;
    };
    const notesContent = createNotesContent(activeProfile.notes, canEdit, notesSaveHandler);

    notesToggle.addEventListener('click', () => {
      const isHidden = notesContent.classList.toggle('hidden');
      notesToggle.textContent = isHidden ? 'Show Notes' : 'Hide Notes';
    });

    const footer = document.createElement('div');
    footer.className =
      'mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400';
    footer.textContent = `Created by: ${client.created_by?.split('-')[0]}...`;

    front.append(header, pills, details, notesToggle, notesContent, footer);
  }

  const back = document.createElement('div');
  back.className =
    'card-back absolute inset-0 bg-gray-50 rounded-xl shadow-md p-6 flex flex-col items-center justify-center space-y-4 border border-gray-200';

  function renderBack() {
    back.replaceChildren();
    const activeProfile = profiles[activeProfileIndex];

    const editBtn = document.createElement('button');
    editBtn.className =
      'w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors cursor-pointer';
    editBtn.textContent = profiles.length > 1 ? 'Edit Profile' : 'Edit Client';
    editBtn.onclick = () => {
      openEditModal(client, activeProfile, (clientUpdates, profileUpdates) => {
        Object.assign(client, clientUpdates);
        if (profileUpdates && activeProfile) {
          Object.assign(activeProfile, profileUpdates);
        }
        renderFront();
        renderBack();
      });
    };
    back.appendChild(editBtn);

    if (canEdit) {
      if (profiles.length > 1) {
        const deleteProfileBtn = document.createElement('button');
        deleteProfileBtn.className =
          'w-full py-2 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg font-medium hover:bg-orange-100 transition-colors cursor-pointer';
        deleteProfileBtn.textContent = 'Delete Profile';
        deleteProfileBtn.onclick = async (e) => {
          e.stopPropagation();
          errorMsg.hide();
          if (!confirm(`Delete purchase profile ${activeProfileIndex + 1} for \"${client.buyer_name}\"?`)) return;
          try {
            const profileId = activeProfile.id;
            await deleteProfile(profileId, client.id);
            profiles.splice(activeProfileIndex, 1);
            if (profiles.length === 0) {
              await deleteClient(client.id);
              if (onDelete) onDelete(client.id);
              return;
            }
            activeProfileIndex = Math.min(activeProfileIndex, profiles.length - 1);
            renderFront();
            renderBack();
          } catch (err) {
            errorMsg.show(`Failed to delete profile: ${err.message}`);
          }
        };
        back.appendChild(deleteProfileBtn);
      }

      const deleteClientBtn = document.createElement('button');
      deleteClientBtn.className =
        'w-full py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg font-medium hover:bg-red-100 transition-colors cursor-pointer';
      deleteClientBtn.textContent = 'Delete Client';

      const errorMsg = createInlineError();
      deleteClientBtn.appendChild(errorMsg.element);

      deleteClientBtn.onclick = async (e) => {
        e.stopPropagation();
        errorMsg.hide();
        if (!confirm('Are you sure you want to delete this client and all their profiles?')) return;
        try {
          await deleteClient(client.id);
          if (onDelete) onDelete(client.id);
        } catch (err) {
          errorMsg.show(`Failed to delete: ${err.message}`);
        }
      };
      back.appendChild(deleteClientBtn);
    }
  }

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