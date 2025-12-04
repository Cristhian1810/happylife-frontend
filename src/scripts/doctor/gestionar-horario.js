// --- ELEMENTOS DEL DOM ---
const scheduleDaysContainer = document.getElementById('schedule-days-container');
const scheduleForm = document.getElementById('schedule-form');
const saveScheduleBtn = document.getElementById('save-schedule-btn');
const durationSelect = document.getElementById('duracion_cita_minutos');

const exceptionForm = document.getElementById('exception-form');
const addExceptionBtn = document.getElementById('add-exception-btn');
const exceptionsListContainer = document.getElementById('exceptions-list-container');
const availabilitySelect = document.getElementById('esta_disponible');
const specialHoursContainer = document.getElementById('special-hours-container');
const exceptionDateInput = document.getElementById('fecha_excepcion');

const errorEl = document.getElementById('error-message');
const successEl = document.getElementById('success-message');

const API_BASE_URL = 'https://happylife-backend.onrender.com';
const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

// --- FUNCIONES DE FEEDBACK ---
const showMessage = (element, message, isSuccess = true) => {
    element.textContent = message;
    const baseClasses = 'p-4 rounded-lg mb-6 font-medium';
    element.className = isSuccess 
        ? `${baseClasses} bg-green-100 text-green-800 border border-green-200` 
        : `${baseClasses} bg-red-100 text-red-800 border border-red-200`;
    element.style.display = 'block';
    setTimeout(() => { element.style.display = 'none'; }, 4000);
};

// --- LÓGICA DE HORARIO SEMANAL ---
const renderWeeklySchedule = () => {
    scheduleDaysContainer.innerHTML = '';
    for (let i = 1; i <= 6; i++) { // Lunes (1) a Sábado (6)
        const dayHtml = `
            <div class="p-4 rounded-lg border bg-gray-50/50">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <input type="checkbox" id="day-${i}" data-day="${i}" class="h-5 w-5 rounded mr-4 text-indigo-600 focus:ring-indigo-500 day-checkbox cursor-pointer">
                        <label for="day-${i}" class="font-semibold text-gray-800 text-lg cursor-pointer">${diasSemana[i]}</label>
                    </div>
                </div>
                <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 time-inputs" style="display: none;">
                    <div>
                        <label for="start-${i}" class="text-sm text-gray-600">Hora de inicio</label>
                        <input type="time" id="start-${i}" class="mt-1 w-full p-2 border rounded-lg" step="1800">
                    </div>
                    <div>
                        <label for="end-${i}" class="text-sm text-gray-600">Hora de fin</label>
                        <input type="time" id="end-${i}" class="mt-1 w-full p-2 border rounded-lg" step="1800">
                    </div>
                </div>
            </div>
        `;
        scheduleDaysContainer.insertAdjacentHTML('beforeend', dayHtml);
    }
    
    scheduleDaysContainer.querySelectorAll('.day-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const timeInputs = e.target.closest('.rounded-lg').querySelector('.time-inputs');
            timeInputs.style.display = e.target.checked ? 'grid' : 'none';
        });
    });
};

const loadWeeklySchedule = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/horario`, { credentials: 'include' });
        if (!response.ok) throw new Error('No se pudo cargar el horario.');
        const data = await response.json();

        if (data.length > 0) {
            durationSelect.value = data[0].duracion_cita_minutos || '30';
        }

        data.forEach(dia => {
            const checkbox = document.getElementById(`day-${dia.dia_semana}`);
            if (checkbox) {
                checkbox.checked = true;
                document.getElementById(`start-${dia.dia_semana}`).value = dia.hora_inicio;
                document.getElementById(`end-${dia.dia_semana}`).value = dia.hora_fin;
                checkbox.dispatchEvent(new Event('change'));
            }
        });
    } catch (error) {
        showMessage(errorEl, error.message, false);
    }
};

const handleSaveSchedule = async (e) => {
    e.preventDefault();
    saveScheduleBtn.disabled = true;
    saveScheduleBtn.innerHTML = `<i class="bi bi-arrow-repeat animate-spin"></i> Guardando...`;

    const horarios = [];
    const duracion = durationSelect.value;
    
    scheduleDaysContainer.querySelectorAll('.day-checkbox:checked').forEach(checkbox => {
        const dia = checkbox.dataset.day;
        const hora_inicio = document.getElementById(`start-${dia}`).value;
        const hora_fin = document.getElementById(`end-${dia}`).value;

        if (hora_inicio && hora_fin && hora_fin > hora_inicio) {
            horarios.push({
                dia_semana: parseInt(dia),
                hora_inicio,
                hora_fin,
                duracion_cita_minutos: parseInt(duracion)
            });
        }
    });

    try {
        const response = await fetch(`${API_BASE_URL}/horario`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(horarios)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        showMessage(successEl, result.message, true);
    } catch (error) {
        showMessage(errorEl, error.message, false);
    } finally {
        saveScheduleBtn.disabled = false;
        saveScheduleBtn.innerHTML = `<i class="bi bi-check-circle"></i> Guardar Horario Semanal`;
    }
};


// --- LÓGICA DE EXCEPCIONES ---
const renderExceptions = (exceptions) => {
    exceptionsListContainer.innerHTML = '';
    if (exceptions.length === 0) {
        exceptionsListContainer.innerHTML = '<div class="text-center text-gray-500 text-sm p-4 bg-gray-50 rounded-lg"><i class="bi bi-info-circle mr-2"></i>No hay excepciones definidas.</div>';
        return;
    }
    exceptions.forEach(ex => {
        const date = new Date(ex.fecha_excepcion).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
        let details = '';
        if (ex.esta_disponible) {
            details = `<span class="font-semibold text-green-700">${ex.hora_inicio} - ${ex.hora_fin}</span>`;
        } else {
            details = '<span class="font-semibold text-red-700">No disponible</span>';
        }
        const exHtml = `
            <div class="flex justify-between items-center p-3 border rounded-lg bg-white hover:border-indigo-300 transition-colors">
                <div>
                    <p class="font-medium text-gray-800">${date}</p>
                    <p class="text-sm">${details}</p>
                </div>
                <button data-id="${ex.id}" class="delete-exception-btn text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 transition-colors">
                    <i class="bi bi-trash-fill text-lg"></i>
                </button>
            </div>`;
        exceptionsListContainer.insertAdjacentHTML('beforeend', exHtml);
    });
};

const loadExceptions = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/horario/excepciones`, { credentials: 'include' });
        if (!response.ok) throw new Error('No se pudieron cargar las excepciones.');
        const data = await response.json();
        renderExceptions(data);
    } catch (error) {
        exceptionsListContainer.innerHTML = `<p class="text-center text-red-500 text-sm">${error.message}</p>`;
    }
};

const handleAddException = async (e) => {
    e.preventDefault();
    addExceptionBtn.disabled = true;
    addExceptionBtn.innerHTML = `<i class="bi bi-arrow-repeat animate-spin"></i> Añadiendo...`;

    const data = {
        fecha_excepcion: exceptionDateInput.value,
        esta_disponible: availabilitySelect.value === 'true',
        hora_inicio: document.getElementById('excepcion_hora_inicio').value,
        hora_fin: document.getElementById('excepcion_hora_fin').value,
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/horario/excepciones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        showMessage(successEl, result.message, true);
        exceptionForm.reset();
        availabilitySelect.dispatchEvent(new Event('change'));
        loadExceptions();
    } catch (error) {
        showMessage(errorEl, error.message, false);
    } finally {
        addExceptionBtn.disabled = false;
        addExceptionBtn.innerHTML = `<i class="bi bi-plus-circle"></i> Añadir Excepción`;
    }
};

const handleDeleteException = async (e) => {
    const btn = e.target.closest('.delete-exception-btn');
    if (!btn) return;
    if (!confirm('¿Estás seguro de que quieres eliminar esta excepción?')) return;
    
    const id = btn.dataset.id;
    try {
        const response = await fetch(`${API_BASE_URL}/horario/excepciones/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        showMessage(successEl, result.message, true);
        loadExceptions();
    } catch (error) {
        showMessage(errorEl, error.message, false);
    }
};

// --- INICIALIZACIÓN Y EVENT LISTENERS ---
renderWeeklySchedule();
loadWeeklySchedule();
loadExceptions();

scheduleForm.addEventListener('submit', handleSaveSchedule);
exceptionForm.addEventListener('submit', handleAddException);
exceptionsListContainer.addEventListener('click', handleDeleteException);

availabilitySelect.addEventListener('change', () => {
    specialHoursContainer.style.display = availabilitySelect.value === 'true' ? 'grid' : 'none';
});