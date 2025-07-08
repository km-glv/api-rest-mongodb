import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const usuarioSchema = new mongoose.Schema({
    email:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/.+@.+\..+/, 'Por favor, ingrese un email válido']
    },
    password:{
        type: String,
        required: true,
        minlength: 6
    },
    fechaRegistro:{
        type: Date,
        default: Date.now
    }
});


// Cifrar contrseña antes de guardar /usando async y await

usuarioSchema.pre('save', async function(next){
    if(!this.isModified('password')){
        return next();
    }
    try{
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch(error){
        next(error);
    }
});

// Verificar contraseña
usuarioSchema.methods.compararPassword = async function(passwordIngresada){
    return await bcrypt.compare(passwordIngresada, this.password);
};

export default mongoose.model('Usuario', usuarioSchema);