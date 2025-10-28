// --- ELEMENTOS DEL DOM ---
const upcomingTab = document.getElementById('tab-upcoming');
const pastTab = document.getElementById('tab-past');
const container = document.getElementById('appointments-container');
const messageContainer = document.getElementById('message-container');

// Modal de confirmación
const confirmModal = document.getElementById('confirm-cancel-modal');
const confirmBtn = document.getElementById('confirm-action-btn');
const cancelBtn = document.getElementById('cancel-action-btn');

const API_BASE_URL = 'https://happylife-backend.onrender.com';
let allAppointments = [];
let appointmentToCancelId = null;

// --- DICCIONARIO DE ESTADOS ---
const statusStyles = {
    'Programada': { text: 'Programada', icon: 'bi-calendar-check', color: 'blue' },
    'Confirmada': { text: 'Confirmada', icon: 'bi-check-circle', color: 'teal' },
    'Completada': { text: 'Completada', icon: 'bi-check2-all', color: 'green' },
    'Cancelada': { text: 'Cancelada', icon: 'bi-x-circle', color: 'red' },
    'Ausente': { text: 'Ausente', icon: 'bi-person-x', color: 'gray'},
    'default': { text: 'Pendiente', icon: 'bi-question-circle', color: 'gray' }
};
const getColorClasses = (color) => ({
    'blue': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
    'teal': { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-300' },
    'green': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
    'red': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
    'gray': { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' }
}[color]);

// --- FUNCIONES AUXILIARES ---
const showMessage = (message, isError = true) => {
    messageContainer.textContent = message;
    messageContainer.className = `p-4 rounded-md mb-6 ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`;
    messageContainer.style.display = 'block';
    setTimeout(() => { messageContainer.style.display = 'none'; }, 4000);
};

const formatDate = (dateString, options = {}) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    if (options.timeStyle || options.hour) {
        return date.toLocaleString('es-ES', options);
    }
    return date.toLocaleDateString('es-ES', options);
};

async function apiCall(endpoint, options = {}) {
    options.credentials = 'include';
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Ocurrió un error en la petición.');
    }
    return data;
}

// --- LÓGICA DE RENDERIZADO ---
const renderAppointments = (filter) => {
    const now = new Date();
    let appointmentsToRender;

    if (filter === 'upcoming') {
        appointmentsToRender = allAppointments.filter(c => 
            new Date(c.fecha_hora_inicio) >= now && 
            ['cancelada', 'completada'].indexOf(c.estado.toLowerCase()) === -1
        );
    } else { // 'past'
        appointmentsToRender = allAppointments.filter(c => 
            new Date(c.fecha_hora_inicio) < now || 
            ['cancelada', 'completada'].indexOf(c.estado.toLowerCase()) !== -1
        );
    }

    container.innerHTML = '';
    if (appointmentsToRender.length === 0) {
        container.innerHTML = `<div class="text-center text-gray-500 p-8 bg-white rounded-lg border shadow-sm"><i class="bi bi-calendar2-x text-4xl mb-2"></i><p>No tienes citas en esta sección.</p></div>`;
        return;
    }
    
    appointmentsToRender.forEach(c => {
        const date = new Date(c.fecha_hora_inicio);
        const canCancel = date > now && c.estado.toLowerCase() !== 'cancelada';
        const status = statusStyles[c.estado] || statusStyles.default;
        const colors = getColorClasses(status.color);

        const cardHtml = `
            <div class="bg-white p-5 rounded-xl shadow-sm border ${colors.border} flex flex-col md:flex-row justify-between items-start gap-4">
                <div class="flex gap-5">
                    <div class="text-center w-16">
                        <p class="text-sm font-bold text-red-500">${date.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase().replace('.', '')}</p>
                        <p class="text-4xl font-bold text-gray-800">${date.getDate()}</p>
                        <p class="text-xs text-gray-500">${date.getFullYear()}</p>
                    </div>
                    <div class="border-l pl-5">
                        <h3 class="font-bold text-lg text-gray-900">${c.doctor}</h3>
                        <p class="text-sm text-gray-600 font-medium">${formatDate(c.fecha_hora_inicio, { weekday: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                        <p class="text-sm text-gray-500 mt-2 italic">"${c.motivo_consulta || 'No especificado'}"</p>
                    </div>
                </div>
                <div class="flex flex-col items-start md:items-end gap-3 w-full md:w-auto mt-4 md:mt-0">
                    <span class="px-3 py-1 text-xs font-bold rounded-full ${colors.bg} ${colors.text} flex items-center gap-2">
                        <i class="bi ${status.icon}"></i>
                        ${status.text}
                    </span>
                    ${canCancel ? `<button data-id="${c.id}" class="cancel-btn text-sm text-red-600 hover:underline font-medium flex items-center gap-1"><i class="bi bi-x-circle"></i>Cancelar Cita</button>` : ''}
                </div>
            </div>`;
        container.insertAdjacentHTML('beforeend', cardHtml);
    });
};

// --- LÓGICA DE API Y EVENTOS ---
const loadAppointments = async () => {
    try {
        container.innerHTML = `<p class="text-center text-gray-500 p-8">Cargando citas...</p>`;
        allAppointments = await apiCall('/mis-citas');
        allAppointments.sort((a, b) => new Date(b.fecha_hora_inicio) - new Date(a.fecha_hora_inicio));
        renderAppointments('upcoming');
    } catch (error) {
        showMessage(error.message);
        container.innerHTML = '';
    }
};

const openCancelModal = (e) => {
    const btn = e.target.closest('.cancel-btn');
    if (!btn) return;
    
    appointmentToCancelId = btn.dataset.id; // El ID ya es un string (UUID)
    confirmModal.classList.remove('hidden');
};

const closeCancelModal = () => {
    appointmentToCancelId = null;
    confirmModal.classList.add('hidden');
};

const confirmCancellation = async () => {
    if (!appointmentToCancelId) return;

    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Cancelando...';

    try {
        const result = await apiCall(`/mis-citas/${appointmentToCancelId}/cancelar`, { method: 'PUT' });
        
        // Actualizar el estado de la cita en el array local
        const appointment = allAppointments.find(c => c.id === appointmentToCancelId);
        if (appointment) {
            appointment.estado = 'Cancelada';
        }
        
        showMessage(result.message, false);
        
        // Vuelve a renderizar la vista actual
        const currentFilter = document.querySelector('.tab-btn.border-indigo-500').id === 'tab-upcoming' ? 'upcoming' : 'past';
        renderAppointments(currentFilter);
        
    } catch (error) {
        showMessage(error.message);
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Sí, cancelar';
        closeCancelModal();
    }
};

const switchTab = (tabToShow) => {
    const isUpcoming = tabToShow === 'upcoming';
    
    upcomingTab.classList.toggle('border-indigo-500', isUpcoming);
    upcomingTab.classList.toggle('text-indigo-600', isUpcoming);
    upcomingTab.classList.toggle('border-transparent', !isUpcoming);
    upcomingTab.classList.toggle('text-gray-500', !isUpcoming);
    
    pastTab.classList.toggle('border-indigo-500', !isUpcoming);
    pastTab.classList.toggle('text-indigo-600', !isUpcoming);
    pastTab.classList.toggle('border-transparent', isUpcoming);
    pastTab.classList.toggle('text-gray-500', isUpcoming);

    renderAppointments(tabToShow);
};

// --- ASIGNACIÓN DE EVENTOS ---
upcomingTab.addEventListener('click', () => switchTab('upcoming'));
pastTab.addEventListener('click', () => switchTab('past'));

container.addEventListener('click', openCancelModal);
confirmBtn.addEventListener('click', confirmCancellation);
cancelBtn.addEventListener('click', closeCancelModal);
confirmModal.addEventListener('click', (e) => { if(e.target === confirmModal) closeCancelModal(); });


// --- INICIALIZACIÓN ---
loadAppointments();