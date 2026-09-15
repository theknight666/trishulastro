const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'trishulastro.db');
const db = new DatabaseSync(DB_PATH);

// Initialize schema
function initDB() {
  // Bookings Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference_code TEXT UNIQUE NOT NULL,
      client_name TEXT NOT NULL,
      client_email TEXT NOT NULL,
      client_phone TEXT NOT NULL,
      client_dob TEXT NOT NULL,
      client_tob TEXT NOT NULL,
      client_city TEXT NOT NULL,
      service_name TEXT NOT NULL,
      service_price REAL NOT NULL DEFAULT 85,
      astrologer_name TEXT NOT NULL,
      preferred_date TEXT NOT NULL,
      preferred_time_slot TEXT NOT NULL,
      consultation_mode TEXT NOT NULL DEFAULT 'Google Meet Video Call',
      query_topic TEXT,
      status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, completed, cancelled
      meeting_link TEXT DEFAULT '',
      admin_notes TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Notifications Log Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER,
      channel TEXT NOT NULL, -- email, sse, webhook
      recipient TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'sent', -- sent, failed, simulated
      created_at TEXT NOT NULL,
      FOREIGN KEY(booking_id) REFERENCES bookings(id) ON DELETE SET NULL
    );
  `);

  // Settings Table (Key/Value)
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Default settings
  const defaultSettings = [
    { key: 'admin_email', value: 'astrologer@trishulastro.com' },
    { key: 'admin_name', value: 'Pt. Radhe Krishna Shastri' },
    { key: 'admin_pin', value: '1088' },
    { key: 'webhook_url', value: '' },
    { key: 'smtp_host', value: '' },
    { key: 'smtp_port', value: '587' },
    { key: 'smtp_user', value: '' },
    { key: 'smtp_pass', value: '' },
    { key: 'smtp_from', value: 'TrishulAstro <guidance@trishulastro.com>' },
    { key: 'sound_enabled', value: 'true' },
    { key: 'desktop_notifications', value: 'true' },
    { key: 'currency', value: 'USD' }
  ];

  const checkStmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  const insertStmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');

  for (const s of defaultSettings) {
    const existing = checkStmt.get(s.key);
    if (!existing) {
      insertStmt.run(s.key, s.value);
    }
  }

  // Seed initial realistic bookings if table is empty
  const countBookings = db.prepare('SELECT COUNT(*) as cnt FROM bookings').get();
  if (countBookings && countBookings.cnt === 0) {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // Tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const initialBookings = [
      {
        reference_code: 'TA-78412',
        client_name: 'Aarav Singhania',
        client_email: 'aarav.singhania@gmail.com',
        client_phone: '+91 98201 44521',
        client_dob: '1992-08-14',
        client_tob: '06:45',
        client_city: 'Mumbai, India',
        service_name: 'Career, Wealth & Business Yoga ($85)',
        service_price: 85,
        astrologer_name: 'Pt. Radhe Krishna Shastri (28+ yrs exp • Banaras Vedic Scholar)',
        preferred_date: todayStr,
        preferred_time_slot: '02:00 PM - 03:00 PM (Afternoon Muhurta)',
        consultation_mode: 'Google Meet Video Call',
        query_topic: 'Seeking guidance on startup expansion, Saturn Sade Sati transit, and overseas business investment timing.',
        status: 'confirmed',
        meeting_link: 'https://meet.google.com/ved-astr-xyz',
        admin_notes: 'Client is in Jupiter Mahadasha. 10th house looks strong, recommend Pukhraj/Yellow Sapphire energization.',
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 3).toISOString()
      },
      {
        reference_code: 'TA-89204',
        client_name: 'Priya Narang',
        client_email: 'priya.narang@outlook.com',
        client_phone: '+1 (415) 555-8392',
        client_dob: '1995-11-23',
        client_tob: '18:15',
        client_city: 'San Francisco, USA',
        service_name: 'Love, Marriage & Kundli Milan ($85)',
        service_price: 85,
        astrologer_name: 'Dr. Gayatri Devi (22+ yrs exp • Ph.D. Vedic Sciences)',
        preferred_date: tomorrowStr,
        preferred_time_slot: '06:00 PM - 07:00 PM (Evening Sandhya)',
        consultation_mode: 'WhatsApp Video Call',
        query_topic: 'Kundli Milan match analysis for marriage proposal. Partner DOB 1993-04-10, New Delhi.',
        status: 'pending',
        meeting_link: '',
        admin_notes: 'Check 7th house Manglik Dosha and Navamsha D9 placement.',
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        reference_code: 'TA-63910',
        client_name: 'Devendra Kulkarni',
        client_email: 'dev.kulkarni@techcorp.io',
        client_phone: '+91 97412 88902',
        client_dob: '1988-03-09',
        client_tob: '11:20',
        client_city: 'Bengaluru, India',
        service_name: 'Complete Janam Kundli & Life Path ($120)',
        service_price: 120,
        astrologer_name: 'Acharya Devvrat Sharma (19+ yrs exp • Gold Medalist)',
        preferred_date: tomorrowStr,
        preferred_time_slot: '10:00 AM - 11:00 AM (Morning Muhurta)',
        consultation_mode: 'Google Meet Video Call',
        query_topic: 'Comprehensive life path consultation covering career crossroads, ancestral Vastu, and spiritual progression.',
        status: 'pending',
        meeting_link: '',
        admin_notes: '',
        created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 1).toISOString()
      }
    ];

    const insertBooking = db.prepare(`
      INSERT INTO bookings (
        reference_code, client_name, client_email, client_phone,
        client_dob, client_tob, client_city, service_name, service_price,
        astrologer_name, preferred_date, preferred_time_slot,
        consultation_mode, query_topic, status, meeting_link, admin_notes,
        created_at, updated_at
      ) VALUES (
        @reference_code, @client_name, @client_email, @client_phone,
        @client_dob, @client_tob, @client_city, @service_name, @service_price,
        @astrologer_name, @preferred_date, @preferred_time_slot,
        @consultation_mode, @query_topic, @status, @meeting_link, @admin_notes,
        @created_at, @updated_at
      )
    `);

    for (const b of initialBookings) {
      insertBooking.run(b);
    }
  }
}

// Database helper functions
const dbHelpers = {
  db,

  // Bookings
  createBooking(booking) {
    const stmt = db.prepare(`
      INSERT INTO bookings (
        reference_code, client_name, client_email, client_phone,
        client_dob, client_tob, client_city, service_name, service_price,
        astrologer_name, preferred_date, preferred_time_slot,
        consultation_mode, query_topic, status, meeting_link, admin_notes,
        created_at, updated_at
      ) VALUES (
        @reference_code, @client_name, @client_email, @client_phone,
        @client_dob, @client_tob, @client_city, @service_name, @service_price,
        @astrologer_name, @preferred_date, @preferred_time_slot,
        @consultation_mode, @query_topic, @status, @meeting_link, @admin_notes,
        @created_at, @updated_at
      )
    `);
    const info = stmt.run(booking);
    return this.getBookingById(info.lastInsertRowid);
  },

  getAllBookings(filter = {}) {
    let sql = 'SELECT * FROM bookings WHERE 1=1';
    const params = [];

    if (filter.status && filter.status !== 'all') {
      sql += ' AND status = ?';
      params.push(filter.status);
    }

    if (filter.search) {
      sql += ' AND (client_name LIKE ? OR client_email LIKE ? OR client_phone LIKE ? OR reference_code LIKE ? OR astrologer_name LIKE ?)';
      const s = `%${filter.search}%`;
      params.push(s, s, s, s, s);
    }

    if (filter.date) {
      sql += ' AND preferred_date = ?';
      params.push(filter.date);
    }

    sql += ' ORDER BY id DESC';

    if (filter.limit) {
      sql += ' LIMIT ?';
      params.push(Number(filter.limit));
      if (filter.offset) {
        sql += ' OFFSET ?';
        params.push(Number(filter.offset));
      }
    }

    const stmt = db.prepare(sql);
    return stmt.all(...params);
  },

  getBookingById(id) {
    const stmt = db.prepare('SELECT * FROM bookings WHERE id = ?');
    return stmt.get(id);
  },

  getBookingByReference(ref) {
    const stmt = db.prepare('SELECT * FROM bookings WHERE reference_code = ?');
    return stmt.get(ref);
  },

  updateBooking(id, updates) {
    const fields = [];
    const params = [];

    for (const [key, val] of Object.entries(updates)) {
      if (['status', 'meeting_link', 'admin_notes', 'preferred_date', 'preferred_time_slot', 'astrologer_name'].includes(key)) {
        fields.push(`${key} = ?`);
        params.push(val);
      }
    }

    fields.push('updated_at = ?');
    params.push(new Date().toISOString());

    params.push(id);

    const sql = `UPDATE bookings SET ${fields.join(', ')} WHERE id = ?`;
    const stmt = db.prepare(sql);
    stmt.run(...params);

    return this.getBookingById(id);
  },

  deleteBooking(id) {
    const stmt = db.prepare('DELETE FROM bookings WHERE id = ?');
    return stmt.run(id);
  },

  getStats() {
    const total = db.prepare('SELECT COUNT(*) as count FROM bookings').get().count;
    const pending = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'").get().count;
    const confirmed = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'confirmed'").get().count;
    const completed = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'completed'").get().count;
    const cancelled = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'cancelled'").get().count;

    const revenueResult = db.prepare("SELECT SUM(service_price) as total FROM bookings WHERE status IN ('confirmed', 'completed')").get();
    const estRevenue = revenueResult && revenueResult.total ? revenueResult.total : 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const todaySessions = db.prepare('SELECT COUNT(*) as count FROM bookings WHERE preferred_date = ?').get(todayStr).count;

    // Services breakdown
    const services = db.prepare(`
      SELECT service_name, COUNT(*) as count, SUM(service_price) as revenue
      FROM bookings
      GROUP BY service_name
      ORDER BY count DESC
    `).all();

    // Astrologer breakdown
    const astrologers = db.prepare(`
      SELECT astrologer_name, COUNT(*) as count
      FROM bookings
      GROUP BY astrologer_name
      ORDER BY count DESC
    `).all();

    return {
      total,
      pending,
      confirmed,
      completed,
      cancelled,
      estRevenue,
      todaySessions,
      services,
      astrologers
    };
  },

  // Notifications
  logNotification(notif) {
    const stmt = db.prepare(`
      INSERT INTO notifications (booking_id, channel, recipient, title, content, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      notif.booking_id || null,
      notif.channel,
      notif.recipient,
      notif.title,
      notif.content,
      notif.status || 'sent',
      new Date().toISOString()
    );
    return info.lastInsertRowid;
  },

  getRecentNotifications(limit = 30) {
    const stmt = db.prepare(`
      SELECT n.*, b.reference_code, b.client_name
      FROM notifications n
      LEFT JOIN bookings b ON n.booking_id = b.id
      ORDER BY n.id DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  },

  // Settings
  getAllSettings() {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const result = {};
    for (const r of rows) {
      result[r.key] = r.value;
    }
    return result;
  },

  getSetting(key, defaultVal = '') {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return row ? row.value : defaultVal;
  },

  setSetting(key, value) {
    const stmt = db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    stmt.run(key, String(value));
  },

  setManySettings(settingsObj) {
    const stmt = db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    for (const [k, v] of Object.entries(settingsObj)) {
      stmt.run(k, String(v));
    }
  }
};

initDB();

module.exports = dbHelpers;
