    // --- ELEMENTOS DEL DOM ---
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const confirmBtn = document.getElementById('confirm-btn');
    const errorEl = document.getElementById('error-message');
    const API_BASE_URL = 'https://happylife-backend.onrender.com';
    const stepIndicator = document.getElementById('step-indicator');

    let currentStep = 1;
    const totalSteps = 4;
    const stepNames = ["Especialidad", "Doctor", "Fecha y Hora", "Confirmación"];

    const appointmentData = {
        specialty: null,
        doctor: null,
        slot: null,
        motivo: ''
    };

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
                    <div class="w-8 h-8 rounded-full ${indicatorClass} flex items-center justify-center font-bold">${isCompleted ? '<i class="bi bi-check-lg"></i>' : i}</div>
                    <p class="text-xs mt-1 font-medium ${isActive || isCompleted ? 'text-gray-800' : 'text-gray-400'}">${stepNames[i-1]}</p>
                </div>
                ${i < totalSteps ? '<div class="flex-1 h-1 ' + (isCompleted ? 'bg-green-500' : 'bg-gray-200') + '"></div>' : ''}
            `;
        }
    };

    const navigateToStep = (step) => {
        document.querySelectorAll('.step-content').forEach(el => el.classList.add('hidden'));
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
            case 1: return !!appointmentData.specialty;
            case 2: return !!appointmentData.doctor;
            case 3: return !!appointmentData.slot;
            default: return false;
        }
    };

    // --- LÓGICA DE CARGA DE DATOS ---
    const loadSpecialties = async () => {
        const list = document.getElementById('specialties-list');
        try {
            const response = await fetch(`${API_BASE_URL}/agendar/especialidades`, { credentials: 'include' });
            const data = await response.json();
            list.innerHTML = data.map(s => `
                <button data-id="${s.id}" data-name="${s.nombre}" class="specialty-btn p-4 border rounded-lg text-center font-semibold text-gray-700 hover:bg-indigo-50 hover:border-indigo-400 transition-colors focus:ring-2 focus:ring-indigo-500">
                    ${s.nombre}
                </button>`).join('');
        } catch {
            list.innerHTML = '<p class="text-red-500 col-span-full">Error al cargar especialidades.</p>';
        }
    };

    const loadDoctors = async (specialtyId) => {
        const list = document.getElementById('doctors-list');
        list.innerHTML = '<p>Cargando doctores...</p>';
        try {
            const response = await fetch(`${API_BASE_URL}/agendar/doctores/${specialtyId}`, { credentials: 'include' });
            const data = await response.json();
            list.innerHTML = data.map(d => `
                <button data-id="${d.id}" data-name="${d.nombres} ${d.apellidos}" class="doctor-btn block w-full p-4 border rounded-lg text-left hover:bg-indigo-50 hover:border-indigo-400 transition-colors focus:ring-2 focus:ring-indigo-500 flex items-center gap-4">
                    <i class="bi bi-person-circle text-3xl text-gray-400"></i>
                    <span class="font-semibold text-gray-700">${d.nombres} ${d.apellidos}</span>
                </button>`).join('');
        } catch {
            list.innerHTML = '<p class="text-red-500">Error al cargar doctores.</p>';
        }
    };

    const loadSlots = async () => {
        const list = document.getElementById('slots-list');
        const date = document.getElementById('appointment-date').value;
        appointmentData.slot = null; // Reset slot on date change
        updateNavButtons();

        if (!date || !appointmentData.doctor) {
            list.innerHTML = '<p class="col-span-3 text-sm text-center text-gray-500 p-4">Selecciona una fecha para ver los horarios.</p>';
            return;
        }

        list.innerHTML = '<p class="col-span-3 text-sm text-center text-gray-500 p-4">Buscando horarios...</p>';
        try {
            const response = await fetch(`${API_BASE_URL}/agendar/horario/${appointmentData.doctor.id}?fecha=${date}`, { credentials: 'include' });
            const data = await response.json();
            if (data.length === 0) {
                list.innerHTML = '<p class="col-span-3 text-sm text-center text-gray-500 p-4">No hay horarios disponibles.</p>';
                return;
            }
            list.innerHTML = data.map(s => {
                const time = new Date(s).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                return `<button data-slot="${s}" class="slot-btn p-2 border rounded-lg bg-white font-medium text-indigo-700 hover:bg-indigo-600 hover:text-white transition-colors focus:ring-2 focus:ring-indigo-500">${time}</button>`;
            }).join('');
        } catch {
            list.innerHTML = '<p class="col-span-3 text-sm text-center text-red-500 p-4">Error al buscar horarios.</p>';
        }
    };

    const showConfirmation = () => {
        const details = document.getElementById('confirmation-details');
        details.innerHTML = `
            <p><strong class="font-semibold text-gray-800">Especialidad:</strong> ${appointmentData.specialty.name}</p>
            <p><strong class="font-semibold text-gray-800">Doctor:</strong> ${appointmentData.doctor.name}</p>
            <p><strong class="font-semibold text-gray-800">Fecha y Hora:</strong> <span class="text-indigo-600 font-bold">${new Date(appointmentData.slot).toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' })}</span></p>
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
                    motivo_consulta: document.getElementById('motivo-consulta').value
                })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            
            alert('¡Cita agendada con éxito!');

        } catch (error) {
            errorEl.textContent = `Error: ${error.message}`;
            errorEl.style.display = 'block';
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
            document.querySelectorAll('.specialty-btn').forEach(btn => btn.classList.remove('bg-indigo-500', 'text-white'));
            specialtyBtn.classList.add('bg-indigo-500', 'text-white');
            appointmentData.specialty = { id: specialtyBtn.dataset.id, name: specialtyBtn.dataset.name };
            loadDoctors(specialtyBtn.dataset.id);
            navigateToStep(2);
        }
        if (doctorBtn) {
            document.querySelectorAll('.doctor-btn').forEach(btn => btn.classList.remove('bg-indigo-500', 'text-white'));
            doctorBtn.classList.add('bg-indigo-500', 'text-white');
            appointmentData.doctor = { id: doctorBtn.dataset.id, name: doctorBtn.dataset.name };
            navigateToStep(3);
        }
        if (slotBtn) {
            document.querySelectorAll('.slot-btn').forEach(btn => btn.classList.remove('bg-indigo-600', 'text-white'));
            slotBtn.classList.add('bg-indigo-600', 'text-white');
            appointmentData.slot = slotBtn.dataset.slot;
            updateNavButtons();
            showConfirmation();
        }
    });

    prevBtn.addEventListener('click', () => navigateToStep(currentStep - 1));
    nextBtn.addEventListener('click', () => {
        if(currentStep === 3) showConfirmation();
        navigateToStep(currentStep + 1);
    });
    confirmBtn.addEventListener('click', handleConfirmAppointment);
    document.getElementById('appointment-date').addEventListener('change', loadSlots);

    // --- INICIALIZACIÓN ---
    loadSpecialties();
    navigateToStep(1);