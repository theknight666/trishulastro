# SpaceEdu — Cinematic Planetary Hero Section

A full-viewport, cinematic, interactive space-themed hero section built as a self-contained HTML file without any external frameworks, dependencies, or build tools.

![SpaceEdu Hero](https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202133_508c64b8-a31e-4290-bdfc-1187df70e0a6.png)

## Overview

- **Single Self-Contained File**: Everything is contained in [index.html](index.html) — all CSS in a single `<style>` tag, all JavaScript in a single `<script>` block.
- **Dynamic Planet Switching**: Cycle between **EARTH**, **VENUS**, and **MARS**. The featured planet displays as an auto-looping background video with corresponding typography, lede copy, and poster fallback.
- **Pre-rendered Cutout Slots**: Sibling PNG cutouts preloaded in both left and right buttons enable instant, sub-2ms visual planet swaps without network reload flashes.
- **Strict Mathematical Design System**: Viewport geometry is computed with custom property `--u` derived from a reference resolution of `1353 x 1163`, incorporating `--vshift`, `--gutter`, and `100dvh` support.
- **6-Tier Responsive Cascade**:
  - **Tier A**: Nav collapse to slide-out frosted glass menu (`<=1030px` or `<=620px`).
  - **Tier B**: Balanced tablet composition (`580px–1030px`).
  - **Tier C**: Mobile flex flow column layout (`<=579px` or `<=620px`).
  - **Tier D**: Automatic scroll indicator hiding on low-height screens (`<=660px`).
  - **Tier E**: Compact vertical spacing on short viewports (`<=620px`).
  - **Tier F**: Dropdown label alignment beneath button on narrow viewports (`<=500px`).
- **Choreographed Entrance Animations**: Hardware-accelerated CSS keyframe choreography (`ent-reveal`, `ent-rise`, `ent-settle`, `ent-draw`, `ent-fade`) that runs once and cleanly unregisters all animation classes after completion.
- **Full Accessibility**: Focus rings in `--cyan`, ARIA expanded / control states, semantic markup, and comprehensive `prefers-reduced-motion` fallbacks.

## Quick Start

### 1. Direct File Access
Simply open [index.html](index.html) in any modern web browser.

### 2. Local Development Server
Run the included 0-dependency Node server:
```bash
node server.js
```
Then open `http://localhost:8080/` in your browser.

## Project Structure

```
├── index.html       # The single self-contained application file
├── server.js        # Minimal 0-dependency local static HTTP server
├── validate.js      # Automated specification & regex verification tests
└── README.md        # Documentation
```
