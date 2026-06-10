const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config(); // Carga las variables del archivo .env

const app = express();

app.use(cors());
app.use(express.json());

// Configuración de conexión profesional
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false // Obligatorio para Aiven
    }
});

db.connect((err) => {
    if (err) {
        console.error('Error conectando a Aiven:', err.message);
        return;
    }
    console.log('¡Conectado exitosamente a la base de datos en Aiven! 🚀');
});

// --- RUTAS ---
app.get('/api/vehiculos/:placa', (req, res) => {
    const placa = req.params.placa;
    const query = 'SELECT * FROM vehiculos WHERE placa = ?';
    
    db.query(query, [placa], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error en la base de datos' });
        if (results.length === 0) return res.status(404).json({ error: 'Vehículo no encontrado' });
        res.json(results[0]); 
    });
});

app.post('/api/ventas', (req, res) => {
    const { placa_vehiculo, id_agente, fecha_venta, hora_venta, monto } = req.body;
    const query = 'INSERT INTO ventas (placa_vehiculo, id_agente, fecha_venta, hora_venta, monto) VALUES (?, ?, ?, ?, ?)';
    
    db.query(query, [placa_vehiculo, id_agente, fecha_venta, hora_venta, monto], (err, results) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'ALERTA: Este vehículo ya compró hoy.' });
            }
            return res.status(500).json({ error: 'Error al registrar la venta' });
        }
        res.json({ mensaje: 'Venta registrada con éxito', id: results.insertId });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});