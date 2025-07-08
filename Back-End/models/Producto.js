import mongoose from 'mongoose';

const productoSchema = new mongoose.Schema({
    nombre:{
        type: String,
        required: true
    },
    precio:{
        type: Number,
        required: true,
        min: 0
    },
    stock:{
        type: Number,
        required: true,
        min: 0
    }
});

export default mongoose.model('Producto', productoSchema);