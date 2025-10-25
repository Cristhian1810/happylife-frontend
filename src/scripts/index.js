// TODO: cambiar tema
const btnTema = document.querySelector('#btn-tema');
const html = document.documentElement;
const logo1 = document.querySelector('#logo1');
const logo2 = document.querySelector('#logo2');
const sunIcon = document.querySelector('#sun-icon');

btnTema.addEventListener('click', () => {
    html.classList.toggle('dark');

    const isDark = html.classList.contains('dark');
    logo1.src = isDark
        ? './src/assets/images/happy-life-icon-blanco.png'
        : './src/assets/images/happy-life-icon-negro.png';
    logo2.src = isDark
        ? './src/assets/images/happy-life-icon-blanco.png'
        : './src/assets/images/happy-life-icon-negro.png';
    sunIcon.src = isDark
        ? './src/assets/icons/sun-blanco.svg'
        : './src/assets/icons/sun-negro.svg';
});

// TODO: configuracion del modal y post a la api

document.addEventListener('DOMContentLoaded', () => {
    const registerModal = document.getElementById('modal');
    const registerModalContent = document.getElementById('modal-content');
    const loginModal = document.getElementById('login-modal');
    const loginModalContent = document.getElementById('login-modal-content');
    const openRegisterBtn = document.getElementById('open-modal-btn');
    const closeRegisterBtn = document.getElementById('close-modal');
    const openLoginBtn = document.getElementById('open-login-btn');
    const closeLoginBtn = document.getElementById('close-login-modal');
    const switchToRegisterBtn = document.getElementById('switch-to-register');
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const generoSelect = document.getElementById('genero-select');
    const switchToLoginBtn = document.getElementById('switch-to-login');

    const showToast = (message, type = 'success') => {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        const baseClasses = 'p-4 rounded-lg shadow-md text-white text-sm transition-all duration-300 transform';
        const typeClasses = type === 'success' ? 'bg-green-500' : 'bg-red-500';
        toast.className = `${baseClasses} ${typeClasses} opacity-0 translate-x-10`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.classList.remove('opacity-0', 'translate-x-10'), 10);
        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-x-10');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 4000);
    };

    const openModal = (modal, content) => {
        modal.classList.remove('hidden');
        setTimeout(() => content.classList.remove('scale-95', 'opacity-0'), 10);
    };

    const closeModal = (modal, content) => {
        content.classList.add('scale-95', 'opacity-0');
        setTimeout(() => modal.classList.add('hidden'), 300);
    };

    const cargarGeneros = async () => {
        try {
            const response = await fetch('https://happylife-backend.onrender.com/generos');
            if (!response.ok) throw new Error('Error al obtener los géneros');
            const generos = await response.json();
            generos.forEach(genero => {
                const option = document.createElement('option');
                option.value = genero.id;
                option.textContent = genero.nombre;
                generoSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Fallo al cargar géneros:', error);
            showToast('No se pudieron cargar las opciones de género.', 'error');
        }
    };
    cargarGeneros();

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const password = formData.get('password');
        const passwordConfirmation = formData.get('password_confirmation');

        if (password !== passwordConfirmation) {
            showToast('Las contraseñas no coinciden.', 'error');
            return;
        }

        const data = {
            nombres: formData.get('nombres'),
            apellidos: formData.get('apellidos'),
            dni: formData.get('dni'),
            telefono: formData.get('telefono'),
            email: formData.get('email'),
            fechaNacimiento: formData.get('fechaNacimiento'),
            genero: formData.get('genero'),
            password: password
        };

        try {
            const response = await fetch('https://happylife-backend.onrender.com/pacientes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                credentials: 'include'
            });
            const result = await response.json();
            if (!response.ok) throw result;

            showToast(result.message || '¡Usuario registrado con éxito!', 'success');
            registerForm.reset();
            closeModal(registerModal, registerModalContent);
        } catch (error) {
            showToast(error.message || 'No se pudo completar el registro.', 'error');
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            email: formData.get('email'),
            password: formData.get('password')
        };
        try {
            const response = await fetch('https://happylife-backend.onrender.com/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                credentials: 'include'
            });
            const result = await response.json();

            if (!response.ok) throw result;

            showToast(result.mensaje || "Inicio de sesión exitoso", 'success');
            loginForm.reset();
            closeModal(loginModal, loginModalContent);

            setTimeout(() => {
                window.location.href = 'src/pages/main.html';
            }, 1000);

        } catch (error) {
            showToast(error.mensaje || 'Error de conexión. Inténtalo de nuevo.', 'error');
        }
    });

    openRegisterBtn.addEventListener('click', () => openModal(registerModal, registerModalContent));
    closeRegisterBtn.addEventListener('click', () => closeModal(registerModal, registerModalContent));
    registerModal.addEventListener('click', (e) => (e.target === registerModal) && closeModal(registerModal, registerModalContent));
    openLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal(loginModal, loginModalContent);
    });
    closeLoginBtn.addEventListener('click', () => closeModal(loginModal, loginModalContent));
    loginModal.addEventListener('click', (e) => (e.target === loginModal) && closeModal(loginModal, loginModalContent));
    switchToRegisterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal(loginModal, loginModalContent);
        setTimeout(() => openModal(registerModal, registerModalContent), 300);
    });
    switchToLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal(registerModal, registerModalContent);
        setTimeout(() => openModal(loginModal, loginModalContent), 300);
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape") {
            if (!registerModal.classList.contains('hidden')) closeModal(registerModal, registerModalContent);
            if (!loginModal.classList.contains('hidden')) closeModal(loginModal, loginModalContent);
        }
    });
});