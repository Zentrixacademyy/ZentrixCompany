const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');

const DATA_DIR = path.join(__dirname, 'data');
const ADMIN_PASSPHRASE = 'zentrix';

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = require('./db');

const app = express();
app.use(helmet());
app.use(cors());
app.use(bodyParser.json({ limit: '8mb' }));

// Public: add booking
app.post('/api/bookings', (req, res) => {
  const payload = req.body;
  if (!payload || !payload.name || !payload.bookingText) {
    return res.status(400).json({ error: 'invalid booking' });
  }
  db.addBooking(payload, (err, newBooking) => {
    if (err) {
      console.error('addBooking error', err);
      return res.status(500).json({ error: 'failed to save booking' });
    }
    res.json({ ok: true, booking: newBooking });
  });
});

// Admin: list bookings (simple passphrase auth via query param)
app.get('/api/bookings', (req, res) => {
  const pass = req.query.pass || req.get('x-admin-pass');
  if (!pass || pass !== ADMIN_PASSPHRASE) return res.status(401).json({ error: 'unauthorized' });
  db.getAllBookings((err, rows) => {
    if (err) {
      console.error('getAllBookings error', err);
      return res.status(500).json({ error: 'failed to read bookings' });
    }
    res.json({ ok: true, bookings: rows });
  });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Zentrix API listening on http://localhost:${port}`));
