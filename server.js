require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Google Sheets Setup
const auth = new google.auth.GoogleAuth({
  credentials: {
    type: 'service_account',
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: '',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = 'Citas';

// Helper function to convert row to appointment object
function rowToAppointment(row) {
  return {
    id: row[0] || '',
    citMod: row[1] || '',
    fechaAlta: row[2] || '',
    numPac: row[3] || '',
    apellidos: row[4] || '',
    nombre: row[5] || '',
    telMovil: row[6] || '',
    fecha: row[7] || '',
    hora: row[8] || '',
    estadoCita: row[9] || '',
    tratamiento: row[10] || '',
    odontologo: row[11] || '',
    notas: row[12] || '',
    duracion: row[13] || ''
  };
}

// Helper function to convert appointment object to row
function appointmentToRow(apt) {
  return [
    apt.id || '',
    apt.citMod || '',
    apt.fechaAlta || new Date().toISOString().split('T')[0],
    apt.numPac || '',
    apt.apellidos || '',
    apt.nombre || '',
    apt.telMovil || '',
    apt.fecha || '',
    apt.hora || '',
    apt.estadoCita || 'Pendiente',
    apt.tratamiento || '',
    apt.odontologo || '',
    apt.notas || '',
    apt.duracion || '30'
  ];
}

// GET all appointments
app.get('/api/citas', async (req, res) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:N`,
    });

    const rows = response.data.values || [];
    const appointments = rows.map(rowToAppointment);

    res.json({ success: true, data: appointments });
  } catch (error) {
    console.error('Error al obtener citas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST new appointment
app.post('/api/citas', async (req, res) => {
  try {
    const appointment = req.body;
    const row = appointmentToRow(appointment);

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:N`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [row] },
    });

    res.json({ success: true, message: 'Cita creada correctamente' });
  } catch (error) {
    console.error('Error al crear cita:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update appointment
app.put('/api/citas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = req.body;

    // Get all rows
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:N`,
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === id);

    if (rowIndex === -1) {
      return res.status(404).json({ success: false, error: 'Cita no encontrada' });
    }

    const row = appointmentToRow(appointment);
    const sheetRowNumber = rowIndex + 2; // +2 because sheet starts at 1 and we skip header

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A${sheetRowNumber}:N${sheetRowNumber}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [row] },
    });

    res.json({ success: true, message: 'Cita actualizada correctamente' });
  } catch (error) {
    console.error('Error al actualizar cita:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE appointment
app.delete('/api/citas/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get all rows
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:N`,
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === id);

    if (rowIndex === -1) {
      return res.status(404).json({ success: false, error: 'Cita no encontrada' });
    }

    const sheetRowNumber = rowIndex + 2;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: 0,
              dimension: 'ROWS',
              startIndex: sheetRowNumber - 1,
              endIndex: sheetRowNumber
            }
          }
        }]
      }
    });

    res.json({ success: true, message: 'Cita eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar cita:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'API de Agenda Dental funcionando' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
