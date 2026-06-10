const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

// Inicializar la aplicación Express
const app = express();

// Middlewares (Para permitir conexiones de la app y entender formato JSON)
app.use(cors());
app.use(express.json());

// Configuración de la conexión a la base de datos (XAMPP por defecto)
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',      // En XAMPP el usuario por defecto es 'root'
    password: '',      // En XAMPP la contraseña por defecto suele estar vacía
    database: 'db_sindicato'
});

// Conectar a la base de datos
db.connect((err) => {
    if (err) {
        console.error('Error conectando a la base de datos:', err);
        return;
    }
    console.log('¡Conectado exitosamente a la base de datos MySQL! 🚀');
});

// --- AQUÍ IRÁN NUESTRAS RUTAS (ENDPOINTS) ---

// 1. RUTA GET: Buscar un vehículo por su placa
// La app móvil usará esto cuando el agente escriba la placa y presione buscar
app.get('/api/vehiculos/:placa', (req, res) => {
    const placa = req.params.placa;
    const query = 'SELECT * FROM vehiculos WHERE placa = ?';
    
    db.query(query, [placa], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error interno en la base de datos' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Vehículo no encontrado o no registrado' });
        }
        // Si lo encuentra, enviamos los datos del auto (modelo, chofer, restricción)
        res.json(results[0]); 
    });
});

// 2. RUTA POST: Registrar una nueva venta de hoja de ruta
// La app enviará los datos aquí cuando el agente presione "Imprimir y Cobrar"
app.post('/api/ventas', (req, res) => {
    const { placa_vehiculo, id_agente, fecha_venta, hora_venta, monto } = req.body;
    
    const query = 'INSERT INTO ventas (placa_vehiculo, id_agente, fecha_venta, hora_venta, monto) VALUES (?, ?, ?, ?, ?)';
    
    db.query(query, [placa_vehiculo, id_agente, fecha_venta, hora_venta, monto], (err, results) => {
        if (err) {
            // Aquí entra en acción nuestro candado "UNIQUE" de SQL
            // ER_DUP_ENTRY significa que intentan duplicar la placa en la misma fecha
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ 
                    error: 'ALERTA: Este vehículo ya compró una hoja de ruta el día de hoy.' 
                });
            }
            return res.status(500).json({ error: 'Error al registrar la venta en la BD' });
        }
        res.json({ 
            mensaje: 'Venta registrada con éxito', 
            id_transaccion: results.insertId 
        });
    });
});

// --- FIN DE LAS RUTAS ---

// Iniciar el servidor en el puerto 3000
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});