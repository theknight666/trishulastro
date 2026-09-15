const path = require('path');
const fs = require('fs');

// Vercel serverless has a read-only root filesystem; /tmp is the only writable directory
const isVercel = Boolean(process.env.VERCEL || process.env.NOW_REGION || process.env.AWS_REGION);
let DB_PATH = path.join(__dirname, 'trishulastro.db');

if (isVercel) {
  DB_PATH = path.join('/tmp', 'trishulastro.db');
  const seedPath = path.join(__dirname, 'trishulastro.db');
  if (!fs.existsSync(DB_PATH) && fs.existsSync(seedPath)) {
    try {
      fs.copyFileSync(seedPath, DB_PATH);
    } catch (e) {
      console.warn('Could not copy seed DB to /tmp:', e);
    }
  }
}

// Try native node:sqlite (Node 22.5+ / Node 24) when running locally
let DatabaseSync = null;
if (!isVercel) {
  try {
    DatabaseSync = require('node:sqlite').DatabaseSync;
  } catch (e) {
    DatabaseSync = null;
  }
}

let db = null;
let useSqlite = false;

if (DatabaseSync) {
  try {
    db = new DatabaseSync(DB_PATH);
    useSqlite = true;
  } catch (err) {
    console.warn('SQLite init failed, falling back to JSON store:', err.message);
    useSqlite = false;
  }
}

// Default settings
const DEFAULT_SETTINGS = {
  admin_email: 'astrologer@trishulastro.com',
  admin_name: 'Pt. Radhe Krishna Shastri',
  admin_pin: '1088',
  admin_password: 'trishul1088',
  webhook_url: '',
  smtp_host: '',
  smtp_port: '587',
  smtp_user: '',
  smtp_pass: '',
  smtp_from: 'TrishulAstro <guidance@trishulastro.com>',
  sound_enabled: 'true',
  desktop_notifications: 'true',
  currency: 'USD'
};

// Seed Bookings (Empty for clean production)
const SEED_BOOKINGS = [];

// -------------------------------------------------------------
// SQLITE IMPLEMENTATION
// -------------------------------------------------------------
if (useSqlite) {
  // Initialize SQLite schema
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
      status TEXT NOT NULL DEFAULT 'pending',
      meeting_link TEXT DEFAULT '',
      admin_notes TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER,
      channel TEXT NOT NULL,
      recipient TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'sent',
      created_at TEXT NOT NULL,
      FOREIGN KEY(booking_id) REFERENCES bookings(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const checkStmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  const insertStmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');

  for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
    if (!checkStmt.get(k)) {
      insertStmt.run(k, String(v));
    }
  }

  const countBookings = db.prepare('SELECT COUNT(*) as cnt FROM bookings').get();
  if (countBookings && countBookings.cnt === 0) {
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
    for (const b of SEED_BOOKINGS) {
      insertBooking.run(b);
    }
  }
}

// -------------------------------------------------------------
// JSON STORE FALLBACK (For Serverless / Node < 22 on Vercel)
// -------------------------------------------------------------
const JSON_FILE = isVercel ? '/tmp/trishulastro.json' : path.join(__dirname, 'trishulastro.json');

function readJSON() {
  try {
    if (fs.existsSync(JSON_FILE)) {
      return JSON.parse(fs.readFileSync(JSON_FILE, 'utf-8'));
    }
  } catch (e) {}
  const initial = {
    bookings: [...SEED_BOOKINGS],
    notifications: [],
    settings: { ...DEFAULT_SETTINGS }
  };
  writeJSON(initial);
  return initial;
}

function writeJSON(data) {
  try {
    fs.writeFileSync(JSON_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not write JSON file store:', e.message);
  }
}

// -------------------------------------------------------------
// UNIFIED DATABASE HELPER METHODS
// -------------------------------------------------------------
const dbHelpers = {
  db,
  useSqlite,

  createBooking(booking) {
    if (useSqlite) {
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
    } else {
      const data = readJSON();
      const newId = data.bookings.length > 0 ? Math.max(...data.bookings.map(b => b.id || 0)) + 1 : 1;
      const newBooking = { id: newId, ...booking };
      data.bookings.unshift(newBooking);
      writeJSON(data);
      return newBooking;
    }
  },

  getAllBookings(filter = {}) {
    if (useSqlite) {
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
    } else {
      const data = readJSON();
      let list = [...data.bookings];

      if (filter.status && filter.status !== 'all') {
        list = list.filter(b => b.status === filter.status);
      }
      if (filter.search) {
        const s = filter.search.toLowerCase();
        list = list.filter(b => 
          (b.client_name && b.client_name.toLowerCase().includes(s)) ||
          (b.client_email && b.client_email.toLowerCase().includes(s)) ||
          (b.client_phone && b.client_phone.toLowerCase().includes(s)) ||
          (b.reference_code && b.reference_code.toLowerCase().includes(s)) ||
          (b.astrologer_name && b.astrologer_name.toLowerCase().includes(s))
        );
      }
      if (filter.date) {
        list = list.filter(b => b.preferred_date === filter.date);
      }
      return list;
    }
  },

  getBookingById(id) {
    if (useSqlite) {
      const stmt = db.prepare('SELECT * FROM bookings WHERE id = ?');
      return stmt.get(id);
    } else {
      const data = readJSON();
      return data.bookings.find(b => String(b.id) === String(id)) || null;
    }
  },

  getBookingByReference(ref) {
    if (useSqlite) {
      const stmt = db.prepare('SELECT * FROM bookings WHERE reference_code = ?');
      return stmt.get(ref);
    } else {
      const data = readJSON();
      return data.bookings.find(b => b.reference_code === ref) || null;
    }
  },

  updateBooking(id, updates) {
    if (useSqlite) {
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
    } else {
      const data = readJSON();
      const idx = data.bookings.findIndex(b => String(b.id) === String(id));
      if (idx !== -1) {
        data.bookings[idx] = {
          ...data.bookings[idx],
          ...updates,
          updated_at: new Date().toISOString()
        };
        writeJSON(data);
        return data.bookings[idx];
      }
      return null;
    }
  },

  deleteBooking(id) {
    if (useSqlite) {
      const stmt = db.prepare('DELETE FROM bookings WHERE id = ?');
      return stmt.run(id);
    } else {
      const data = readJSON();
      data.bookings = data.bookings.filter(b => String(b.id) !== String(id));
      writeJSON(data);
      return true;
    }
  },

  clearAllBookings() {
    if (useSqlite) {
      db.prepare('DELETE FROM bookings').run();
      try { db.prepare("DELETE FROM sqlite_sequence WHERE name = 'bookings'").run(); } catch (e) {}
      return true;
    } else {
      const data = readJSON();
      data.bookings = [];
      writeJSON(data);
      return true;
    }
  },

  clearAllNotifications() {
    if (useSqlite) {
      db.prepare('DELETE FROM notifications').run();
      try { db.prepare("DELETE FROM sqlite_sequence WHERE name = 'notifications'").run(); } catch (e) {}
      return true;
    } else {
      const data = readJSON();
      data.notifications = [];
      writeJSON(data);
      return true;
    }
  },

  getStats() {
    const bookings = this.getAllBookings();
    const total = bookings.length;
    const pending = bookings.filter(b => b.status === 'pending').length;
    const confirmed = bookings.filter(b => b.status === 'confirmed').length;
    const completed = bookings.filter(b => b.status === 'completed').length;
    const cancelled = bookings.filter(b => b.status === 'cancelled').length;

    const estRevenue = bookings
      .filter(b => ['confirmed', 'completed'].includes(b.status))
      .reduce((sum, b) => sum + (parseFloat(b.service_price) || 0), 0);

    const todayStr = new Date().toISOString().split('T')[0];
    const todaySessions = bookings.filter(b => b.preferred_date === todayStr).length;

    return {
      total,
      pending,
      confirmed,
      completed,
      cancelled,
      estRevenue,
      todaySessions
    };
  },

  logNotification(notif) {
    if (useSqlite) {
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
    } else {
      const data = readJSON();
      const newNotif = {
        id: (data.notifications.length + 1),
        ...notif,
        created_at: new Date().toISOString()
      };
      data.notifications.unshift(newNotif);
      writeJSON(data);
      return newNotif.id;
    }
  },

  getRecentNotifications(limit = 30) {
    if (useSqlite) {
      const stmt = db.prepare(`
        SELECT n.*, b.reference_code, b.client_name
        FROM notifications n
        LEFT JOIN bookings b ON n.booking_id = b.id
        ORDER BY n.id DESC
        LIMIT ?
      `);
      return stmt.all(limit);
    } else {
      const data = readJSON();
      return (data.notifications || []).slice(0, limit);
    }
  },

  getAllSettings() {
    if (useSqlite) {
      const rows = db.prepare('SELECT key, value FROM settings').all();
      const result = {};
      for (const r of rows) result[r.key] = r.value;
      return result;
    } else {
      const data = readJSON();
      return { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
    }
  },

  getSetting(key, defaultVal = '') {
    if (useSqlite) {
      const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
      return row ? row.value : defaultVal;
    } else {
      const settings = this.getAllSettings();
      return settings[key] !== undefined ? settings[key] : defaultVal;
    }
  },

  setSetting(key, value) {
    if (useSqlite) {
      const stmt = db.prepare(`
        INSERT INTO settings (key, value) VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `);
      stmt.run(key, String(value));
    } else {
      const data = readJSON();
      data.settings = data.settings || {};
      data.settings[key] = String(value);
      writeJSON(data);
    }
  },

  setManySettings(settingsObj) {
    for (const [k, v] of Object.entries(settingsObj)) {
      this.setSetting(k, v);
    }
  }
};

module.exports = dbHelpers;
