// --- ELEMENTOS DEL DOM ---
const table = document.getElementById('patients-table');
const tableBody = document.getElementById('patients-table-body');
const loaderEl = document.getElementById('loader');
const messageContainer = document.getElementById('message-container');
const searchInput = document.getElementById('search-input');
const addPatientBtn = document.getElementById('add-patient-btn');

// Modal de Paciente
const patientModal = document.getElementById('patient-modal');
const modalTitle = document.getElementById('modal-title');
const modalError = document.getElementById('modal-error');
const patientForm = document.getElementById('patient-form');
const closeModalBtn = document.getElementById('close-modal-btn');
const cancelModalBtn = document.getElementById('cancel-modal-btn');
const submitBtn = document.getElementById('submit-btn');

const API_BASE_URL = 'https://happylife-backend.onrender.com';
let allPatientsData = [];

// --- FUNCIONES AUXILIARES ---
const showMessage = (message, isError = true) => {
    messageContainer.textContent = message;
    messageContainer.className = `p-4 rounded-md mb-6 ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`;
    messageContainer.style.display = 'block';
    setTimeout(() => { messageContainer.style.display = 'none'; }, 4000);
};

const formatDate = (dateString) => {
    if (!dateString) return 'No especificado';
    const date = new Date(dateString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('es-ES', {
        year: 'numeric', month: '2-digit', day: '2-digit'
    });
};

async function apiCall(endpoint, options = {}) {
    options.credentials = 'include';
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || `Error en la petición a ${endpoint}`);
    }
    return data;
}


// --- LÓGICA DE LA TABLA ---
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
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${patient.email}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${patient.telefono || 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(patient.fecha_nacimiento)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                <button data-id="${patient.id}" class="edit-btn text-indigo-600 hover:text-indigo-900 font-semibold focus:outline-none" title="Funcionalidad no implementada en el backend">
                    Editar
                </button>
            </td>`;
        tableBody.appendChild(row);
    });
};

const loadPatients = async () => {
    try {
        loaderEl.style.display = 'block';
        table.style.display = 'none';
        allPatientsData = await apiCall('/pacientes');
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
        `${p.nombres} ${p.apellidos}`.toLowerCase().includes(searchTerm) ||
        p.dni.includes(searchTerm) ||
        p.email.toLowerCase().includes(searchTerm)
    );
    renderTable(filtered);
};


// --- LÓGICA DEL MODAL ---
const openModal = async () => {
    patientForm.reset();
    modalError.style.display = 'none';
    modalTitle.textContent = 'Añadir Nuevo Paciente';
    
    // Poblar el select de géneros
    const generoSelect = document.getElementById('genero');
    generoSelect.innerHTML = '<option value="">Cargando...</option>';
    try {
        const generos = await apiCall('/generos');
        generoSelect.innerHTML = '<option value="">-- Seleccione --</option>';
        generos.forEach(g => {
            generoSelect.innerHTML += `<option value="${g.id}">${g.nombre}</option>`;
        });
    } catch (error) {
        generoSelect.innerHTML = '<option value="">Error al cargar</option>';
    }
    
    patientModal.showModal();
};

const closeModal = () => {
    patientModal.close();
};

const handleFormSubmit = async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = 'Guardando...';
    modalError.style.display = 'none';

    const formData = new FormData(patientForm);
    const data = Object.fromEntries(formData.entries());

    try {
        const result = await apiCall('/pacientes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        showMessage(result.message, false);
        closeModal();
        await loadPatients(); // Recargar la tabla
    } catch (error) {
        modalError.textContent = error.message;
        modalError.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Guardar Paciente';
    }
};


// --- INICIALIZACIÓN Y EVENT LISTENERS ---
const initialize = () => {
    loadPatients();

    searchInput.addEventListener('input', handleSearch);
    addPatientBtn.addEventListener('click', openModal);

    // Eventos del modal
    closeModalBtn.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);
    patientModal.addEventListener('click', (e) => {
        if (e.target === patientModal) closeModal();
    });
    patientForm.addEventListener('submit', handleFormSubmit);

    // Placeholder para el botón de editar
    tableBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-btn')) {
            showMessage('La función para editar pacientes aún no está implementada en el backend.', true);
        }
    });
};

initialize();