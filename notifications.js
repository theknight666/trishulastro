const nodemailer = require('nodemailer');
const db = require('./db');

// Set of active SSE client connections
const sseClients = new Set();

// Register SSE client
function addSSEClient(res) {
  sseClients.add(res);
}

// Remove SSE client
function removeSSEClient(res) {
  sseClients.delete(res);
}

// Broadcast SSE event to all connected admin consoles
function broadcastSSE(eventType, data) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch (err) {
      sseClients.delete(client);
    }
  }
}

// Keepalive heartbeat
const keepaliveTimer = setInterval(() => {
  for (const client of sseClients) {
    try {
      client.write(':keepalive\n\n');
    } catch (err) {
      sseClients.delete(client);
    }
  }
}, 20000);
if (keepaliveTimer.unref) keepaliveTimer.unref();

// Get transporter for email
async function getEmailTransporter() {
  const host = db.getSetting('smtp_host');
  const port = db.getSetting('smtp_port', '587');
  const user = db.getSetting('smtp_user');
  const pass = db.getSetting('smtp_pass');

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465,
      auth: { user, pass }
    });
  }

  // If no SMTP configured, return null (handled gracefully with simulation log)
  return null;
}

// Generate luxury Vedic Astrologer Alert Email HTML
function generateAstrologerEmailHTML(booking) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #0b0c10; color: #ffffff; margin: 0; padding: 20px; }
      .container { max-width: 620px; margin: 0 auto; background: #12131a; border: 1px solid #f5c767; border-radius: 12px; overflow: hidden; }
      .header { background: linear-gradient(135deg, #1b1c26 0%, #08080c 100%); padding: 28px 24px; text-align: center; border-bottom: 2px solid #f5c767; }
      .logo { font-size: 26px; font-weight: bold; color: #f5c767; letter-spacing: 2px; }
      .sub { font-size: 13px; color: #79dce8; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 6px; }
      .content { padding: 24px; }
      .alert-badge { display: inline-block; background: rgba(74, 222, 128, 0.15); border: 1px solid #4ade80; color: #4ade80; font-size: 12px; font-weight: bold; padding: 4px 12px; border-radius: 20px; margin-bottom: 16px; }
      .title { font-size: 20px; font-weight: 600; color: #ffffff; margin-bottom: 8px; }
      .kundli-box { background: rgba(245, 199, 103, 0.05); border: 1px dashed rgba(245, 199, 103, 0.35); border-radius: 8px; padding: 16px; margin: 18px 0; }
      .item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 14px; }
      .item:last-child { border-bottom: none; }
      .label { color: rgba(255,255,255,0.6); }
      .val { color: #f5c767; font-weight: 600; }
      .val-light { color: #ffffff; font-weight: 500; }
      .query-box { background: #191a24; border-left: 3px solid #79dce8; padding: 14px; margin: 16px 0; font-size: 14px; line-height: 1.5; color: #e2e8f0; }
      .btn { display: inline-block; background: #f5c767; color: #071227; font-weight: bold; text-decoration: none; padding: 12px 28px; border-radius: 24px; text-transform: uppercase; font-size: 13px; letter-spacing: 1px; margin-top: 14px; }
      .footer { background: #08080c; text-align: center; padding: 16px; font-size: 12px; color: rgba(255,255,255,0.4); border-top: 1px solid rgba(255,255,255,0.08); }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo">⚜ TRISHULASTRO</div>
        <div class="sub">Sacred Consultation Notification</div>
      </div>
      <div class="content">
        <span class="alert-badge">⚡ NEW SESSION BOOKED</span>
        <div class="title">New Consultation Request #${booking.reference_code}</div>
        <p style="color:rgba(255,255,255,0.7); font-size:14px; line-height:1.5;">
          A devotee has requested a personalized Vedic consultation. Detailed birth chart parameters and preferred slot are presented below:
        </p>

        <div class="kundli-box">
          <div style="font-weight:600; color:#79dce8; margin-bottom:10px; font-size:13px; text-transform:uppercase; letter-spacing:1px;">Client & Birth Chart Data</div>
          <div class="item"><span class="label">Devotee Name:</span> <span class="val-light">${booking.client_name}</span></div>
          <div class="item"><span class="label">Email Address:</span> <span class="val-light">${booking.client_email}</span></div>
          <div class="item"><span class="label">Phone / WhatsApp:</span> <span class="val-light">${booking.client_phone}</span></div>
          <div class="item"><span class="label">Date of Birth:</span> <span class="val">${booking.client_dob}</span></div>
          <div class="item"><span class="label">Exact Time of Birth:</span> <span class="val">${booking.client_tob}</span></div>
          <div class="item"><span class="label">Place of Birth:</span> <span class="val">${booking.client_city}</span></div>
        </div>

        <div class="kundli-box">
          <div style="font-weight:600; color:#79dce8; margin-bottom:10px; font-size:13px; text-transform:uppercase; letter-spacing:1px;">Session Specifications</div>
          <div class="item"><span class="label">Consultation Focus:</span> <span class="val">${booking.service_name}</span></div>
          <div class="item"><span class="label">Fee / Energy Exchange:</span> <span class="val">$${booking.service_price}</span></div>
          <div class="item"><span class="label">Assigned Scholar:</span> <span class="val-light">${booking.astrologer_name}</span></div>
          <div class="item"><span class="label">Preferred Date:</span> <span class="val">${booking.preferred_date}</span></div>
          <div class="item"><span class="label">Preferred Muhurta Slot:</span> <span class="val">${booking.preferred_time_slot}</span></div>
          <div class="item"><span class="label">Consultation Medium:</span> <span class="val-light">${booking.consultation_mode}</span></div>
        </div>

        ${booking.query_topic ? `
          <div style="font-size:13px; color:rgba(255,255,255,0.7); font-weight:600; text-transform:uppercase; letter-spacing:1px; margin-top:14px;">Devotee's Questions & Focus:</div>
          <div class="query-box">"${booking.query_topic}"</div>
        ` : ''}

        <div style="text-align: center; margin-top: 20px;">
          <a href="http://localhost:3000/admin" class="btn">Open Astrologer Sanctum Dashboard</a>
        </div>
      </div>
      <div class="footer">
        TrishulAstro Vedic Astrological Services • Real-Time Consultation Notification System
      </div>
    </div>
  </body>
  </html>
  `;
}

// Generate luxury Vedic Appointment Pass Email for the Client
function generateClientEmailHTML(booking) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #050608; color: #ffffff; margin: 0; padding: 20px; }
      .card { max-width: 600px; margin: 0 auto; background: #0e0f16; border: 2px solid #f5c767; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.8); }
      .top { background: linear-gradient(135deg, #181924 0%, #06070a 100%); padding: 32px 24px; text-align: center; border-bottom: 1px solid rgba(245,199,103,0.3); }
      .om { font-size: 32px; color: #f5c767; margin-bottom: 8px; }
      .brand { font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: 2px; }
      .ref-tag { display: inline-block; background: rgba(245,199,103,0.15); border: 1px solid #f5c767; color: #f5c767; padding: 6px 18px; border-radius: 30px; font-weight: bold; margin-top: 14px; font-size: 14px; letter-spacing: 1px; }
      .body { padding: 28px; font-size: 14px; line-height: 1.6; color: #cbd5e1; }
      .greeting { font-size: 18px; color: #ffffff; font-weight: 600; margin-bottom: 12px; }
      .detail-grid { background: #151620; border-radius: 10px; padding: 18px; margin: 20px 0; border: 1px solid rgba(255,255,255,0.08); }
      .row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
      .row:last-child { border-bottom: none; }
      .row-lbl { color: #94a3b8; }
      .row-val { color: #f5c767; font-weight: 600; }
      .status-box { background: rgba(74,222,128,0.1); border: 1px solid #4ade80; color: #4ade80; padding: 12px; border-radius: 8px; text-align: center; font-size: 13px; margin: 18px 0; }
      .footer { background: #06070a; text-align: center; padding: 18px; font-size: 12px; color: #64748b; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="top">
        <div class="om">ॐ</div>
        <div class="brand">TRISHULASTRO</div>
        <div style="color:#79dce8; font-size:12px; letter-spacing:2px; text-transform:uppercase; margin-top:4px;">Sacred Vedic Appointment Pass</div>
        <div class="ref-tag">PASS REF: ${booking.reference_code}</div>
      </div>
      <div class="body">
        <div class="greeting">Namaste ${booking.client_name},</div>
        <p>
          Your request for an authentic 1-on-1 Vedic Consultation has been received into the sanctum. Our Master Astrologer has been alerted in real-time.
        </p>

        <div class="status-box">
          ✦ Muhurta Status: <strong>Under Auspicious Review</strong> — The astrologer will confirm your slot & share your direct session link shortly.
        </div>

        <div class="detail-grid">
          <div class="row"><span class="row-lbl">Service:</span> <span class="row-val">${booking.service_name}</span></div>
          <div class="row"><span class="row-lbl">Assigned Scholar:</span> <span class="row-val" style="color:#ffffff;">${booking.astrologer_name}</span></div>
          <div class="row"><span class="row-lbl">Preferred Date:</span> <span class="row-val">${booking.preferred_date}</span></div>
          <div class="row"><span class="row-lbl">Preferred Muhurta:</span> <span class="row-val">${booking.preferred_time_slot}</span></div>
          <div class="row"><span class="row-lbl">Mode:</span> <span class="row-val" style="color:#79dce8;">${booking.consultation_mode}</span></div>
          <div class="row"><span class="row-lbl">Birth Record:</span> <span class="row-val">${booking.client_dob} at ${booking.client_tob} (${booking.client_city})</span></div>
        </div>

        <p style="font-size: 13px; color: #94a3b8;">
          <strong>Preparation Tip:</strong> Before your session, ensure you are seated in a peaceful room facing East or North. Have a glass of pure water beside you.
        </p>
      </div>
      <div class="footer">
        May Surya, Brihaspati, and Lord Shiva bless your path.<br>
        TrishulAstro Sanctuary • Banaras & Worldwide
      </div>
    </div>
  </body>
  </html>
  `;
}

// Webhook dispatcher (Discord/Slack/Telegram)
async function sendWebhookNotification(booking) {
  const webhookUrl = db.getSetting('webhook_url');
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return { status: 'skipped', reason: 'No webhook URL configured' };
  }

  try {
    const isDiscord = webhookUrl.includes('discord.com');
    const isSlack = webhookUrl.includes('slack.com');

    let body;
    if (isDiscord) {
      body = JSON.stringify({
        content: `🚨 **New TrishulAstro Session Booked!** Pass: \`${booking.reference_code}\``,
        embeds: [
          {
            title: `✨ ${booking.service_name}`,
            description: `**Client:** ${booking.client_name}\n**Phone/WhatsApp:** ${booking.client_phone}\n**Email:** ${booking.client_email}`,
            color: 16107367, // Gold #F5C767
            fields: [
              { name: 'Preferred Date & Slot', value: `${booking.preferred_date} | ${booking.preferred_time_slot}`, inline: false },
              { name: 'Birth Details', value: `${booking.client_dob} at ${booking.client_tob}, ${booking.client_city}`, inline: true },
              { name: 'Mode', value: booking.consultation_mode, inline: true },
              { name: 'Assigned Astrologer', value: booking.astrologer_name, inline: false },
              { name: 'Devotee Query', value: booking.query_topic || 'Standard Kundli reading', inline: false }
            ],
            footer: { text: 'TrishulAstro Sanctum • Real-Time Alert' },
            timestamp: new Date().toISOString()
          }
        ]
      });
    } else if (isSlack) {
      body = JSON.stringify({
        text: `*New TrishulAstro Session Booked!*\n*Client:* ${booking.client_name} (${booking.client_phone})\n*Service:* ${booking.service_name}\n*Slot:* ${booking.preferred_date} (${booking.preferred_time_slot})\n*Ref:* ${booking.reference_code}`
      });
    } else {
      // Generic Webhook JSON payload
      body = JSON.stringify({
        event: 'booking.created',
        timestamp: new Date().toISOString(),
        booking
      });
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });

    const ok = response.ok;
    db.logNotification({
      booking_id: booking.id,
      channel: 'webhook',
      recipient: webhookUrl.substring(0, 40) + '...',
      title: `Webhook Alert: ${booking.reference_code}`,
      content: `Dispatched to webhook status: ${response.status}`,
      status: ok ? 'sent' : 'failed'
    });

    return { status: ok ? 'sent' : 'failed', statusCode: response.status };
  } catch (err) {
    console.error('Error dispatching webhook:', err.message);
    db.logNotification({
      booking_id: booking.id,
      channel: 'webhook',
      recipient: webhookUrl.substring(0, 40) + '...',
      title: `Webhook Error: ${booking.reference_code}`,
      content: err.message,
      status: 'failed'
    });
    return { status: 'failed', error: err.message };
  }
}

// Master Dispatcher for when someone books a session
async function notifyNewBooking(booking) {
  const results = {
    sse: false,
    emailAdmin: false,
    emailClient: false,
    webhook: false
  };

  // 1. Instant Real-Time Push to open Admin Dashboards (SSE)
  try {
    broadcastSSE('new_booking', {
      message: `⚡ Divine Booking Received: ${booking.client_name} (${booking.reference_code})`,
      booking
    });
    results.sse = true;
    db.logNotification({
      booking_id: booking.id,
      channel: 'sse',
      recipient: 'Admin Live Console',
      title: `Live Alert #${booking.reference_code}`,
      content: `Instant dashboard broadcast for ${booking.client_name} - ${booking.service_name}`,
      status: 'sent'
    });
  } catch (err) {
    console.error('SSE broadcast error:', err.message);
  }

  // 2. Astrologer / Admin Email Notification
  const adminEmail = db.getSetting('admin_email', 'astrologer@trishulastro.com');
  const transporter = await getEmailTransporter();

  if (transporter) {
    try {
      const from = db.getSetting('smtp_from', 'TrishulAstro <guidance@trishulastro.com>');
      await transporter.sendMail({
        from,
        to: adminEmail,
        subject: `⚡ [TrishulAstro] New Session Booked: ${booking.client_name} (#${booking.reference_code})`,
        html: generateAstrologerEmailHTML(booking)
      });
      results.emailAdmin = true;
      db.logNotification({
        booking_id: booking.id,
        channel: 'email',
        recipient: adminEmail,
        title: `Astrologer Alert: ${booking.reference_code}`,
        content: `Email delivered to owner inbox (${adminEmail})`,
        status: 'sent'
      });
    } catch (err) {
      console.error('SMTP admin email error:', err.message);
      db.logNotification({
        booking_id: booking.id,
        channel: 'email',
        recipient: adminEmail,
        title: `Astrologer Alert: ${booking.reference_code}`,
        content: `SMTP Failed: ${err.message}`,
        status: 'failed'
      });
    }

    // 3. Devotee / Client Confirmation Email
    try {
      const from = db.getSetting('smtp_from', 'TrishulAstro <guidance@trishulastro.com>');
      await transporter.sendMail({
        from,
        to: booking.client_email,
        subject: `⚜ Your Vedic Appointment Pass: #${booking.reference_code} — TrishulAstro`,
        html: generateClientEmailHTML(booking)
      });
      results.emailClient = true;
      db.logNotification({
        booking_id: booking.id,
        channel: 'email',
        recipient: booking.client_email,
        title: `Client Pass: ${booking.reference_code}`,
        content: `Vedic appointment pass delivered to ${booking.client_email}`,
        status: 'sent'
      });
    } catch (err) {
      console.error('SMTP client email error:', err.message);
    }
  } else {
    // Graceful simulation: Record simulated email delivery with full HTML preview
    db.logNotification({
      booking_id: booking.id,
      channel: 'email',
      recipient: adminEmail,
      title: `Astrologer Notification: #${booking.reference_code}`,
      content: `[Simulated Preview] Ready for custom SMTP in Settings. Target: ${adminEmail}. Service: ${booking.service_name}. Devotee: ${booking.client_name} (${booking.client_phone}).`,
      status: 'simulated'
    });
    db.logNotification({
      booking_id: booking.id,
      channel: 'email',
      recipient: booking.client_email,
      title: `Client Vedic Pass: #${booking.reference_code}`,
      content: `[Simulated Pass] Ready for custom SMTP in Settings. Target: ${booking.client_email}. Service: ${booking.service_name}. Astrologer: ${booking.astrologer_name}.`,
      status: 'simulated'
    });
    results.emailAdmin = 'simulated';
    results.emailClient = 'simulated';
  }

  // 4. Webhook Notification (Discord / Slack / Telegram)
  const webhookRes = await sendWebhookNotification(booking);
  results.webhook = webhookRes.status;

  return results;
}

// Test Notification Dispatcher
async function dispatchTestNotification() {
  const mockBooking = {
    id: 0,
    reference_code: 'TA-TEST-' + Math.floor(1000 + Math.random() * 9000),
    client_name: 'Test Devotee (Verification)',
    client_email: 'test@example.com',
    client_phone: '+1 (555) 019-2834',
    client_dob: '1990-01-01',
    client_tob: '12:00',
    client_city: 'Varanasi, India',
    service_name: 'Complete Janam Kundli & Life Path ($120)',
    service_price: 120,
    astrologer_name: 'Pt. Radhe Krishna Shastri',
    preferred_date: new Date().toISOString().split('T')[0],
    preferred_time_slot: '10:00 AM - 11:00 AM (Morning Muhurta)',
    consultation_mode: 'Google Meet Video Call',
    query_topic: 'This is an automatic test notification to verify your alert channels.'
  };

  // Broadcast test SSE
  broadcastSSE('test_alert', {
    message: `🔔 Test notification received at ${new Date().toLocaleTimeString()}! All systems operational.`,
    test: true,
    booking: mockBooking
  });

  // Log in DB
  db.logNotification({
    booking_id: null,
    channel: 'sse',
    recipient: 'Admin Live Console',
    title: 'Manual Test Notification',
    content: 'User triggered test alert from Admin Settings panel.',
    status: 'sent'
  });

  // Webhook if enabled
  const webhookRes = await sendWebhookNotification(mockBooking);

  return { sse: true, webhook: webhookRes.status };
}

module.exports = {
  addSSEClient,
  removeSSEClient,
  broadcastSSE,
  notifyNewBooking,
  dispatchTestNotification
};
