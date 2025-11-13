const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Base de datos en memoria (temporal)
let citas = [
  {
    id: "1",
    nombre: "María",
    apellidos: "González",
    telefono: "+34 600 123 456",
    fecha: "2024-01-15",
    hora: "10:00",
    tratamiento: "Limpieza",
    doctor: "Dr. García",
    estado: "Confirmada",
    notas: "Primera visita",
    created_at: "2024-01-10T10:00:00Z"
  },
  {
    id: "2",
    nombre: "Juan",
    apellidos: "Pérez",
    telefono: "+34 600 789 012",
    fecha: "2024-01-16",
    hora: "14:30",
    tratamiento: "Revisión",
    doctor: "Dra. Martínez",
    estado: "Pendiente",
    notas: "",
    created_at: "2024-01-10T11:00:00Z"
  }
];

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Backend funcionando correctamente',
    timestamp: new Date().toISOString(),
    totalCitas: citas.length
  });
});

// Obtener todas las citas
app.get('/api/citas/sql', (req, res) => {
  try {
    res.json({ 
      success: true, 
      data: citas,
      total: citas.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Crear nueva cita
app.post('/api/citas/sql', (req, res) => {
  try {
    const nuevaCita = {
      id: Date.now().toString(),
      nombre: req.body.nombre,
      apellidos: req.body.apellidos,
      telefono: req.body.telefono,
      fecha: req.body.fecha,
      hora: req.body.hora,
      tratamiento: req.body.tratamiento,
      doctor: req.body.doctor,
      estado: req.body.estado || 'Pendiente',
      notas: req.body.notas || '',
      created_at: new Date().toISOString()
    };
    
    citas.push(nuevaCita);
    
    res.json({ 
      success: true, 
      message: 'Cita creada correctamente',
      data: nuevaCita
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Actualizar cita
app.put('/api/citas/sql/:id', (req, res) => {
  try {
    const citaId = req.params.id;
    const citaIndex = citas.findIndex(c => c.id === citaId);
    
    if (citaIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Cita no encontrada' 
      });
    }
    
    citas[citaIndex] = {
      ...citas[citaIndex],
      ...req.body,
      id: citaId // Mantener el ID original
    };
    
    res.json({ 
      success: true, 
      message: 'Cita actualizada correctamente',
      data: citas[citaIndex]
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Eliminar cita
app.delete('/api/citas/sql/:id', (req, res) => {
  try {
    const citaId = req.params.id;
    const citaIndex = citas.findIndex(c => c.id === citaId);
    
    if (citaIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Cita no encontrada' 
      });
    }
    
    citas.splice(citaIndex, 1);
    
    res.json({ 
      success: true, 
      message: 'Cita eliminada correctamente'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'API Agenda Dental',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      citas: '/api/citas/sql'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📋 Total de citas: ${citas.length}`);
});
