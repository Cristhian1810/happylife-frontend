const loaderEl = document.getElementById('loader');
const errorEl = document.getElementById('error-message');
const successEl = document.getElementById('success-message');
const clinicFormEl = document.getElementById('clinic-form');
const clinicFieldsetEl = document.getElementById('clinic-fieldset');
const saveButtonEl = document.getElementById('save-button');
const logoPreviewEl = document.getElementById('logo-preview');
const urlLogoInputEl = document.getElementById('url_logo');

const API_URL = 'https://happylife-backend.onrender.com/clinica/info';

// Carga los datos de la clínica en el formulario
const loadClinicInfo = async () => {
    try {
        clinicFieldsetEl.disabled = true;
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('No se pudo conectar con el servidor.');

        const data = await response.json();
        
        for (const key in data) {
            const input = clinicFormEl.querySelector(`[name="${key}"]`);
            if (input) {
                input.value = data[key] || '';
            }
        }
        
        updateLogoPreview(data.url_logo);

        loaderEl.classList.add('hidden');
        clinicFormEl.classList.remove('hidden');

    } catch (error) {
        loaderEl.classList.add('hidden');
        errorEl.textContent = `Error al cargar la información: ${error.message}`;
        errorEl.classList.remove('hidden');
    } finally {
        clinicFieldsetEl.disabled = false;
    }
};

// Actualiza la vista previa del logo en tiempo real
const updateLogoPreview = (url) => {
    if (url && url.trim() !== '') {
        logoPreviewEl.src = url;
    } else {
        logoPreviewEl.src = 'https://via.placeholder.com/150?text=Sin+Logo';
    }
};

// Maneja el envío del formulario para guardar los cambios
const handleFormSubmit = async (event) => {
    event.preventDefault();
    saveButtonEl.disabled = true;
    saveButtonEl.textContent = 'Guardando...';
    errorEl.classList.add('hidden');
    successEl.classList.add('hidden');

    const formData = new FormData(clinicFormEl);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Ocurrió un error.');
        
        successEl.textContent = result.message;
        successEl.classList.remove('hidden');
        
        setTimeout(() => successEl.classList.add('hidden'), 4000);

    } catch (error) {
        errorEl.textContent = `Error al guardar: ${error.message}`;
        errorEl.classList.remove('hidden');
    } finally {
        saveButtonEl.disabled = false;
        saveButtonEl.textContent = 'Guardar Cambios';
    }
};

// --- Event Listeners ---
clinicFormEl.addEventListener('submit', handleFormSubmit);
urlLogoInputEl.addEventListener('input', (e) => updateLogoPreview(e.target.value));

// --- Inicialización ---
loadClinicInfo();