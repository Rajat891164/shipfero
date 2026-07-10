# 📊 SHIPFERO — Full Project Analysis, Progress & Guidance

> Generated: 2026-07-10 | Stack: Django 5.1 + DRF + PostgreSQL + JWT

---

## 🏗 Project Overview

**Shipfero** is a multi-courier aggregation platform (like Shiprocket) for D2C Indian merchants.  
Merchants onboard → connect channels (Shopify/Amazon) → configure couriers → book shipments → track → manage NDR/Returns → billing via wallet.

**Full Stack:**  
- Backend: Django 5.1 + DRF + PostgreSQL (schema: `shipfero`)  
- Auth: JWT (SimpleJWT)  
- Task Queue: Celery + Redis (planned)  
- Storage: AWS S3 (planned)  
- Frontend: React.js + Vite (to be integrated after backend completes)

---

## 📋 15-Module PRD Breakdown (from converted.md)

| # | Module | Django App | Status |
|---|--------|-----------|--------|
| 1 | Onboarding | `accounts/` + `merchants/` | ✅ **DONE** |
| 2 | Courier Integration | `couriers/` (new) | ✅ **DONE** |
| 3 | Platform/Channel Integration | `integrations/` (new) | ✅ **DONE** |
| 4 | Dashboard | aggregated APIs | ✅ **DONE** |
| 5 | Orders | `orders/` (new) | ✅ **DONE** |
| 6 | Track | `tracking/` (new) | ✅ **DONE** |
| 7 | NDR | `ndr/` (new) | ✅ **DONE** |
| 8 | Returns | `returns/` (new) | ✅ **DONE** |
| 9 | Logistics | `carriers/` (partial) | ✅ **DONE** |
| 10 | Wallet | `billing/` (partial) | ✅ **DONE** |
| 11 | Pricing | `pricing/` (new) | ✅ **DONE** |
| 12 | Add-ons | `addons/` (new) | ❌ **PENDING** |
| 13 | Reports | `reports/` (new) | ✅ **DONE** |
| 14 | Settings | `accounts/` extension | ✅ **DONE** |
| 15 | Gen AI Suite | FastAPI microservice | ❌ **FUTURE** |

---

## ✅ WHAT IS ALREADY BUILT

### `apps/accounts/` — User Auth
- ✅ `User` model (email-based, custom manager)
- ✅ `EmailOTP` model (6-digit, 15min expiry, cooldown)
- ✅ `POST /api/auth/signup/` — creates User + Merchant + OTP
- ✅ `POST /api/auth/send-email-otp/` — resend OTP
- ✅ `POST /api/auth/verify-email-otp/` — verifies OTP, advances step
- ✅ JWT token endpoints via SimpleJWT

### `apps/merchants/` — Merchant Onboarding
- ✅ Models: `Merchant`, `MerchantProfile`, `MerchantKYC`, `MerchantBankDetails`, `PickupLocation`, `MerchantPlan`
- ✅ `GET /api/merchants/me/` — merchant basic info
- ✅ `GET/POST/PATCH /api/merchants/onboarding/business-profile/`
- ✅ `GET/POST /api/merchants/onboarding/kyc/`
- ✅ `GET/POST /api/merchants/onboarding/bank-details/`
- ✅ `GET/POST /api/merchants/onboarding/pickup-locations/`
- ✅ `POST /api/merchants/onboarding/complete/`
- ✅ `GET /api/merchants/onboarding/status/`
- ✅ `GET /api/merchants/plan/`

### `apps/shipments/` — Basic Shipments
- ✅ Models: `Shipment`, `ShipmentStatusEvent`, `ShipmentLabel`
- ✅ `GET/POST /api/shipments/` — list/create
- ✅ `GET/PATCH/DELETE /api/shipments/<pk>/` — detail/cancel
- ✅ `POST /api/shipments/<pk>/book/` — book shipment
- ✅ `GET /api/shipments/track/<tracking_id>/` — public track
- ✅ `GET /api/shipments/stats/` — dashboard stats

### `apps/carriers/` — Basic Carrier Management
- ✅ Models: `Carrier`, `CarrierRate`, `ServiceablePincode`
- ✅ `GET /api/carriers/` — list active carriers
- ✅ `GET /api/carriers/<pk>/` — carrier detail
- ✅ `POST /api/carriers/serviceability/` — check serviceability
- ✅ `POST /api/carriers/calculate-rate/` — rate calculator

### `apps/billing/` — Wallet & Billing
- ✅ Models: `Wallet`, `WalletTransaction`, `Invoice`
- ✅ `GET /api/billing/wallet/` — wallet balance
- ✅ `POST /api/billing/wallet/add-funds/` — recharge
- ✅ `GET /api/billing/transactions/` — history
- ✅ `GET /api/billing/invoices/` — invoices
- ✅ `GET /api/billing/summary/` — billing summary

### `apps/notifications/` — In-app Notifications
- ✅ `Notification` model with types/priorities
- ✅ `GET /api/notifications/` — list
- ✅ `POST /api/notifications/<pk>/read/` — mark read
- ✅ `POST /api/notifications/mark-all-read/`
- ✅ `GET /api/notifications/unread-count/`

### `apps/admin_panel/` — Internal Admin API
- ✅ `GET /api/admin/dashboard/` — platform stats
- ✅ `GET/POST /api/admin/kyc/<pk>/review/` — KYC approve/reject
- ✅ `GET/PATCH /api/admin/merchants/<pk>/` — merchant management
- ✅ `POST /api/admin/merchants/<pk>/status/` — suspend/activate
- ✅ `GET/POST/PATCH/DELETE /api/admin/carriers/` — carrier CRUD
- ✅ `POST /api/admin/billing/adjust/` — manual wallet adjustment

---

## ❌ WHAT IS REMAINING — PRIORITY ORDER

### 🔴 PRIORITY 1 — Core Business Logic (Build Immediately)

#### Module 5: `apps/orders/` — Orders Management
This is the CORE business flow. Orders come from channel sync, get processed, AWBs booked.

**Models needed:**
- `Order` — main order from channel (Shopify/Amazon/manual)
- `OrderCustomer` — buyer details
- `OrderItem` — line items (product, SKU, qty, price, weight)
- `OrderStatusHistory` — audit trail of status changes

**APIs needed:**
- `GET /api/orders/` — paginated list with filters (status/date/channel/courier)
- `GET /api/orders/<id>/` — full order detail with items + tracking
- `POST /api/orders/` — create manual order
- `PATCH /api/orders/<id>/` — update order (weight, dimensions)
- `POST /api/orders/<id>/process/` — validate + move to processing
- `POST /api/orders/<id>/book-awb/` — book AWB via carrier
- `POST /api/orders/bulk-process/` — bulk process up to 500 orders
- `GET /api/orders/stats/` — new/processing/booked counts for dashboard

---

#### Module 6: `apps/tracking/` — Shipment Tracking
Tracking webhooks from couriers + customer-facing branded tracking.

**Models needed:**
- `TrackingEvent` — per-AWB event (status, location, timestamp)
- `WebhookLog` — incoming courier webhook log (idempotency)
- `CustomerNotification` — SMS/email/WhatsApp sent log

**APIs needed:**
- `GET /api/tracking/<awb>/` — full tracking timeline
- `POST /api/tracking/webhooks/<courier_code>/` — courier webhook receiver
- `GET /api/tracking/analytics/` — TAT, delivery %, delay analysis
- Public branded page endpoint

---

#### Module 7: `apps/ndr/` — Non-Delivery Reports
Critical for reducing RTO. NDR created when courier fails delivery.

**Models needed:**
- `NDR` — linked to Shipment, reason code, attempt count
- `NDRAction` — merchant action log (re-attempt / update address / RTO)

**APIs needed:**
- `GET /api/ndr/` — list NDRs with filters
- `GET /api/ndr/<id>/` — NDR detail
- `POST /api/ndr/<id>/action/` — take action (re-attempt/RTO/address update)
- `GET /api/ndr/dashboard/` — summary stats
- `POST /api/ndr/bulk-action/` — bulk action up to 100 NDRs

---

#### Module 8: `apps/returns/` — Returns & RTO
RTO auto-created after max NDR attempts. Reverse pickup merchant-initiated.

**Models needed:**
- `Return` — linked to original Shipment, return type (RTO/Reverse)
- `ReturnTrackingEvent` — return journey tracking
- `Refund` — refund record per return

**APIs needed:**
- `GET /api/returns/` — list returns
- `GET /api/returns/<id>/` — return detail + tracking
- `POST /api/returns/` — create reverse pickup
- `POST /api/returns/<id>/mark-received/` — confirm received at warehouse
- `GET /api/returns/stats/` — stats for dashboard

---

### 🟠 PRIORITY 2 — Integration Layer

#### Module 2: `apps/couriers/` — Courier Integration (Merchant-side)
Per-merchant courier credential management. Different from `apps/carriers/` (platform carrier catalog).

**Models needed:**
- `MerchantCourier` — merchant's configured courier account
- `CourierCredential` — AES-256 encrypted API keys/tokens
- `CourierHealthCheck` — ping results per courier
- `CourierHealthLog` — historical uptime data

**APIs needed:**
- `GET /api/couriers/` — merchant's configured couriers
- `POST /api/couriers/` — add courier (wizard step by step)
- `POST /api/couriers/<id>/test/` — test connection
- `GET /api/couriers/<id>/health/` — health status
- `DELETE /api/couriers/<id>/` — remove (blocked if in-transit shipments)

---

#### Module 3: `apps/integrations/` — Channel Integration
Shopify, Amazon, WooCommerce order sync.

**Models needed:**
- `ChannelIntegration` — per-merchant channel connection
- `PaymentMethodMapping` — channel payment → COD/Prepaid
- `StatusPushbackConfig` — platform status → channel status mapping
- `IntegrationSyncLog` — sync history, errors

**APIs needed:**
- `GET/POST /api/integrations/` — list/add integration
- `POST /api/integrations/<id>/sync/` — manual sync
- `GET /api/integrations/<id>/logs/` — sync history
- `POST /api/integrations/webhooks/<platform>/` — incoming orders webhook

---

### 🟡 PRIORITY 3 — Supporting Features

#### Module 11: `apps/pricing/` — Rate Cards
Zone-wise pricing visible to merchants.

**Models needed:**
- `PricingZone` — zone definitions (A/B/C/D/E)
- `RateCard` — per courier, per zone, per weight slab

**APIs needed:**
- `GET /api/pricing/rate-cards/` — full rate matrix with filter by courier
- `GET /api/pricing/zones/` — zone definitions
- `POST /api/pricing/compare/` — compare all couriers for a route

---

#### Module 13: `apps/reports/` — MIS Reports
Background Celery tasks for heavy exports.

**Models needed:**
- `ReportJob` — background report task (status, S3 URL)
- `ScheduledReport` — recurring report config

**APIs needed:**
- `POST /api/reports/generate/` — kick off report generation
- `GET /api/reports/<id>/status/` — polling endpoint
- `GET /api/reports/` — download center (past 90 days)
- `POST /api/reports/scheduled/` — create scheduled report

---

#### Module 14 Extension: `apps/accounts/` Settings
**Missing from current accounts app:**
- `MerchantAPIKey` model — generate/revoke API keys
- `StaffMember` model — invite staff with role-based permissions
- `AuditLog` model — immutable change log

**APIs needed:**
- `POST /api/settings/api-keys/` — generate key
- `DELETE /api/settings/api-keys/<id>/` — revoke
- `GET/POST /api/settings/staff/` — invite staff
- `PATCH /api/settings/staff/<id>/permissions/` — update permissions
- `GET /api/settings/audit-logs/` — immutable audit trail

---

#### Module 12: `apps/addons/` — Premium Add-ons (Lower Priority)
- Shipway Protect (shipment insurance)
- EDD Widget
- COD Verification
- NDR WhatsApp
- NDR Calling
- Shipway Delight (post-delivery engagement)

---

#### Module 15: Gen AI Suite (Future — Separate FastAPI microservice)
- AI Courier Selector, RTO Risk Scorer, Address Intelligence, NDR AI Classifier, NL Reports

---

## 🔧 WHAT NEEDS FIXING IN EXISTING CODE

| Issue | File | Fix Needed |
|-------|------|------------|
| `migrations/` folders missing | All new apps | Run `makemigrations` for each app |
| `simplejwt` not in old `urls.py` | `config/urls.py` | ✅ Already updated |
| Old accounts urls used `/api/accounts/` | All references | Now `/api/auth/` |
| `MerchantPlan` start_date has no default | `merchants/models.py` | Add `auto_now_add` or default |
| `Shipment.carrier` FK → `"carriers.Carrier"` | `shipments/models.py` | Verify app_label resolves |
| No `migrations/` folder for `shipments`, `carriers`, `billing`, `notifications`, `admin_panel` | All new apps | Create via `makemigrations` |

---

## 📁 FINAL TARGET DIRECTORY STRUCTURE

```
backend/
├── apps/
│   ├── accounts/          ✅ Done
│   ├── merchants/         ✅ Done
│   ├── shipments/         ✅ Done (needs migrations)
│   ├── carriers/          ✅ Done (needs migrations)
│   ├── billing/           ✅ Done (needs migrations)
│   ├── notifications/     ✅ Done (needs migrations)
│   ├── admin_panel/       ✅ Done (no models)
│   ├── orders/            ✅ Done
│   ├── tracking/          ✅ Done
│   ├── ndr/               ✅ Done
│   ├── returns/           ✅ Done
│   ├── couriers/          ✅ Done
│   ├── integrations/      ✅ Done
│   ├── pricing/           ✅ Done
│   ├── reports/           ✅ Done
│   └── addons/            ❌ BUILD LATER
├── core/                  ✅ Done
├── config/                ✅ Done
└── manage.py              ✅ Done
```

---

## 🗺 COMPLETE API ENDPOINT REFERENCE (Target)

### Auth (`/api/auth/`)
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/signup/` | Register new merchant |
| POST | `/send-email-otp/` | Send OTP |
| POST | `/verify-email-otp/` | Verify OTP |
| POST | `/token/` | Get JWT tokens |
| POST | `/token/refresh/` | Refresh JWT |

### Merchants (`/api/merchants/`)
| Method | URL | Description |
|--------|-----|-------------|
| GET/PATCH | `/me/` | Merchant profile |
| GET | `/onboarding/status/` | Onboarding progress |
| GET/POST/PATCH | `/onboarding/business-profile/` | Business profile |
| GET/POST | `/onboarding/kyc/` | KYC documents |
| GET/POST/PATCH/DELETE | `/onboarding/bank-details/<pk>/` | Bank accounts |
| GET/POST/PATCH/DELETE | `/onboarding/pickup-locations/<pk>/` | Pickup locations |
| POST | `/onboarding/complete/` | Complete onboarding |
| GET | `/plan/` | Current plan |

### Orders (`/api/orders/`) — PENDING
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/` | List orders (paginated, filterable) |
| POST | `/` | Create manual order |
| GET | `/<id>/` | Order detail |
| PATCH | `/<id>/` | Update order |
| POST | `/<id>/process/` | Move to processing |
| POST | `/<id>/book-awb/` | Book AWB |
| POST | `/bulk-process/` | Bulk book up to 500 |
| GET | `/stats/` | Dashboard counts |

### Shipments (`/api/shipments/`)
| Method | URL | Description |
|--------|-----|-------------|
| GET/POST | `/` | List/create |
| GET/PATCH/DELETE | `/<pk>/` | Detail/update/cancel |
| POST | `/<pk>/book/` | Book a draft shipment |
| GET | `/track/<tracking_id>/` | Public tracking |
| GET | `/stats/` | Status counts |

### Tracking (`/api/tracking/`) — PENDING
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/<awb>/` | Full tracking timeline |
| POST | `/webhooks/<courier_code>/` | Courier webhook |
| GET | `/analytics/` | TAT/delivery stats |

### NDR (`/api/ndr/`) — PENDING
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/` | NDR list |
| GET | `/dashboard/` | Summary stats |
| GET | `/<id>/` | NDR detail |
| POST | `/<id>/action/` | Take action |
| POST | `/bulk-action/` | Bulk action |

### Returns (`/api/returns/`) — PENDING
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/` | Returns list |
| POST | `/` | Create reverse pickup |
| GET | `/<id>/` | Return detail |
| POST | `/<id>/mark-received/` | Confirm received |
| GET | `/stats/` | Return stats |

### Carriers (`/api/carriers/`)
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/` | List active carriers |
| GET | `/<pk>/` | Carrier detail |
| POST | `/serviceability/` | Check serviceability |
| POST | `/calculate-rate/` | Rate calculator |

### Couriers — Merchant (`/api/couriers/`) — PENDING
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/` | My configured couriers |
| POST | `/` | Add courier account |
| PATCH | `/<id>/` | Update settings |
| DELETE | `/<id>/` | Remove courier |
| POST | `/<id>/test/` | Test API connection |
| GET | `/<id>/health/` | Health status |

### Integrations (`/api/integrations/`) — PENDING
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/` | My channel integrations |
| POST | `/` | Add integration |
| DELETE | `/<id>/` | Remove |
| POST | `/<id>/sync/` | Manual sync |
| GET | `/<id>/logs/` | Sync history |
| POST | `/webhooks/<platform>/` | Incoming order webhook |

### Billing (`/api/billing/`)
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/wallet/` | Balance |
| POST | `/wallet/add-funds/` | Recharge |
| GET | `/transactions/` | History |
| GET | `/invoices/` | Invoices |
| GET | `/summary/` | Dashboard summary |

### Pricing (`/api/pricing/`) — PENDING
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/rate-cards/` | Zone-wise rates |
| GET | `/zones/` | Zone definitions |
| POST | `/compare/` | Compare couriers |

### Reports (`/api/reports/`) — PENDING
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/generate/` | Start report job |
| GET | `/<id>/status/` | Job progress |
| GET | `/` | Past reports |

### Notifications (`/api/notifications/`)
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/` | List |
| GET | `/unread-count/` | Badge count |
| POST | `/mark-all-read/` | Mark all read |
| GET/POST | `/<pk>/read/` | Mark one read |

### Admin Panel (`/api/admin/`)
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/dashboard/` | Platform stats |
| GET | `/kyc/` | All KYC docs |
| POST | `/kyc/<pk>/review/` | Approve/reject |
| GET | `/merchants/` | All merchants |
| PATCH | `/merchants/<pk>/` | Edit merchant |
| POST | `/merchants/<pk>/status/` | Change status |
| GET/POST | `/carriers/` | Carrier CRUD |
| POST | `/billing/adjust/` | Wallet adjustment |

---

## 🚀 BUILD ORDER (Recommended)

```
Phase 1 — Core Transaction Flow (Build Next):
  1. apps/orders/       — Order model + CRUD + book-AWB
  2. apps/tracking/     — Webhook receiver + tracking timeline
  3. apps/ndr/          — NDR creation + merchant actions
  4. apps/returns/      — RTO + reverse pickup

Phase 2 — Integration Layer:
  5. apps/couriers/     — Per-merchant courier credentials
  6. apps/integrations/ — Shopify/Amazon/WooCommerce sync

Phase 3 — Supporting Features:
  7. apps/pricing/      — Rate cards
  8. apps/reports/      — Celery-based report export
  9. Settings extension — API keys, staff, audit logs

Phase 4 — Add-ons:
  10. apps/addons/      — Insurance, EDD, COD verify, WhatsApp

Phase 5 — AI Suite (Future):
  11. FastAPI microservice for Gen AI features
```

---

## ⚠️ KEY TECHNICAL DECISIONS

1. **`apps/orders/` vs `apps/shipments/`**: Orders are the commercial entity (from channel). Shipments are logistics entity (with AWB). One Order → One Shipment (1:1 or eventually 1:many for splits).

2. **`apps/couriers/` vs `apps/carriers/`**: `carriers` = platform catalog (admin manages). `couriers` = merchant's configured accounts with credentials.

3. **Celery needed for**: Report exports, courier health pings, webhook processing, scheduled sync, notification delivery.

4. **AWS S3 needed for**: KYC document storage, label PDFs, report downloads, logo uploads.

5. **Database schema**: All tables in PostgreSQL schema `shipfero` (set via `search_path`).

6. **Wallet deduction on AWB booking**: When `POST /orders/<id>/book-awb/` is called → check wallet balance → deduct shipping charge → create `WalletTransaction(DEDUCTION)`.

---

*Last updated: 2026-07-10*
