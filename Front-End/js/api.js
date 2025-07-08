/* ===============================================
        // Si el token expiró, redirigir al login
        if (response.status === 401) {
            console.log('🔒 Token expirado, redirigiendo al login...');
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
            return;
        }GURACIÓN DE LA API
   =============================================== */

// URL base de tu API backend
const API_CONFIG = {
    BASE_URL: 'http://localhost:7000/api',
    ENDPOINTS: {
        AUTH: '/auth',
        CLIENTES: '/clientes', 
        PRODUCTOS: '/productos',
        PEDIDOS: '/pedidos'
    }
};

/* ===============================================
   CLIENTE HTTP CON AUTENTICACIÓN
   =============================================== */

/**
 * Función para hacer peticiones HTTP con autenticación automática
 * @param {string} url - URL de la API
 * @param {object} options - Opciones de fetch (method, body, etc.)
 * @returns {Promise<Response>} - Respuesta de la API
 */
async function apiRequest(url, options = {}) {
    // Obtener token del localStorage
    const token = localStorage.getItem('authToken');
    
    // Configurar headers por defecto
    const defaultHeaders = {
        'Content-Type': 'application/json'
    };
    
    // Agregar token si existe
    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    // Combinar opciones
    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        }
    };
    
    try {
        console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
        const response = await fetch(url, config);
        
        // Si el token expiró o es inválido, redirigir al login
        if (response.status === 401) {
            console.log('🔒 Token expirado, redirigiendo al login...');
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            window.location.href = 'index.html';
            return;
        }
        
        return response;
    } catch (error) {
        console.error('❌ Error en petición API:', error);
        throw error;
    }
}

/* ===============================================
   MÉTODOS HTTP SIMPLIFICADOS
   =============================================== */

/**
 * Realizar petición GET
 * @param {string} endpoint - Endpoint de la API (ej: '/clientes')
 * @returns {Promise<any>} - Datos de respuesta
 */
async function apiGet(endpoint) {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    const response = await apiRequest(url, { method: 'GET' });
    
    if (response && response.ok) {
        return await response.json();
    } else if (response) {
        const error = await response.json();
        throw new Error(error.message || 'Error en petición GET');
    }
}

/**
 * Realizar petición POST
 * @param {string} endpoint - Endpoint de la API
 * @param {object} data - Datos a enviar
 * @returns {Promise<any>} - Datos de respuesta
 */
async function apiPost(endpoint, data) {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    const response = await apiRequest(url, {
        method: 'POST',
        body: JSON.stringify(data)
    });
    
    if (response && response.ok) {
        return await response.json();
    } else if (response) {
        const error = await response.json();
        throw new Error(error.message || 'Error en petición POST');
    }
}

/**
 * Realizar petición PUT
 * @param {string} endpoint - Endpoint de la API
 * @param {object} data - Datos a actualizar
 * @returns {Promise<any>} - Datos de respuesta
 */
async function apiPut(endpoint, data) {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    const response = await apiRequest(url, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
    
    if (response && response.ok) {
        return await response.json();
    } else if (response) {
        const error = await response.json();
        throw new Error(error.message || 'Error en petición PUT');
    }
}

/**
 * Realizar petición DELETE
 * @param {string} endpoint - Endpoint de la API
 * @returns {Promise<any>} - Datos de respuesta
 */
async function apiDelete(endpoint) {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    const response = await apiRequest(url, { method: 'DELETE' });
    
    if (response && response.ok) {
        return await response.json();
    } else if (response) {
        const error = await response.json();
        throw new Error(error.message || 'Error en petición DELETE');
    }
}

/* ===============================================
   UTILIDADES DE AUTENTICACIÓN
   =============================================== */

/**
 * Verificar si el usuario está autenticado
 * @returns {boolean} - true si está autenticado
 */
function isAuthenticated() {
    const token = localStorage.getItem('authToken');
    return token !== null && token !== undefined;
}

/**
 * Obtener información del usuario logueado
 * @returns {object|null} - Datos del usuario o null
 */
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (userStr && userStr !== 'undefined') {
        try {
            return JSON.parse(userStr);
        } catch (error) {
            console.warn('⚠️ Error parsing user data:', error);
            return null;
        }
    }
    return null;
}

/**
 * Cerrar sesión del usuario
 */
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    console.log('🚪 Sesión cerrada correctamente');
    window.location.href = 'login.html';
}

console.log('🔧 API Client configurado correctamente');
