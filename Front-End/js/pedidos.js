/* ===============================================
   LÓGICA DE GESTIÓN DE PEDIDOS
   =============================================== */

// Variables globales
let orders = [];
let clients = [];
let products = [];
let editingOrderId = null;
let orderProductCounter = 0;

// Verificar autenticación al cargar
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Página de pedidos cargada');
    
    // Verificar si está autenticado
    if (!isAuthenticated()) {
        console.log('❌ No autenticado, redirigiendo al login');
        window.location.href = 'login.html';
        return;
    }
    
    // Configurar formulario
    document.getElementById('newOrderForm').addEventListener('submit', handleOrderSubmit);
    
    // Cargar datos iniciales
    loadInitialData();
});

/* ===============================================
   FUNCIONES DE INICIALIZACIÓN
   =============================================== */

// Cargar datos iniciales
async function loadInitialData() {
    try {
        // Cargar clientes, productos y pedidos en paralelo
        await Promise.all([
            loadClients(),
            loadProducts(),
            loadOrders()
        ]);
        
        console.log('✅ Datos iniciales cargados correctamente');
    } catch (error) {
        console.error('❌ Error cargando datos iniciales:', error);
        showMessage('Error al cargar datos iniciales: ' + error.message, 'error');
    }
}

// Cargar clientes
async function loadClients() {
    try {
        console.log('🔄 Cargando clientes...');
        const response = await apiGet('/clientes');
        clients = response || [];
        populateClientSelect();
        console.log(`✅ ${clients.length} clientes cargados`);
    } catch (error) {
        console.error('❌ Error cargando clientes:', error);
        throw error;
    }
}

// Cargar productos
async function loadProducts() {
    try {
        console.log('🔄 Cargando productos...');
        const response = await apiGet('/productos');
        products = response || [];
        console.log(`✅ ${products.length} productos cargados`);
    } catch (error) {
        console.error('❌ Error cargando productos:', error);
        throw error;
    }
}

// Cargar pedidos
async function loadOrders() {
    try {
        console.log('🔄 Cargando pedidos...');
        const response = await apiGet('/pedidos');
        orders = response || [];
        
        renderOrders();
        console.log(`✅ ${orders.length} pedidos cargados`);
        
    } catch (error) {
        console.error('❌ Error cargando pedidos:', error);
        showMessage('Error al cargar los pedidos: ' + error.message, 'error');
    }
}

/* ===============================================
   FUNCIONES DE INTERFAZ
   =============================================== */

// Llenar selector de clientes
function populateClientSelect() {
    const clientSelect = document.getElementById('orderClient');
    clientSelect.innerHTML = '<option value="">Selecciona un cliente...</option>';
    
    clients.forEach(client => {
        const option = document.createElement('option');
        option.value = client._id;
        option.textContent = `${client.nombre} ${client.apellido} - ${client.correo}`;
        clientSelect.appendChild(option);
    });
}

// Llenar selector de productos
function populateProductSelect(selectElement) {
    selectElement.innerHTML = '<option value="">Selecciona un producto...</option>';
    
    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product._id;
        option.textContent = `${product.nombre} - $${formatPrice(product.precio)}`;
        option.dataset.price = product.precio;
        option.dataset.stock = product.stock;
        selectElement.appendChild(option);
    });
}

// Alternar formulario de pedido
function toggleOrderForm() {
    const form = document.getElementById('orderForm');
    const isActive = form.classList.contains('active');
    
    if (isActive) {
        form.classList.remove('active');
        clearForm();
    } else {
        form.classList.add('active');
        document.getElementById('orderClient').focus();
        // Agregar el primer producto automáticamente
        if (document.getElementById('orderProducts').children.length === 0) {
            addProductToOrder();
        }
    }
}

// Limpiar formulario
function clearForm() {
    document.getElementById('newOrderForm').reset();
    document.getElementById('orderProducts').innerHTML = '';
    document.getElementById('orderTotalAmount').textContent = '0';
    editingOrderId = null;
    orderProductCounter = 0;
    document.querySelector('#orderForm h3').textContent = '📝 Nuevo Pedido';
    document.querySelector('#orderForm button[type="submit"]').textContent = 'Guardar Pedido';
}

// Mostrar mensajes
function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    const container = document.querySelector('.container');
    container.insertBefore(messageDiv, container.firstChild);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

/* ===============================================
   GESTIÓN DE PRODUCTOS EN EL PEDIDO
   =============================================== */

// Añadir producto al pedido
function addProductToOrder() {
    orderProductCounter++;
    const productsContainer = document.getElementById('orderProducts');
    
    const productDiv = document.createElement('div');
    productDiv.className = 'product-item';
    productDiv.id = `product-${orderProductCounter}`;
    
    productDiv.innerHTML = `
        <div class="product-select">
            <label>Producto:</label>
            <select class="form-control product-selector" onchange="updateProductInfo(this, ${orderProductCounter})">
                <option value="">Selecciona un producto...</option>
            </select>
        </div>
        <div class="product-stock">
            <label>Stock disponible:</label>
            <div class="stock-info" id="stock-${orderProductCounter}">-</div>
        </div>
        <div class="product-quantity">
            <label>Cantidad:</label>
            <input type="number" class="form-control quantity-input" min="1" value="1" 
                   onchange="updateSubtotal(${orderProductCounter})" id="quantity-${orderProductCounter}">
        </div>
        <div class="product-price">
            <label>Precio unitario:</label>
            <div id="price-${orderProductCounter}">$0</div>
        </div>
        <div class="product-subtotal">
            <label>Subtotal:</label>
            <div id="subtotal-${orderProductCounter}">$0</div>
        </div>
        <div class="product-actions">
            <button type="button" class="btn-remove" onclick="removeProduct(${orderProductCounter})">
                🗑️ Eliminar
            </button>
        </div>
    `;
    
    productsContainer.appendChild(productDiv);
    
    // Llenar el selector de productos
    const productSelect = productDiv.querySelector('.product-selector');
    populateProductSelect(productSelect);
}

// Actualizar información del producto
function updateProductInfo(selectElement, productId) {
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    const stockDiv = document.getElementById(`stock-${productId}`);
    const priceDiv = document.getElementById(`price-${productId}`);
    const quantityInput = document.getElementById(`quantity-${productId}`);
    
    if (selectedOption.value) {
        const stock = parseInt(selectedOption.dataset.stock);
        const price = parseFloat(selectedOption.dataset.price);
        
        // Actualizar información de stock
        stockDiv.textContent = stock;
        if (stock === 0) {
            stockDiv.className = 'stock-info stock-out';
            stockDiv.textContent = 'Sin stock';
            quantityInput.disabled = true;
            quantityInput.value = 0;
        } else if (stock <= 5) {
            stockDiv.className = 'stock-info stock-low';
            stockDiv.textContent = `${stock} (Stock bajo)`;
            quantityInput.disabled = false;
            quantityInput.max = stock;
        } else {
            stockDiv.className = 'stock-info stock-available';
            stockDiv.textContent = `${stock} disponibles`;
            quantityInput.disabled = false;
            quantityInput.max = stock;
        }
        
        // Actualizar precio
        priceDiv.textContent = `$${formatPrice(price)}`;
        
        // Actualizar subtotal
        updateSubtotal(productId);
    } else {
        stockDiv.textContent = '-';
        stockDiv.className = 'stock-info';
        priceDiv.textContent = '$0';
        quantityInput.disabled = false;
        quantityInput.removeAttribute('max');
    }
}

// Actualizar subtotal
function updateSubtotal(productId) {
    const selectElement = document.querySelector(`#product-${productId} .product-selector`);
    const quantityInput = document.getElementById(`quantity-${productId}`);
    const subtotalDiv = document.getElementById(`subtotal-${productId}`);
    
    if (selectElement.value && quantityInput.value) {
        const selectedOption = selectElement.options[selectElement.selectedIndex];
        const price = parseFloat(selectedOption.dataset.price);
        const quantity = parseInt(quantityInput.value);
        const stock = parseInt(selectedOption.dataset.stock);
        
        // Validar que no exceda el stock
        if (quantity > stock) {
            quantityInput.value = stock;
            showMessage(`La cantidad no puede exceder el stock disponible (${stock})`, 'error');
            return;
        }
        
        const subtotal = price * quantity;
        subtotalDiv.textContent = `$${formatPrice(subtotal)}`;
    } else {
        subtotalDiv.textContent = '$0';
    }
    
    updateOrderTotal();
}

// Eliminar producto del pedido
function removeProduct(productId) {
    const productDiv = document.getElementById(`product-${productId}`);
    productDiv.remove();
    updateOrderTotal();
}

// Actualizar total del pedido
function updateOrderTotal() {
    let total = 0;
    const subtotalElements = document.querySelectorAll('[id^="subtotal-"]');
    
    subtotalElements.forEach(element => {
        const subtotalText = element.textContent.replace('$', '').replace(/,/g, '');
        const subtotal = parseFloat(subtotalText) || 0;
        total += subtotal;
    });
    
    document.getElementById('orderTotalAmount').textContent = formatPrice(total);
}

/* ===============================================
   CRUD DE PEDIDOS
   =============================================== */

// Manejar envío del formulario
async function handleOrderSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const clienteId = formData.get('cliente');
    const estado = formData.get('estado');
    
    // Recopilar productos del pedido
    const productos = [];
    const productItems = document.querySelectorAll('.product-item');
    
    productItems.forEach(item => {
        const select = item.querySelector('.product-selector');
        const quantity = item.querySelector('.quantity-input');
        
        if (select.value && quantity.value && parseInt(quantity.value) > 0) {
            productos.push({
                producto: select.value,
                cantidad: parseInt(quantity.value)
            });
        }
    });
    
    // Validaciones
    if (!clienteId) {
        showMessage('Por favor selecciona un cliente', 'error');
        return;
    }
    
    if (productos.length === 0) {
        showMessage('Por favor agrega al menos un producto al pedido', 'error');
        return;
    }
    
    const orderData = {
        cliente: clienteId,
        productos: productos,
        estado: estado
    };
    
    console.log('📝 Datos del pedido a enviar:', orderData);
    
    try {
        if (editingOrderId) {
            console.log('✏️ Actualizando pedido con ID:', editingOrderId);
            await updateOrder(editingOrderId, orderData);
        } else {
            console.log('➕ Creando nuevo pedido');
            await createOrder(orderData);
        }
        
        toggleOrderForm();
        await loadOrders();
        
    } catch (error) {
        console.error('❌ Error completo:', error);
        showMessage('Error al guardar el pedido: ' + error.message, 'error');
    }
}

// Crear pedido
async function createOrder(orderData) {
    console.log('📝 Creando pedido:', orderData);
    const response = await apiPost('/pedidos', orderData);
    showMessage('Pedido creado exitosamente', 'success');
    
    // Actualizar stock de productos
    await updateProductsStock(orderData.productos);
    
    return response;
}

// Actualizar stock de productos
async function updateProductsStock(productos) {
    try {
        for (const item of productos) {
            const product = products.find(p => p._id === item.producto);
            if (product) {
                const newStock = product.stock - item.cantidad;
                await apiPut(`/productos/${item.producto}`, {
                    nombre: product.nombre,
                    precio: product.precio,
                    stock: newStock
                });
                
                // Actualizar en el array local
                product.stock = newStock;
            }
        }
        
        console.log('✅ Stock de productos actualizado');
    } catch (error) {
        console.error('❌ Error actualizando stock:', error);
        showMessage('Advertencia: Error al actualizar el stock de productos', 'error');
    }
}

// Actualizar pedido
async function updateOrder(orderId, orderData) {
    console.log('✏️ Actualizando pedido:', orderId, orderData);
    const response = await apiPut('/pedidos/' + orderId, orderData);
    showMessage('Pedido actualizado exitosamente', 'success');
    return response;
}

// Eliminar pedido
async function deleteOrder(orderId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este pedido?')) {
        return;
    }
    
    try {
        console.log('🗑️ Eliminando pedido:', orderId);
        await apiDelete('/pedidos/' + orderId);
        showMessage('Pedido eliminado exitosamente', 'success');
        loadOrders();
        
    } catch (error) {
        console.error('❌ Error eliminando pedido:', error);
        showMessage('Error al eliminar el pedido: ' + error.message, 'error');
    }
}

/* ===============================================
   RENDERIZADO DE PEDIDOS
   =============================================== */

// Renderizar pedidos
function renderOrders() {
    const container = document.getElementById('ordersList');
    
    if (orders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🛒</div>
                <p>No hay pedidos registrados</p>
                <button class="btn btn-primary" onclick="toggleOrderForm()">Crear Primer Pedido</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="order-item">
            <div class="order-header">
                <div>
                    <div class="order-client">
                        ${order.cliente ? `${order.cliente.nombre} ${order.cliente.apellido}` : 'Cliente no encontrado'}
                    </div>
                    <div class="order-date">
                        📅 ${new Date(order.fechaPedido).toLocaleDateString()}
                    </div>
                </div>
                <div>
                    <span class="order-status status-${order.estado.toLowerCase()}">
                        ${order.estado}
                    </span>
                </div>
            </div>
            
            <div class="order-products-list">
                ${order.productos ? order.productos.map(item => `
                    <div class="order-product">
                        <span>${item.producto ? item.producto.nombre : 'Producto no encontrado'}</span>
                        <span>Cantidad: ${item.cantidad}</span>
                        <span>$${item.producto ? formatPrice(item.producto.precio * item.cantidad) : '0'}</span>
                    </div>
                `).join('') : '<div>No hay productos en este pedido</div>'}
            </div>
            
            <div class="order-total-amount">
                Total: $${formatPrice(order.total || 0)}
            </div>
            
            <div class="order-actions">
                <button class="btn-small btn-edit" onclick="editOrder('${order._id}')">✏️ Editar</button>
                <button class="btn-small btn-delete" onclick="deleteOrder('${order._id}')">🗑️ Eliminar</button>
            </div>
        </div>
    `).join('');
}

/* ===============================================
   FUNCIONES AUXILIARES
   =============================================== */

// Formatear precio
function formatPrice(price) {
    return new Intl.NumberFormat('es-CL', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(price);
}

// Función logout (heredada)
function logout() {
    console.log('🚪 Cerrando sesión...');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}
