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

    // Tropical/Sidereal Sun approximation (Lahiri Ayanamsha offset ~23-24 deg)
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
// REST API ROUTES
// -------------------------------------------------------------

// 1. Real-Time SSE Stream for Admin Console
app.get('/api/events', (req, res) => {
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

// 2. Create Booking (Submitted from client website)
app.post('/api/bookings', async (req, res) => {
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

    // Validation
    if (!client_name || !client_email || !client_phone || !client_dob) {
      return res.status(400).json({ error: 'Client name, email, phone, and date of birth are required.' });
    }

    // Extract price from service string if applicable (e.g. "Complete Janam Kundli & Life Path ($120)")
    let servicePrice = 85;
    if (service_name) {
      const match = service_name.match(/\$(\d+)/);
      if (match) servicePrice = parseFloat(match[1]);
    }

    // Generate distinctive Vedic Booking Reference Code
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
      service_name: service_name || 'Vedic Astrology Consultation ($85)',
      service_price: servicePrice,
      astrologer_name: astrologer_name || 'Pt. Radhe Krishna Shastri (28+ yrs exp • Banaras Vedic Scholar)',
      preferred_date: preferred_date || nowIso.split('T')[0],
      preferred_time_slot: preferred_time_slot || '10:00 AM - 11:00 AM (Morning Muhurta)',
      consultation_mode: consultation_mode || 'Google Meet Video Call',
      query_topic: query_topic ? query_topic.trim() : '',
      status: 'pending',
      meeting_link: '',
      admin_notes: '',
      created_at: nowIso,
      updated_at: nowIso
    };

    const newBooking = db.createBooking(bookingPayload);

    // Trigger instant notifications across all active channels (SSE, Email, Webhook)
    // Non-blocking so response is swift
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

// 3. Get All Bookings (with filtering & search)
app.get('/api/bookings', (req, res) => {
  try {
    const { status, search, date, limit, offset } = req.query;
    const bookings = db.getAllBookings({ status, search, date, limit, offset });
    res.json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    console.error('Error querying bookings:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Get Single Booking with calculated Vedic astro parameters
app.get('/api/bookings/:id', (req, res) => {
  try {
    const booking = db.getBookingById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Add astrological calculation preview
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
app.patch('/api/bookings/:id', (req, res) => {
  try {
    const existing = db.getBookingById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const updated = db.updateBooking(req.params.id, req.body);

    // Broadcast update via SSE
    notifications.broadcastSSE('booking_updated', {
      booking: updated,
      message: `Booking #${updated.reference_code} updated (${updated.status})`
    });

    res.json({ success: true, booking: updated });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ error: error.message });
  }
});

// 6. Delete Booking
app.delete('/api/bookings/:id', (req, res) => {
  try {
    db.deleteBooking(req.params.id);
    notifications.broadcastSSE('booking_deleted', { id: req.params.id });
    res.json({ success: true, message: 'Booking removed from registry.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Executive Stats & Analytics
app.get('/api/stats', (req, res) => {
  try {
    const stats = db.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Notification Logs
app.get('/api/notifications', (req, res) => {
  try {
    const notifs = db.getRecentNotifications(50);
    res.json({ success: true, notifications: notifs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 9. Send Test Notification
app.post('/api/notifications/test', async (req, res) => {
  try {
    const result = await notifications.dispatchTestNotification();
    res.json({ success: true, result, message: 'Test notification triggered successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 10. Admin Settings Management
app.get('/api/settings', (req, res) => {
  try {
    const settings = db.getAllSettings();
    // Mask sensitive password before returning to frontend
    if (settings.smtp_pass) {
      settings.smtp_pass_set = true;
      settings.smtp_pass = '••••••••';
    } else {
      settings.smtp_pass_set = false;
    }
    // Mask PIN partially
    if (settings.admin_pin) {
      settings.admin_pin_set = true;
    }
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/settings', (req, res) => {
  try {
    const incoming = req.body;
    // Don't overwrite password with masked value
    if (incoming.smtp_pass === '••••••••') {
      delete incoming.smtp_pass;
    }
    db.setManySettings(incoming);
    res.json({ success: true, message: 'Settings saved successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 11. Admin Authentication
app.post('/api/auth/login', (req, res) => {
  try {
    const { pin } = req.body;
    const correctPin = db.getSetting('admin_pin', '1088');
    if (String(pin) === String(correctPin)) {
      res.json({ success: true, token: 'vedic-admin-' + Date.now() });
    } else {
      res.status(401).json({ error: 'Incorrect Sacred Security PIN. Please re-enter.' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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

// Start Server
app.listen(PORT, () => {
  console.log(`\n========================================================`);
  console.log(`⚜ TRISHULASTRO VEDIC PLATFORM & BACKEND RUNNING`);
  console.log(`   Client Sanctum:   http://localhost:${PORT}/`);
  console.log(`   Astrologer Admin: http://localhost:${PORT}/admin`);
  console.log(`   Real-Time SSE:    http://localhost:${PORT}/api/events`);
  console.log(`========================================================\n`);
});
