/* ===============================================
   LÓGICA DE GESTIÓN DE PRODUCTOS
   =============================================== */

// Variables globales
let products = [];
let editingProductId = null;

// Verificar autenticación al cargar
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Página de productos cargada');
    
    // Verificar si está autenticado
    if (!isAuthenticated()) {
        console.log('❌ No autenticado, redirigiendo al login');
        window.location.href = 'login.html';
        return;
    }
    
    // Configurar formulario
    document.getElementById('newProductForm').addEventListener('submit', handleProductSubmit);
    
    // Cargar productos automáticamente
    loadProducts();
});

/* ===============================================
   FUNCIONES DE INTERFAZ
   =============================================== */

// Alternar formulario de producto
function toggleProductForm() {
    const form = document.getElementById('productForm');
    const isActive = form.classList.contains('active');
    
    if (isActive) {
        form.classList.remove('active');
        clearForm();
    } else {
        form.classList.add('active');
        document.getElementById('productName').focus();
    }
}

// Limpiar formulario
function clearForm() {
    document.getElementById('newProductForm').reset();
    editingProductId = null;
    document.querySelector('#productForm h3').textContent = '📝 Nuevo Producto';
    document.querySelector('#productForm button[type="submit"]').textContent = 'Guardar Producto';
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

// Cargar productos
async function loadProducts() {
    try {
        console.log('🔄 Cargando productos...');
        const response = await apiGet('/productos');
        products = response || [];
        
        renderProducts();
        console.log(`✅ ${products.length} productos cargados`);
        
    } catch (error) {
        console.error('❌ Error cargando productos:', error);
        showMessage('Error al cargar los productos: ' + error.message, 'error');
    }
}

// Renderizar productos
function renderProducts() {
    const container = document.getElementById('productsList');
    
    if (products.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📦</div>
                <p>No hay productos registrados</p>
                <button class="btn btn-primary" onclick="toggleProductForm()">Crear Primer Producto</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = products.map(product => {
        const stockStatus = getStockStatus(product.stock);
        const stockBadge = getStockBadge(product.stock);
        
        return `
            <div class="product-item">
                <div class="product-header">
                    <div>
                        <div class="product-name">${product.nombre || 'Sin nombre'}</div>
                        <div class="product-price">$${formatPrice(product.precio)}</div>
                        <div class="product-stock ${stockStatus}">
                            Stock: ${product.stock} ${stockBadge}
                        </div>
                    </div>
                    <div class="product-actions">
                        <button class="btn-small btn-edit" onclick="editProduct('${product._id}')">✏️ Editar</button>
                        <button class="btn-small btn-delete" onclick="deleteProduct('${product._id}')">🗑️ Eliminar</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Obtener estado del stock
function getStockStatus(stock) {
    if (stock === 0) return 'out-of-stock';
    if (stock <= 5) return 'low-stock';
    return '';
}

// Obtener badge del stock
function getStockBadge(stock) {
    if (stock === 0) return '<span class="stock-badge out">Sin Stock</span>';
    if (stock <= 5) return '<span class="stock-badge low">Stock Bajo</span>';
    if (stock <= 20) return '<span class="stock-badge medium">Stock Medio</span>';
    return '<span class="stock-badge high">Stock Alto</span>';
}

// Formatear precio
function formatPrice(price) {
    return new Intl.NumberFormat('es-CL', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(price);
}

/* ===============================================
   CRUD DE PRODUCTOS
   =============================================== */

// Manejar envío del formulario
async function handleProductSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const productData = {
        nombre: formData.get('nombre'),
        precio: parseFloat(formData.get('precio')),
        stock: parseInt(formData.get('stock'))
    };
    
    console.log('📝 Datos del producto a enviar:', productData);
    console.log('📝 Modo edición:', editingProductId ? 'SÍ' : 'NO');
    
    try {
        if (editingProductId) {
            console.log('✏️ Actualizando producto con ID:', editingProductId);
            await updateProduct(editingProductId, productData);
        } else {
            console.log('➕ Creando nuevo producto');
            await createProduct(productData);
        }
        
        toggleProductForm();
        await loadProducts(); // Recargar productos para verificar actualización
        
    } catch (error) {
        console.error('❌ Error completo:', error);
        console.error('❌ Mensaje de error:', error.message);
        
        // Verificar si el producto se actualizó a pesar del error
        if (editingProductId) {
            console.log('🔍 Verificando si el producto se actualizó a pesar del error...');
            try {
                await loadProducts();
                const updatedProduct = products.find(p => p._id === editingProductId);
                if (updatedProduct && 
                    updatedProduct.nombre === productData.nombre &&
                    updatedProduct.precio === productData.precio &&
                    updatedProduct.stock === productData.stock) {
                    console.log('✅ Producto actualizado exitosamente a pesar del error del servidor');
                    showMessage('Producto actualizado exitosamente', 'success');
                    toggleProductForm();
                    return;
                }
            } catch (loadError) {
                console.error('❌ Error al verificar actualización:', loadError);
            }
        }
        
        showMessage('Error al guardar el producto: ' + error.message, 'error');
    }
}

// Crear producto
async function createProduct(productData) {
    console.log('📝 Creando producto:', productData);
    const response = await apiPost('/productos', productData);
    showMessage('Producto creado exitosamente', 'success');
    return response;
}

// Editar producto
function editProduct(productId) {
    const product = products.find(p => p._id === productId);
    if (!product) return;
    
    // Llenar formulario
    document.getElementById('productName').value = product.nombre;
    document.getElementById('productPrice').value = product.precio;
    document.getElementById('productStock').value = product.stock;
    
    // Cambiar estado
    editingProductId = productId;
    document.querySelector('#productForm h3').textContent = '✏️ Editar Producto';
    document.querySelector('#productForm button[type="submit"]').textContent = 'Actualizar Producto';
    
    // Mostrar formulario
    document.getElementById('productForm').classList.add('active');
}

// Actualizar producto
async function updateProduct(productId, productData) {
    console.log('✏️ Actualizando producto:', productId, productData);
    const response = await apiPut('/productos/' + productId, productData);
    // No mostrar mensaje aquí, se manejará en handleProductSubmit
    return response;
}

// Eliminar producto
async function deleteProduct(productId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
        return;
    }
    
    try {
        console.log('🗑️ Eliminando producto:', productId);
        await apiDelete('/productos/' + productId);
        showMessage('Producto eliminado exitosamente', 'success');
        loadProducts();
        
    } catch (error) {
        console.error('❌ Error eliminando producto:', error);
        showMessage('Error al eliminar el producto: ' + error.message, 'error');
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
