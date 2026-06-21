const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DB_DIR, 'bookings.db');

const db = new sqlite3.Database(DB_FILE);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      course TEXT NOT NULL,
      dateText TEXT NOT NULL,
      selectedTime TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      bookingText TEXT NOT NULL,
      screenshot TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `);
});

function getAllBookings(callback) {
  db.all('SELECT * FROM bookings ORDER BY id DESC', (err, rows) => {
    callback(err, rows);
  });
}

function addBooking(booking, callback) {
  const stmt = db.prepare(`
    INSERT INTO bookings (name, course, dateText, selectedTime, phone, email, bookingText, screenshot, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    booking.name,
    booking.course,
    booking.dateText,
    booking.selectedTime,
    booking.phone,
    booking.email,
    booking.bookingText,
    booking.screenshot,
    new Date().toISOString(),
    function (err) {
      callback(err, { id: this.lastID, ...booking });
    }
  );
  stmt.finalize();
}

module.exports = {
  getAllBookings,
  addBooking,
};
