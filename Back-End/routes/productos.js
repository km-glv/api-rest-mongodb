import { Router } from 'express';
import Producto from '../models/Producto.js';

const route = Router();

// Crear producto
route.post('/', async (req, res)=>{
    const producto = new Producto({
        nombre: req.body.nombre,
        precio: req.body.precio,
        stock: req.body.stock
    });
    try{
        const nuevoProducto = await producto.save();
        res.status(201).json(nuevoProducto);
    } catch(error){
        res.status(400).json({'mensaje error':error.message});
    }
});

// Obtener todos los productos
route.get('/', async (req, res)=>{
    try{
        const filtro={};
        if (req.query.nombre){
            filtro.nombre = {$regex: req.query.nombre, $options: 'i'};
        }
        if(req.query.minPrecio || req.query.maxPrecio){
            filtro.precio={};
            if(req.query.minPrecio){
                filtro.precio.$gte = parseFloat(req.query.minPrecio);
            }
            if(req.query.maxPrecio){
                filtro.precio.$lte = parseFloat(req.query.maxPrecio);
            }
        }
        let query = Producto.find(filtro);

        if(req.query.sort){
            const sortBy = req.query.sort.split(',').join(' ');
            query = query.sort(sortBy);
        }

        const productos = await query.exec();
        res.status(200).json(productos);
    } catch(error){
        res.status(500).json({message:error.message});
    }
});

// Obtener producto por ID
route.get('/:id', async (req, res) => {
    try {
        const producto = await Producto.findById(req.params.id);
        if (!producto) return res.status(404).json({ message: 'Producto no encontrado' });
        res.status(200).json(producto);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Actualizar producto
route.put('/:id', async (req, res)=>{ 
    try {
        console.log('🔄 PUT - Actualizando producto:', req.params.id);
        console.log('📝 PUT - Datos recibidos:', req.body);
        
        const productoActualizado = await Producto.findByIdAndUpdate(
            req.params.id,
            req.body,
            {new: true, runValidators: true}
        );
        
        console.log('📊 PUT - Producto actualizado:', productoActualizado);
        
        if(!productoActualizado) {
            console.log('❌ PUT - Producto no encontrado');
            return res.status(404).json({message:'Producto no encontrado' });
        }
        
        console.log('✅ PUT - Éxito, enviando respuesta');
        res.status(200).json(productoActualizado);
    } catch(error){
        console.error('❌ PUT - Error:', error.message);
        res.status(500).json({ message: error.message});
    }
});

// Eliminar producto
route.delete('/:id', async (req, res) => {
    try {
        const productoEliminado = await Producto.findByIdAndDelete(req.params.id);
        if (!productoEliminado) return res.status(404).json({ message: 'Producto no encontrado' });
        res.status(200).json({ message: 'Producto eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default route; 