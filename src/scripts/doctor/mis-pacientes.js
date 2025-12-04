// --- FUNCIÓN PARA CREAR MODALES DINÁMICAMENTE ---
function createAddRecordModal() {
    if (document.getElementById('add-record-modal')) return;

    const modalHTML = `
        <div class="bg-white rounded-lg shadow-2xl p-6 sm:p-8 w-full max-w-lg transform transition-all">
            <div class="flex justify-between items-center border-b pb-4 mb-6">
                <h2 class="text-2xl font-bold text-gray-900">Añadir Registro para <span id="patient-name-in-add-modal"></span></h2>
                <button id="close-add-record-modal-btn" class="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
            </div>
            <div id="add-record-error" class="hidden bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm"></div>
            <form id="add-record-form" class="space-y-4">
                <div>
                    <label for="cita_id" class="block text-sm font-medium text-gray-700 mb-1">Cita a registrar *</label>
                    <select id="cita_id" name="cita_id" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"></select>
                    <p class="text-xs text-gray-500 mt-1">Solo aparecen citas pasadas sin registro previo.</p>
                </div>
                <div>
                    <label for="diagnostico" class="block text-sm font-medium text-gray-700 mb-1">Diagnóstico *</label>
                    <textarea id="diagnostico" name="diagnostico" rows="3" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"></textarea>
                </div>
                <div>
                    <label for="receta_medica" class="block text-sm font-medium text-gray-700 mb-1">Receta Médica</label>
                    <textarea id="receta_medica" name="receta_medica" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"></textarea>
                </div>
                <div>
                    <label for="notas_doctor" class="block text-sm font-medium text-gray-700 mb-1">Notas Adicionales</label>
                    <textarea id="notas_doctor" name="notas_doctor" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"></textarea>
                </div>
                <div class="flex justify-end space-x-3 pt-4">
                    <button type="button" id="cancel-add-record-btn" class="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg">Cancelar</button>
                    <button type="submit" id="submit-record-btn" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg">Guardar Registro</button>
                </div>
            </form>
        </div>
    `;
    
    const modalContainer = document.createElement('div');
    modalContainer.id = 'add-record-modal';
    modalContainer.className = 'hidden fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4';
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);
}

// Llamar a la función para asegurar que el modal exista en el DOM
createAddRecordModal();


// --- ELEMENTOS DEL DOM ---
const table = document.getElementById('patients-table');
const tableBody = document.getElementById('patients-table-body');
const loaderEl = document.getElementById('loader');
const messageContainer = document.getElementById('message-container');
const searchInput = document.getElementById('search-input');

// Modal de Historial
const historyModal = document.getElementById('history-modal');
const closeHistoryModalBtn = document.getElementById('close-history-modal-btn');
const patientNameInModal = document.getElementById('patient-name-in-modal');
const patientGeneralInfo = document.getElementById('patient-general-info');
const medicalRecordsList = document.getElementById('medical-records-list');
const addRecordBtn = document.getElementById('add-record-btn');

// Modal de Añadir Registro (obtenidos después de crearlo dinámicamente)
const addRecordModal = document.getElementById('add-record-modal');
const closeAddRecordModalBtn = document.getElementById('close-add-record-modal-btn');
const cancelAddRecordBtn = document.getElementById('cancel-add-record-btn');
const addRecordForm = document.getElementById('add-record-form');
const addRecordError = document.getElementById('add-record-error');
const patientNameInAddModal = document.getElementById('patient-name-in-add-modal');
const submitRecordBtn = document.getElementById('submit-record-btn');


const API_BASE_URL = 'https://happylife-backend.onrender.com';
let allPatientsData = [];
let appointmentStatuses = [];
let currentPatient = null;

// --- FUNCIONES AUXILIARES ---
const showMessage = (message, isError = true) => {
    messageContainer.textContent = message;
    messageContainer.className = `p-4 rounded-md mb-6 ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`;
    messageContainer.style.display = 'block';
    setTimeout(() => { messageContainer.style.display = 'none'; }, 4000);
};

const calculateAge = (birthDate) => {
    if (!birthDate) return 'N/A';
    const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
    return age > 0 ? age : '< 1';
};

// --- FUNCIÓN DE FECHA CORREGIDA ---
const formatDate = (dateString, options = {}) => {
    if (!dateString) return 'Nunca';
    // Si se pide la hora (timeStyle), usamos toLocaleString. Si no, toLocaleDateString.
    if (options.timeStyle) {
        return new Date(dateString).toLocaleString('es-ES', options);
    }
    return new Date(dateString).toLocaleDateString('es-ES', options);
};

// --- API ---
async function apiCall(endpoint, options = {}) {
    options.credentials = 'include';
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || `Error en la petición a ${endpoint}`);
    }
    return data;
}

// --- LÓGICA DE LA TABLA PRINCIPAL ---
const renderTable = (patients) => {
    table.style.display = 'table';
    tableBody.innerHTML = '';
    if (patients.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-10 text-gray-500">No se encontraron pacientes.</td></tr>`;
        return;
    }
    patients.forEach(patient => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${patient.nombres} ${patient.apellidos}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${patient.dni}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div>${patient.email}</div>
                <div class="text-xs text-gray-400">${patient.telefono || 'N/A'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${calculateAge(patient.fecha_nacimiento)} años</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(patient.ultima_cita)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                <button data-id="${patient.id}" class="view-history-btn text-indigo-600 hover:text-indigo-900 font-semibold focus:outline-none">
                    Ver Historial
                </button>
            </td>`;
        tableBody.appendChild(row);
    });
};

const loadPatients = async () => {
    try {
        loaderEl.style.display = 'block';
        table.style.display = 'none';
        allPatientsData = await apiCall('/mis-pacientes');
        renderTable(allPatientsData);
    } catch (error) {
        showMessage(error.message);
        table.style.display = 'none';
    } finally {
        loaderEl.style.display = 'none';
    }
};

const handleSearch = (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    const filtered = allPatientsData.filter(p => 
        `${p.nombres} ${p.apellidos}`.toLowerCase().includes(searchTerm) || p.dni.includes(searchTerm)
    );
    renderTable(filtered);
};

// --- LÓGICA DEL MODAL DE HISTORIAL ---
const renderMedicalRecords = (records) => {
    if (records.length === 0) {
        medicalRecordsList.innerHTML = '<p class="text-center text-gray-500">No hay registros de citas para este paciente.</p>';
        return;
    }
    medicalRecordsList.innerHTML = records.map(record => `
        <div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div class="flex flex-col sm:flex-row justify-between sm:items-center mb-2 gap-2">
                <p class="font-semibold text-indigo-700">Cita: ${formatDate(record.fecha_cita, { dateStyle: 'full', timeStyle: 'short' })}</p>
                <div class="flex items-center gap-2">
                    <span class="text-sm text-gray-600">${record.especialidades.join(', ') || 'General'}</span>
                    <select data-cita-id="${record.cita_id}" class="status-select text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                        ${appointmentStatuses.map(status => `<option value="${status.id}" ${status.id === record.estado_cita_id ? 'selected' : ''}>${status.nombre}</option>`).join('')}
                    </select>
                </div>
            </div>
            ${record.id ? `
                <div class="text-sm">
                    <p><strong>Diagnóstico:</strong> ${record.diagnostico || 'N/A'}</p>
                    <p><strong>Receta Médica:</strong> ${record.receta_medica || 'N/A'}</p>
                    <p><strong>Notas Adicionales:</strong> ${record.notas_doctor || 'N/A'}</p>
                    <p class="text-xs text-gray-400 mt-2">Registrado el: ${formatDate(record.fecha_creacion, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
            ` : `<p class="text-sm text-amber-700 bg-amber-100 p-2 rounded-md">Esta cita no tiene un registro médico asociado.</p>`}
        </div>
    `).join('');
};

const openHistoryModal = async (patientId) => {
    currentPatient = allPatientsData.find(p => p.id === patientId);
    if (!currentPatient) return;

    patientNameInModal.textContent = `${currentPatient.nombres} ${currentPatient.apellidos}`;
    medicalRecordsList.innerHTML = '<p class="text-center text-gray-500">Cargando historial...</p>';
    
    patientGeneralInfo.innerHTML = `
        <div><strong>DNI:</strong> ${currentPatient.dni}</div>
        <div><strong>Email:</strong> ${currentPatient.email}</div>
        <div><strong>Teléfono:</strong> ${currentPatient.telefono || 'N/A'}</div>
        <div><strong>Edad:</strong> ${calculateAge(currentPatient.fecha_nacimiento)} años</div>
        <div><strong>Tipo Sangre:</strong> ${currentPatient.tipo_sangre_nombre || 'N/A'}</div>
        <div class="md:col-span-2"><strong>Alergias:</strong> ${currentPatient.alergias || 'Ninguna conocida'}</div>`;
    
    historyModal.classList.remove('hidden');

    try {
        const history = await apiCall(`/mis-pacientes/${patientId}/historial`);
        renderMedicalRecords(history);
    } catch (error) {
        medicalRecordsList.innerHTML = `<p class="text-center text-red-500">${error.message}</p>`;
    }
};

const closeHistoryModal = () => historyModal.classList.add('hidden');

// --- LÓGICA DEL MODAL PARA AÑADIR REGISTRO ---
const openAddRecordModal = async () => {
    patientNameInAddModal.textContent = `${currentPatient.nombres} ${currentPatient.apellidos}`;
    addRecordForm.reset();
    addRecordError.style.display = 'none';
    const citaSelect = document.getElementById('cita_id');
    citaSelect.innerHTML = '<option value="">Cargando citas...</option>';
    
    try {
        const citas = await apiCall(`/mis-pacientes/${currentPatient.id}/citas-sin-historial`);
        if (citas.length === 0) {
            citaSelect.innerHTML = '<option value="">No hay citas pendientes de registro</option>';
        } else {
            citaSelect.innerHTML = '<option value="">-- Seleccione una cita --</option>';
            citas.forEach(cita => {
                citaSelect.innerHTML += `<option value="${cita.id}">${formatDate(cita.fecha_hora_inicio, { dateStyle: 'long', timeStyle: 'short' })}</option>`;
            });
        }
        addRecordModal.classList.remove('hidden');
    } catch(error) {
        showMessage(error.message);
    }
};

const closeAddRecordModal = () => addRecordModal.classList.add('hidden');

const handleAddRecordSubmit = async (e) => {
    e.preventDefault();
    submitRecordBtn.disabled = true;
    submitRecordBtn.textContent = 'Guardando...';
    addRecordError.style.display = 'none';

    const formData = new FormData(addRecordForm);
    const data = Object.fromEntries(formData.entries());

    try {
        await apiCall('/historial-medico', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        showMessage('Registro añadido con éxito.', false);
        closeAddRecordModal();
        await openHistoryModal(currentPatient.id); // Refrescar historial
    } catch (error) {
        addRecordError.textContent = error.message;
        addRecordError.style.display = 'block';
    } finally {
        submitRecordBtn.disabled = false;
        submitRecordBtn.textContent = 'Guardar Registro';
    }
};

const handleStatusChange = async (e) => {
    const select = e.target;
    const citaId = select.dataset.citaId;
    const newStatusId = select.value;

    try {
        await apiCall(`/citas/${citaId}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado_cita_id: newStatusId })
        });
        showMessage('Estado de la cita actualizado.', false);
    } catch (error) {
        showMessage(error.message);
        openHistoryModal(currentPatient.id); // Revertir visualmente
    }
};

// --- INICIALIZACIÓN Y EVENT LISTENERS ---
const initialize = async () => {
    try {
        appointmentStatuses = await apiCall('/estados-cita');
        await loadPatients();
    } catch(error) {
        showMessage("Error crítico al inicializar la página: " + error.message);
    }
};

searchInput.addEventListener('input', handleSearch);
tableBody.addEventListener('click', (e) => {
    const btn = e.target.closest('.view-history-btn');
    if (btn) openHistoryModal(btn.dataset.id);
});

// Eventos del modal de historial
closeHistoryModalBtn.addEventListener('click', closeHistoryModal);
historyModal.addEventListener('click', (e) => { if (e.target === historyModal) closeHistoryModal(); });
addRecordBtn.addEventListener('click', openAddRecordModal);
medicalRecordsList.addEventListener('change', (e) => {
    if (e.target.classList.contains('status-select')) {
        handleStatusChange(e);
    }
});

// Eventos del modal de añadir registro (delegados al contenedor del modal)
closeAddRecordModalBtn.addEventListener('click', closeAddRecordModal);
cancelAddRecordBtn.addEventListener('click', closeAddRecordModal);
addRecordModal.addEventListener('click', (e) => { if (e.target === addRecordModal) closeAddRecordModal(); });
addRecordForm.addEventListener('submit', handleAddRecordSubmit);

// --- INICIAR LA APLICACIÓN ---
initialize();