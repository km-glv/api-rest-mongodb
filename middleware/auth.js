import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';
const JWT_SECRET = process.env.JWT_SECRET;
const authMiddleware = async (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        return res.status(401).json({ message: 'Acceso denegado. No se proporcionó token.' });
    }
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'Acceso denegado. Formato de token inválido.' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const usuario = await Usuario.findById(decoded.id).select('-password');
        if (!usuario) {
            return res.status(401).json({ message: 'El token no es válido o el usuario no existe.'});
        }
        req.usuario = usuario;
        next();
    } catch (error) {
        res.status(401).json({message:'Token no válido o expirado.', error: error.message});
    }
};

export default authMiddleware;