document.addEventListener("DOMContentLoaded", () => {
    const main = document.querySelector("main");
    const nombreUsuarioEl = document.querySelector("#nombre-usuario");
    const rolUsuarioEl = document.querySelector("#rol-usuario");
    const rolSidebarEl = document.querySelector("#rol-texto-sidebar");
    const logoutBtn = document.querySelector("#logout-btn");
    const menuContainer = document.getElementById("menu-container");
    const headerTitleEl = document.getElementById("header-title");
    const sidebar = document.getElementById("sidebar");
    const sidebarOverlay = document.getElementById("sidebar-overlay");
    const menuBtn = document.getElementById("menu-btn");

    const pageScripts = {
        "paciente/dashboard.html": "../scripts/paciente/dashboard.js",
        "paciente/agendar-cita.html": "../scripts/paciente/agendar-cita.js",
        "paciente/mis-citas.html": "../scripts/paciente/mis-citas.js",
        "paciente/perfil.html": "../scripts/paciente/perfil.js",
        "recepcionista/dashboard.html": "../scripts/recepcionista/dashboard.js",
        "recepcionista/calendario-general.html": "../scripts/recepcionista/calendario-general.js",
        "recepcionista/gestion-pacientes.html": "../scripts/recepcionista/gestion-pacientes.js",
        "recepcionista/perfil.html": "../scripts/recepcionista/perfil.js",
        "doctor/dashboard.html": "../scripts/doctor/dashboard.js",
        "doctor/gestionar-horario.html": "../scripts/doctor/gestionar-horario.js",
        "doctor/mis-pacientes.html": "../scripts/doctor/mis-pacientes.js",
        "doctor/perfil.html": "../scripts/doctor/perfil.js",
        "administrador/dashboard.html": "../scripts/administrador/dashboard.js",
        "administrador/gestion-doctor.html": "../scripts/administrador/gestion-doctor.js",
        "administrador/gestion-recepcionistas.html": "../scripts/administrador/gestion-recepcionistas.js",
        "administrador/supervision-citas.html": "../scripts/administrador/supervision-citas.js",
        "administrador/perfil.html": "../scripts/administrador/perfil.js",
        "super-admin/dashboard.html": "../scripts/super-admin/dashboard.js",
        "super-admin/gestion-administradores.html": "../scripts/super-admin/gestion-administradores.js",
        "super-admin/gestion-doctor.html": "../scripts/super-admin/gestion-doctor.js",
        "super-admin/gestion-recepcionistas.html": "../scripts/super-admin/gestion-recepcionistas.js",
        "super-admin/supervision-citas.html": "../scripts/super-admin/supervision-citas.js",
        "super-admin/perfil.html": "../scripts/super-admin/perfil.js",
        "super-admin/configuracion-clinica.html": "../scripts/super-admin/configuracion-clinica.js"
    };

    const menuConfig = {
        5: [{ texto: "Dashboard", icono: "bi-speedometer", pagina: "paciente/dashboard.html" }, { texto: "Agendar Cita", icono: "bi-calendar-plus", pagina: "paciente/agendar-cita.html" }, { texto: "Mis Citas", icono: "bi-calendar-check", pagina: "paciente/mis-citas.html" }, { texto: "Mi Perfil", icono: "bi-person-circle", pagina: "paciente/perfil.html" }],
        4: [{ texto: "Dashboard", icono: "bi-speedometer", pagina: "recepcionista/dashboard.html" }, { texto: "Calendario General", icono: "bi-calendar3", pagina: "recepcionista/calendario-general.html" }, { texto: "Gestión de Pacientes", icono: "bi-people-fill", pagina: "recepcionista/gestion-pacientes.html" }, { texto: "Mi Perfil", icono: "bi-person-circle", pagina: "recepcionista/perfil.html" }],
        3: [{ texto: "Dashboard", icono: "bi-speedometer", pagina: "doctor/dashboard.html" }, { texto: "Gestionar Horario", icono: "bi-clock-history", pagina: "doctor/gestionar-horario.html" }, { texto: "Mis Pacientes", icono: "bi-person-badge", pagina: "doctor/mis-pacientes.html" }, { texto: "Mi Perfil", icono: "bi-person-circle", pagina: "doctor/perfil.html" }],
        2: [{ texto: "Dashboard", icono: "bi-speedometer", pagina: "administrador/dashboard.html" }, { texto: "Gestión de Doctores", icono: "bi-file-earmark-medical-fill", pagina: "administrador/gestion-doctor.html" }, { texto: "Gestión de Recepcionistas", icono: "bi-person-lines-fill", pagina: "administrador/gestion-recepcionistas.html" }, { texto: "Supervisión de Citas", icono: "bi-calendar-week", pagina: "administrador/supervision-citas.html" }, { texto: "Mi Perfil", icono: "bi-person-circle", pagina: "administrador/perfil.html" }],
        1: [{ texto: "Dashboard", icono: "bi-speedometer", pagina: "super-admin/dashboard.html" }, { texto: "Gestión de Admins", icono: "bi-person-video3", pagina: "super-admin/gestion-administradores.html" }, { texto: "Gestión de Doctores", icono: "bi-file-earmark-medical-fill", pagina: "super-admin/gestion-doctor.html" }, { texto: "Gestión de Recepcionistas", icono: "bi-person-lines-fill", pagina: "super-admin/gestion-recepcionistas.html" }, { texto: "Supervisión de Citas", icono: "bi-calendar-week", pagina: "super-admin/supervision-citas.html" }, { texto: "Mi Perfil", icono: "bi-person-circle", pagina: "super-admin/perfil.html" }, { texto: "Configuración Clínica", icono: "bi-hospital", pagina: "super-admin/configuracion-clinica.html" }]
    };

    const nombresRoles = { 1: 'Super Administrador', 2: 'Administrador', 3: 'Doctor', 4: 'Recepcionista', 5: 'Paciente' };

    async function cargarDatosUsuario() {
        try {
            const response = await fetch('https://happylife-backend.onrender.com/perfil', { credentials: 'include' });
            if (!response.ok) {
                localStorage.clear();
                window.location.href = '../../index.html';
                return;
            }
            const usuario = await response.json();
            
            // --- CORRECCIÓN AQUÍ ---
            const nombreRol = nombresRoles[usuario.rol_id] || 'Usuario';
            
            if (nombreUsuarioEl) nombreUsuarioEl.textContent = `${usuario.nombres} ${usuario.apellidos}`;
            if (rolUsuarioEl) rolUsuarioEl.textContent = nombreRol;
            if (rolSidebarEl) rolSidebarEl.textContent = nombreRol;
            
            // --- Y CORRECCIÓN AQUÍ ---
            inicializarMenu(usuario.rol_id);

        } catch (error) {
            console.error("Error al cargar datos del usuario:", error);
            window.location.href = '../../index.html';
        }
    }

    function inicializarMenu(rolId) {
        const menuItems = menuConfig[rolId];
        if (!menuItems) return;

        menuContainer.innerHTML = '';
        menuItems.forEach(item => {
            const button = document.createElement('button');
            button.className = "flex items-center gap-2 px-3 py-2 text-start text-sm font-medium rounded-lg cursor-pointer hover:bg-gray-100 transition-colors";
            button.dataset.pagina = item.pagina;
            button.dataset.titulo = item.texto;
            button.innerHTML = `<i class="bi ${item.icono}"></i> <span>${item.texto}</span>`;
            menuContainer.appendChild(button);
        });

        const navButtons = menuContainer.querySelectorAll("button");
        const savedPage = localStorage.getItem('activePage') || navButtons[0]?.dataset.pagina;
        let activeButton = Array.from(navButtons).find(btn => btn.dataset.pagina === savedPage) || navButtons[0];

        if (activeButton) {
            activeButton.classList.add("bg-gray-900", "text-white");
            activeButton.classList.remove("hover:bg-gray-100");
            loadPage(activeButton.dataset.pagina);
            if (headerTitleEl) headerTitleEl.textContent = activeButton.dataset.titulo;
        }

        navButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                if (activeButton === btn) return;

                if (activeButton) {
                    activeButton.classList.remove("bg-gray-900", "text-white");
                    activeButton.classList.add("hover:bg-gray-100");
                }
                btn.classList.add("bg-gray-900", "text-white");
                btn.classList.remove("hover:bg-gray-100");
                activeButton = btn;
                loadPage(btn.dataset.pagina);
                if (headerTitleEl) headerTitleEl.textContent = btn.dataset.titulo;
                localStorage.setItem('activePage', btn.dataset.pagina);
                localStorage.setItem('activeTitle', btn.dataset.titulo);
                if (window.innerWidth < 768) {
                    toggleMenu(false);
                }
            });
        });
    }

    async function loadPage(rutaPagina) {
        if (!rutaPagina) return;

        const oldScript = document.getElementById('dynamic-page-script');
        if (oldScript) {
            oldScript.remove();
        }

        const pageUrl = `../pages/${rutaPagina}`;
        try {
            const response = await fetch(pageUrl);
            if (!response.ok) throw new Error(`Error ${response.status} al cargar ${pageUrl}`);

            main.innerHTML = await response.text();

            const scriptSrc = pageScripts[rutaPagina];
            if (scriptSrc) {
                const scriptResponse = await fetch(scriptSrc);
                if (scriptResponse.ok) {
                    const scriptText = await scriptResponse.text();
                    const newScript = document.createElement("script");
                    newScript.id = 'dynamic-page-script';
                    newScript.textContent = `(function() { ${scriptText} })();`;
                    document.body.appendChild(newScript);
                } else {
                    console.warn(`Advertencia: No se encontró el archivo de script en ${scriptSrc}`);
                }
            }
        } catch (err) {
            main.innerHTML = `<div class="p-8 text-center"><p class="text-red-600 font-semibold">No se pudo cargar el contenido 😢</p><p class="text-gray-500 mt-2">${err.message}</p></div>`;
            console.error(err);
        }
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await fetch('https://happylife-backend.onrender.com/logout', { method: 'POST', credentials: 'include' });
                localStorage.clear();
                window.location.href = '../../index.html';
            } catch (error) {
                console.error('Error al cerrar sesión:', error);
            }
        });
    }

    function toggleMenu(show) {
        if (show) {
            sidebar.classList.remove('-translate-x-full');
            sidebarOverlay.classList.remove('hidden');
        } else {
            sidebar.classList.add('-translate-x-full');
            sidebarOverlay.classList.add('hidden');
        }
    }

    menuBtn.addEventListener("click", () => toggleMenu(true));
    sidebarOverlay.addEventListener("click", () => toggleMenu(false));

    cargarDatosUsuario();
});