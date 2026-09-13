# Agent Guidance & Operational Manual: QR

This document is written for **Antigravity** and any other autonomous AI coding agents working on the **QR** codebase. It contains critical system environment details, development commands, architectural invariants, and domain deployment rules to ensure seamless pair programming without common pitfalls.

---

## 1. System Environment & Shell Gotchas

### 1.1 Operating System & Shell
- **OS:** Windows (x64)
- **Shell:** PowerShell (`pwsh` / `powershell.exe`)
- **Node Version Manager:** `fnm` (Fast Node Manager)

### 1.2 The `fnm` Requirement (Mandatory)
In this Windows PowerShell environment, `node` and `npm` are managed by `fnm`. If you execute `npm` or `node` directly without loading the fnm environment in the session, PowerShell may report that the command cannot be found or uses the wrong Node version.
**Always prepend the fnm environment hook to your commands:**
```powershell
fnm env --use-on-cd | Out-String | Invoke-Expression; npm run build
```

### 1.3 PowerShell Command Chaining (`&&` vs `;`)
- **NEVER use `&&`** to chain commands in Windows PowerShell (e.g. `npm run build && git commit`). It will fail with a parser error: `The token '&&' is not a valid statement separator in this version.`
- **ALWAYS use semicolon `;`** to chain commands:
  ```powershell
  git add .; git commit --no-gpg-sign -m "your message"
  ```

### 1.4 Git Commits (`--no-gpg-sign`)
The user's global Git configuration expects GPG signing by default, but agent shells do not possess the interactive GPG passphrase pinentry.
**Always include `--no-gpg-sign` on all git commits:**
```powershell
git commit --no-gpg-sign -m "feat: description"
```

---

## 2. Project Identity & Architecture

| Property | Value |
|---|---|
| **Product Name** | **QR** (Dual-Action Hub & Generator) |
| **Repository** | `https://github.com/injest-in/qr.git` |
| **Live Production URL** | `https://injest.in/qr/` |
| **Architecture** | 100% Client-Side React SPA, Zero-Backend, Offline-First PWA |
| **License** | MIT License (`LICENSE`) |
| **Core Libraries** | React 19, TypeScript 6, Vite 8, Tailwind CSS v4, Oxlint, qr-code-styling, jsPDF, html5-qrcode, PapaParse |

### Zero-Persistence Principle
There is **no remote backend, database, or analytics server**. All QR generation, vCard encoding, calendar `.ics` generation, camera scanning, and PDF rendering take place entirely within client-side browser memory. Do not introduce any remote tracking, telemetry, or server dependencies.

---

## 3. GitHub Pages & Custom Domain Rules (Critical)

> [!WARNING]
> Violating these rules will immediately break production routing on `https://injest.in/qr/`!

1. **Custom Domain Inheritance:**
   - The organization apex/root site `injest-in.github.io` owns the custom domain `injest.in`.
   - Any sub-project repository under this organization (e.g. `injest-in/qr`) automatically inherits the subpath `https://injest.in/qr/`.
2. **NO CNAME in this Repository:**
   - **DO NOT create a `CNAME` file** in `public/` or at the repository root.
   - Having a `CNAME` file in this sub-repository creates an apex domain conflict with the parent organization and breaks deployment with a 404 API error.
3. **Vite Base Path:**
   - The base path in `vite.config.ts` must remain strictly `base: '/qr/'`.
4. **HashRouter SPA Contract:**
   - GitHub Pages serves static files and does not support server-side URL rewrites.
   - All client routes must use HashRouter (`/#/<route>`).
   - `public/404.html` must remain present; it catches any direct browser navigation without hash and redirects back to `/#/<route>`.
5. **Jekyll Bypass:**
   - `public/.nojekyll` must remain present so GitHub Pages does not ignore assets or folders with leading underscores.
6. **GitHub Actions Workflow:**
   - `.github/workflows/deploy.yml` runs on Node 24 with `actions/deploy-pages@v4`.
   - The GitHub repository's **Settings > Pages > Build and deployment > Source** must be set to **GitHub Actions** (never "Deploy from a branch").

---

## 4. Key Functional Conventions & UI Rules

### 4.1 Tool Tiers
Tools in `src/components/QRGenerator.tsx` must be organized in three ranked tiers:
- **⚡ Simple Tools:** WhatsApp Chat (`whatsapp`), Mail to (`email`), Call to (`phone`), Website Link (`link`), UPI Payment (`upi`).
- **🏢 Business & Place:** Guest Wi-Fi (`wifi`), Business Card (`vcard`), Google Maps Directions (`maps`), Calendar Event (`calendar`).
- **🚀 Advanced Tools:** Pay via UPI + WhatsApp Receipt Gate (`pay-gate`), ServiceNow IT Ticket (`servicenow`), Form Prefill (`form`), Uber Ride Intent (`uber`), Store Catalog (`catalog`), Batch CSV Studio (`batch`), Scanner / Staff Mode (`scan` / `staff`).

### 4.2 Deeplink Bookmarking (Two-Way Hash Binding)
Every tool and all input fields must synchronize to `window.location.hash` with a 250ms debounce (`serializeToolToHash()` in `src/utils/qrParsers.ts`). On initial load, `parseToolFromHash()` must restore all form inputs and generate the QR code instantly.

### 4.3 Form Inputs & Informative Placeholders
- Form state fields must initialize to empty strings (`""`) unless loaded from URL hash parameters.
- **Never pre-fill inputs with dummy values** (e.g. "John Doe", "demo@upi") because users find backspacing tedious on mobile.
- Use descriptive `placeholder="e.g. 9876543210"` instead.

### 4.4 QR Defaults & Transparency
- **Default Background:** 100% Transparent (`isTransparent: true`, `bgColor: 'transparent'`).
- **Default Dot Matrix:** Circular dots (`dots`).
- **Default Corner Eyes:** Extra-rounded (`extra-rounded`).
- **Default Corner Dots:** Circular dot (`dot`).
- **Settings Modal:** Advanced visual controls live in `src/components/QRSettingsModal.tsx` via the **Customize Style** button.
- **Canvas Preview Invariant:** Irrespective of whether the active theme is Light, Dark, or System Auto, the QR preview container (`[data-tour="preview"]`) **must always preserve a light, high-contrast base** (`#ffffff` or user's custom `bgColor`). Never allow the canvas container to invert to dark in dark mode, because default dark QR codes would become invisible. On mobile screens (<390px), HTML5 `<canvas>` elements generated by `qr-code-styling` must be strictly constrained via `.qr-checkerboard canvas { max-width: 100% !important; height: auto !important; }` to prevent overflow spills onto surrounding dark backgrounds.

### 4.5 Theming & Mobile Header Space Conservation
- Light, Dark, and System Default themes are managed via `src/utils/theme.ts` and `src/components/ThemeToggle.tsx`.
- **Desktop Layout (`sm:flex`):** Renders a 3-button segmented pill (`Light`, `Dark`, `System`).
- **Mobile Layout (`sm:hidden`):** Renders a compact 34px floating dropdown to preserve app bar space.
- Selection is persisted in `localStorage` under `qr_theme_preference`.
- In System mode, it listens to `(prefers-color-scheme: dark)`.

### 4.6 Country Code Picker
- Phone numbers in WhatsApp, Phone Call, and Catalog use `src/components/CountryCodeSelect.tsx`.
- Country is auto-detected via timezone and browser language with a fallback to India (`+91`).

### 4.7 Interactive Spotlight Tour
- The onboarding tour is managed via `src/components/SpotlightTour.tsx`.
- Target elements are wired using `data-tour="<id>"` attributes (`tiers`, `bookmark`, `inputs`, `preview`, `customize`, `print`).
- Tour auto-triggers only on first visit and persists completion under `qr_has_seen_tour` in `localStorage`.
- Includes prominent **Skip Tour** buttons in the card header and footer, backdrop dismiss, and `Escape` key support.
- Mobile viewport adaptation: Uses vertical center scroll (`block: 'center'`) and adaptive top/bottom card docking so tooltips never clip offscreen or obscure highlighted elements.
- Re-triggerable anytime via the **Tour** button in the top navigation bar.

### 4.8 Open Source Trust & Auditable Links
- The repository is 100% open source under the MIT License (`https://github.com/injest-in/qr`).
- Clear trust links to GitHub and the MIT License are surfaced in:
  - Top header bar (`GitHub` icon button).
  - Sub-header privacy banner (`Audit Code` link and `MIT License` badge).
  - Generator live preview card footer (`100% On-Device • Open Source (MIT)` link).
  - `DualActionGate.tsx` payment gate footer.
  - Global application footer.
- When adding or modifying views, maintain these trust surfaces so users and security engineers can always independently verify client-side isolation and zero exfiltration.

### 4.9 Made in Bharat Vector Branding & Simple Phrasing
- **Plain-Language Copy:** Avoid intimidating technical jargon like "Hub & Zero-Persistence Generator" in primary headings. Use accessible, merchant-friendly language such as "Simple & Private QR Maker" and "100% Private: Your data never leaves this browser."
- **Authentic Bharat Branding:** Uses `src/components/MadeInBharatBadge.tsx` featuring the Indian Tricolor (Saffron `#FF9933`, White `#FFFFFF`, Green `#138808`) and a crisp 24-spoke Navy Blue Ashoka Chakra (`#000080`). Supported in header (`variant="pill"`), footer (`variant="footer"`), and inline gates (`variant="inline"`).

---

## 5. Performance Budget & Bundle Architecture

Heavy third-party libraries must **always be lazy-loaded** using React `lazy()` and dynamic `import()` to prevent bloating the initial bundle:
- `jspdf` (~130 KB gzipped) -> Loaded only in `PrintPreviewModal.tsx` when user clicks "Print Standee".
- `html5-qrcode` (~50 KB gzipped) -> Loaded only in `ScannerModal.tsx` when user opens the scanner.
- `papaparse` (~10 KB gzipped) -> Loaded only in `BulkCSVModal.tsx` when user opens Batch CSV.

**Budget Target:** Initial bundle must stay under **120 KB gzipped**.

---

## 6. Standard Development Workflow for Agents

Whenever making changes:

```powershell
# 1. Activate fnm & verify build
fnm env --use-on-cd | Out-String | Invoke-Expression; npm run build

# 2. Run linting
fnm env --use-on-cd | Out-String | Invoke-Expression; npm run lint

# 3. Check git status
git status

# 4. Commit changes (always include --no-gpg-sign)
git add .; git commit --no-gpg-sign -m "type(scope): concise description"
```

---

## 7. Documentation Locations

- **High-level user & developer guide:** [README.md](file:///c:/Users/Admin/Documents/Sites/qr/README.md)
- **Functional specification & schemas:** [docs/SPECIFICATION.md](file:///c:/Users/Admin/Documents/Sites/qr/docs/SPECIFICATION.md)
- **Architecture, diagrams & extension guide:** [docs/ARCHITECTURE.md](file:///c:/Users/Admin/Documents/Sites/qr/docs/ARCHITECTURE.md)
- **This file (agent manual):** [AGENTS.md](file:///c:/Users/Admin/Documents/Sites/qr/AGENTS.md)

---

## 8. Documentation Maintenance Rule (Mandatory for All Agents)

> [!IMPORTANT]
> **Always keep documentation 100% consistent with the codebase.**
> Whenever making functional, architectural, UX, routing, or environmental changes based on user input, you **MUST proactively update all corresponding documentation files**:
> 1. **`README.md`**: Update feature summaries, tool tables, deeplink examples, and deployment notes whenever tools, styling defaults, or setup steps change.
> 2. **`docs/SPECIFICATION.md`**: Update functional requirements, protocols, payload parameters, deeplink schemas, and edge case rules whenever inputs, schemas, or routing logic are modified.
> 3. **`docs/ARCHITECTURE.md`**: Update architecture diagrams, data flow sequences, bundle optimization notes, or component maps whenever architecture or component relationships change.
> 4. **`AGENTS.md`**: Update environment notes, tool Gotchas (e.g. `fnm`, PowerShell syntax, GPG flags), and operational constraints whenever new tools, dependencies, or workflows are introduced.
>
> **Never leave documentation out-of-sync with the current state of the codebase.**

