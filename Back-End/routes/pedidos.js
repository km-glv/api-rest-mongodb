import { Router } from 'express';
import Pedido from '../models/Pedido.js';
import Cliente from '../models/Cliente.js';
import Producto from '../models/Producto.js';

const route = Router();

route.get('/', async (req, res) => {
    try {
        const filtro = {};
        if (req.query.estado) {filtro.estado = req.query.estado;}
        let query = Pedido.find(filtro)
                            .populate('cliente')
                            .populate('productos.producto');
        if (req.query.sortFecha) {
            if (req.query.sortFecha === 'asc') {
                query = query.sort('fechaPedido');
            } else if (req.query.sortFecha === 'desc') {
                query = query.sort('-fechaPedido');
            }
        } else{
            query = query.sort('-fechaPedido');
        }
        const pedidos = await query.exec();
        res.status(200).json(pedidos);
    } catch(error){
        res.status(500).json({ message:error.message});
    }
});

route.get('/:id', async (req, res) => { // Obtener pedido por ID
    try {
        const pedido = await Pedido.findById(req.params.id)
                                .populate('cliente')
                                .populate('productos.producto');
        if (!pedido) return res.status(404).json({message:'Pedido no encontrado'});
        res.status(200).json(pedido);
    } catch(error){
        res.status(500).json({message:error.message});
    }
});

route.post('/', async (req, res) => { // Crear pedido
    const { cliente, productos, estado } = req.body;
    try {
        console.log('📝 POST - Creando nuevo pedido');
        console.log('👤 Cliente:', cliente);
        console.log('📦 Productos:', productos);
        
        // Verificar que el cliente existe
        const clienteExiste = await Cliente.findById(cliente);
        if (!clienteExiste) {
            return res.status(400).json({ message: 'Cliente no encontrado' });
        }
        
        let totalPedido = 0;
        const productosValidados = [];
        
        // Validar productos y stock disponible
        for (const item of productos) {
            const productoExiste = await Producto.findById(item.producto);
            if (!productoExiste) {
                return res.status(400).json({ message: `Producto con ID ${item.producto} no encontrado` });
            }
            
            if (item.cantidad <= 0) {
                return res.status(400).json({ message: 'La cantidad del producto debe ser mayor a 0' });
            }
            
            // Verificar stock disponible
            if (productoExiste.stock < item.cantidad) {
                return res.status(400).json({ 
                    message: `Stock insuficiente para ${productoExiste.nombre}. Stock disponible: ${productoExiste.stock}, solicitado: ${item.cantidad}` 
                });
            }
            
            totalPedido += productoExiste.precio * item.cantidad;
            productosValidados.push({
                producto: productoExiste,
                cantidad: item.cantidad
            });
        }
        
        // Crear el pedido
        const pedido = new Pedido({
            cliente, 
            productos: productos.map(item => ({
                producto: item.producto,
                cantidad: item.cantidad
            })), 
            estado: estado || 'Pendiente', 
            total: totalPedido
        });
        
        const nuevoPedido = await pedido.save();
        
        // Descontar stock de cada producto
        for (const item of productosValidados) {
            const nuevoStock = item.producto.stock - item.cantidad;
            await Producto.findByIdAndUpdate(
                item.producto._id,
                { stock: nuevoStock },
                { new: true }
            );
            console.log(`📉 Stock descontado - Producto: ${item.producto.nombre}, Cantidad: ${item.cantidad}, Nuevo stock: ${nuevoStock}`);
        }
        
        console.log('✅ POST - Pedido creado y stock actualizado');
        res.status(201).json(nuevoPedido);
        
    } catch(error){
        console.error('❌ POST - Error:', error.message);
        res.status(400).json({message: error.message});
    }
});

route.put('/:id', async (req, res) => { // Editar pedido
    try {
        console.log('✏️ PUT - Actualizando pedido:', req.params.id);
        
        // Obtener el pedido actual para comparar cambios
        const pedidoActual = await Pedido.findById(req.params.id).populate('productos.producto');
        if (!pedidoActual) {
            return res.status(404).json({ message: 'Pedido no encontrado' });
        }
        
        // Si se están actualizando los productos, manejar el stock
        if (req.body.productos) {
            console.log('📦 PUT - Actualizando productos del pedido');
            
            // Devolver el stock de los productos actuales
            for (const item of pedidoActual.productos) {
                const producto = await Producto.findById(item.producto._id);
                if (producto) {
                    const stockDevuelto = producto.stock + item.cantidad;
                    await Producto.findByIdAndUpdate(
                        item.producto._id,
                        { stock: stockDevuelto },
                        { new: true }
                    );
                    console.log(`📈 Stock devuelto - ${producto.nombre}: +${item.cantidad} (Total: ${stockDevuelto})`);
                }
            }
            
            // Validar y descontar stock de los nuevos productos
            let totalPedido = 0;
            for (const item of req.body.productos) {
                const producto = await Producto.findById(item.producto);
                if (!producto) {
                    return res.status(400).json({ message: `Producto con ID ${item.producto} no encontrado` });
                }
                
                if (item.cantidad <= 0) {
                    return res.status(400).json({ message: 'La cantidad del producto debe ser mayor a 0' });
                }
                
                // Verificar stock disponible
                if (producto.stock < item.cantidad) {
                    return res.status(400).json({ 
                        message: `Stock insuficiente para ${producto.nombre}. Stock disponible: ${producto.stock}, solicitado: ${item.cantidad}` 
                    });
                }
                
                totalPedido += producto.precio * item.cantidad;
            }
            
            // Actualizar el total
            req.body.total = totalPedido;
            
            // Actualizar el pedido
            const pedidoActualizado = await Pedido.findByIdAndUpdate(
                req.params.id,
                req.body,
                {new: true, runValidators: true}
            );
            
            // Descontar stock de los nuevos productos
            for (const item of req.body.productos) {
                const producto = await Producto.findById(item.producto);
                if (producto) {
                    const nuevoStock = producto.stock - item.cantidad;
                    await Producto.findByIdAndUpdate(
                        item.producto,
                        { stock: nuevoStock },
                        { new: true }
                    );
                    console.log(`📉 Stock descontado - ${producto.nombre}: -${item.cantidad} (Total: ${nuevoStock})`);
                }
            }
            
            console.log('✅ PUT - Pedido actualizado y stock ajustado');
            res.status(200).json(pedidoActualizado);
        } else {
            // Si no se actualizan productos, solo actualizar otros campos
            const pedidoActualizado = await Pedido.findByIdAndUpdate(
                req.params.id,
                req.body,
                {new: true, runValidators: true}
            );
            res.status(200).json(pedidoActualizado);
        }
        
    } catch(error){
        console.error('❌ PUT - Error:', error.message);
        res.status(400).json({message: error.message});
    }
});

route.delete('/:id', async (req, res) => { // Borrar pedidos
    try {
        console.log('🗑️ DELETE - Eliminando pedido:', req.params.id);
        
        // Primero obtener el pedido con los productos para saber qué stock devolver
        const pedidoAEliminar = await Pedido.findById(req.params.id).populate('productos.producto');
        
        if (!pedidoAEliminar) {
            console.log('❌ DELETE - Pedido no encontrado');
            return res.status(404).json({ message: 'Pedido no encontrado' });
        }
        
        console.log('📦 DELETE - Productos en el pedido:', pedidoAEliminar.productos.length);
        
        // Devolver el stock de cada producto
        for (const item of pedidoAEliminar.productos) {
            const producto = await Producto.findById(item.producto._id);
            if (producto) {
                const nuevoStock = producto.stock + item.cantidad;
                await Producto.findByIdAndUpdate(
                    item.producto._id,
                    { stock: nuevoStock },
                    { new: true }
                );
                console.log(`📈 Stock devuelto - Producto: ${producto.nombre}, Cantidad: ${item.cantidad}, Nuevo stock: ${nuevoStock}`);
            }
        }
        
        // Eliminar el pedido
        const pedidoEliminado = await Pedido.findByIdAndDelete(req.params.id);
        
        console.log('✅ DELETE - Pedido eliminado y stock devuelto');
        res.status(200).json({
            message: 'Pedido eliminado exitosamente',
            stockDevuelto: pedidoAEliminar.productos.map(item => ({
                producto: item.producto.nombre,
                cantidadDevuelta: item.cantidad
            }))
        });
        
    } catch(error){
        console.error('❌ DELETE - Error:', error.message);
        res.status(500).json({message: error.message});
    }
});
export default route; 