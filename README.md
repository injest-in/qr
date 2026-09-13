# QR — Zero-Persistence Hub & Dual-Action Generator

[![Live Deployment](https://img.shields.io/badge/Live-injest.in%2Fqr-blue?style=for-the-badge&logo=googlechrome&logoColor=white)](https://injest.in/qr/)
[![Zero Backend](https://img.shields.io/badge/Architecture-100%25%20Client--Side-emerald?style=for-the-badge)](https://injest.in/qr/)
[![License](https://img.shields.io/badge/License-MIT-slate?style=for-the-badge)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646cff?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

**QR** is a high-performance, privacy-first, zero-persistence dual-action QR hub, scanner, and physical print studio. Built as a 100% client-side React Progressive Web App (PWA), it runs entirely within the user's browser—meaning **no user details, transaction notes, or scanned codes are ever transmitted to or stored on remote servers.**

---

## 🚀 Live Demo & Production URL

- **Production URL:** [https://injest.in/qr/](https://injest.in/qr/)
- **Fallback URL:** [https://injest-in.github.io/qr/](https://injest-in.github.io/qr/)

---

## 🌟 Key Capabilities

1. **⚡ Ranked Tool Tiers:**
   - **Simple Tools:** WhatsApp Chat, Mail to, Call to, Website Link, Direct UPI Payment.
   - **Business & Place Tools:** Guest Wi-Fi Card, Digital Business Card (vCard 3.0), Google Maps Directions, Calendar Event (.ics).
   - **Advanced Tools:** Dual-Action Pay Gate (UPI + WhatsApp Proof), ServiceNow IT Ticket, Form Prefill, Uber Ride Intent, Store Catalog.

2. **🔗 Bookmarkable Deeplinks (Two-Way Hash Binding):**
   - Every tool mode and input field is synchronized to the URL hash in real time (e.g. `#/whatsapp?phone=9876543210&msg=Hello`).
   - Bookmarking the page, copying the link, or refreshing the browser restores the exact tool and pre-fills all inputs instantly.

3. **🎨 Transparent QR Defaults & Style Customization:**
   - **Transparent Background Default:** QR canvas background defaults to 100% transparent (`color: 'transparent'`), ready for placing directly onto posters, stickers, and standees.
   - **Subtle Checkerboard Canvas:** Renders over a clean checkered pattern so transparent codes are legible in any theme.
   - **Circular Dot Matrix (`dots`) & Extra-Rounded Eye Corners:** Modern aesthetics by default, saved in `localStorage`.
   - **Settings Modal:** Advanced visual settings (dot styles, eye shapes, ECL, margin, colors) are tucked into a clean **Customize Style** dialog.

4. **🌓 Light, Dark & System Theming:**
   - One-tap switcher between ☀️ Light, 🌙 Dark, and 💻 System Default mode.
   - Automatically adapts to OS color scheme changes and persists preference in `localStorage`.

5. **🌍 Localized Country Code Picker:**
   - Auto-detects user country using browser timezone (`Intl.DateTimeFormat`) and locale, defaulting to India (`+91`).
   - Dropdown with flag emojis and international dial codes.

6. **📄 Physical Print-Ready PDF Studio:**
   - Client-side 300 DPI vector PDF generation via `jspdf`.
   - Formats: **A4 Table Tent Card** (foldable), **A5 Acrylic Counter Standee**, and **2" × 1" Asset Tag**.
   - Includes cut/fold guide lines and human-readable fallback text.

7. **📷 Reverse Ingestion Scanner & Staff Mode:**
   - Camera scanner and image file drag-and-drop powered by `html5-qrcode`.
   - **Staff Mode (`#/staff`):** Flattens nested JSON payloads, decodes ServiceNow variable parameters, parses Wi-Fi credentials, and inspects raw tokens without network execution.

8. **📊 High-Throughput Bulk CSV Batch Generator:**
   - Client-side CSV parser using `PapaParse`.
   - Bulk canvas rendering and ZIP download for hundreds of QR codes at once.

9. **✨ Interactive Lightweight Spotlight Tour:**
   - Zero-dependency, SVG mask-cutout guided tour highlighting tool tiers, two-way bookmarking, clean inputs, live vector preview, style customization, and the physical print studio.
   - Welcomes first-time visitors automatically, saves completion state in `localStorage`, and includes a prominent **Skip Tour** option.
   - Mobile-optimized: Automatically smooth-scrolls target elements into center view and uses adaptive top/bottom card docking so tooltips never clip off-screen.
   - Can be re-launched anytime via the **✨ Tour** button in the header.

10. **👁️ Universal Preview Visibility Invariant:**
    - The QR preview container explicitly maintains a high-contrast light base (`#ffffff` or user's chosen `bgColor`) across Light, Dark, and System Auto modes, ensuring dark QR codes are always clearly legible and camera-scannable.

11. **🛡️ 100% Open Source & Auditable Trust:**
   - Licensed under the permissive **[MIT License](LICENSE)**.
   - Full source code is publicly hosted on [GitHub](https://github.com/injest-in/qr).
   - In-app trust links let users audit client-side network calls, zero-persistence guarantees, and PWA service workers directly.

---

## 🛠️ Tool Catalog & Deeplink Matrix

| Tool Mode | Tier | Protocol Generated | Example Bookmarkable URL |
|---|---|---|---|
| **WhatsApp** | Simple | `https://wa.me/<cc><phone>?text=...` | `#/whatsapp?cc=+91&phone=9876543210&msg=Hello` |
| **Mail to** | Simple | `mailto:<email>?subject=...&body=...` | `#/email?to=contact@shop.com&sub=Quote&body=Hi` |
| **Call to** | Simple | `tel:<phone>` | `#/phone?cc=+91&num=9876543210` |
| **Website Link** | Simple | `https://<url>` | `#/link?url=https://injest.in` |
| **UPI Pay** | Simple | `upi://pay?pa=...&pn=...` | `#/upi?pa=shop@upi&pn=Artisan&am=150.00` |
| **Guest Wi-Fi** | Business | `WIFI:S:<ssid>;T:<type>;P:<pass>;;` | `#/wifi?ssid=OfficeGuest&p=secret123&t=WPA` |
| **Business Card** | Business | `BEGIN:VCARD...END:VCARD` | `#/vcard?fn=Alex&ln=Morgan&tel=9876543210` |
| **Google Maps** | Business | `https://www.google.com/maps/dir/...` | `#/maps?lat=12.9716&lng=77.5946&mode=transit` |
| **Calendar Event** | Business | `BEGIN:VCALENDAR...END:VCALENDAR` | `#/calendar?title=Keynote&start=2026-10-15T10:00` |
| **Pay + WhatsApp** | Advanced | `https://injest.in/qr/#/pay?...` | `#/pay-gate?pa=shop@upi&pn=Store&wa=919876543210` |
| **ServiceNow** | Advanced | `https://<inst>.service-now.com/...` | `#/servicenow?instance=dev12345&table=incident` |
| **Form Prefill** | Advanced | `<url>?entry.1=val1...` | `#/form?url=https://docs.google.com/forms/...` |
| **Uber Ride** | Advanced | `https://m.uber.com/ul/?action=setPickup...` | `#/uber?lat=37.7879&lng=-122.4075&nick=Airport` |
| **Store Catalog** | Advanced | `https://wa.me/c/<cc><phone>` | `#/catalog?cc=91&phone=9876543210` |

---

## 🏗️ Project Architecture & Source Code Map

```text
src/
├── main.tsx                    # React entry point
├── App.tsx                     # App Shell, header, logo, theme toggle & route dispatch
├── index.css                   # Tailwind v4 directives, dark variant & checkerboard CSS
├── types/
│   └── index.ts                # TypeScript types, unions, payloads, QROptions defaults
├── components/
│   ├── QRGenerator.tsx         # Central multi-tier generator, real-time sync, exports
│   ├── DualActionGate.tsx      # Customer payment gate (/pay)
│   ├── CountryCodeSelect.tsx   # Country picker with flag emojis and dial codes
│   ├── QRSettingsModal.tsx     # Precision styling, dot shapes & transparency settings
│   ├── ThemeToggle.tsx         # Light / Dark / System segmented toggle
│   ├── ScannerModal.tsx        # [Lazy] Camera and file drop QR scanner
│   ├── BulkCSVModal.tsx        # [Lazy] High-throughput CSV batch generator
│   ├── PrintPreviewModal.tsx   # [Lazy] Standee & tent card PDF print studio
│   └── SpotlightTour.tsx       # Interactive zero-dependency guided spotlight onboarding tour
└── utils/
    ├── countryCodes.ts         # World country dataset and timezone auto-detection
    ├── qrParsers.ts            # Protocol builders, hash serializers & deserializers
    ├── scannabilityLinter.ts   # Contrast ratio calculator & scannability analyzer
    └── theme.ts                # Theme state management & system preference listener
```

---

## 💻 Getting Started (Local Development)

### Prerequisites
- Node.js 20+ or 24+
- `npm` or `pnpm`

### Installation & Run
```bash
# Clone the repository
git clone https://github.com/injest-in/qr.git
cd qr

# Install dependencies
npm install

# Start local dev server (default: http://localhost:5173/qr/)
npm run dev
```

### Building for Production
```bash
# Typecheck and build production assets into dist/
npm run build

# Preview production build locally
npm run preview
```

### Linting
```bash
# Run ultra-fast oxlint
npm run lint
```

---

## 🌐 Deployment & GitHub Pages Architecture

- **Host Domain:** `https://injest.in/qr/`
- **Sub-repository Path Inheritance:** The root site `injest-in.github.io` owns the custom domain `injest.in`. Project sub-repositories under the `injest-in` organization automatically inherit `https://injest.in/<repo>/`.
  > **Note:** The `injest-in/qr` repository **must NOT contain a `CNAME` file**, to avoid custom domain conflicts with the parent organization.
- **GitHub Actions Workflow:** `.github/workflows/deploy.yml` builds and deploys using Node 24 and `actions/deploy-pages@v4`.
- **SPA 404 Redirection:** `public/404.html` captures direct browser navigation without hash and redirects back to `/#/<route>` cleanly.
- **Jekyll Bypass:** `public/.nojekyll` prevents GitHub Pages from filtering out files starting with underscores or dots.

---

## 📚 Technical Documentation

For deep technical details, refer to:
- [📖 Functional Specification Document](docs/SPECIFICATION.md) — Comprehensive functional requirements (FR-A through FR-J), payload schemas, routing contracts, and storage guidelines.
- [🏛️ Architecture & Engineering Guide](docs/ARCHITECTURE.md) — System architecture, sequence diagrams, bundle optimization strategy, and extension tutorial.
- [🤖 Agent Guide & Operational Manual](AGENTS.md) — Environment configuration, `fnm` instructions, PowerShell gotchas, and architectural invariants for AI coding assistants.

---

## 🔒 Privacy Guarantee & Verifiable Trust
 
QR is designed with zero persistence. It does not use external analytics, cookies, tracking pixels, or remote database endpoints. All QR computations, contact card builds, and PDF exports are executed locally on the client device.
 
Because the application is 100% open source, anyone can inspect the repository, audit network activity, and independently verify that no user data ever leaves the browser.
 
---
 
## 📄 License
 
This project is open-source and free software licensed under the **[MIT License](LICENSE)**.
 
Copyright (c) 2026 [injest-in](https://github.com/injest-in). Feel free to inspect, fork, contribute, and build upon it!
