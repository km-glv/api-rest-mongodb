import mongoose from 'mongoose';

const pedidoSchema = new mongoose.Schema({
    cliente:{
        type: mongoose.Schema.Types.ObjectId, //enlaza los datos de cliente con los pedidos
        ref: 'Cliente', //tabla de donde saca los datos
        required: true
    },
    producto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Producto',
        required: true
    },
    productos:[
        {
            producto:{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Producto',
                required: true
            },
            cantidad:{
                type: Number,
                required: true,
                min: 1
            }
        }
    ],
    fechaPedido:{
        type: Date,
        default: Date.now
    },
    estado:{
        type:String,
        enum: ['Pendiente', 'Procesando', 'Enviado', 'Cancelado'], //estados posibles del pedido
        default: 'Pendiente'
    },
    cantidad: {
        type: Number,
        required: true,
        min: 1
    },
    precioUnitario: {
        type: Number,
        required: true,
        min: 1
    },
    subTotal: {
        type: Number,
        required: true,
        min: 1
    },
    total:{
        type: Number,
        required: true,
        min: 1
    }
})

export default mongoose.model('Pedido', pedidoSchema);