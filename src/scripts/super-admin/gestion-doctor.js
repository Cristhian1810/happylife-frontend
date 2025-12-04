import { checkAuth, logout } from '../index.js';

// Auth
checkAuth();
document.getElementById('logoutBtn').addEventListener('click', logout);

// DOM Elements
const doctorsTableBody = document.getElementById('doctorsTableBody');
const searchInput = document.getElementById('searchInput');
const doctorModal = document.getElementById('doctorModal');
const doctorForm = document.getElementById('doctorForm');
const modalTitle = document.getElementById('modalTitle');
const passwordField = document.getElementById('passwordField');
const estadoField = document.getElementById('estadoField');
const tituloSelect = document.getElementById('titulo_profesional');
const especialidadesSelect = document.getElementById('especialidades');

// URL DE PRODUCCIÓN
const API_BASE_URL = 'https://happylife-backend.onrender.com/api';

let doctores = [];

document.addEventListener('DOMContentLoaded', async () => {
  const userData = JSON.parse(localStorage.getItem('userData'));
  if (userData) {
    document.getElementById(
      'adminNameDisplay'
    ).textContent = `${userData.nombres} ${userData.apellidos}`;
  }
  await Promise.all([loadDoctores(), loadCatalogos()]);
});

async function loadCatalogos() {
  try {
    const response = await fetch(`${API_BASE_URL}/catalogos`);
    const data = await response.json();

    tituloSelect.innerHTML = '<option value="">Seleccione...</option>';
    data.titulos.forEach((t) => {
      const option = document.createElement('option');
      option.value = t.id;
      option.textContent = t.nombre;
      tituloSelect.appendChild(option);
    });

    especialidadesSelect.innerHTML = '<option value="">Seleccione...</option>';
    data.especialidades.forEach((e) => {
      const option = document.createElement('option');
      option.value = e.id;
      option.textContent = e.nombre;
      especialidadesSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error al cargar catálogos:', error);
    Swal.fire('Error', 'No se pudieron cargar los datos auxiliares', 'error');
  }
}

async function loadDoctores() {
  try {
    const response = await fetch(`${API_BASE_URL}/doctores`);
    if (!response.ok) throw new Error('Error al cargar doctores');
    doctores = await response.json();
    renderDoctores(doctores);
    updateStats();
  } catch (error) {
    console.error('Error:', error);
    Swal.fire('Error', 'Error al cargar la lista de doctores', 'error');
  }
}

function updateStats() {
  document.getElementById('total-doctores').textContent = doctores.length;
  document.getElementById('total-activos').textContent = doctores.filter(
    (d) => d.esta_activo
  ).length;
  document.getElementById('total-inactivos').textContent = doctores.filter(
    (d) => !d.esta_activo
  ).length;
}

function renderDoctores(list) {
  doctorsTableBody.innerHTML = '';
  if (list.length === 0) {
    doctorsTableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">No se encontraron doctores</td></tr>`;
    return;
  }

  list.forEach((doc) => {
    const tr = document.createElement('tr');
    const statusClass = doc.esta_activo
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
    const statusText = doc.esta_activo ? 'Activo' : 'Inactivo';
    const especialidad = doc.especialidad || 'Sin asignar';

    tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                        <div class="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                            ${doc.nombres.charAt(0)}${doc.apellidos.charAt(0)}
                        </div>
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${
                          doc.nombres
                        } ${doc.apellidos}</div>
                        <div class="text-sm text-gray-500">${doc.dni}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 font-medium">${especialidad}</div>
                <div class="text-xs text-gray-500">${
                  doc.titulo_profesional || ''
                }</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${doc.numero_colegiatura}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div>${doc.email}</div>
                <div>${doc.telefono || '-'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                    ${statusText}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="editDoctor('${
                  doc.id
                }')" class="text-indigo-600 hover:text-indigo-900 mr-3 font-semibold">Editar</button>
                <button onclick="deleteDoctor('${
                  doc.id
                }')" class="text-red-600 hover:text-red-900 font-semibold">Estado</button>
            </td>
        `;
    doctorsTableBody.appendChild(tr);
  });
}

searchInput.addEventListener('input', (e) => {
  const term = e.target.value.toLowerCase();
  const filtered = doctores.filter(
    (doc) =>
      doc.nombres.toLowerCase().includes(term) ||
      doc.apellidos.toLowerCase().includes(term) ||
      doc.dni.includes(term) ||
      (doc.especialidad && doc.especialidad.toLowerCase().includes(term))
  );
  renderDoctores(filtered);
});

window.openModal = () => {
  doctorModal.classList.remove('hidden');
  resetForm();
};

window.closeModal = () => {
  doctorModal.classList.add('hidden');
  resetForm();
};

function resetForm() {
  doctorForm.reset();
  document.getElementById('doctorId').value = '';
  modalTitle.textContent = 'Nuevo Doctor';
  passwordField.style.display = 'block';
  document.getElementById('password').required = true;
  estadoField.style.display = 'none';
  tituloSelect.value = '';
  especialidadesSelect.value = '';
}

window.editDoctor = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/doctores/${id}`);
    if (!response.ok) throw new Error('Error obteniendo datos');
    const doc = await response.json();

    document.getElementById('doctorId').value = doc.id;
    document.getElementById('nombres').value = doc.nombres;
    document.getElementById('apellidos').value = doc.apellidos;
    document.getElementById('dni').value = doc.dni;
    document.getElementById('email').value = doc.email;
    document.getElementById('telefono').value = doc.telefono || '';
    document.getElementById('numero_colegiatura').value =
      doc.numero_colegiatura;
    document.getElementById('biografia').value = doc.biografia || '';
    document.getElementById('esta_activo').checked = doc.esta_activo;

    tituloSelect.value = doc.titulo_profesional_id;

    if (doc.especialidad_id) {
      especialidadesSelect.value = doc.especialidad_id;
    }

    modalTitle.textContent = 'Editar Doctor';
    passwordField.style.display = 'none';
    document.getElementById('password').required = false;
    estadoField.style.display = 'flex';

    doctorModal.classList.remove('hidden');
  } catch (error) {
    console.error(error);
    Swal.fire('Error', 'No se pudo cargar la información del doctor', 'error');
  }
};

window.deleteDoctor = async (id) => {
  const result = await Swal.fire({
    title: '¿Cambiar estado?',
    text: 'Esta acción activará o desactivará al doctor.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Sí, cambiar',
    cancelButtonText: 'Cancelar',
  });

  if (result.isConfirmed) {
    try {
      const response = await fetch(`${API_BASE_URL}/doctores/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        Swal.fire(
          'Actualizado',
          'El estado del doctor ha sido actualizado.',
          'success'
        );
        loadDoctores();
      } else {
        throw new Error('Error al cambiar estado');
      }
    } catch (error) {
      Swal.fire('Error', 'No se pudo actualizar el doctor', 'error');
    }
  }
};

doctorForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(doctorForm);
  const id = document.getElementById('doctorId').value;

  const data = {
    nombres: formData.get('nombres'),
    apellidos: formData.get('apellidos'),
    dni: formData.get('dni'),
    email: formData.get('email'),
    telefono: formData.get('telefono'),
    numero_colegiatura: formData.get('numero_colegiatura'),
    biografia: formData.get('biografia'),
    titulo_profesional_id: formData.get('titulo_profesional_id'),
    especialidad_id: formData.get('especialidad_id'),
    esta_activo: document.getElementById('esta_activo').checked,
  };

  if (!id) {
    data.password = formData.get('password');
  }

  try {
    const url = id
      ? `${API_BASE_URL}/doctores/${id}`
      : `${API_BASE_URL}/doctores`;
    const method = id ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok) {
      Swal.fire('Éxito', result.message, 'success');
      closeModal();
      loadDoctores();
    } else {
      Swal.fire('Error', result.message || 'Error al guardar', 'error');
    }
  } catch (error) {
    console.error(error);
    Swal.fire('Error', 'Error de conexión', 'error');
  }
});
