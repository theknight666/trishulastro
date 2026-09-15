const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('./db');
const notifications = require('./notifications');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper: Vedic Sign Calculator for instant astrologer insight
function calculateVedicSigns(dobStr) {
  try {
    const dob = new Date(dobStr);
    const m = dob.getMonth() + 1; // 1-12
    const d = dob.getDate();

    // Tropical/Sidereal Sun approximation
    const signs = [
      { name: 'Mesha (Aries)', ruler: 'Mangal (Mars)', element: 'Fire', from: [3, 21], to: [4, 19] },
      { name: 'Vrishabha (Taurus)', ruler: 'Shukra (Venus)', element: 'Earth', from: [4, 20], to: [5, 20] },
      { name: 'Mithuna (Gemini)', ruler: 'Budha (Mercury)', element: 'Air', from: [5, 21], to: [6, 20] },
      { name: 'Karka (Cancer)', ruler: 'Chandra (Moon)', element: 'Water', from: [6, 21], to: [7, 22] },
      { name: 'Simha (Leo)', ruler: 'Surya (Sun)', element: 'Fire', from: [7, 23], to: [8, 22] },
      { name: 'Kanya (Virgo)', ruler: 'Budha (Mercury)', element: 'Earth', from: [8, 23], to: [9, 22] },
      { name: 'Tula (Libra)', ruler: 'Shukra (Venus)', element: 'Air', from: [9, 23], to: [10, 22] },
      { name: 'Vrishchika (Scorpio)', ruler: 'Mangal / Ketu', element: 'Water', from: [10, 23], to: [11, 21] },
      { name: 'Dhanu (Sagittarius)', ruler: 'Guru (Jupiter)', element: 'Fire', from: [11, 22], to: [12, 21] },
      { name: 'Makara (Capricorn)', ruler: 'Shani (Saturn)', element: 'Earth', from: [12, 22], to: [1, 19] },
      { name: 'Kumbha (Aquarius)', ruler: 'Shani / Rahu', element: 'Air', from: [1, 20], to: [2, 18] },
      { name: 'Meena (Pisces)', ruler: 'Guru (Jupiter)', element: 'Water', from: [2, 19], to: [3, 20] }
    ];

    let matched = signs[0];
    for (const s of signs) {
      if (
        (m === s.from[0] && d >= s.from[1]) ||
        (m === s.to[0] && d <= s.to[1])
      ) {
        matched = s;
        break;
      }
    }

    return {
      approxSunSign: matched.name,
      rulingGraha: matched.ruler,
      element: matched.element,
      nakshatraEstimate: 'Requires ephemeris calculation during live session',
      auspiciousGemstone: matched.ruler.includes('Jupiter') ? 'Yellow Sapphire (Pukhraj)' :
                          matched.ruler.includes('Venus') ? 'Diamond / White Zircon' :
                          matched.ruler.includes('Mars') ? 'Red Coral (Moonga)' :
                          matched.ruler.includes('Saturn') ? 'Blue Sapphire (Neelam)' :
                          matched.ruler.includes('Mercury') ? 'Emerald (Panna)' :
                          matched.ruler.includes('Sun') ? 'Ruby (Manikya)' : 'Natural Pearl (Moti)'
    };
  } catch (e) {
    return { approxSunSign: 'Vedic Analysis Pending' };
  }
}

// -------------------------------------------------------------
// REST API ROUTER (Mounts on both /api and / for Vercel + Local)
// -------------------------------------------------------------
const apiRouter = express.Router();

// 1. Real-Time SSE Stream for Admin Console
apiRouter.get('/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  res.write('event: connected\ndata: {"status":"connected","timestamp":"' + new Date().toISOString() + '"}\n\n');
  notifications.addSSEClient(res);

  req.on('close', () => {
    notifications.removeSSEClient(res);
  });
});

// 2. Create Booking
apiRouter.post('/bookings', async (req, res) => {
  try {
    const {
      client_name,
      client_email,
      client_phone,
      client_dob,
      client_tob,
      client_city,
      service_name,
      astrologer_name,
      preferred_date,
      preferred_time_slot,
      consultation_mode,
      query_topic
    } = req.body;

    if (!client_name || !client_email || !client_phone || !client_dob) {
      return res.status(400).json({ error: 'Client name, email, phone, and date of birth are required.' });
    }

    let servicePrice = 85;
    if (service_name) {
      const match = service_name.match(/\$(\d+)/);
      if (match) servicePrice = parseFloat(match[1]);
    }

    const refCode = 'TA-' + Math.floor(10000 + Math.random() * 90000);
    const nowIso = new Date().toISOString();

    const bookingPayload = {
      reference_code: refCode,
      client_name: client_name.trim(),
      client_email: client_email.trim(),
      client_phone: client_phone.trim(),
      client_dob: client_dob || '1995-01-01',
      client_tob: client_tob || '12:00',
      client_city: client_city ? client_city.trim() : 'Unspecified',
      service_name: service_name || 'Vedic Astrology Consultation',
      service_price: servicePrice,
      astrologer_name: astrologer_name || 'Pt. Radhe Krishna Shastri',
      preferred_date: preferred_date || nowIso.split('T')[0],
      preferred_time_slot: preferred_time_slot || '10:00 AM - 11:00 AM',
      consultation_mode: consultation_mode || 'Google Meet',
      query_topic: query_topic ? query_topic.trim() : '',
      status: 'pending',
      meeting_link: '',
      admin_notes: '',
      created_at: nowIso,
      updated_at: nowIso
    };

    const newBooking = db.createBooking(bookingPayload);

    notifications.notifyNewBooking(newBooking).catch(err => {
      console.error('Notification dispatch failure:', err);
    });

    res.status(201).json({
      success: true,
      message: `Auspicious Consultation Pass #${refCode} created successfully!`,
      booking: newBooking
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Internal sacred sanctum error: ' + error.message });
  }
});

// 3. Get All Bookings
apiRouter.get('/bookings', (req, res) => {
  try {
    const { status, search, date, limit, offset } = req.query;
    const bookings = db.getAllBookings({ status, search, date, limit, offset });
    res.json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Get Single Booking with calculated Vedic astro parameters
apiRouter.get('/bookings/:id', (req, res) => {
  try {
    const booking = db.getBookingById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const astroMeta = calculateVedicSigns(booking.client_dob);

    res.json({
      success: true,
      booking,
      astrologicalAnalysis: astroMeta
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Update Booking Status / Meeting Link / Notes
apiRouter.patch('/bookings/:id', (req, res) => {
  try {
    const existing = db.getBookingById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const updated = db.updateBooking(req.params.id, req.body);

    notifications.broadcastSSE('booking_updated', {
      booking: updated,
      message: `Booking #${updated.reference_code} updated (${updated.status})`
    });

    res.json({ success: true, booking: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Delete Booking
apiRouter.delete('/bookings/:id', (req, res) => {
  try {
    db.deleteBooking(req.params.id);
    notifications.broadcastSSE('booking_deleted', { id: req.params.id });
    res.json({ success: true, message: 'Booking removed from registry.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Executive Stats & Analytics
apiRouter.get('/stats', (req, res) => {
  try {
    const stats = db.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Notification Logs
apiRouter.get('/notifications', (req, res) => {
  try {
    const notifs = db.getRecentNotifications(50);
    res.json({ success: true, notifications: notifs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 9. Send Test Notification
apiRouter.post('/notifications/test', async (req, res) => {
  try {
    const result = await notifications.dispatchTestNotification();
    res.json({ success: true, result, message: 'Test notification triggered successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 10. Admin Settings Management
apiRouter.get('/settings', (req, res) => {
  try {
    const settings = db.getAllSettings();
    if (settings.smtp_pass) {
      settings.smtp_pass_set = true;
      settings.smtp_pass = '••••••••';
    } else {
      settings.smtp_pass_set = false;
    }
    if (settings.admin_password) {
      settings.admin_password_set = true;
      settings.admin_password = '••••••••';
    }
    if (settings.admin_pin) {
      settings.admin_pin_set = true;
    }
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post('/settings', (req, res) => {
  try {
    const incoming = req.body;
    if (incoming.smtp_pass === '••••••••') delete incoming.smtp_pass;
    if (incoming.admin_password === '••••••••') delete incoming.admin_password;

    db.setManySettings(incoming);
    res.json({ success: true, message: 'Settings saved successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 11. Admin Authentication (Password & PIN)
apiRouter.post('/auth/login', (req, res) => {
  try {
    const { password, pin } = req.body;
    const correctPassword = db.getSetting('admin_password', 'trishul1088');
    const correctPin = db.getSetting('admin_pin', '1088');

    const isPassValid = password && String(password).trim() === String(correctPassword).trim();
    const isPinValid = pin && String(pin).trim() === String(correctPin).trim();

    if (isPassValid || isPinValid) {
      res.json({
        success: true,
        token: 'sanctum-auth-' + Date.now(),
        adminName: db.getSetting('admin_name', 'Pt. Radhe Krishna Shastri'),
        message: 'Auspicious entry granted to the Sanctum.'
      });
    } else {
      res.status(401).json({ error: 'Incorrect Sanctum Password. Access denied.' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Change Password Endpoint
apiRouter.post('/auth/change-password', (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const actualPassword = db.getSetting('admin_password', 'trishul1088');

    if (String(currentPassword).trim() !== String(actualPassword).trim()) {
      return res.status(400).json({ error: 'Current password does not match.' });
    }

    if (!newPassword || newPassword.trim().length < 4) {
      return res.status(400).json({ error: 'New password must be at least 4 characters.' });
    }

    db.setSetting('admin_password', newPassword.trim());
    res.json({ success: true, message: 'Sanctum password updated successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mount router on both /api (standard) and / (Vercel serverless prefix-strip fallback)
app.use('/api', apiRouter);
app.use('/', apiRouter);

// -------------------------------------------------------------
// STATIC FILES & SPA FALLBACK
// -------------------------------------------------------------

// Serve Admin Console
app.get('/admin', (req, res) => {
  res.redirect('/admin.html');
});

// Serve root and all other static assets
app.use(express.static(__dirname));

app.use((req, res) => {
  if (req.accepts('html')) {
    res.redirect('/index.html');
  } else {
    res.status(404).send('Not Found');
  }
});

// Start Server locally if run directly
if (require.main === module || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n========================================================`);
    console.log(`⚜ TRISHULASTRO VEDIC PLATFORM & BACKEND RUNNING`);
    console.log(`   Client Sanctum:   http://localhost:${PORT}/`);
    console.log(`   Astrologer Admin: http://localhost:${PORT}/admin`);
    console.log(`   Real-Time SSE:    http://localhost:${PORT}/api/events`);
    console.log(`========================================================\n`);
  });
}

module.exports = app;
