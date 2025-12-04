// --- ELEMENTOS DEL DOM ---
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const confirmBtn = document.getElementById('confirm-btn');
const errorEl = document.getElementById('error-message');
const API_BASE_URL = 'https://happylife-backend.onrender.com';
const stepIndicator = document.getElementById('step-indicator');

let currentStep = 1;
const totalSteps = 4;
const stepNames = ['Especialidad', 'Doctor', 'Fecha y Hora', 'Confirmación'];

const appointmentData = {
  specialty: null,
  doctor: null,
  slot: null,
  motivo: '',
};

// Almacenará las citas actuales del usuario para validaciones
let userExistingAppointments = [];

// --- LÓGICA DE NAVEGACIÓN Y UI ---
const renderStepIndicator = () => {
  stepIndicator.innerHTML = '';
  for (let i = 1; i <= totalSteps; i++) {
    const isActive = i === currentStep;
    const isCompleted = i < currentStep;

    let indicatorClass = 'bg-gray-200';
    if (isActive) indicatorClass = 'bg-indigo-600 text-white';
    if (isCompleted) indicatorClass = 'bg-green-500 text-white';

    stepIndicator.innerHTML += `
            <div class="flex-1 flex flex-col items-center">
                <div class="w-8 h-8 rounded-full ${indicatorClass} flex items-center justify-center font-bold">${
      isCompleted ? '<i class="bi bi-check-lg"></i>' : i
    }</div>
                <p class="text-xs mt-1 font-medium ${
                  isActive || isCompleted ? 'text-gray-800' : 'text-gray-400'
                }">${stepNames[i - 1]}</p>
            </div>
            ${
              i < totalSteps
                ? '<div class="flex-1 h-1 ' +
                  (isCompleted ? 'bg-green-500' : 'bg-gray-200') +
                  '"></div>'
                : ''
            }
        `;
  }
};

const navigateToStep = (step) => {
  document
    .querySelectorAll('.step-content')
    .forEach((el) => el.classList.add('hidden'));
  document.getElementById(`step-${step}`).classList.remove('hidden');
  currentStep = step;
  renderStepIndicator();
  updateNavButtons();
};

const updateNavButtons = () => {
  prevBtn.disabled = currentStep === 1;
  nextBtn.disabled = !isStepValid(currentStep);
  nextBtn.classList.toggle('hidden', currentStep === 4);
  confirmBtn.classList.toggle('hidden', currentStep !== 4);
};

const isStepValid = (step) => {
  switch (step) {
    case 1:
      return !!appointmentData.specialty;
    case 2:
      return !!appointmentData.doctor;
    case 3:
      return !!appointmentData.slot;
    default:
      return false;
  }
};

// --- LÓGICA DE CARGA DE DATOS ---

// 1. Cargar citas del usuario para validaciones
const loadUserAppointments = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/citas`, {
      credentials: 'include',
    });
    if (response.ok) {
      userExistingAppointments = await response.json();
    }
  } catch (error) {
    console.error('Error al cargar historial de citas:', error);
  }
};

const loadSpecialties = async () => {
  const list = document.getElementById('specialties-list');
  try {
    const response = await fetch(`${API_BASE_URL}/agendar/especialidades`, {
      credentials: 'include',
    });
    const data = await response.json();
    list.innerHTML = data
      .map(
        (s) => `
            <button data-id="${s.id}" data-name="${s.nombre}" class="specialty-btn p-4 border rounded-lg text-center font-semibold text-gray-700 hover:bg-indigo-50 hover:border-indigo-400 transition-colors focus:ring-2 focus:ring-indigo-500">
                ${s.nombre}
            </button>`
      )
      .join('');
  } catch {
    list.innerHTML =
      '<p class="text-red-500 col-span-full">Error al cargar especialidades.</p>';
  }
};

const loadDoctors = async (specialtyId) => {
  const list = document.getElementById('doctors-list');
  list.innerHTML = '<p>Cargando doctores...</p>';
  try {
    const response = await fetch(
      `${API_BASE_URL}/agendar/doctores/${specialtyId}`,
      { credentials: 'include' }
    );
    const data = await response.json();

    // VALIDACIÓN: Si no hay doctores disponibles
    if (data.length === 0) {
      list.innerHTML = `
                <div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
                    <i class="bi bi-exclamation-circle mr-2"></i>
                    No hay doctores disponibles para esta especialidad en este momento.
                </div>`;
      return;
    }

    list.innerHTML = data
      .map(
        (d) => `
            <button data-id="${d.id}" data-name="${d.nombres} ${d.apellidos}" class="doctor-btn block w-full p-4 border rounded-lg text-left hover:bg-indigo-50 hover:border-indigo-400 transition-colors focus:ring-2 focus:ring-indigo-500 flex items-center gap-4">
                <i class="bi bi-person-circle text-3xl text-gray-400"></i>
                <span class="font-semibold text-gray-700">${d.nombres} ${d.apellidos}</span>
            </button>`
      )
      .join('');
  } catch {
    list.innerHTML = '<p class="text-red-500">Error al cargar doctores.</p>';
  }
};

const loadSlots = async () => {
  const list = document.getElementById('slots-list');
  const dateInput = document.getElementById('appointment-date').value;
  appointmentData.slot = null; // Reset slot on date change
  updateNavButtons();

  if (!dateInput || !appointmentData.doctor) {
    list.innerHTML =
      '<p class="col-span-3 text-sm text-center text-gray-500 p-4">Selecciona una fecha para ver los horarios.</p>';
    return;
  }

  // --- VALIDACIÓN: Límite de 2 citas por día ---
  const selectedDateStr = new Date(dateInput + 'T00:00:00').toDateString();

  const appointmentsOnThisDay = userExistingAppointments.filter((cita) => {
    const citaDate = new Date(cita.fecha_hora_inicio).toDateString();
    // Filtramos solo citas activas (no canceladas) si tu backend devuelve estado
    const isActive = cita.estado !== 'cancelada';
    return citaDate === selectedDateStr && isActive;
  });

  if (appointmentsOnThisDay.length >= 2) {
    list.innerHTML = `
            <div class="col-span-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
                <i class="bi bi-x-circle mr-2"></i>
                Ya tienes 2 citas programadas para este día. Por favor, selecciona otra fecha.
            </div>`;
    return;
  }

  list.innerHTML =
    '<p class="col-span-3 text-sm text-center text-gray-500 p-4">Buscando horarios...</p>';

  try {
    const response = await fetch(
      `${API_BASE_URL}/agendar/horario/${appointmentData.doctor.id}?fecha=${dateInput}`,
      { credentials: 'include' }
    );
    const availableSlots = await response.json();

    if (availableSlots.length === 0) {
      list.innerHTML =
        '<p class="col-span-3 text-sm text-center text-gray-500 p-4">No hay horarios disponibles con este doctor.</p>';
      return;
    }

    list.innerHTML = availableSlots
      .map((slotIsoString) => {
        const slotDate = new Date(slotIsoString);
        const timeStr = slotDate.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        });

        // --- VALIDACIÓN: Choque de hora y margen de 30 minutos ---
        let isDisabled = false;
        let conflictMessage = '';

        // Revisamos contra todas las citas futuras del usuario (no solo las de ese día, por seguridad, aunque la fecha ya filtra)
        for (const existingCita of userExistingAppointments) {
          if (existingCita.estado === 'cancelada') continue;

          const existingDate = new Date(existingCita.fecha_hora_inicio);
          const diffMs = Math.abs(slotDate - existingDate);
          const diffMinutes = diffMs / (1000 * 60);

          // Caso 1: Exactamente la misma hora
          if (diffMs === 0) {
            isDisabled = true;
            conflictMessage = 'Ya tienes una cita a esta hora';
            break;
          }

          // Caso 2: Margen de 30 minutos
          if (diffMinutes < 30) {
            isDisabled = true;
            conflictMessage = 'Debe haber 30 min de diferencia entre citas';
            break;
          }
        }

        if (isDisabled) {
          return `
                    <button disabled class="slot-btn-disabled p-2 border rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed text-xs flex flex-col items-center justify-center opacity-70" title="${conflictMessage}">
                        <span class="font-bold text-sm line-through">${timeStr}</span>
                        <span class="text-[10px]">${conflictMessage}</span>
                    </button>
                `;
        } else {
          return `<button data-slot="${slotIsoString}" class="slot-btn p-2 border rounded-lg bg-white font-medium text-indigo-700 hover:bg-indigo-600 hover:text-white transition-colors focus:ring-2 focus:ring-indigo-500">${timeStr}</button>`;
        }
      })
      .join('');
  } catch {
    list.innerHTML =
      '<p class="col-span-3 text-sm text-center text-red-500 p-4">Error al buscar horarios.</p>';
  }
};

const showConfirmation = () => {
  const details = document.getElementById('confirmation-details');
  details.innerHTML = `
        <p><strong class="font-semibold text-gray-800">Especialidad:</strong> ${
          appointmentData.specialty.name
        }</p>
        <p><strong class="font-semibold text-gray-800">Doctor:</strong> ${
          appointmentData.doctor.name
        }</p>
        <p><strong class="font-semibold text-gray-800">Fecha y Hora:</strong> <span class="text-indigo-600 font-bold">${new Date(
          appointmentData.slot
        ).toLocaleString('es-ES', {
          dateStyle: 'full',
          timeStyle: 'short',
        })}</span></p>
    `;
};

// --- LÓGICA DE AGENDAMIENTO ---
const handleConfirmAppointment = async () => {
  confirmBtn.disabled = true;
  confirmBtn.innerHTML = `<i class="bi bi-arrow-repeat animate-spin"></i> Agendando...`;
  try {
    const response = await fetch(`${API_BASE_URL}/citas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        doctor_usuario_id: appointmentData.doctor.id,
        fecha_hora_inicio: appointmentData.slot,
        motivo_consulta: document.getElementById('motivo-consulta').value,
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);

    alert('¡Cita agendada con éxito!');
    await loadUserAppointments();
    location.reload();
  } catch (error) {
    errorEl.textContent = `Error: ${error.message}`;
    errorEl.classList.remove('hidden');
    errorEl.className =
      'p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400';
  } finally {
    confirmBtn.disabled = false;
    confirmBtn.innerHTML = `<i class="bi bi-check2-circle"></i> Confirmar Cita`;
  }
};

// --- EVENT LISTENERS ---
document.body.addEventListener('click', (e) => {
  const specialtyBtn = e.target.closest('.specialty-btn');
  const doctorBtn = e.target.closest('.doctor-btn');
  const slotBtn = e.target.closest('.slot-btn');

  if (specialtyBtn) {
    document
      .querySelectorAll('.specialty-btn')
      .forEach((btn) => btn.classList.remove('bg-indigo-500', 'text-white'));
    specialtyBtn.classList.add('bg-indigo-500', 'text-white');
    appointmentData.specialty = {
      id: specialtyBtn.dataset.id,
      name: specialtyBtn.dataset.name,
    };
    loadDoctors(specialtyBtn.dataset.id);
    navigateToStep(2);
  }
  if (doctorBtn) {
    document
      .querySelectorAll('.doctor-btn')
      .forEach((btn) => btn.classList.remove('bg-indigo-500', 'text-white'));
    doctorBtn.classList.add('bg-indigo-500', 'text-white');
    appointmentData.doctor = {
      id: doctorBtn.dataset.id,
      name: doctorBtn.dataset.name,
    };
    navigateToStep(3);
  }
  if (slotBtn) {
    document
      .querySelectorAll('.slot-btn')
      .forEach((btn) => btn.classList.remove('bg-indigo-600', 'text-white'));
    slotBtn.classList.add('bg-indigo-600', 'text-white');
    appointmentData.slot = slotBtn.dataset.slot;
    updateNavButtons();
    showConfirmation();
  }
});

prevBtn.addEventListener('click', () => navigateToStep(currentStep - 1));
nextBtn.addEventListener('click', () => {
  if (currentStep === 3) showConfirmation();
  navigateToStep(currentStep + 1);
});
confirmBtn.addEventListener('click', handleConfirmAppointment);
document
  .getElementById('appointment-date')
  .addEventListener('change', loadSlots);

(async () => {
  await loadUserAppointments();
  loadSpecialties();
  navigateToStep(1);
})();
