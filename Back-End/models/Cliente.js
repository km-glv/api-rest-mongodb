import mongoose from 'mongoose';

const clienteSchema = new mongoose.Schema({
    rut:{
        type: String,
        required: true
    },
    nombre:{
        type: String,
        required: true,
        trim: true //quita los espacios antes y despues de cada texto
    },
    apellido:{
        type: String,
        required: true,
        trim: true
    },
    correo:{
        type: String,
        required: true,
        unique: true, //campo unico
        lowercase: true, //tdo el texto queda en minuscula
        trim: true,
        match: [/.+@.+\..+/, 'Ingrese un correo valido'] //  /texto + @ + texto + .punto + texto/ || \ para separar los puntos
    },
    fechaNace:{
        type: Date
    },
    fechaRegistro:{
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Cliente', clienteSchema);