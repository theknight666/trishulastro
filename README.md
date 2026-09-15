# TrishulAstro — Sacred Vedic Astrology & Cosmic Booking Platform

A luxury, full-featured Vedic astrology consultation platform featuring an interactive celestial planetary hero, certified master astrologers directory, daily horoscope forecasts, free Janam Kundli calculator, **full booking backend**, **real-time notification engine**, and the **Astrologer Admin Sanctum** management console.

![TrishulAstro Logo](assets/trishulastro_logo.jpg)

## Features

- **Full Booking Backend & Persistent Storage**:
  - Powered by Node.js and Node v24's native `node:sqlite` engine with zero external database setup.
  - Persistently stores complete consultation requests, birth parameters (Date of Birth, Time of Birth, Place of Birth), Muhurta slots, consultation medium, meeting links, and private astrologer notes.
- **Multi-Channel Real-Time Notification Engine**:
  - **Live Server-Sent Events (SSE)**: Streams real-time push alerts to any open Astrologer Admin Console the exact moment a booking is placed.
  - **Vedic Temple Bell Audio Chime**: Synthesized via HTML5 Web Audio API using harmonic frequencies (432Hz root, 864Hz octave, 1296Hz fifth) simulating a Tibetan singing bowl/temple bell chime.
  - **Browser Desktop Push Notifications**: Native OS notification alerts even when the admin console runs in a background tab.
  - **Email Dispatcher (Nodemailer)**: Sends formatted celestial HTML emails with birth chart parameters to the astrologer and a sacred Vedic Appointment Pass to the client.
  - **Smartphone Webhooks**: Optional Discord, Slack, or Telegram webhook integration for instant phone notifications.
  - **Audit Logging**: Full history of all dispatched notifications with delivery statuses.
- **Astrologer Admin Sanctum Console (`/admin`)**:
  - Real-time connection status pill ("🟢 LIVE SSE SYNCED").
  - Executive KPI cards: Total Consultations, Pending Reviews, Confirmed Sessions, Revenue ($ & ₹), and Today's Muhurtas.
  - Bookings matrix with tab filters (`All`, `Pending`, `Confirmed`, `Completed`, `Cancelled`) and live search.
  - Devotee Kundli details drawer with computed Vedic signs (approximate Sun sign, ruling Graha, recommended gemstone).
  - 1-click WhatsApp messaging and Google Meet link manager.
  - Configuration center for notification email, PIN, webhook, and SMTP.
  - 1-click CSV export of all consultation records.
- **Celestial Planetary Showcase (Vedic Grahas)**:
  - Explores the sacred celestial forces: **Venus (Shukra)**, **Jupiter (Guru)**, **Mars (Mangal)**, **Saturn (Shani)**, **The Sun (Surya)**, **Mercury (Budha)**, and **The Moon (Chandra)**.
  - Rich Vedic astrological significance, ruling deities, gemstones, auspicious days, and sacred Bija Mantras.
- **Vedic Consultation Packages**:
  - Complete Janam Kundli & Life Path (D1, D9 Navamsha, Mahadasha)
  - Career, Business & Wealth Yoga
  - Love, Marriage Compatibility & Kundli Milan
  - Urgent Prashna Kundli (Horary)
  - Gemstones & Karma Remedies
  - Vastu Shastra & Space Energy
- **Master Astrologers Directory**:
  - Verified profiles of Banaras and Vedic scholars (Pt. Radhe Krishna Shastri, Dr. Gayatri Devi, Acharya Devvrat Sharma, Acharya Vidyadhar Joshi).
- **Interactive Daily Horoscope & Rashiphal**:
  - Dynamic 12-sign zodiac picker (Aries through Pisces) with career, love, wealth, and health rating meters.
- **Instant Kundli Calculator**:
  - Computes Ascendant (Lagna), Moon Sign (Rashi), Sun Sign, and active Mahadasha with customized astrological synthesis.
- **Sacred 432Hz Om Chants Audio**:
  - Real-time synthesized harmonic drone with zero external dependencies.

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Start the TrishulAstro server:
```bash
npm start
```

3. Open your browser:
- **Client Sacred Portal**: [http://localhost:3000/](http://localhost:3000/)
- **Astrologer Admin Sanctum**: [http://localhost:3000/admin](http://localhost:3000/admin) *(Default PIN: `1088`)*
