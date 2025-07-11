import { Router } from 'express'; 
import Cliente from '../models/Cliente.js'; 

const route = Router();

route.post('/', async (req, res)=>{ // POST crea cliente
    const cliente = new Cliente({
        rut: req.body.rut,
        nombre: req.body.nombre, 
        apellido: req.body.apellido,
        correo: req.body.correo,
        fechaNace: req.body.fechaNace
    });
    try{
        const nuevoCliente = await cliente.save();
        res.status(201).json(nuevoCliente);
    } catch(error){
        res.status(400).json({'mensaje error':error.message});
    }
})
// GET consulta clientes
route.get('/', async (req, res)=>{ //async para que el codigo no trabaje de forma lineal
    try{
        const filtro={};
        if (req.query.nombre){
            filtro.nombre = {$regex: req.query.nombre, $options: 'i'} // si viene un parametro nombre, filtra el nombre
        }

        if (req.query.apellido){
            filtro.apellido = {$regex: req.query.apellido, $options: 'i'}
        }

        if (req.query.correo){
            filtro.correo = {$regex: req.query.correo, $options: 'i'}
        }
         
        const clientes = await Cliente.find(filtro); //ejecuta un find en la tabla Clientes y lo almaneca en la variable clientes
        res.status(200).json(clientes); //entrega la informacion del find en la variable clientes en formato JSON
    } catch(error){
        res.status(500).json({message: error.message});
    }
});

// obtener cliente por su ID
route.put('/:id', async (req, res)=>{ // PUT editar clientes
    try{
        console.log('🔄 PUT - Actualizando cliente:', req.params.id);
        console.log('📝 PUT - Datos recibidos:', req.body);
        
        // Validar que el ID sea válido
        if (!req.params.id || req.params.id.length !== 24) {
            console.log('❌ PUT - ID inválido:', req.params.id);
            return res.status(400).json({'message': 'ID de cliente inválido'});
        }
        
        const clienteActualizado = await Cliente.findByIdAndUpdate(
            req.params.id,
            req.body,
            {new: true, runValidators: true}
        );
        
        console.log('📊 PUT - Cliente actualizado:', clienteActualizado);
        
        if (!clienteActualizado) {
            console.log('❌ PUT - Cliente no encontrado');
            return res.status(404).json({'message': 'cliente no encontrado'});
        }
        
        console.log('✅ PUT - Éxito, enviando respuesta');
        res.status(200).json(clienteActualizado);
    } catch(error){
        console.error('❌ PUT - Error completo:', error);
        console.error('❌ PUT - Error message:', error.message);
        console.error('❌ PUT - Error stack:', error.stack);
        res.status(500).json({'message':error.message});
    }
});

route.delete('/:id', async (req, res)=>{
    try{
        const clienteEliminado = await Cliente.findByIdAndDelete(req.params.id);
        if(!clienteEliminado) return res.status(404).json({message:'Cliente no encontrado'});
        res.status(200).json({message:'Cliente eliminado'});
    } catch (error) {
        res.status(500).json({message:error.message});
    }
});

export default route;