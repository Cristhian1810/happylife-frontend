// --- Elementos del DOM ---
const dashboardTitleEl = document.getElementById('dashboard-title');
const welcomeMessageEl = document.getElementById('welcome-message');
const statsContainerEl = document.getElementById('stats-cards-container');
const mainPanelEl = document.getElementById('main-panel');
const secondaryPanelEl = document.getElementById('secondary-panel');
const loaderEl = document.getElementById('loader');
const errorEl = document.getElementById('error-message');

const API_BASE_URL = 'https://happylife-backend.onrender.com';

// --- Funciones de Renderizado ---

// Crea una tarjeta de estadística
const createStatCard = ({ title, value, icon }) => `
    <div class="bg-white p-6 rounded-xl shadow-md border border-gray-200 flex items-center justify-between">
        <div>
            <p class="text-sm font-medium text-gray-500">${title}</p>
            <p class="text-3xl font-bold text-gray-800">${value}</p>
        </div>
        <div class="bg-indigo-100 text-indigo-600 rounded-full p-3">
            <i class="bi ${icon} text-2xl"></i>
        </div>
    </div>`;

// Crea una tabla HTML
const createTable = (title, headers, rows) => {
    if (!rows || rows.length === 0) {
        return `<h2 class="text-xl font-semibold text-gray-700 mb-4">${title}</h2><p class="text-gray-500">No hay datos disponibles.</p>`;
    }
    const headerHtml = headers.map(h => `<th class="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">${h}</th>`).join('');
    const bodyHtml = rows.map(row => `<tr>${row.map(cell => `<td class="border-t px-4 py-2 text-sm text-gray-700">${cell || 'N/A'}</td>`).join('')}</tr>`).join('');
    return `
        <h2 class="text-xl font-semibold text-gray-700 mb-4">${title}</h2>
        <div class="overflow-x-auto">
            <table class="min-w-full bg-white">
                <thead class="bg-gray-50"><tr>${headerHtml}</tr></thead>
                <tbody>${bodyHtml}</tbody>
            </table>
        </div>`;
};

// Crea un gráfico usando Chart.js
const createChart = (containerEl, canvasId, type, labels, data, chartTitle) => {
    containerEl.innerHTML = `
        <h2 class="text-xl font-semibold text-gray-700 mb-4">${chartTitle}</h2>
        <div class="relative h-64"><canvas id="${canvasId}"></canvas></div>
    `;
    const ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                label: chartTitle,
                data: data,
                backgroundColor: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#6B7280', '#3B82F6'],
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
};

// --- Lógica Principal ---
const loadDashboard = async () => {
    loaderEl.style.display = 'block';
    errorEl.style.display = 'none';

    try {
        // La llamada a la API ahora es directa y envía las credenciales (cookies de sesión)
        const response = await fetch(`${API_BASE_URL}/dashboard/stats`, { credentials: 'include' });
        
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || `Error ${response.status}`);
        }
        const data = await response.json();

        // Limpiar contenedores
        statsContainerEl.innerHTML = '';
        mainPanelEl.innerHTML = '';
        secondaryPanelEl.innerHTML = '';
        
        // Renderizar Título y Tarjetas
        dashboardTitleEl.textContent = `Dashboard: ${data.dashboardType}`;
        welcomeMessageEl.textContent = `Bienvenido de vuelta. Aquí tienes tu resumen de hoy.`;
        if (data.cards) {
            statsContainerEl.innerHTML = data.cards.map(createStatCard).join('');
        }

        // --- Renderizado Específico por Rol ---

        if (data.dashboardType === 'Super Administrador' || data.dashboardType === 'Administrador') {
            mainPanelEl.innerHTML = `<h2 class="text-xl font-semibold mb-4">Crecimiento de Usuarios (Últimos 7 días)</h2><div class="relative h-64"><canvas id="userGrowthChart"></canvas></div>`;
            const ctx = document.getElementById('userGrowthChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: { labels: data.charts.userGrowth.labels, datasets: [{ label: 'Nuevos Usuarios', data: data.charts.userGrowth.data, tension: 0.1, fill: true, backgroundColor: 'rgba(79, 70, 229, 0.1)', borderColor: '#4F46E5' }] }
            });
            createChart(secondaryPanelEl, 'appointmentsByStatusChart', 'doughnut', data.charts.appointmentsByStatus.labels, data.charts.appointmentsByStatus.data, 'Citas por Estado');
        
        } else if (data.dashboardType === 'Doctor') {
            mainPanelEl.innerHTML = createTable(data.tables.title, data.tables.headers, data.tables.rows);
            createChart(secondaryPanelEl, 'weeklyPerformanceChart', 'pie', data.charts.weeklyPerformance.labels, data.charts.weeklyPerformance.data, 'Actividad Semanal');
        
        } else if (data.dashboardType === 'Recepcionista') {
            mainPanelEl.innerHTML = createTable(data.tables.title, data.tables.headers, data.tables.rows);
            secondaryPanelEl.innerHTML = `<h2 class="text-xl font-semibold">Acciones Rápidas</h2><div class="mt-4 space-y-2"><button class="w-full p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Registrar Paciente</button><button class="w-full p-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Agendar Nueva Cita</button></div>`;
        
        } else if (data.dashboardType === 'Paciente') {
            if (data.activity) {
                mainPanelEl.innerHTML = `
                    <h2 class="text-xl font-semibold text-gray-700 mb-4">${data.activityTitle}</h2>
                    <div class="p-4 bg-indigo-50 rounded-lg space-y-1">
                        <p><strong>Doctor:</strong> ${data.activity.doctor}</p>
                        <p><strong>Especialidad:</strong> ${data.activity.especialidad || 'No especificada'}</p>
                        <p class="font-bold text-indigo-700 text-lg">${new Date(data.activity.fecha_hora_inicio).toLocaleString('es-ES', {dateStyle: 'full', timeStyle: 'short'})}</p>
                    </div>`;
            } else {
                 mainPanelEl.innerHTML = `<h2 class="text-xl font-semibold text-gray-700">No tienes citas próximas.</h2><p class="text-gray-500">Puedes agendar una nueva cita desde el menú.</p>`;
            }
            secondaryPanelEl.innerHTML = createTable(data.tables.title, data.tables.headers, data.tables.rows);
        }

    } catch (error) {
        errorEl.textContent = `Error al cargar el dashboard: ${error.message}`;
        errorEl.style.display = 'block';
        dashboardTitleEl.textContent = 'Error';
    } finally {
        loaderEl.style.display = 'none';
    }
};

// Iniciar la carga del dashboard
loadDashboard();