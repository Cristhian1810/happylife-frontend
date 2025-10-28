const tableBody = document.getElementById('appointments-table-body');
const table = document.getElementById('appointments-table');
const loader = document.getElementById('loader');
const errorMessage = document.getElementById('error-message');

const filterDate = document.getElementById('filter-date');
const filterDoctor = document.getElementById('filter-doctor');
const filterStatus = document.getElementById('filter-status');

const API_BASE_URL = 'https://happylife-backend.onrender.com';
const API_URL = `${API_BASE_URL}/supervision/citas`;

let allAppointmentsData = [];

// --- FUNCIONES AUXILIARES ---
const populateStatusFilter = async () => {
    try {
        // Asumiendo que tienes una ruta para obtener los estados de cita.
        // Si no la tienes, puedes crearla o definirlos estáticamente aquí.
        const response = await fetch(`${API_BASE_URL}/estados-cita`); // Necesitarás crear esta ruta
        if (!response.ok) return;
        const statuses = await response.json();
        
        statuses.forEach(status => {
            const option = document.createElement('option');
            option.value = status.nombre;
            option.textContent = status.nombre;
            filterStatus.appendChild(option);
        });
    } catch (error) {
        console.error("No se pudieron cargar los estados de cita:", error);
    }
};

const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
    return new Date(dateString).toLocaleString('es-ES', options);
};

const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
        case 'programada':
            return 'bg-blue-100 text-blue-800';
        case 'confirmada':
            return 'bg-yellow-100 text-yellow-800';
        case 'completada':
            return 'bg-green-100 text-green-800';
        case 'cancelada':
            return 'bg-red-100 text-red-800';
        case 'ausente':
            return 'bg-gray-100 text-gray-800';
        default:
            return 'bg-gray-200 text-gray-900';
    }
};


// --- LÓGICA PRINCIPAL ---
const renderTable = (data) => {
    tableBody.innerHTML = '';
    if (!data || data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-10 text-gray-500">No se encontraron citas con los filtros actuales.</td></tr>`;
        return;
    }
    data.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${formatDate(item.fecha_hora_inicio)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${item.nombre_paciente} <span class="text-gray-400">(${item.dni_paciente})</span></td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${item.nombre_doctor}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.especialidades_doctor ? item.especialidades_doctor.join(', ') : 'N/A'}</td>
            <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title="${item.motivo_consulta || ''}">${item.motivo_consulta || 'Sin motivo'}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(item.estado_cita)}">
                    ${item.estado_cita}
                </span>
            </td>`;
        tableBody.appendChild(row);
    });
};

const fetchAndRender = async () => {
    try {
        loader.classList.remove('hidden');
        table.classList.add('hidden');
        errorMessage.classList.add('hidden');
        
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`Error: ${response.status}`);

        allAppointmentsData = await response.json();
        renderTable(allAppointmentsData);

    } catch (error) {
        errorMessage.textContent = `No se pudieron cargar los datos. ${error.message}`;
        errorMessage.classList.remove('hidden');
    } finally {
        loader.classList.add('hidden');
        table.classList.remove('hidden');
    }
};

const applyFilters = () => {
    const date = filterDate.value;
    const doctor = filterDoctor.value.toLowerCase().trim();
    const status = filterStatus.value;

    const filteredData = allAppointmentsData.filter(item => {
        const itemDate = item.fecha_hora_inicio.split('T')[0]; // Obtiene YYYY-MM-DD
        const matchDate = !date || itemDate === date;
        const matchDoctor = !doctor || item.nombre_doctor.toLowerCase().includes(doctor);
        const matchStatus = !status || item.estado_cita === status;
        
        return matchDate && matchDoctor && matchStatus;
    });

    renderTable(filteredData);
};

// --- EVENT LISTENERS ---
filterDate.addEventListener('input', applyFilters);
filterDoctor.addEventListener('input', applyFilters);
filterStatus.addEventListener('change', applyFilters);

// --- INICIALIZACIÓN ---
// populateStatusFilter(); // Descomenta esto cuando crees la ruta /estados-cita
fetchAndRender();