require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configurar Google Sheets API
const auth = new google.auth.GoogleAuth({
  credentials: {
    type: 'service_account',
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: '✅ Backend de Agenda Dental funcionando correctamente' });
});

// Obtener todas las citas
app.get('/api/citas', async (req, res) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Citas!A2:K',
    });

    const rows = response.data.values || [];
    const citas = rows.map((row, index) => ({
      id: row[0] || `${index + 2}`,
      paciente_nombre: row[1] || '',
      paciente_telefono: row[2] || '',
      paciente_email: row[3] || '',
      fecha: row[4] || '',
      hora: row[5] || '',
      tratamiento: row[6] || '',
      doctor: row[7] || '',
      estado: row[8] || '',
      notas: row[9] || '',
      createdAt: row[10] || new Date().toISOString(),
    }));

    res.json({ success: true, data: citas });
  } catch (error) {
    console.error('Error al obtener citas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Crear nueva cita
app.post('/api/citas', async (req, res) => {
  try {
    const cita = req.body;
    const values = [[
      cita.id,
      cita.paciente_nombre,
      cita.paciente_telefono,
      cita.paciente_email,
      cita.fecha,
      cita.hora,
      cita.tratamiento,
      cita.doctor,
      cita.estado,
      cita.notas,
      cita.createdAt,
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Citas!A:K',
      valueInputOption: 'USER_ENTERED',
      resource: { values },
    });

    res.json({ success: true, message: 'Cita creada correctamente' });
  } catch (error) {
    console.error('Error al crear cita:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Actualizar cita
app.put('/api/citas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const cita = req.body;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Citas!A2:A',
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === id);

    if (rowIndex === -1) {
      return res.status(404).json({ success: false, error: 'Cita no encontrada' });
    }

    const values = [[
      cita.id,
      cita.paciente_nombre,
      cita.paciente_telefono,
      cita.paciente_email,
      cita.fecha,
      cita.hora,
      cita.tratamiento,
      cita.doctor,
      cita.estado,
      cita.notas,
      cita.createdAt,
    ]];

    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `Citas!A${rowIndex + 2}:K${rowIndex + 2}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values },
    });

    res.json({ success: true, message: 'Cita actualizada correctamente' });
  } catch (error) {
    console.error('Error al actualizar cita:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Eliminar cita
app.delete('/api/citas/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Citas!A2:A',
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === id);

    if (rowIndex === -1) {
      return res.status(404).json({ success: false, error: 'Cita no encontrada' });
    }

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      resource: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: 0,
              dimension: 'ROWS',
              startIndex: rowIndex + 1,
              endIndex: rowIndex + 2,
            },
          },
        }],
      },
    });

    res.json({ success: true, message: 'Cita eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar cita:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
  console.log(`📊 Conectado a Google Sheets`);
});


