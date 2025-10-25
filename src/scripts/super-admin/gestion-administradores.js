const tableBody = document.getElementById('admins-table-body');
const table = document.getElementById('admins-table');
const loader = document.getElementById('loader');
const errorMessage = document.getElementById('error-message');
const totalAdminsEl = document.getElementById('total-admins');
const totalActivosEl = document.getElementById('total-activos');
const totalInactivosEl = document.getElementById('total-inactivos');
const searchInput = document.getElementById('search-input');
const openModalBtn = document.getElementById('open-add-modal-btn');
const apiUrl = 'https://happylife-backend.onrender.com/administradores';

let allAdminsData = [];
let adminIdToDelete = null;

function createAddModal() {
    const modalHTML = `
        <div id="add-modal" class="hidden fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div class="bg-white rounded-lg shadow-2xl p-6 sm:p-8 w-full max-w-lg transform transition-all" id="modal-content">
                <h2 id="modal-title" class="text-2xl font-bold text-gray-900 mb-6">Añadir Nuevo Administrador</h2>
                <div id="modal-error" class="hidden bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm"></div>
                <form id="admin-form" novalidate>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                        <input class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500" id="nombres" name="nombres" type="text" placeholder="Nombres" required>
                        <input class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" id="apellidos" name="apellidos" type="text" placeholder="Apellidos" required>
                        <input class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" id="dni" name="dni" type="text" placeholder="DNI" required>
                        <input class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" id="telefono" name="telefono" type="tel" placeholder="Teléfono">
                        <input class="sm:col-span-2 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" id="email" name="email" type="email" placeholder="Correo Electrónico" required>
                        <div class="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4" id="password-fields">
                            <input class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" id="password" name="password" type="password" placeholder="Contraseña" required>
                            <input class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" id="confirmPassword" name="confirmPassword" type="password" placeholder="Repetir Contraseña" required>
                        </div>
                    </div>
                    <div class="flex items-center justify-end space-x-4 mt-8">
                        <button id="close-modal-btn" type="button" class="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors">Cancelar</button>
                        <button id="submit-btn" type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:bg-indigo-400">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function createDeleteModal() {
    const modalHTML = `
        <div id="confirm-delete-modal" class="hidden fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div class="bg-white rounded-lg shadow-2xl p-6 sm:p-8 w-full max-w-sm transform transition-all">
                <div class="text-center">
                    <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                        <svg class="h-6 w-6 text-red-600" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    </div>
                    <h3 class="text-lg leading-6 font-medium text-gray-900 mt-5">Desactivar Administrador</h3>
                    <div class="mt-2 px-7 py-3"><p class="text-sm text-gray-500">¿Estás seguro? La cuenta será desactivada y el usuario no podrá acceder al sistema.</p></div>
                </div>
                <div class="flex justify-center space-x-4 mt-6">
                    <button id="cancel-delete-btn" class="py-2 px-4 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-semibold">Cancelar</button>
                    <button id="confirm-delete-btn" class="py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold">Sí, desactivar</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function createEditModal() {
    const modalHTML = `
        <div id="edit-modal" class="hidden fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div class="bg-white rounded-lg shadow-2xl p-6 sm:p-8 w-full max-w-lg transform transition-all">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">Editar Administrador</h2>
                <div id="edit-modal-error" class="hidden bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm"></div>
                <form id="edit-admin-form" novalidate>
                    <input type="hidden" id="edit-admin-id" name="id">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                        <input class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" id="edit-nombres" name="nombres" type="text" placeholder="Nombres" required>
                        <input class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" id="edit-apellidos" name="apellidos" type="text" placeholder="Apellidos" required>
                        <input class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" id="edit-dni" name="dni" type="text" placeholder="DNI" required>
                        <input class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" id="edit-telefono" name="telefono" type="tel" placeholder="Teléfono">
                        <input class="sm:col-span-2 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" id="edit-email" name="email" type="email" placeholder="Correo Electrónico" required>
                        </div>
                    <div class="flex items-center justify-end space-x-4 mt-8">
                        <button id="close-edit-modal-btn" type="button" class="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors">Cancelar</button>
                        <button id="submit-edit-btn" type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:bg-indigo-400">Actualizar</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

createAddModal();
createDeleteModal();
createEditModal();

const modal = document.getElementById('add-modal');
const modalError = document.getElementById('modal-error');
const adminForm = document.getElementById('admin-form');
const closeModalBtn = document.getElementById('close-modal-btn');
const submitBtn = document.getElementById('submit-btn');

const deleteModal = document.getElementById('confirm-delete-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

const editModal = document.getElementById('edit-modal');
const editModalError = document.getElementById('edit-modal-error');
const editAdminForm = document.getElementById('edit-admin-form');
const closeEditModalBtn = document.getElementById('close-edit-modal-btn');
const submitEditBtn = document.getElementById('submit-edit-btn');

const renderTable = (admins) => {
    tableBody.innerHTML = '';
    if (!admins || admins.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-10 text-gray-500">No se encontraron administradores.</td></tr>`;
        return;
    }
    admins.forEach(admin => {
        const formattedDate = new Date(admin.fecha_creacion).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${admin.nombres}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${admin.apellidos}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${admin.dni}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${admin.email}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${admin.telefono || 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${admin.esta_activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${admin.esta_activo ? 'Activo' : 'Inactivo'}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formattedDate}</td>
            <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                <div class="flex items-center justify-center space-x-2">
                    <button class="edit-btn p-2 rounded-full text-blue-100 bg-blue-600 hover:bg-blue-700 transition-colors duration-200" title="Editar" data-id="${admin.id}"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z"></path></svg></button>
                    <button class="delete-btn p-2 rounded-full text-red-100 bg-red-600 hover:bg-red-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed" title="Desactivar" data-id="${admin.id}" ${!admin.esta_activo ? 'disabled' : ''}>
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
            </td>`;
        tableBody.appendChild(row);
    });
};

const fetchAndRenderAdmins = async () => {
    try {
        loader.classList.remove('hidden');
        table.classList.add('hidden');
        errorMessage.classList.add('hidden');
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`Error al conectar con el servidor: ${response.status}`);

        allAdminsData = await response.json();
        renderTable(allAdminsData);

        const activos = allAdminsData.filter(admin => admin.esta_activo).length;
        totalAdminsEl.textContent = allAdminsData.length;
        totalActivosEl.textContent = activos;
        totalInactivosEl.textContent = allAdminsData.length - activos;

    } catch (error) {
        console.error('Error al obtener los datos:', error);
        errorMessage.textContent = `No se pudieron cargar los datos. ${error.message}`;
        errorMessage.classList.remove('hidden');
    } finally {
        loader.classList.add('hidden');
        table.classList.remove('hidden');
    }
};

const openAddModal = () => {
    adminForm.reset();
    modalError.classList.add('hidden');
    modal.classList.remove('hidden');
};
const closeAddModal = () => {
    modal.classList.add('hidden');
};
const handleAddFormSubmit = async (event) => {
    event.preventDefault();

    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    if (!password || password !== confirmPassword) {
        modalError.textContent = 'Las contraseñas no coinciden o están vacías.';
        modalError.classList.remove('hidden');
        return;
    }

    const formData = new FormData(adminForm);
    const adminData = Object.fromEntries(formData.entries());

    submitBtn.disabled = true;
    submitBtn.textContent = 'Guardando...';
    modalError.classList.add('hidden');

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(adminData)
        });
        if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.message || 'Ocurrió un error al guardar.');
        }
        closeAddModal();
        await fetchAndRenderAdmins();
    } catch (error) {
        modalError.textContent = error.message;
        modalError.classList.remove('hidden');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Guardar';
    }
};

const openDeleteModal = (id) => {
    adminIdToDelete = id;
    deleteModal.classList.remove('hidden');
};
const closeDeleteModal = () => {
    adminIdToDelete = null;
    deleteModal.classList.add('hidden');
};
const handleDeleteConfirm = async () => {
    if (!adminIdToDelete) return;
    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.textContent = 'Desactivando...';
    try {
        const response = await fetch(`${apiUrl}/${adminIdToDelete}`, { method: 'DELETE' });
        if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.message || 'No se pudo desactivar el administrador.');
        }
        closeDeleteModal();
        await fetchAndRenderAdmins();
    } catch (error) {
        console.error('Error al desactivar:', error);
        alert(`Error: ${error.message}`);
    } finally {
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.textContent = 'Sí, desactivar';
    }
};

const openEditModal = (id) => {
    const adminData = allAdminsData.find(admin => admin.id == id);
    if (!adminData) {
        console.error("No se encontró el administrador con id:", id);
        return;
    }

    document.getElementById('edit-admin-id').value = adminData.id;
    document.getElementById('edit-nombres').value = adminData.nombres;
    document.getElementById('edit-apellidos').value = adminData.apellidos;
    document.getElementById('edit-dni').value = adminData.dni;
    document.getElementById('edit-telefono').value = adminData.telefono || '';
    document.getElementById('edit-email').value = adminData.email;

    editModalError.classList.add('hidden');
    editModal.classList.remove('hidden');
};

const closeEditModal = () => {
    editModal.classList.add('hidden');
};

const handleEditFormSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData(editAdminForm);
    const updatedData = Object.fromEntries(formData.entries());
    const adminId = updatedData.id;

    submitEditBtn.disabled = true;
    submitEditBtn.textContent = 'Actualizando...';
    editModalError.classList.add('hidden');

    try {
        const response = await fetch(`${apiUrl}/${adminId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.message || 'Ocurrió un error al actualizar.');
        }

        closeEditModal();
        await fetchAndRenderAdmins();
    } catch (error) {
        editModalError.textContent = error.message;
        editModalError.classList.remove('hidden');
    } finally {
        submitEditBtn.disabled = false;
        submitEditBtn.textContent = 'Actualizar';
    }
};

openModalBtn.addEventListener('click', openAddModal);
closeModalBtn.addEventListener('click', closeAddModal);
adminForm.addEventListener('submit', handleAddFormSubmit);
modal.addEventListener('click', (e) => { if (e.target === modal) closeAddModal(); });

cancelDeleteBtn.addEventListener('click', closeDeleteModal);
confirmDeleteBtn.addEventListener('click', handleDeleteConfirm);
deleteModal.addEventListener('click', (e) => { if (e.target === deleteModal) closeDeleteModal(); });

editAdminForm.addEventListener('submit', handleEditFormSubmit);
closeEditModalBtn.addEventListener('click', closeEditModal);
editModal.addEventListener('click', (e) => { if (e.target === editModal) closeEditModal(); });

searchInput.addEventListener('input', (event) => {
    const searchTerm = event.target.value.toLowerCase().trim();
    const filteredAdmins = allAdminsData.filter(admin => {
        const fullName = `${admin.nombres} ${admin.apellidos}`.toLowerCase();
        return fullName.includes(searchTerm) ||
            admin.dni.toLowerCase().includes(searchTerm) ||
            admin.email.toLowerCase().includes(searchTerm) ||
            (admin.telefono && admin.telefono.toLowerCase().includes(searchTerm));
    });
    renderTable(filteredAdmins);
});

tableBody.addEventListener('click', (event) => {
    const editButton = event.target.closest('.edit-btn');
    const deleteButton = event.target.closest('.delete-btn');

    if (editButton) {
        const id = editButton.dataset.id;
        openEditModal(id);
        return;
    }

    if (deleteButton) {
        const id = deleteButton.dataset.id;
        openDeleteModal(id);
        return;
    }
});

fetchAndRenderAdmins();