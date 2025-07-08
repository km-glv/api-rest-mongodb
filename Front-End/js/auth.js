/* ===============================================
   LÓGICA DE AUTENTICACIÓN
   =============================================== */

console.log('🔑 Módulo de autenticación cargado');

// Verificar si ya está logueado al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Página de login cargada, verificando autenticación...');
    
    if (isAuthenticated()) {
        console.log('✅ Usuario ya autenticado, redirigiendo al dashboard...');
        window.location.href = 'dashboard.html';
    }
    
    setupLoginForm();
});

/* ===============================================
   CONFIGURAR FORMULARIO DE LOGIN
   =============================================== */
function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    
    if (!loginForm) {
        console.error('❌ No se encontró el formulario de login');
        return;
    }
    
    loginForm.addEventListener('submit', handleLogin);
    console.log('📝 Formulario de login configurado');
}

/* ===============================================
   MANEJAR PROCESO DE LOGIN
   =============================================== */
async function handleLogin(event) {
    event.preventDefault(); // Evitar que se recargue la página
    
    console.log('🚀 Iniciando proceso de login...');
    
    // Obtener datos del formulario
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Validaciones básicas
    if (!email || !password) {
        showMessage('Por favor, completa todos los campos', 'error');
        return;
    }
    
    // Mostrar estado de cargando
    setLoadingState(true);
    
    try {
        // 🌐 COMUNICACIÓN CON TU BACKEND
        // Esto llama a: POST http://localhost:3000/api/auth/login
        console.log('🌐 Enviando credenciales al backend...');
        
        const loginData = {
            email: email,
            password: password
        };
        
        // Hacer petición a tu API de login
        const response = await apiPost('/auth/login', loginData);
        
        console.log('✅ Login exitoso:', response);
        
        // Guardar token
        localStorage.setItem('authToken', response.token);
        
        // Guardar datos del usuario (verificar que existan)
        if (response.usuario) {
            localStorage.setItem('user', JSON.stringify(response.usuario));
        } else {
            // Si no hay usuario en la respuesta, crear un objeto básico
            const basicUser = {
                email: email,
                nombre: email.split('@')[0] // Usar la parte antes del @ como nombre
            };
            localStorage.setItem('user', JSON.stringify(basicUser));
        }
        
        // Mostrar mensaje de éxito
        showMessage('¡Login exitoso! Redirigiendo...', 'success');
        
        // Redirigir al dashboard después de 1 segundo
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error en login:', error);
        showMessage(error.message || 'Error al iniciar sesión', 'error');
    } finally {
        setLoadingState(false);
    }
}

/* ===============================================
   FUNCIONES DE UTILIDAD
   =============================================== */

/**
 * Mostrar mensajes al usuario
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo: 'success', 'error', 'info'
 */
function showMessage(message, type = 'info') {
    const messageArea = document.getElementById('messageArea');
    
    if (!messageArea) {
        console.warn('⚠️ No se encontró el área de mensajes');
        alert(message);
        return;
    }
    
    // Limpiar mensajes anteriores
    messageArea.innerHTML = '';
    
    // Crear mensaje
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Mostrar mensaje
    messageArea.appendChild(messageDiv);
    
    // Auto-ocultar después de 5 segundos si es éxito
    if (type === 'success') {
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
    
    console.log(`💬 Mensaje mostrado: ${type} - ${message}`);
}

/**
 * Activar/desactivar estado de carga
 * @param {boolean} loading - Si está cargando
 */
function setLoadingState(loading) {
    const loginBtn = document.getElementById('loginBtn');
    const form = document.getElementById('loginForm');
    
    if (loading) {
        loginBtn.textContent = '⏳ Verificando...';
        loginBtn.disabled = true;
        form.classList.add('loading');
    } else {
        loginBtn.textContent = '🚀 Iniciar Sesión';
        loginBtn.disabled = false;
        form.classList.remove('loading');
    }
}

/* ===============================================
   FUNCIONES PARA DEBUGGING
   =============================================== */

// Función para probar la conexión con la API
async function testApiConnection() {
    try {
        console.log('🔍 Probando conexión con la API...');
        const response = await fetch(`${API_CONFIG.BASE_URL}/auth/test`);
        console.log('📡 Estado de la API:', response.status);
    } catch (error) {
        console.error('❌ Error de conexión:', error);
    }
}

// Ejecutar test al cargar (solo en modo desarrollo)
if (window.location.hostname === 'localhost') {
    testApiConnection();
}
