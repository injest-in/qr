# Functional & Technical Specification: QR

**Product Name:** QR  
**Version:** 1.0.0  
**Target URL:** `https://injest.in/qr/`  
**Remote Repository:** `https://github.com/injest-in/qr.git`  
**Architecture:** 100% Client-Side React SPA, Zero-Backend, Offline-First PWA  

---

## 1. Executive Summary & Vision

QR is a privacy-first, zero-persistence dual-action QR generator, scanner, and physical print studio built for micro-merchants, local shop owners, enterprise IT departments, and individuals.

### Core Philosophy:
1. **Zero Persistence & Client-Side Execution:** No user data, contact details, payment information, or scanned codes ever leave the browser. Everything is computed, rendered, and exported purely within client-side memory using modern Web APIs.
2. **Dual-Intent Native Routing:** Bridges financial transactions with operational confirmation (e.g., executing a UPI transaction and seamlessly prompting WhatsApp payment proof).
3. **Shareable & Bookmarkable Deeplinks:** Every tool, form input, and configuration is serializable to and deserializable from URL hash routes (`#/whatsapp?phone=...`).
4. **Physical World Print Readiness:** Includes a built-in PDF print studio rendering vector standees, tent cards, and asset tags adhering to print-shop ISO dimensional standards at 300 DPI.

---

## 2. Tool Hierarchy & Functional Modules

Tools are segmented into three progressive tiers to prevent cognitive overload for non-technical users while preserving advanced workflows:

```
┌────────────────────────────────────────────────────────────────────────┐
│                               QR HUB                                   │
├──────────────────┬──────────────────────────┬──────────────────────────┤
│  ⚡ Simple Tools │  🏢 Business & Place      │  🚀 Advanced Tools       │
├──────────────────┼──────────────────────────┼──────────────────────────┤
│ • WhatsApp Chat  │ • Guest Wi-Fi            │ • Pay + WhatsApp Gate    │
│ • Mail to        │ • Business Card (vCard)  │ • ServiceNow Incident    │
│ • Call to        │ • Google Maps Directions │ • Form Prefill           │
│ • Website Link   │ • Calendar Event (.ics)  │ • Uber Ride Intent       │
│ • UPI Payment    │                          │ • WhatsApp Store Catalog │
│                  │                          │ • Batch CSV Studio       │
│                  │                          │ • Staff Reverse Scanner  │
└──────────────────┴──────────────────────────┴──────────────────────────┘
```

---

### 2.1 Simple Tools

#### A. WhatsApp Chat (`whatsapp`)
- **Purpose:** Opens a 1-click WhatsApp conversation with the merchant or individual, with an optional pre-drafted message.
- **Protocol:** `https://wa.me/<countryCode><phone>?text=<encodedMessage>`
- **Fields:**
  - `countryCode`: Localized dial code (e.g., `+91`, `+1`, `+44`).
  - `phone`: Raw phone number without dial code.
  - `message` (Optional): Pre-filled greeting or inquiry text.
- **Deeplink Format:** `#/whatsapp?cc=+91&phone=9876543210&msg=Hello`

#### B. Mail to (`email`)
- **Purpose:** Launches the user's native email client with pre-filled recipient, subject line, and draft body.
- **Protocol:** `mailto:<to>?subject=<encodedSubject>&body=<encodedBody>`
- **Fields:**
  - `to`: Recipient email address.
  - `subject` (Optional): Subject line.
  - `body` (Optional): Email body text.
- **Deeplink Format:** `#/email?to=contact@shop.com&sub=Inquiry&body=Hello`

#### C. Call to (`phone`)
- **Purpose:** Triggers immediate telephone dialer with pre-populated phone number.
- **Protocol:** `tel:<countryCode><phone>`
- **Fields:**
  - `countryCode`: Localized dial code.
  - `phone`: Phone number digits.
- **Deeplink Format:** `#/phone?cc=+91&num=9876543210`

#### D. Website Link (`link`)
- **Purpose:** Universal link opening an HTTPS destination URL (menus, catalogs, landing pages).
- **Protocol:** `https://<domain>/<path>`
- **Fields:**
  - `url`: Destination website URL.
- **Deeplink Format:** `#/link?url=https://injest.in`

#### E. UPI Payment (`upi`)
- **Purpose:** Native UPI intent for direct customer-to-merchant bank settlement across all Indian UPI apps (Google Pay, PhonePe, Paytm, BHIM, Cred, Navi).
- **Protocol:** `upi://pay?pa=<vpa>&pn=<name>&cu=INR[&am=<amount>][&tn=<note>]`
- **Fields:**
  - `pa`: Payee Virtual Payment Address (VPA) / UPI ID (e.g., `merchant@upi`).
  - `pn`: Payee / Business Name (e.g., `Artisan Cafe`).
  - `am` (Optional): Fixed amount in INR (e.g., `150.00`).
  - `tn` (Optional): Transaction note or invoice reference.
- **Deeplink Format:** `#/upi?pa=shop@upi&pn=Store&am=150.00&tn=Coffee`

---

### 2.2 Business & Place Tools

#### A. Guest Wi-Fi (`wifi`)
- **Purpose:** Point-and-connect Wi-Fi configuration QR code adhering to the standard Android and iOS Wi-Fi format.
- **Protocol:** `WIFI:S:<ssid>;T:<encryption>;P:<password>;H:<hidden>;;`
- **Fields:**
  - `ssid`: Network SSID name (escaped for special characters: `;`, `:`, `,`, `\`).
  - `encryption`: `WPA` (WPA/WPA2/WPA3), `WEP`, or `nopass`.
  - `password`: Pre-shared network key.
  - `hidden`: Boolean flag indicating hidden SSID.
- **Deeplink Format:** `#/wifi?ssid=OfficeWiFi&p=SecretPass123&t=WPA&h=0`

#### B. Digital Business Card (`vcard`)
- **Purpose:** Downloads and imports a contact directly into Apple Contacts or Google Contacts using the vCard 3.0 standard.
- **Protocol:** 
  ```text
  BEGIN:VCARD
  VERSION:3.0
  N:<lastName>;<firstName>;;;
  FN:<firstName> <lastName>
  ORG:<organization>
  TITLE:<title>
  TEL;TYPE=CELL:<phone>
  EMAIL:<email>
  URL:<url>
  ADR:;;<address>;;;;
  END:VCARD
  ```
- **Deeplink Format:** `#/vcard?fn=Alex&ln=Morgan&org=FinTech&tel=+919876543210&em=alex@example.com`

#### C. Google Maps Directions (`maps`)
- **Purpose:** Initiates turn-by-turn navigation in Google Maps mobile application or browser.
- **Protocol:** `https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>&travelmode=<mode>`
- **Fields:**
  - `lat`: Destination latitude coordinate.
  - `lng`: Destination longitude coordinate.
  - `name` (Optional): Destination nickname.
  - `travelMode`: `transit` (default), `driving`, `walking`, or `bicycling`.
  - **Device GPS Integration:** Built-in "Use My Current Device Location" button calling HTML5 Geolocation API.
- **Deeplink Format:** `#/maps?lat=12.9716&lng=77.5946&mode=transit`

#### D. Calendar Event (`calendar`)
- **Purpose:** Direct 1-tap event import into native calendar apps using the RFC 5545 `.ics` standard.
- **Protocol:**
  ```text
  BEGIN:VCALENDAR
  VERSION:2.0
  PRODID:-//QR//EN
  BEGIN:VEVENT
  SUMMARY:<title>
  DESCRIPTION:<description>
  LOCATION:<location>
  DTSTART:<UTC_TIMESTAMP>
  DTEND:<UTC_TIMESTAMP>
  END:VEVENT
  END:VCALENDAR
  ```
- **Deeplink Format:** `#/calendar?title=Launch&start=2026-10-15T10:00&end=2026-10-15T11:30&loc=Auditorium`

---

### 2.3 Advanced Tools

#### A. Pay via UPI + WhatsApp Receipt Gate (`pay-gate`)
- **Purpose:** Dual-Action payment gateway. Generates a QR code pointing to `https://injest.in/qr/#/pay?...`. When scanned by a customer, it launches a dedicated mobile interface that:
  1. Triggers Intent 1: Launches native UPI app for payment.
  2. Triggers Intent 2: One-tap button opening WhatsApp with pre-filled payment confirmation text sent directly to merchant.
  3. Failover: One-tap VPA clipboard copy and Web Share API Level 2 support.
- **Deeplink Format:** `#/pay-gate?pa=shop@upi&pn=Store&am=250.00&tn=Order42&wa=919876543210`

#### B. IT Asset & Incident Management (`servicenow`)
- **Purpose:** Enterprise physical IT asset tagging. Generates QR codes placed on laptops, servers, or conference rooms that prefill incidents or catalog requests in ServiceNow without requiring API tokens.
- **Protocols:**
  - Platform UI: `https://<instance>.service-now.com/<table>.do?sys_id=-1&sysparm_query=<k1>=<v1>^<k2>=<v2>`
  - Service Portal: `https://<instance>.service-now.com/sp?id=sc_cat_item&sys_id=<portalSysId>&sysparm_variable_values=<urlEncodedJson>`
- **Deeplink Format:** `#/servicenow?instance=dev12345&table=incident`

#### C. Custom Form Prefill (`form`)
- **Purpose:** Automatically populates fields in Google Forms, Typeform, or custom web survey endpoints via URL query parameters.
- **Protocol:** `<baseUrl>?<fieldKey1>=<val1>&<fieldKey2>=<val2>`
- **Deeplink Format:** `#/form?url=https://docs.google.com/forms/d/e/.../viewform`

#### D. Uber Ride Intent (`uber`)
- **Purpose:** Launches the Uber app with pickup set to customer's live GPS location and drop-off coordinates preset to venue/store.
- **Protocol:** `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=<lat>&dropoff[longitude]=<lng>&dropoff[nickname]=<nick>`
- **Deeplink Format:** `#/uber?lat=37.7879&lng=-122.4075&nick=Venue`

#### E. WhatsApp Business Store Catalog (`catalog`)
- **Purpose:** Routes customers directly into a merchant's native WhatsApp Business product showcase catalog.
- **Protocol:** `https://wa.me/c/<countryCode><phone>`
- **Deeplink Format:** `#/catalog?cc=91&phone=9876543210`

#### F. Bulk CSV Batch Processor (`batch`)
- **Purpose:** High-throughput batch generation of hundreds of QR codes from uploaded CSV files.
- **Features:** Client-side CSV parsing with PapaParse, parallel canvas rendering, zip archive packaging, progress bar, error handling.
- **Route:** `#/batch` or `#/csv`

#### G. Camera Scanner & Staff Reverse-Ingestion (`scan`, `staff`)
- **Purpose:** Camera scanner and drag-and-drop image decoder powered by `html5-qrcode`.
- **Modes:**
  - Standard User Mode: Instant redirect/action execution.
  - Staff Mode (`#/staff`): Deep schema extraction. Flattens structured JSON payloads, decodes ServiceNow variables, extracts Wi-Fi credentials, and displays raw token key-value pairs without executing remote calls.

---

## 3. Styling, Precision Customization & Theming

### 3.1 Default Preferences (Stored in LocalStorage)
- **Background Transparency:** 100% Transparent (`isTransparent: true`, `bgColor: 'transparent'`).
- **Dot Matrix Style:** Circular dots (`dots`).
- **Corner Eye Style:** Extra-rounded (`extra-rounded`).
- **Corner Dot Style:** Circular dot (`dot`).
- **Error Correction Level:** Level `M` (15% redundancy).
- **Quiet Zone Margin:** 4 modules.
- **Storage Key:** `qr_styling_preferences` in `localStorage`.

### 3.2 Theming (Light / Dark / System)
- **Modes:**
  - `light`: Clean daylight theme (`bg-slate-50`, `bg-white`, `border-slate-200`, `text-slate-900`).
  - `dark`: Deep slate theme (`dark:bg-slate-950`, `dark:bg-slate-900`, `dark:border-slate-800`, `dark:text-slate-100`).
  - `system`: Matches OS preference via `window.matchMedia('(prefers-color-scheme: dark)')`.
- **Storage Key:** `qr_theme_preference` in `localStorage`.
- **Canvas Checkerboard:** Transparent QR codes display over `.qr-checkerboard` (dual-mode subtle grid pattern) to maintain high visual contrast in both light and dark themes.
- **Quick Invert Button:** 1-tap button on preview card toggling foreground pattern between dark (`#0f172a`) and light (`#ffffff`).

### 3.3 Contrast & WCAG Scannability Linter
- Automatically calculates relative luminance (\(L = 0.2126R + 0.7152G + 0.0722B\)) and contrast ratio.
- Evaluates payload density against QR Version capacity.
- Displays real-time status badge:
  - `PASS` (Ratio \(\ge 7:1\))
  - `WARN` (\(3:1 \le Ratio < 7:1\))
  - `FAIL` (Ratio \(< 3:1\)) with 1-click Auto-Fix button.

---

## 4. Physical Print Studio Specifications

The built-in Print Studio (`PrintPreviewModal.tsx`) renders PDF documents directly in the browser via `jspdf`:

| Template Type | Target Dimensions | Orientation | Standard Use Case |
|---|---|---|---|
| **A4 Table Tent** (`tent-a4`) | 210mm × 297mm | Portrait / Foldable | Restaurant dining tables, hotel check-in desks |
| **A5 Acrylic Standee** (`standee-a5`) | 148mm × 210mm | Portrait | Retail billing counters, point-of-sale desks |
| **2" × 1" Asset Tag** (`asset-tag-2x1`) | 50.8mm × 25.4mm | Landscape | Server racks, monitors, machinery asset labels |

- **Vector Math:** Rendered at 300 DPI with cut/fold reference markings.
- **Human-Readable Fallback:** Displays primary and secondary fallback texts (e.g. UPI VPA, phone number, Wi-Fi password) in case the printed QR is damaged.

---

## 5. Routing & URL Deeplink Specification

### 5.1 Architecture: HashRouter with 404 Redirection
Because GitHub Pages serves static files and does not natively support arbitrary server-side rewrite rules, the application uses **HashRouter** (`#/`) for all sub-routes:

```
https://injest.in/qr/#/<route>?<params>
```

When a user accesses a deep route directly without hash (e.g. `https://injest.in/qr/pay`), `public/404.html` captures the path, extracts search params, and redirects to the HashRouter format:

```javascript
// public/404.html redirect contract
var pathSegmentsToKeep = 1; // /qr/
var l = window.location;
l.replace(
  l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') +
  l.pathname.split('/').slice(0, 1 + pathSegmentsToKeep).join('/') + '/#/' +
  l.pathname.slice(1).split('/').slice(pathSegmentsToKeep).join('/') +
  (l.search ? '&' + l.search.slice(1) : '') +
  l.hash
);
```

### 5.2 Hash Route Map

| Hash Route | Component / Modal | Supported Query Parameters |
|---|---|---|
| `#/` | Main QR Hub | (none) |
| `#/whatsapp` | WhatsApp Chat Tool | `cc`, `phone`, `num`, `msg`, `text` |
| `#/email` | Mail to Tool | `to`, `email`, `sub`, `subject`, `body`, `msg` |
| `#/phone` | Call to Tool | `cc`, `num`, `phone` |
| `#/link` | Website Link Tool | `url`, `link` |
| `#/upi` | UPI Payment Tool | `pa`, `pn`, `am`, `tn` |
| `#/wifi` | Wi-Fi Tool | `ssid`, `p`, `pass`, `t`, `h` |
| `#/vcard` | vCard Contact Tool | `fn`, `ln`, `tel`, `phone`, `em`, `email`, `org`, `title`, `url`, `adr` |
| `#/maps` | Google Maps Tool | `lat`, `lng`, `name`, `mode` |
| `#/calendar` | Calendar Event Tool | `title`, `start`, `end`, `loc`, `desc` |
| `#/pay-gate` | Dual-Action Setup | `pa`, `pn`, `am`, `tn`, `wa` |
| `#/pay` | Customer Payment Gate | `pa`, `pn`, `am`, `tn`, `wa` |
| `#/servicenow` | ServiceNow Tool | `instance`, `table`, `mode`, `sys_id` |
| `#/form` | Form Prefill Tool | `url` |
| `#/uber` | Uber Ride Tool | `lat`, `lng`, `nick` |
| `#/catalog` | Catalog Tool | `cc`, `phone` |
| `#/scan` | Camera Scanner Modal | (none) |
| `#/staff` | Staff Scanner Modal | (none) |
| `#/batch` | Bulk CSV Modal | (none) |

---

## 6. GitHub Pages & Custom Domain Rules

1. **Root Organization Ownership:** The GitHub Pages site `injest-in.github.io` owns the apex/subdomain `injest.in`.
2. **Sub-repository Path Inheritance:** The repository `injest-in/qr` inherits `https://injest.in/qr/`.
3. **No Project CNAME:** The project repository `injest-in/qr` **must NOT have its own `CNAME` file**. Having a `CNAME` in a sub-repo conflicts with the parent organization's custom domain configuration and causes deployment failures.
4. **Vite Base Path:** Configured as `base: '/qr/'` in `vite.config.ts`.
5. **Jekyll Bypass:** `public/.nojekyll` ensures that files starting with underscores are preserved by GitHub Pages.
6. **Deployment Pipeline:** `.github/workflows/deploy.yml` uses Node 24 and `actions/deploy-pages@v4`.

---

## 7. Interactive Spotlight Onboarding Tour

The application provides an interactive, zero-dependency guided spotlight tour (`src/components/SpotlightTour.tsx`) for first-time visitors:
- **Architecture:** Zero external library footprint. Uses SVG mask cutouts (`<mask id="tour-spotlight-mask">`) with hardware-accelerated CSS backdrop dimming and smooth center scrolling.
- **Tour Steps (Optimized Top-to-Bottom Storyline):**
  1. `[data-tour="tiers"]`: Tool hierarchy (Simple, Business & Place, Advanced).
  2. `[data-tour="bookmark"]`: Real-time two-way URL deeplink synchronization and bookmarking.
  3. `[data-tour="inputs"]`: Clean inputs without dummy values and localized country auto-detection.
  4. `[data-tour="preview"]`: High-visibility vector rendering on high-contrast base.
  5. `[data-tour="customize"]`: Precision styling controls (dots, corner eyes, error correction).
  6. `[data-tour="print"]`: Print-ready physical PDF studio.
- **Mobile Viewport Optimization & Scroll-to-Highlight:**
  - Automatic smooth scrolling to vertical center (`block: 'center'`).
  - Read-only scroll & resize listeners measure bounds without triggering recursive `scrollIntoView` calls, ensuring zero stuttering.
  - Adaptive Top/Bottom Docking on mobile screens (`< 640px`): Automatically docks the tooltip card at the top if the target element is in the bottom half of the screen, or at the bottom if the target is in the top half. This guarantees that highlighted controls are never covered and the card never clips offscreen.
- **Dismissal & Skip Controls:**
  - Prominent **Skip Tour** buttons in the card header and footer.
  - Backdrop click and `Escape` key dismissals.
  - State persisted in `localStorage: qr_has_seen_tour`. The tour only auto-launches on the user's initial visit and remains closed on subsequent sessions.
- **On-Demand Relaunch:** Can be relaunched anytime via the **✨ Tour** button in the app bar, which always restarts clean at Step 1.

---

## 8. Universal Preview Visibility Invariant

Regardless of the active user interface theme (`light`, `dark`, or `system` auto):
- **Contrast Base Invariant:** The QR preview canvas container (`[data-tour="preview"]`) **must always preserve a light, high-contrast base** (`#ffffff` or the user's custom `bgColor`).
- **Rationale:** Because default QR codes feature dark foreground dots (`#0f172a`) with a 100% transparent background, allowing the canvas container to adopt a dark background in dark mode would render the QR code invisible and unscannable by mobile cameras.
- **Styling Contract:** `.qr-checkerboard` is set to `background-color: #ffffff !important` with a subtle `#f1f5f9` pattern, and the inline container dynamically applies `style={{ backgroundColor: options.isTransparent ? '#ffffff' : options.bgColor }}`.

---

## 9. Open Source Transparency & License Specification

To establish verifiable trust for merchants and enterprise users handling sensitive credentials (UPI VPAs, Wi-Fi passwords, contact cards), the product adheres to an open-source auditable architecture:
1. **License Model:** Permissive **MIT License**, formally declared in the root `LICENSE` file and `package.json`.
2. **Public Repository:** Hosted at `https://github.com/injest-in/qr`.
3. **In-App Trust Surface:**
   - **Header Bar:** Quick-action GitHub button (`href="https://github.com/injest-in/qr"`).
   - **Privacy Sub-header:** Includes explicit `Audit Code` external link to repository and `MIT License` status badge.
   - **Preview Card Footer:** Displays `100% On-Device • Open Source (MIT)` verification link directly beneath the generated QR preview.
   - **Dual-Action Gate:** Features a dedicated verification link: `Audit open-source code on GitHub (MIT License)`.
   - **Global Footer:** Features `Open Source on GitHub` link and `MIT License` reference.
4. **Verifiability Guarantee:** Users and security researchers can independently audit client-side network calls in browser DevTools to confirm zero background analytics, zero telemetry beacons, and zero remote payload transmission.


