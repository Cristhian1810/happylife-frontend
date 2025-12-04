const tableBody = document.getElementById('doctors-table-body');
const table = document.getElementById('doctors-table');
const loader = document.getElementById('loader');
const errorMessage = document.getElementById('error-message');
const totalDoctoresEl = document.getElementById('total-doctores');
const totalActivosEl = document.getElementById('total-activos');
const totalInactivosEl = document.getElementById('total-inactivos');
const searchInput = document.getElementById('search-input');
const openModalBtn = document.getElementById('open-add-modal-btn');

// Cambia la URL base según tu entorno (desarrollo/producción)
const API_BASE_URL = 'https://happylife-backend.onrender.com';

let allDoctorsData = [];
let doctorIdToAction = null;

// --- CÓDIGO HTML PARA LOS MODALES ---
function createModalsHTML() {
  const modalHTML = `
        <div id="doctor-modal" class="hidden fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div class="bg-white rounded-lg shadow-2xl p-6 sm:p-8 w-full max-w-2xl transform transition-all">
                <h2 id="modal-title" class="text-2xl font-bold text-gray-900 mb-6">Añadir Nuevo Doctor</h2>
                <div id="modal-error" class="hidden bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm"></div>
                <form id="doctor-form" novalidate>
                    <input type="hidden" id="doctor-id" name="id">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                        <input class="w-full px-3 py-2 border border-gray-300 rounded-md" name="nombres" type="text" placeholder="Nombres" required>
                        <input class="w-full px-3 py-2 border border-gray-300 rounded-md" name="apellidos" type="text" placeholder="Apellidos" required>
                        <input class="w-full px-3 py-2 border border-gray-300 rounded-md" name="dni" type="text" placeholder="DNI" required>
                        <input class="w-full px-3 py-2 border border-gray-300 rounded-md" name="telefono" type="tel" placeholder="Teléfono">
                        <input class="sm:col-span-2 w-full px-3 py-2 border border-gray-300 rounded-md" name="email" type="email" placeholder="Correo Electrónico" required>
                        <input class="w-full px-3 py-2 border border-gray-300 rounded-md" name="numero_colegiatura" type="text" placeholder="Nro. Colegiatura" required>
                        <select name="titulo_profesional_id" class="w-full px-3 py-2 border border-gray-300 rounded-md" required>
                            <option value="">Seleccione Título Profesional...</option>
                        </select>
                        <div class="sm:col-span-2" id="password-fields">
                            <input class="w-full px-3 py-2 border border-gray-300 rounded-md" name="password" type="password" placeholder="Contraseña" required>
                        </div>
                        <div class="sm:col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Especialidades</label>
                            <div id="especialidades-checkboxes" class="grid grid-cols-2 md:grid-cols-3 gap-2 border p-3 rounded-md max-h-32 overflow-y-auto">
                                </div>
                        </div>
                        <textarea class="sm:col-span-2 w-full px-3 py-2 border border-gray-300 rounded-md" name="biografia" placeholder="Biografía (opcional)"></textarea>
                    </div>
                    <div class="flex items-center justify-end space-x-4 mt-8">
                        <button id="close-modal-btn" type="button" class="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg">Cancelar</button>
                        <button id="submit-btn" type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg disabled:bg-indigo-400">Guardar</button>
                    </div>
                </form>
            </div>
        </div>

        <div id="confirm-delete-modal" class="hidden fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div class="bg-white rounded-lg shadow-2xl p-6 sm:p-8 w-full max-w-sm">
                <div class="text-center">
                    <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                        <svg class="h-6 w-6 text-red-600" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 mt-5">Desactivar Doctor</h3>
                    <p class="text-sm text-gray-500 mt-2">¿Estás seguro? La cuenta será desactivada y el doctor no podrá acceder al sistema.</p>
                </div>
                <div class="flex justify-center space-x-4 mt-6">
                    <button id="cancel-delete-btn" class="py-2 px-4 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-semibold">Cancelar</button>
                    <button id="confirm-delete-btn" class="py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold">Sí, desactivar</button>
                </div>
            </div>
        </div>`;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

createModalsHTML();

// --- REFERENCIAS A ELEMENTOS DEL DOM DE LOS MODALES ---
const doctorModal = document.getElementById('doctor-modal');
const modalError = document.getElementById('modal-error');
const doctorForm = document.getElementById('doctor-form');
const closeModalBtn = document.getElementById('close-modal-btn');
const submitBtn = document.getElementById('submit-btn');
const passwordFields = document.getElementById('password-fields');

const deleteModal = document.getElementById('confirm-delete-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

// --- FUNCIONES AUXILIARES ---
const populateSelects = async () => {
  try {
    const [titulosRes, especialidadesRes] = await Promise.all([
      fetch(`${API_BASE_URL}/titulos-profesionales`),
      fetch(`${API_BASE_URL}/especialidades`),
    ]);
    const titulos = await titulosRes.json();
    const especialidades = await especialidadesRes.json();

    const tituloSelect = doctorForm.querySelector(
      'select[name="titulo_profesional_id"]'
    );
    tituloSelect.innerHTML =
      '<option value="">Seleccione Título Profesional...</option>';
    titulos.forEach((t) => {
      tituloSelect.innerHTML += `<option value="${t.id}">${t.nombre}</option>`;
    });

    const especialidadesContainer = document.getElementById(
      'especialidades-checkboxes'
    );
    especialidadesContainer.innerHTML = '';
    especialidades.forEach((e) => {
      especialidadesContainer.innerHTML += `
                <label class="flex items-center space-x-2 text-sm">
                    <input type="checkbox" name="especialidades" value="${e.id}" class="rounded">
                    <span>${e.nombre}</span>
                </label>`;
    });
  } catch (error) {
    console.error('Error al cargar datos para formularios:', error);
    modalError.textContent =
      'No se pudieron cargar las especialidades y títulos.';
    modalError.classList.remove('hidden');
  }
};

// --- LÓGICA PRINCIPAL ---
const renderTable = (doctores) => {
  tableBody.innerHTML = '';
  if (!doctores || doctores.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-10 text-gray-500">No se encontraron doctores.</td></tr>`;
    return;
  }
  doctores.forEach((doc) => {
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-50';
    row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${
              doc.nombres
            }</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${
              doc.apellidos
            }</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${
              doc.especialidades ? doc.especialidades.join(', ') : 'N/A'
            }</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${
              doc.numero_colegiatura
            }</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${
              doc.dni
            }</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${
              doc.email
            }</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  doc.esta_activo
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }">${doc.esta_activo ? 'Activo' : 'Inactivo'}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                <div class="flex items-center justify-center space-x-2">
                    <button class="edit-btn p-2 rounded-full text-blue-100 bg-blue-600 hover:bg-blue-700" title="Editar" data-id="${
                      doc.id
                    }">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z"></path></svg>
                    </button>
                    <button class="delete-btn p-2 rounded-full text-red-100 bg-red-600 hover:bg-red-700 disabled:bg-gray-400" title="Desactivar" data-id="${
                      doc.id
                    }" ${!doc.esta_activo ? 'disabled' : ''}>
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
            </td>`;
    tableBody.appendChild(row);
  });
};

const fetchAndRenderDoctores = async () => {
  try {
    loader.classList.remove('hidden');
    table.classList.add('hidden');
    errorMessage.classList.add('hidden');
    const response = await fetch(`${API_BASE_URL}/doctores`);
    if (!response.ok) throw new Error(`Error: ${response.status}`);

    allDoctorsData = await response.json();
    renderTable(allDoctorsData);

    const activos = allDoctorsData.filter((doc) => doc.esta_activo).length;
    totalDoctoresEl.textContent = allDoctorsData.length;
    totalActivosEl.textContent = activos;
    totalInactivosEl.textContent = allDoctorsData.length - activos;
  } catch (error) {
    errorMessage.textContent = `No se pudieron cargar los datos. ${error.message}`;
    errorMessage.classList.remove('hidden');
  } finally {
    loader.classList.add('hidden');
    table.classList.remove('hidden');
  }
};

// --- MANEJO DE MODALES ---
const openModal = (mode, doctorId = null) => {
  doctorForm.reset();
  modalError.classList.add('hidden');

  if (mode === 'add') {
    document.getElementById('modal-title').textContent = 'Añadir Nuevo Doctor';
    passwordFields.classList.remove('hidden');
    doctorForm.querySelector('input[name="password"]').required = true;
    document.getElementById('doctor-id').value = '';
  } else {
    // 'edit'
    document.getElementById('modal-title').textContent = 'Editar Doctor';
    passwordFields.classList.add('hidden');
    doctorForm.querySelector('input[name="password"]').required = false;

    const doctorData = allDoctorsData.find((d) => d.id === doctorId);
    if (!doctorData) return;

    // Rellenar formulario
    document.getElementById('doctor-id').value = doctorData.id;
    doctorForm.querySelector('input[name="nombres"]').value =
      doctorData.nombres;
    doctorForm.querySelector('input[name="apellidos"]').value =
      doctorData.apellidos;
    doctorForm.querySelector('input[name="dni"]').value = doctorData.dni;
    doctorForm.querySelector('input[name="telefono"]').value =
      doctorData.telefono || '';
    doctorForm.querySelector('input[name="email"]').value = doctorData.email;
    doctorForm.querySelector('input[name="numero_colegiatura"]').value =
      doctorData.numero_colegiatura;
    doctorForm.querySelector('select[name="titulo_profesional_id"]').value =
      doctorData.titulo_profesional_id;
    doctorForm.querySelector('textarea[name="biografia"]').value =
      doctorData.biografia || '';

    const especialidadesCheckboxes = doctorForm.querySelectorAll(
      'input[name="especialidades"]'
    );

    fetch(`${API_BASE_URL}/doctores/${doctorId}`)
      .then((res) => res.json())
      .then((docDetails) => {
        especialidadesCheckboxes.forEach((checkbox) => {
          checkbox.checked = docDetails.especialidades_ids?.includes(
            parseInt(checkbox.value)
          );
        });
      });
  }
  doctorModal.classList.remove('hidden');
};

const closeModal = () => doctorModal.classList.add('hidden');

const handleFormSubmit = async (event) => {
  event.preventDefault();

  const formData = new FormData(doctorForm);
  const doctorData = Object.fromEntries(formData.entries());
  doctorData.especialidades = Array.from(
    doctorForm.querySelectorAll('input[name="especialidades"]:checked')
  ).map((cb) => parseInt(cb.value));

  const id = doctorData.id;
  const method = id ? 'PUT' : 'POST';
  const url = id
    ? `${API_BASE_URL}/doctores/${id}`
    : `${API_BASE_URL}/doctores`;

  if (method === 'POST' && !doctorData.password) {
    modalError.textContent =
      'La contraseña es obligatoria para nuevos doctores.';
    modalError.classList.remove('hidden');
    return;
  }
  if (method === 'PUT') delete doctorData.password;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Guardando...';

  try {
    const response = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doctorData),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Error al guardar.');

    closeModal();
    await fetchAndRenderDoctores();
  } catch (error) {
    modalError.textContent = error.message;
    modalError.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Guardar';
  }
};

const openDeleteModal = (id) => {
  doctorIdToAction = id;
  deleteModal.classList.remove('hidden');
};
const closeDeleteModal = () => {
  doctorIdToAction = null;
  deleteModal.classList.add('hidden');
};
const handleDeleteConfirm = async () => {
  if (!doctorIdToAction) return;
  confirmDeleteBtn.disabled = true;
  confirmDeleteBtn.textContent = 'Desactivando...';
  try {
    const response = await fetch(
      `${API_BASE_URL}/doctores/${doctorIdToAction}`,
      { method: 'DELETE' }
    );
    if (!response.ok) throw new Error('No se pudo desactivar.');

    closeDeleteModal();
    await fetchAndRenderDoctores();
  } catch (error) {
    alert(`Error: ${error.message}`);
  } finally {
    confirmDeleteBtn.disabled = false;
    confirmDeleteBtn.textContent = 'Sí, desactivar';
  }
};

// --- EVENT LISTENERS ---
openModalBtn.addEventListener('click', () => openModal('add'));
closeModalBtn.addEventListener('click', closeModal);
doctorModal.addEventListener('click', (e) => {
  if (e.target === doctorModal) closeModal();
});
doctorForm.addEventListener('submit', handleFormSubmit);

cancelDeleteBtn.addEventListener('click', closeDeleteModal);
deleteModal.addEventListener('click', (e) => {
  if (e.target === deleteModal) closeDeleteModal();
});
confirmDeleteBtn.addEventListener('click', handleDeleteConfirm);

searchInput.addEventListener('input', (e) => {
  const searchTerm = e.target.value.toLowerCase().trim();
  const filtered = allDoctorsData.filter(
    (doc) =>
      `${doc.nombres} ${doc.apellidos}`.toLowerCase().includes(searchTerm) ||
      doc.dni.toLowerCase().includes(searchTerm) ||
      doc.email.toLowerCase().includes(searchTerm) ||
      (doc.especialidades &&
        doc.especialidades.join(' ').toLowerCase().includes(searchTerm))
  );
  renderTable(filtered);
});

tableBody.addEventListener('click', (e) => {
  const editBtn = e.target.closest('.edit-btn');
  const deleteBtn = e.target.closest('.delete-btn');
  if (editBtn) openModal('edit', editBtn.dataset.id);
  if (deleteBtn) openDeleteModal(deleteBtn.dataset.id);
});

// --- INICIALIZACIÓN ---
populateSelects();
fetchAndRenderDoctores();
