/* ===============================================
   LÓGICA DE GESTIÓN DE CLIENTES
   =============================================== */

// Variables globales
let clients = [];
let editingClientId = null;

// Verificar autenticación al cargar
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Página de clientes cargada');
    
    // Verificar si está autenticado
    if (!isAuthenticated()) {
        console.log('❌ No autenticado, redirigiendo al login');
        window.location.href = 'login.html';
        return;
    }
    
    // Configurar formulario
    document.getElementById('newClientForm').addEventListener('submit', handleClientSubmit);
    
    // Cargar clientes automáticamente
    loadClients();
});

/* ===============================================
   FUNCIONES DE INTERFAZ
   =============================================== */

// Alternar formulario de cliente
function toggleClientForm() {
    const form = document.getElementById('clientForm');
    const isActive = form.classList.contains('active');
    
    if (isActive) {
        form.classList.remove('active');
        clearForm();
    } else {
        form.classList.add('active');
        document.getElementById('clientName').focus();
    }
}

// Limpiar formulario
function clearForm() {
    document.getElementById('newClientForm').reset();
    editingClientId = null;
    document.querySelector('#clientForm h3').textContent = '📝 Nuevo Cliente';
    document.querySelector('#clientForm button[type="submit"]').textContent = 'Guardar Cliente';
}

// Mostrar mensajes
function showMessage(message, type) {
    // Crear elemento de mensaje
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Insertarlo al inicio del container
    const container = document.querySelector('.container');
    container.insertBefore(messageDiv, container.firstChild);
    
    // Eliminarlo después de 5 segundos
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

/* ===============================================
   FUNCIONES DE DATOS
   =============================================== */

// Cargar clientes
async function loadClients() {
    try {
        console.log('🔄 Cargando clientes...');
        const response = await apiGet('/clientes');
        clients = response || [];
        
        renderClients();
        console.log(`✅ ${clients.length} clientes cargados`);
        
    } catch (error) {
        console.error('❌ Error cargando clientes:', error);
        showMessage('Error al cargar los clientes: ' + error.message, 'error');
    }
}

// Renderizar clientes
function renderClients() {
    const container = document.getElementById('clientsList');
    
    if (clients.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <p>No hay clientes registrados</p>
                <button class="btn btn-primary" onclick="toggleClientForm()">Crear Primer Cliente</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = clients.map(client => `
        <div class="client-item">
            <div class="client-header">
                <div>
                    <div class="client-name">${client.nombre || 'Sin nombre'} ${client.apellido || 'Sin apellido'}</div>
                    <div class="client-email">${client.correo || 'Sin correo'}</div>
                </div>
                <div class="client-actions">
                    <button class="btn-small btn-edit" onclick="editClient('${client._id}')">✏️ Editar</button>
                    <button class="btn-small btn-delete" onclick="deleteClient('${client._id}')">🗑️ Eliminar</button>
                </div>
            </div>
            <div><strong>RUT:</strong> ${client.rut || 'Sin RUT'}</div>
            ${client.fechaNace ? `<div><strong>Fecha de Nacimiento:</strong> ${new Date(client.fechaNace).toLocaleDateString()}</div>` : ''}
            <div><strong>Fecha de Registro:</strong> ${new Date(client.fechaRegistro).toLocaleDateString()}</div>
        </div>
    `).join('');
}

/* ===============================================
   CRUD DE CLIENTES
   =============================================== */

// Manejar envío del formulario
async function handleClientSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const clientData = {
        rut: formData.get('rut'),
        nombre: formData.get('nombre'),
        apellido: formData.get('apellido'),
        correo: formData.get('correo'),
        fechaNace: formData.get('fechaNace') || null
    };
    
    console.log('📝 Datos del cliente a enviar:', clientData);
    console.log('📝 Modo edición:', editingClientId ? 'SÍ' : 'NO');
    
    try {
        if (editingClientId) {
            console.log('✏️ Actualizando cliente con ID:', editingClientId);
            await updateClient(editingClientId, clientData);
        } else {
            console.log('➕ Creando nuevo cliente');
            await createClient(clientData);
        }
        
        toggleClientForm();
        await loadClients(); // Recargar clientes para verificar actualización
        
    } catch (error) {
        console.error('❌ Error completo:', error);
        console.error('❌ Mensaje de error:', error.message);
        
        // Verificar si el cliente se actualizó a pesar del error
        if (editingClientId) {
            console.log('🔍 Verificando si el cliente se actualizó a pesar del error...');
            try {
                await loadClients();
                const updatedClient = clients.find(c => c._id === editingClientId);
                if (updatedClient && 
                    updatedClient.nombre === clientData.nombre &&
                    updatedClient.apellido === clientData.apellido &&
                    updatedClient.correo === clientData.correo) {
                    console.log('✅ Cliente actualizado exitosamente a pesar del error del servidor');
                    showMessage('Cliente actualizado exitosamente', 'success');
                    toggleClientForm();
                    return;
                }
            } catch (loadError) {
                console.error('❌ Error al verificar actualización:', loadError);
            }
        }
        
        showMessage('Error al guardar el cliente: ' + error.message, 'error');
    }
}

// Crear cliente
async function createClient(clientData) {
    console.log('📝 Creando cliente:', clientData);
    const response = await apiPost('/clientes', clientData);
    showMessage('Cliente creado exitosamente', 'success');
    return response;
}

// Editar cliente
function editClient(clientId) {
    const client = clients.find(c => c._id === clientId);
    if (!client) return;
    
    // Llenar formulario
    document.getElementById('clientRut').value = client.rut;
    document.getElementById('clientName').value = client.nombre;
    document.getElementById('clientLastName').value = client.apellido;
    document.getElementById('clientEmail').value = client.correo;
    document.getElementById('clientBirthDate').value = client.fechaNace ? 
        new Date(client.fechaNace).toISOString().split('T')[0] : '';
    
    // Cambiar estado
    editingClientId = clientId;
    document.querySelector('#clientForm h3').textContent = '✏️ Editar Cliente';
    document.querySelector('#clientForm button[type="submit"]').textContent = 'Actualizar Cliente';
    
    // Mostrar formulario
    document.getElementById('clientForm').classList.add('active');
}

// Actualizar cliente
async function updateClient(clientId, clientData) {
    console.log('✏️ Actualizando cliente:', clientId, clientData);
    const response = await apiPut('/clientes/' + clientId, clientData);
    // No mostrar mensaje aquí, se manejará en handleClientSubmit
    return response;
}

// Eliminar cliente
async function deleteClient(clientId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
        return;
    }
    
    try {
        console.log('🗑️ Eliminando cliente:', clientId);
        await apiDelete('/clientes/' + clientId);
        showMessage('Cliente eliminado exitosamente', 'success');
        loadClients();
        
    } catch (error) {
        console.error('❌ Error eliminando cliente:', error);
        showMessage('Error al eliminar el cliente: ' + error.message, 'error');
    }
}

/* ===============================================
   FUNCIONES AUXILIARES
   =============================================== */

// Función logout (heredada)
function logout() {
    console.log('🚪 Cerrando sesión...');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}
