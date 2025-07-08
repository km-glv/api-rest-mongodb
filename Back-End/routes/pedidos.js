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
        const clienteExiste = await Cliente.findById(cliente);
        if (!clienteExiste) {
            return res.status(400).json({ message: 'Cliente no encontrado' });
        }
        let totalPedido = 0;
        for (const item of productos) {
            const productoExiste = await Producto.findById(item.producto);
            if (!productoExiste) {
                return res.status(400).json({ message: `Producto con ID ${item.producto} no encontrado` });
            }
            if (item.cantidad <= 0) {
                return res.status(400).json({ message: 'La cantidad del producto debe ser mayor a 0' });
            }
            totalPedido += productoExiste.precio * item.cantidad;
        }
        const pedido = new Pedido({
            cliente, productos, estado, total: totalPedido});
        const nuevoPedido = await pedido.save();
        res.status(201).json(nuevoPedido);
    } catch(error){
        res.status(400).json({message:error.message});
    }
});

route.put('/:id', async (req, res) => { // Editar pedido
    try {
        const pedidoActualizado = await Pedido.findByIdAndUpdate(
            req.params.id,
            req.body,
            {new: true, runValidators: true}
        );
        if (!pedidoActualizado) return res.status(404).json({ message:'Pedido no encontrado' });
        res.status(200).json(pedidoActualizado);
    } catch(error){
        res.status(400).json({message:error.message});
    }
});

route.delete('/:id', async (req, res) => { // Borrar pedidos
    try {
        const pedidoEliminado = await Pedido.findByIdAndDelete(req.params.id);
        if (!pedidoEliminado) return res.status(404).json({ message: 'Pedido no encontrado' });
        res.status(200).json({message:'Pedido eliminado exitosamente'});
    } catch(error){
        res.status(500).json({message: error.message});
    }
});
export default route; 