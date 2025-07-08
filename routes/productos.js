import { Router } from 'express';
import Producto from '../models/Producto.js';

const route = Router();

route.post('/', async (req, res)=>{
    const producto = new Producto({
        nombre: req.body.nombre,
        precio: req.body.precio,
        stock: req.body.stock
    })
    try{
        const nuevoProducto = await Producto.save();
        res.status(201).json(nuevoPedido);
    } catch(error){
        res.status(400).json({'mensaje error':error.message});
    }
});

route.get('/', async (req, res)=>{
    try{
        const filtro={};
        if (req.query.categoria){
            filtro.categoria = {$regex: req.query.categoria, $options: 'i'};
        }
        if(req,query.minPrecio || req.query.maxPrecio){
            filtro.precio={};
            if(req.query,minPrecio){
                filtro.precio.$gte = parseFloat(req.query.minPrecio);
            }
            if(req.query.maxPrecio){
                filtro.precio.$lte = parseFloat(req.query.maxPrecio);
            }
        }
        let query = Producto.find(filtro);

        if(req.query.sort){
            const sortBy = req-query.sort.split(',').join(' ');
            query = query.sort(sortBy);
        }

        const producto = await query.exec();
        res.status(200).json(productos);
    } catch(error){
        res.status(500).json({message:error.message});
    }
});

route.get('/:id', async (req, res) => { // obtener producto por ID
    try {
        const producto = await Producto.findById(req.params.id);
        if (!producto) return res.status(404).json({ message: 'Producto no encontrado' });
        res.status(200).json(producto);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

route.post('/', async (req, res) => { // Crear producto
    const producto = new Producto({
        nombre: req.body.nombre,
        descripcion: req.body.descripcion,
        precio: req.body.precio,
        stock: req.body.stock,
        categoria: req.body.categoria
    });
    try {
        const nuevoProducto = await producto.save();
        res.status(201).json(nuevoProducto);
    } catch(error){
        res.status(400).json({ message:error.message });
    }
});

route.put('/:id', async (req, res)=>{ // Actualizar producto
    try {
        const productoActualizado = await Producto.findByIdAndUpdate(
        req.params.id,
        req.body,
        {new: true, runValidators: true}
        );
        if(!productoActualizado) return res.status(404).json({message:'Producto no encontrado' });
        res.status(200).json(productoActualizado);
    } catch(error){
        res.status(400).json({ message: error.message});
    }
});

route.delete('/:id', async (req, res) => { // Eliminar producto
    try {
        const productoEliminado = await Producto.findByIdAndDelete(req.params.id);
        if (!productoEliminado) return res.status(404).json({ message: 'Producto no encontrado' });
        res.status(200).json({ message: 'Producto eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default route; 