import dotenv from 'dotenv';
dotenv.config(); //conecta la carpeta .env
import mongoose from 'mongoose'; //conecta la bd mongo

import authMiddleware from './middleware/auth.js';
import authRouter from './routes/auth.js';
import clientesRouter from './routes/clientes.js';
import productosRouter from './routes/productos.js';
import pedidosRouter from './routes/pedidos.js';

import express from 'express'; //servidor web
const app = express(); //todo lo que pase en la web pasa por la const

// Configurar CORS - DEBE IR ANTES de las rutas
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Permitir cualquier origen
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Responder a peticiones OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Configurar middleware ANTES de las rutas
app.use(express.json()); //para que el servidor entienda los datos en formato JSON

// Configurar rutas - DESPUÉS del middleware
app.use('/api/auth', authRouter); // SIN autenticación (para login/register)
app.use('/api/clientes', authMiddleware, clientesRouter);
app.use('/api/productos', authMiddleware, productosRouter);
app.use('/api/pedidos', authMiddleware, pedidosRouter);


// agrear pedidosRouter, productoRouter, etc
const PORT = process.env.PORT || 3000; //lee la carpeta PORT local y solo funciona importando dotenv
mongoose.connect(process.env.MONGO_URI)
    .then(()=>{ //then = if
        console.log('Conectado al servidor MongoDB');
    })
    .catch((error)=>{
        console.error('error al conectar al servidor de base de datos', error);
        process.exit(1);
    });

// app.listen es el servidor que escucha las peticiones
app.listen(PORT, ()=>{
    console.log(`servidor esta corriendo en el puerto ${PORT}`); // Alt gr + `` para agregar variables, tambien usar ${VARIABLE}
});


app.get('/',(req, res)=>{ //request y respuesta desde la raiz //=> es igual a ..
    res.send('<H1>Funcionó</H1> !! <br>Bienvenido'); //send envia el mensaje a la pagina
})

app.get('/api/clientes', (req, res)=>{
    res.send('<H1>Bienvenido, esta consultando los clientes</H1>')
})

app.post('/api/clientes', (req, res)=>{
    res.send('<H1>Bienvenido, esta ingresando los clientes</H1>')
})

app.get('/api/clientes', (req, res)=>{
    res.send('<H1>Bienvenido, esta consultando los clientes</H1>')
})

app.delete('/api/clientes', (req, res)=>{
    res.send('<H1>Bienvenido, esta eliminando los clientes</H1>')
})

// Pedidos

app.post('/api/pedidos', (req, res)=>{
    res.send('<H1>Bienvenido, esta ingresando los pedidos</H1>')
})

app.get('/api/pedidos', (req, res)=>{
    res.send('<H1>Bienvenido, esta consultando los pedidos</H1>')
})

app.put('/api/pedidos', (req, res)=>{
    res.send('<H1>Bienvenido, esta actualizando los pedidos</H1>')
})

app.delete('/api/pedidos', (req, res)=>{
    res.send('<H1>Bienvenido, esta eliminando los pedidos</H1>')
})

// Productos

app.post('/api/productos', (req, res)=>{
    res.send('<H1>Bienvenido, esta agregando los pedidos</H1>')
})

app.get('/api/productos', (req, res)=>{
    res.send('<H1>Bienvenido, esta consultando los pedidos</H1>')
})

app.put('/api/productos', (req, res)=>{
    res.send('<H1>Bienvenido, esta actualizando los pedidos</H1>')
})

app.delete('/api/productos', (req, res)=>{
    res.send('<H1>Bienvenido, esta eliminando los pedidos</H1>')
})