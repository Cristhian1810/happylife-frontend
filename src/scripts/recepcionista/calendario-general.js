// --- ESTADO Y CONFIGURACIÓN GLOBAL ---
const state = {
    currentDate: new Date(),
    selectedDate: new Date(),
    appointments: []
};

const API_BASE_URL = 'https://happylife-backend.onrender.com';
const DOCTOR_COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f97316', '#8b5cf6', '#d946ef'];
const doctorColorMap = new Map();

// --- ELEMENTOS DEL DOM ---
const previousMonthBtn = document.getElementById('previousMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');
const calendarDateEl = document.getElementById('calendar-date');
const calendarDaysContainer = document.getElementById('calendar-days');
const scheduleContainer = document.getElementById('schedule');
const selectedDayLabel = document.getElementById('selected-day-label');
const doctorLegend = document.getElementById('doctor-legend');
const appointmentsModal = document.getElementById('appointments-modal');
const modalHeading = document.getElementById('modal-heading');
const modalList = document.getElementById('modal-list');
const modalCloseBtn = document.getElementById('modalCloseBtn');

// --- FUNCIONES AUXILIARES ---
const yyyy_mm_dd = (dt) => dt.toISOString().slice(0, 10);

const formatMonthYear = (date) => date.toLocaleString('es-ES', { month: 'long', year: 'numeric' });

async function apiCall(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { credentials: 'include' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Error de red');
    return data;
}

const getDoctorColor = (doctorName) => {
    if (!doctorColorMap.has(doctorName)) {
        const colorIndex = doctorColorMap.size % DOCTOR_COLORS.length;
        doctorColorMap.set(doctorName, DOCTOR_COLORS[colorIndex]);
    }
    return doctorColorMap.get(doctorName);
};

// --- RENDERIZADO DEL CALENDARIO MENSUAL ---
function renderCalendar() {
    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    calendarDateEl.textContent = formatMonthYear(state.currentDate);
    calendarDaysContainer.innerHTML = '';

    const offsetFromMonday = (firstOfMonth.getDay() + 6) % 7;
    for (let i = 0; i < offsetFromMonday; i++) {
        calendarDaysContainer.innerHTML += `<div class="bg-slate-50"></div>`;
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(year, month, d);
        calendarDaysContainer.appendChild(createDayCell(dateObj));
    }
}

function createDayCell(dateObj) {
    const day = dateObj.getDate();
    const dateKey = yyyy_mm_dd(dateObj);
    
    const btn = document.createElement('button');
    btn.className = 'flex flex-col items-start p-1 rounded min-h-[90px] hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400';
    
    const today = new Date();
    if (dateKey === yyyy_mm_dd(today)) {
        btn.classList.add('bg-indigo-50');
    }
    if (state.selectedDate && dateKey === yyyy_mm_dd(state.selectedDate)) {
        btn.classList.add('ring-2', 'ring-indigo-500');
    }

    const appointmentsForDay = state.appointments.filter(a => yyyy_mm_dd(a.start) === dateKey);
    
    let badgesHTML = '';
    appointmentsForDay.slice(0, 3).forEach(app => {
        badgesHTML += `<span class="text-xs px-1.5 py-0.5 rounded text-white truncate w-full" style="background-color: ${app.color};">${app.title}</span>`;
    });
    if (appointmentsForDay.length > 3) {
        badgesHTML += `<span class="text-xs text-slate-500">+${appointmentsForDay.length - 3} más</span>`;
    }

    btn.innerHTML = `
        <h5 class="text-sm font-semibold self-center ${dateKey === yyyy_mm_dd(today) ? 'text-indigo-600' : 'text-slate-700'}">${day}</h5>
        <div class="mt-1 flex flex-col gap-1 w-full">${badgesHTML}</div>`;
    
    btn.addEventListener('click', () => {
        state.selectedDate = dateObj;
        renderCalendar(); // Re-render para mostrar el día seleccionado
        renderScheduleForDate(dateObj);
        openDayModal(dateObj);
    });

    return btn;
}


// --- RENDERIZADO DEL HORARIO DIARIO ---
function renderScheduleForDate(dateObj) {
    selectedDayLabel.textContent = dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    scheduleContainer.innerHTML = '';
    const appointmentsForDay = state.appointments.filter(a => yyyy_mm_dd(a.start) === yyyy_mm_dd(dateObj));

    for (let hour = 7; hour < 21; hour++) { // Horario de 7 AM a 8 PM
        const label = new Date(0, 0, 0, hour).toLocaleTimeString('es-ES', { hour: 'numeric' });
        const eventsInHour = appointmentsForDay.filter(ev => ev.start.getHours() === hour);
        
        let eventsHTML = '<div class="text-xs text-slate-400">—</div>';
        if (eventsInHour.length > 0) {
            eventsHTML = eventsInHour.map(ev => `
                <div class="mb-1 p-2 rounded-md text-white text-left" style="background-color: ${ev.color};">
                    <div class="font-semibold text-sm">${ev.title}</div>
                    <div class="text-xs opacity-90">${ev.start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - ${ev.end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div class="text-xs opacity-80">${ev.client}</div>
                </div>
            `).join('');
        }

        scheduleContainer.innerHTML += `
            <div class="flex gap-3 items-start">
                <div class="w-20 text-right pr-2 text-sm text-slate-500">${label}</div>
                <div class="flex-1 min-h-[44px] relative bg-white border border-slate-100 rounded-md p-1 shadow-sm">${eventsHTML}</div>
            </div>`;
    }
}


// --- LÓGICA DEL MODAL ---
function openDayModal(dateObj) {
    modalHeading.textContent = `Citas — ${dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}`;
    modalList.innerHTML = '';
    
    const events = state.appointments.filter(a => yyyy_mm_dd(a.start) === yyyy_mm_dd(dateObj));
    if (events.length === 0) {
        modalList.innerHTML = `<li class="text-sm text-slate-500">No hay citas para este día.</li>`;
    } else {
        events.forEach(ev => {
            modalList.innerHTML += `
                <li class="p-3 border rounded-lg flex items-start justify-between gap-4" style="border-left: 4px solid ${ev.color};">
                    <div>
                        <div class="font-semibold">${ev.title}</div>
                        <div class="text-sm text-slate-600">${ev.client}</div>
                        <div class="text-xs text-slate-500 mt-1">
                            <i class="bi bi-clock"></i> ${ev.start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - ${ev.end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                    <span class="text-xs font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-700">${ev.status}</span>
                </li>`;
        });
    }
    
    appointmentsModal.showModal();
}

// --- INICIALIZACIÓN Y EVENTOS ---
async function initialize() {
    try {
        const rawAppointments = await apiCall('/supervision/citas');
        state.appointments = rawAppointments.map(app => {
            const color = getDoctorColor(app.nombre_doctor);
            return {
                id: app.id,
                title: app.nombre_paciente,
                client: `Dr. ${app.nombre_doctor}`,
                start: new Date(app.fecha_hora_inicio),
                end: new Date(app.fecha_hora_fin),
                status: app.estado_cita,
                color: color
            };
        });

        doctorLegend.innerHTML = Array.from(doctorColorMap.entries()).map(([name, color]) => 
            `<span class="flex items-center gap-1.5"><span class="block w-2.5 h-2.5 rounded-full" style="background-color: ${color};"></span> Dr. ${name.split(' ')[0]}</span>`
        ).join('');

        renderCalendar();
        renderScheduleForDate(state.selectedDate);
    } catch (e) {
        console.error(e);
        scheduleContainer.innerHTML = `<p class="text-red-500 text-center">${e.message}</p>`;
    }
}

function setupEventListeners() {
    previousMonthBtn.addEventListener('click', () => {
        state.currentDate.setMonth(state.currentDate.getMonth() - 1);
        renderCalendar();
    });
    nextMonthBtn.addEventListener('click', () => {
        state.currentDate.setMonth(state.currentDate.getMonth() + 1);
        renderCalendar();
    });
    
    modalCloseBtn.addEventListener('click', () => appointmentsModal.close());
    appointmentsModal.addEventListener('click', (e) => {
        if (e.target === appointmentsModal) appointmentsModal.close();
    });
}


// --- ARRANQUE ---
setupEventListeners();
initialize();