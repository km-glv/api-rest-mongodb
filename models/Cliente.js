import mongoose from 'mongoose';

const clienteSchema = new mongoose.Schema({
    rut:{
        type: String,
        require: true
    },
    nombre:{
        type: String,
        require: true,
        trim: true //quita los espacios antes y despues de cada texto
    },
    apellido:{
        type: String,
        require: true,
        trim: true
    },
    correo:{
        type: String,
        require: true,
        unique: true, //campo unico
        lowerCase: true, //tdo el texto queda en minuscula
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