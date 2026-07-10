# 📦 Shipfero — Project Overview (project.md)

> **Kya hai:** Multi-courier aggregation platform (Shiprocket-jaisa) for Indian D2C merchants.
> **Stack:** Django 5.1 + DRF + PostgreSQL + JWT · React 18 + Vite + Tailwind
> **Last updated:** 2026-07-10

---

## 1. Ek line me

Merchant onboard hota hai → channel connect karta hai (Shopify/Amazon/WooCommerce) → couriers configure karta hai → orders sync hote hain → AWB book hota hai → shipment track hota hai → NDR/Returns manage hote hain → wallet se billing hoti hai.

Ye poora flow attached **Flowchart** aur **ShipboltPRD.pdf** (root ka `converted.md`) me define hai.

---

## 2. Architecture

```
D:\My files\shipfero\                 ← project root (repo)
├── backend/                          ← Django project (main kaam yahan)
│   ├── config/                       ← settings package, urls, wsgi/asgi
│   │   └── settings/                 ← base.py / development.py / production.py
│   ├── core/                         ← shared base models/utils
│   ├── apps/                         ← 15 feature apps (see below)
│   ├── manage.py
│   ├── requirements.txt
│   └── db.sqlite3                    ← purana/khaali; asli DB = PostgreSQL
├── docs/PROJECT_ANALYSIS.md          ← pehle se bana analysis (reference)
├── converted.md                      ← PRD ka full text (ShipboltPRD.pdf)
├── Flow_chartApp.png                 ← end-to-end flow diagram
├── database/ frontend/ ui/ deployment/  ← abhi KHAALI (placeholders)
└── (frontend asli me alag path par)

D:\My files\ship\Admin_UI\            ← React frontend (is project ka UI)
├── src/pages/                        ← 16 pages (Dashboard, Orders, NDR, ...)
├── src/services/api.js               ← API layer (abhi mock + purane endpoints)
├── src/store/                        ← Zustand stores (auth, ui)
└── src/components/layout/            ← Sidebar, Topbar, Layout
```

**Backend stack detail:**
- Django 5.1.11 + Django REST Framework 3.17
- Auth: JWT via `djangorestframework-simplejwt` (access 1h, refresh 7d, rotate ON)
- DB: PostgreSQL — database `shipfero_db`, schema `shipfero` (via `search_path`)
- Custom user: `accounts.User` (email-based login, no username)
- Default DRF permission: `IsAuthenticated`; pagination 20/page
- Timezone: `Asia/Kolkata`

**Frontend stack detail:**
- React 18 + Vite 5 + Tailwind 3
- Routing: react-router-dom 6 · State: Zustand · Forms: react-hook-form + zod
- Charts: recharts · HTTP: axios · Animation: framer-motion · Icons: lucide-react

**Planned (abhi nahi bana):** Celery + Redis (background tasks), AWS S3 (file storage), FastAPI microservice (Gen AI suite).

---

## 3. 15 Modules — Feature List

Poora feature detail `converted.md` (PRD) me hai. Yahan har module ka summary + Django app mapping:

| # | Module | Django App | Purpose |
|---|--------|-----------|---------|
| 1 | **Onboarding** | `accounts` + `merchants` | Signup → Email OTP → Business Profile → KYC → Bank (penny drop) → Pickup Location → Plan → Checklist |
| 2 | **Courier Integration** | `couriers` | Per-merchant courier accounts, AES-256 encrypted credentials, add-courier wizard, health monitor, test connection, serviceability |
| 3 | **Channel Integration** | `integrations` | Shopify/Amazon/WooCommerce+ connect, payment-method mapping, status pushback, sync settings, sync logs |
| 4 | **Dashboard** | aggregated APIs | Overview cards, shipment-status breakdown, charts, pending-actions, getting-started checklist, courier stats, top-10 |
| 5 | **Orders** | `orders` | New → Process → Manifest → Book AWB. List/detail, bulk process (≤500), weight/dim confirm, wallet check |
| 6 | **Track** | `tracking` | AWB tracking timeline, courier webhooks (incoming), branded public tracking page, customer SMS/email/WhatsApp, analytics (TAT/delivery%) |
| 7 | **NDR** | `ndr` | Non-delivery mgmt. 8 standard reason codes, action pending/taken, re-attempt/RTO/address-update, bulk action (≤100), escalation flow |
| 8 | **Returns** | `returns` | RTO (auto after max NDR) + reverse pickup (merchant-initiated), refunds, pickup-failed report, return analytics |
| 9 | **Logistics** | `carriers` | Platform courier catalog, serviceability check, pickup-location mgmt, per-merchant enable/disable, courier performance |
| 10 | **Wallet** | `billing` | Balance (real-time), recharge (Razorpay/UPI), transaction history, COD remittance tracking, invoices |
| 11 | **Pricing** | `pricing` | Zone-wise rate cards (A–E), weight slabs, volumetric weight, COD charge, fuel surcharge, rate comparison tool |
| 12 | **Add-ons** | `addons` *(not built)* | Shipway Protect (insurance), EDD widget, COD verify, NDR WhatsApp, NDR calling, Shipway Delight |
| 13 | **Reports** | `reports` | Master MIS, orders/shipment/NDR/delay/product reports, scheduled reports, download center (Celery + S3) |
| 14 | **Settings** | `accounts` (+ `settings_*`) | Profile, KYC, bank, API keys (hashed), staff mgmt (roles + JSONB permissions), immutable audit logs |
| 15 | **Gen AI Suite** | FastAPI *(future)* | AI courier selector, RTO risk scorer, address intelligence, NDR classifier, NL reports + agentic agents |

> **Do khaas distinctions:**
> - `orders` = commercial entity (channel se aaya). `shipments` = logistics entity (AWB ke saath). 1 Order → 1 Shipment.
> - `carriers` = platform ka courier catalog (admin manage karta hai). `couriers` = merchant ke apne configured courier accounts (credentials ke saath).

---

## 4. Key Business Rules (PRD se)

- **AWB booking BLOCKED** jab tak `kyc_status = 'verified'` na ho.
- **COD remittance BLOCKED** jab tak bank penny-drop verify na ho.
- Min 1 pickup location zaroori pehle shipment se pehle.
- **Wallet deduct** hota hai AWB booking par → balance check → deduct → `WalletTransaction(DEDUCTION)`.
- Volumetric weight = (L×B×H)/5000; chargeable = MAX(actual, volumetric).
- NDR max attempts default 3 → auto-RTO (configurable).
- Sabhi files (KYC, labels, reports) → private S3 (planned).
- 14-day Pro trial auto-applied har naye merchant ko.

---

## 5. API Surface (current backend)

Base: `http://localhost:8000/api/` · Auth: `Authorization: Bearer <jwt>`

| Prefix | App | Highlights |
|--------|-----|-----------|
| `/api/auth/` | accounts | signup, send/verify-email-otp, token, token/refresh |
| `/api/settings/` | accounts | profile, api-keys, staff, audit-logs |
| `/api/merchants/` | merchants | me, onboarding/{business-profile,kyc,bank-details,pickup-locations,complete,status}, plan |
| `/api/orders/` | orders | list/create, detail, process, book-awb, bulk-process, stats |
| `/api/shipments/` | shipments | list/create, detail, book, track/`<id>`, stats |
| `/api/tracking/` | tracking | `<awb>`, webhooks/`<courier>`, analytics |
| `/api/ndr/` | ndr | list, dashboard, `<id>`, action, bulk-action |
| `/api/returns/` | returns | list, create, `<id>`, mark-received, stats |
| `/api/carriers/` | carriers | list, `<pk>`, serviceability, calculate-rate |
| `/api/couriers/` | couriers | list/add, `<id>`, test, health |
| `/api/integrations/` | integrations | list/add, `<id>`, sync, logs, webhooks/`<platform>` |
| `/api/pricing/` | pricing | rate-cards, zones, compare |
| `/api/reports/` | reports | generate, `<id>`/status, list |
| `/api/billing/` | billing | wallet, wallet/add-funds, transactions, invoices, summary |
| `/api/notifications/` | notifications | list, unread-count, mark-all-read, `<pk>`/read |
| `/api/admin/` | admin_panel | dashboard, kyc review, merchants, carriers CRUD, billing/adjust |

Full endpoint table: `docs/PROJECT_ANALYSIS.md`.

---

## 6. Reference Files

- **`converted.md`** — poora PRD (15 modules, har feature detail me).
- **`Flow_chartApp.png`** — end-to-end merchant + order + delivery flow.
- **`docs/PROJECT_ANALYSIS.md`** — pehle ka detailed analysis + target endpoint tables.
- **`progress.md`** — kya ban gaya / kya baaki (live tracker).
- **`memory.md`** — repetitive quick-reference (paths, commands, conventions).
