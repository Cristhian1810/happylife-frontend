// --- FUNCIÓN PARA CREAR ELEMENTOS DINÁMICOS ---
function createDynamicElements() {
  if (document.getElementById('password-modal')) return;

  const passwordModalHTML = `<div class="bg-white rounded-xl shadow-2xl w-full max-w-md"><div class="flex justify-between items-center p-6 border-b"><h3 class="text-xl font-bold text-gray-900">Cambiar Contraseña</h3><button id="close-password-modal-btn" class="text-2xl text-gray-400 hover:text-gray-600">&times;</button></div><form id="password-form" class="p-6 space-y-4"><div><label for="password_actual" class="block text-sm font-medium text-gray-700 mb-1">Contraseña Actual</label><input type="password" id="password_actual" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></div><div><label for="nueva_password" class="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label><input type="password" id="nueva_password" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></div><div><label for="confirmar_password" class="block text-sm font-medium text-gray-700 mb-1">Confirmar Nueva Contraseña</label><input type="password" id="confirmar_password" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></div><div class="flex justify-end gap-3 pt-4"><button type="button" id="cancel-password-change-btn" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Cancelar</button><button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Guardar Contraseña</button></div></form></div>`;
  const deleteModalHTML = `<div class="bg-white rounded-xl shadow-2xl w-full max-w-md text-center"><div class="p-6"><div class="mx-auto bg-red-100 rounded-full w-16 h-16 flex items-center justify-center"><i class="bi bi-exclamation-triangle-fill text-red-600 text-4xl"></i></div><h3 class="text-2xl font-bold text-gray-900 mt-4">¿Estás seguro?</h3><p class="text-gray-600 mt-2 mb-6">Esta acción es permanente. Para confirmar, por favor ingresa tu contraseña.</p><form id="delete-confirm-form"><div><label for="delete-password" class="sr-only">Contraseña</label><input type="password" id="delete-password" placeholder="Ingresa tu contraseña" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-center"><p id="delete-error-message" class="text-red-500 text-sm mt-2 h-5"></p></div><div class="flex justify-center gap-4 mt-6"><button type="button" id="cancel-delete-btn" class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Cancelar</button><button type="submit" id="confirm-delete-btn" class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">Sí, desactivar</button></div></form></div></div>`;
  const toastHTML = `<div id="toast-icon" class="text-2xl"></div><div id="toast-message" class="text-sm font-normal ml-3"></div>`;

  const backdropClass =
    'hidden fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
  const passwordModalContainer = document.createElement('div');
  passwordModalContainer.id = 'password-modal';
  passwordModalContainer.className = backdropClass;
  passwordModalContainer.innerHTML = passwordModalHTML;
  document.body.appendChild(passwordModalContainer);

  const deleteModalContainer = document.createElement('div');
  deleteModalContainer.id = 'delete-confirm-modal';
  deleteModalContainer.className = backdropClass;
  deleteModalContainer.innerHTML = deleteModalHTML;
  document.body.appendChild(deleteModalContainer);

  const toastContainer = document.createElement('div');
  toastContainer.id = 'toast-notification';
  toastContainer.className =
    'hidden fixed bottom-5 right-5 flex items-center w-full max-w-xs p-4 text-white rounded-lg shadow';
  toastContainer.setAttribute('role', 'alert');
  toastContainer.innerHTML = toastHTML;
  document.body.appendChild(toastContainer);
}

createDynamicElements();

// --- ELEMENTOS DEL DOM ---
const profileAvatar = document.getElementById('profile-avatar'),
  profileFullname = document.getElementById('profile-fullname'),
  profileDni = document.getElementById('profile-dni'),
  profileEmail = document.getElementById('profile-email'),
  profileForm = document.getElementById('profile-form'),
  profileInputs = profileForm.querySelectorAll('input, select, textarea'),
  editProfileBtn = document.getElementById('edit-profile-btn'),
  profileActions = document.getElementById('profile-actions'),
  cancelProfileBtn = document.getElementById('cancel-profile-btn'),
  passwordModal = document.getElementById('password-modal'),
  passwordForm = document.getElementById('password-form'),
  openPasswordModalBtn = document.getElementById('open-password-modal-btn'),
  closePasswordModalBtn = document.getElementById('close-password-modal-btn'),
  cancelPasswordChangeBtn = document.getElementById(
    'cancel-password-change-btn'
  ),
  toast = document.getElementById('toast-notification'),
  toastMessage = document.getElementById('toast-message'),
  toastIcon = document.getElementById('toast-icon'),
  deleteAccountBtn = document.getElementById('delete-account-btn'),
  deleteConfirmModal = document.getElementById('delete-confirm-modal'),
  cancelDeleteBtn = document.getElementById('cancel-delete-btn'),
  deleteConfirmForm = document.getElementById('delete-confirm-form'),
  deletePasswordInput = document.getElementById('delete-password'),
  deleteErrorMessage = document.getElementById('delete-error-message');

// --- ESTADO Y FUNCIONES ---
let originalProfileData = {};
const API_BASE_URL = 'https://happylife-backend.onrender.com';

function showToast(message, type = 'success') {
  toastMessage.textContent = message;
  toast.classList.remove('hidden', 'bg-green-500', 'bg-red-500');
  toast.classList.add(type === 'success' ? 'bg-green-500' : 'bg-red-500');
  toastIcon.innerHTML =
    type === 'success'
      ? `<i class="bi bi-check-circle-fill"></i>`
      : `<i class="bi bi-exclamation-triangle-fill"></i>`;
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

function populateSelectWithOptions(
  selectId,
  options,
  valueKey,
  textKey,
  selectedValue = null
) {
  const select = document.getElementById(selectId);
  if (!select) return;
  select.innerHTML = '';
  if (!Array.isArray(options)) return;

  options.forEach((optionData) => {
    const option = document.createElement('option');
    if (
      optionData[valueKey] !== undefined &&
      optionData[textKey] !== undefined
    ) {
      option.value = optionData[valueKey];
      option.textContent = optionData[textKey];
      select.appendChild(option);
    }
  });
  if (selectedValue) {
    select.value = selectedValue;
  }
}

function populateCheckboxes(
  containerId,
  options,
  valueKey,
  textKey,
  selectedValues = []
) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  if (!Array.isArray(options) || options.length === 0) {
    container.innerHTML =
      '<p class="text-gray-500 col-span-full">No hay especialidades disponibles.</p>';
    return;
  }

  options.forEach((optionData) => {
    const optionId = `especialidad-${optionData[valueKey]}`;
    const wrapper = document.createElement('div');
    wrapper.className = 'flex items-center';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = optionId;
    checkbox.name = 'especialidades';
    checkbox.value = optionData[valueKey];
    checkbox.className =
      'h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500';
    checkbox.disabled = true;

    // Comprueba si el ID de la especialidad está en la lista de IDs del doctor
    if (
      Array.isArray(selectedValues) &&
      selectedValues.includes(optionData[valueKey])
    ) {
      checkbox.checked = true;
    }

    const label = document.createElement('label');
    label.htmlFor = optionId;
    label.textContent = optionData[textKey];
    label.className = 'ml-2 block text-sm text-gray-900';

    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);
    container.appendChild(wrapper);
  });
}

function populateProfileData(user) {
  originalProfileData = { ...user };
  const initials =
    user.nombres && user.apellidos
      ? `${user.nombres.charAt(0)}${user.apellidos.charAt(0)}`
      : '?';
  profileAvatar.textContent = initials.toUpperCase();
  profileFullname.textContent = `${user.nombres || ''} ${user.apellidos || ''}`;
  profileDni.textContent = `DNI: ${user.dni || 'No definido'}`;
  profileEmail.textContent = `Email: ${user.email || 'No definido'}`;

  Object.keys(user).forEach((key) => {
    let element = document.getElementById(key);
    // Verificación adicional para fecha de nacimiento en caso de inconsistencia de IDs
    if (!element && key.includes('_')) {
      const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      element = document.getElementById(camelKey);
    }

    if (element) {
      element.value = user[key] === null ? '' : user[key];
    }
  });
}

function toggleProfileEditMode(isEditing) {
  profileInputs.forEach((input) => {
    if (input.id !== 'dni' && input.name !== 'especialidades') {
      input.disabled = !isEditing;
      input.classList.toggle('bg-gray-50', !isEditing);
    }
  });

  const checkboxesContainer = document.getElementById(
    'especialidades-container'
  );
  const checkboxes = checkboxesContainer.querySelectorAll(
    'input[type="checkbox"]'
  );
  checkboxes.forEach((checkbox) => {
    checkbox.disabled = !isEditing;
  });
  checkboxesContainer.classList.toggle('bg-gray-50', !isEditing);

  profileActions.classList.toggle('hidden', !isEditing);
  editProfileBtn.classList.toggle('hidden', isEditing);
}

async function fetchAPI(url, options = {}) {
  const defaultOptions = { credentials: 'include' };
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...defaultOptions,
      ...options,
    });
    if (response.status === 401) {
      window.location.href = '../../index.html';
      throw new Error('Sesión expirada.');
    }
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Ocurrió un error en la petición.');
    }
    return data;
  } catch (error) {
    console.error('Error en fetchAPI:', error);
    throw error;
  }
}

async function initProfilePage() {
  try {
    const basicUserData = await fetchAPI('/perfil');
    const userId = basicUserData.id;

    if (basicUserData.rol_id !== 3) {
      showToast('Acceso no autorizado para este rol.', 'error');
      document.body.innerHTML =
        '<p class="text-center text-red-500">No tienes permiso para ver esta página.</p>';
      return;
    }

    const [doctorData, titlesData, specialtiesData] = await Promise.all([
      fetchAPI(`/doctores/${userId}`),
      fetchAPI('/titulos-profesionales'),
      fetchAPI('/especialidades'),
    ]);

    populateSelectWithOptions(
      'titulo_profesional_id',
      titlesData,
      'id',
      'nombre',
      doctorData.titulo_profesional_id
    );
    populateCheckboxes(
      'especialidades-container',
      specialtiesData,
      'id',
      'nombre',
      doctorData.especialidades_ids
    );

    const fullProfileData = { ...basicUserData, ...doctorData };
    populateProfileData(fullProfileData);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// --- MANEJADORES DE EVENTOS ---
editProfileBtn.addEventListener('click', () => toggleProfileEditMode(true));

cancelProfileBtn.addEventListener('click', async () => {
  await initProfilePage();
  toggleProfileEditMode(false);
});

// --- CORREGIDO ---
profileForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(profileForm);
  const data = Object.fromEntries(formData.entries());

  // Recolectar las especialidades de forma correcta
  const checkedSpecialties = document.querySelectorAll(
    '#especialidades-container input[name="especialidades"]:checked'
  );
  data.especialidades = Array.from(checkedSpecialties).map((cb) => cb.value);

  // CORRECCIÓN: Agregar campos que no se capturan en formData si no son inputs editables
  if (!data.nombres) data.nombres = originalProfileData.nombres;
  if (!data.apellidos) data.apellidos = originalProfileData.apellidos;
  if (!data.email) data.email = originalProfileData.email;
  if (!data.telefono) data.telefono = originalProfileData.telefono;

  // El DNI está deshabilitado, por lo que no se envía. Lo añadimos manualmente.
  data.dni = originalProfileData.dni;

  try {
    await fetchAPI(`/doctores/${originalProfileData.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    showToast('Perfil actualizado con éxito.');
    await initProfilePage();
    toggleProfileEditMode(false);
  } catch (error) {
    showToast(error.message, 'error');
  }
});

openPasswordModalBtn.addEventListener('click', () =>
  passwordModal.classList.remove('hidden')
);
[closePasswordModalBtn, cancelPasswordChangeBtn].forEach((btn) => {
  btn.addEventListener('click', () => {
    passwordModal.classList.add('hidden');
    passwordForm.reset();
  });
});

passwordForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nueva = document.getElementById('nueva_password').value;
  const confirmar = document.getElementById('confirmar_password').value;
  if (nueva !== confirmar) {
    showToast('Las nuevas contraseñas no coinciden.', 'error');
    return;
  }
  const data = {
    password_actual: document.getElementById('password_actual').value,
    nueva_password: nueva,
  };
  try {
    const result = await fetchAPI('/perfil/cambiar-password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    showToast(result.message || 'Contraseña actualizada correctamente.');
    passwordModal.classList.add('hidden');
    passwordForm.reset();
  } catch (error) {
    showToast(error.message, 'error');
  }
});

deleteAccountBtn.addEventListener('click', () => {
  deleteConfirmForm.reset();
  deleteErrorMessage.textContent = '';
  deleteConfirmModal.classList.remove('hidden');
  setTimeout(() => deletePasswordInput.focus(), 100);
});

cancelDeleteBtn.addEventListener('click', () => {
  deleteConfirmModal.classList.add('hidden');
});

deleteConfirmForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  deleteErrorMessage.textContent = '';

  try {
    const result = await fetchAPI(`/doctores/${originalProfileData.id}`, {
      method: 'DELETE',
    });
    showToast(result.message || 'Cuenta desactivada con éxito.');
    setTimeout(() => {
      fetchAPI('/logout', { method: 'POST' }).finally(() => {
        window.location.href = '../../index.html';
      });
    }, 2000);
  } catch (error) {
    deleteErrorMessage.textContent = error.message;
  }
});

initProfilePage();
