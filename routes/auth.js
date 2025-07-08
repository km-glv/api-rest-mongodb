import {Router} from 'express';
import Usuario from '../models/Usuario.js';
import jwt from 'jsonwebtoken';

const router = Router();
// Obtiene clave secreta JWT
const JWT_SECRET = process.env.JWT_SECRET;

router.post('/register', async (req, res)=>{ // Registro de usuario
    const { email, password } = req.body;
    try {
        let usuario = await Usuario.findOne({ email });
        if (usuario) {
            return res.status(400).json({ message: 'El email ya está registrado' });
        }
        usuario = new Usuario({email, password});
        await usuario.save();
        const token = jwt.sign( {id: usuario._id}, JWT_SECRET, {expiresIn: '1h'});
        res.status(201).json({ message:'Usuario registrado exitosamente', token });
    } catch (error){
        res.status(500).json({ message:'Error en el servidor', error: error.message });
    }
});

router.post('/login', async (req, res) => {
        const { email, password } = req.body;
    try {
        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }
        const isMatch = await usuario.compararPassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }
        const token = jwt.sign({id: usuario._id }, JWT_SECRET, {expiresIn:'1h'});
        res.status(200).json({message: 'Inicio de sesión exitoso', token });
    } catch(error){
        res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
});

export default router;