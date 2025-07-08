import { Router } from 'express'; //Router es una variable que maneja rutas, así no trae todo Express
import Cliente from '../models/Cliente.js'; //..sale de la carpeta routes y luego entra en la carpeta models y selecciona Cliente.js

const route = Router();

route.post('/', async (req, res)=>{ // POST crea cliente
    const cliente = new Cliente({
        nombre: req.body.nombre, // saca el nombre del request desde el body del codigo html, y en body selleciona el nombre
        apellido: req.body.apellido,
        correo: req.body.correo,
        telefono: req.body.telefono,
        direccion: req.body.direccion
    });
    try{
        const nuevoCliente = await Cliente.save();
        res.status(201).json(nuevoCliente);
    } catch(error){
        res.status(400).json({'mensaje error':error.massage});
    }
})
// GET consulta clientes
route.get('/', async (req, res)=>{ //async para que el codigo no trabaje de forma lineal
    try{
        const filtro={};
        if (req.params.nombre){
            filtro.nombre = {regex: req.query.nombre, $option: 'i'} // si viene un parametro nombre, filtra el nombre
        }

        if (req.params.apellido){
            filtro.apellido = {regex: req.query.apellido, $option: 'i'}
        }

        if (req.params.email){
            filtro.email = {regex: req.query.email, $option: 'i'}
        }
         
        const clientes = await Cliente.find(); //ejecuta un find en la tabla Clientes y lo almaneca en la variable clientes
        res.status(200).json(clientes); //entrega la informacion del find en la variable clientes en formato JSON
    } catch(error){
        res.status(500).json({message: error.message});
    }
});

// obtener cliente por su ID
route.put('/:id', async (req, res)=>{ // PUT editar cientes
    try{
        const clienteAztualizado = await Cliente.findByIdAndUpdate(
            req.params.id, // esta mas arriba q body, entonce se llama PARAMETRO
            req.body,
            {new: true, runValidators: true}
        );
        if (!clienteAztualizado) return res.status(400).json({'message': 'cliente no encontrado'});
        res.status(200).json({'mensje':error.message});
    } catch(error){
        res.status(500).json({'mensje':error.message});
    }
});

route.delete('/:id', async (req, res)=>{
    try{
        const clienteEliminado = await Cliente.findByIdAndDelete(req.params.id);
        if(!clienteEliminado) return res.status(400).json({message:'Cliente no encontrado'});
        res.status(200).json({message:'Cliente eliminado'});
    } catch (error) {
        res.status(500).json({message:error.message});
    }
});

export default route;