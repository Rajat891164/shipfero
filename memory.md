# 🧠 Shipfero — Quick Reference (memory.md)

> Bar-bar scan hone wali cheezein yahan. Naya durable fact mile → yahan add karo (session-specific mat daalo).

---

## 📍 Paths

| Kya | Path |
|-----|------|
| Repo root | `D:\My files\shipfero` |
| Backend | `D:\My files\shipfero\backend` |
| Django apps | `backend\apps\<app>\` |
| Settings package | `backend\config\settings\` (base/development/production) |
| Root URLconf | `backend\config\urls.py` |
| Frontend (React) | `D:\My files\ship\Admin_UI` ← **NOTE: "ship" folder, "shipfero" nahi** |
| Frontend API layer | `Admin_UI\src\services\api.js` |
| PRD full text | `converted.md` (root) |
| Flow diagram | `Flow_chartApp.png` (root) |
| Prior analysis | `docs\PROJECT_ANALYSIS.md` |

---

## ⚙️ Stack (fixed decisions)

- **Backend:** Django 5.1.11, DRF 3.17, SimpleJWT 5.5, psycopg2-binary. Python via `backend\venv`.
- ⚠️ **ALWAYS use `backend\venv\Scripts\python.exe`** for manage.py commands, never bare `python` — global Python (3.13) has a *different* Django (4.2.30) installed and produces subtly different migration files. Bash: `"venv/Scripts/python.exe" manage.py ...`.
- If venv pip packages look stale/missing (e.g. `rest_framework_simplejwt` ImportError), run `venv/Scripts/pip.exe install -r requirements.txt`.
- **DB:** PostgreSQL — name `shipfero_db`, user `postgres`, host `localhost:5432`, **schema `shipfero`** (set via `search_path` in settings). `db.sqlite3` = ignore (khaali).
- **Settings module:** `DJANGO_SETTINGS_MODULE=config.settings` (package `__init__.py` chooses env).
- **User model:** `accounts.User` — email-based, custom manager, no username.
- **JWT:** access 1h, refresh 7d, `ROTATE_REFRESH_TOKENS=True`, header `Bearer`.
- **DRF defaults:** `IsAuthenticated`, PageNumberPagination size 20.
- **Frontend:** React 18, Vite 5, Tailwind 3, Zustand, react-router 6, react-hook-form + zod, recharts, axios. Dev: `npm run dev`. Env `VITE_API_URL=http://localhost:8000/api`.

---

## 🗺️ URL prefix → app map

```
/api/auth/          accounts        /api/carriers/       carriers
/api/settings/      accounts        /api/couriers/       couriers
/api/merchants/     merchants       /api/integrations/   integrations
/api/orders/        orders          /api/pricing/        pricing
/api/shipments/     shipments       /api/reports/        reports
/api/tracking/      tracking        /api/billing/        billing
/api/ndr/           ndr             /api/notifications/  notifications
/api/returns/       returns         /api/admin/          admin_panel

/api/merchants/dashboard/  — Module 4, aggregated dashboard (added Phase 1)
```

Registered in `backend\config\urls.py`. Har app ka apna `urls.py`.

---

## 🧱 App roles (confusion avoid karo)

- `orders` = commercial order (channel se). `shipments` = logistics (AWB). 1:1.
- `carriers` = platform courier **catalog** (admin). `couriers` = merchant ke **configured accounts** (encrypted creds).
- `billing` = wallet + invoices + COD remittance. `pricing` = rate cards + zones.
- `admin_panel` = internal admin API (no own models).

---

## 🚦 Hard business rules

- KYC `verified` na ho → AWB booking blocked.
- Bank penny-drop verify na ho → COD remittance blocked.
- AWB book → wallet balance check → deduct → `WalletTransaction(DEDUCTION)`.
- Volumetric wt = (L×B×H)/5000; chargeable = MAX(actual, volumetric).
- NDR max attempts default 3 → auto-RTO.
- Min 1 pickup location before first shipment.

---

## 🐛 Known issues

1. ~~`pricing/models.py` duplicate field~~ ✅ fixed (`4bae33f`).
2. ~~13 apps ki migrations missing~~ ✅ fixed — sab migrated, 48 tables live in `shipfero_db` (`9415e0b`).
3. ~~`user.merchant` unhandled 500~~ ✅ fixed everywhere via `core/utils.get_merchant()` — swept across all 12 core modules in Phase 1 (commits `9013fc9` through `a6ad408`). New app code should use `get_merchant(request)`, never `request.user.merchant` directly.
4. Frontend `api.js` **purane endpoints** (`/accounts/`, `/logistics/`, `/wallet/balance/`) — current backend se mismatch. Rewire needed (Phase 2 — not started).
5. Root `database/ frontend/ ui/ deployment/` — khaali placeholders.
6. `config/settings_old.py` — legacy, cleanup pending (low priority).
7. `accounts.User.mobile` — required+unique but not in `REQUIRED_FIELDS`; `createsuperuser` leaves it as `''`. Fine for one superuser, risky for a second.
8. `django-cors-headers` referenced via `CORS_ALLOW_ALL_ORIGINS` in `development.py` but package not installed — no-op today, will matter once frontend (different origin/port) calls the API (Phase 2).
9. Payment Method Mapping / Status Pushback Config (PRD Module 3 sub-features) — no models built yet. Order processing should eventually block on unmapped payment methods per PRD; deferred.
10. Reports (Module 13) and courier/channel health monitors (Modules 2/3) are synchronous stubs pending Celery — by design, not bugs (Phase 3 work).

---

## 🔐 Encryption pattern (established, reuse this)

`core/encryption.py` — Fernet/AES symmetric encryption for any sensitive field stored in the DB (API keys, tokens, secrets). Key derives from `SECRET_KEY` unless `FIELD_ENCRYPTION_KEY` env var is set.

```python
from core.encryption import encrypt_value, decrypt_value, mask_value
# on write (create/update serializer): validated_data[field] = encrypt_value(raw)
# on read: add a SerializerMethodField returning mask_value(decrypt_value(obj.field))
```
Applied to: `couriers.MerchantCourier` (api_key/api_secret/account_number), `integrations.ChannelIntegration` (api_key/api_secret/access_token), `carriers.Carrier` via `admin_panel.AdminCarrierSerializer` (api_key/api_secret). If a new app stores third-party credentials, use this same pattern — don't store plaintext.

`core/utils.py` — `get_merchant(request)` returns the request user's Merchant or raises a clean DRF 403 (instead of `request.user.merchant` raising an unhandled 500 for staff/superuser accounts). Use this in every new merchant-scoped view.

---

## 🔑 Local dev test accounts

(Local Postgres only, not real credentials — recreate if DB reset)

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Superuser (Django admin) | `admin@shipfero.dev` | `Admin@12345` | No Merchant row — merchant-scoped endpoints correctly 403 (get_merchant) |
| Test merchant | `testmerchant@shipfero.dev` | `Test@12345` | Has Merchant row, KYC VERIFIED, wallet ~₹5840, 1 default pickup location (Mumbai), 3 orders (1 COD booked, 2 prepaid booked+bulk), 1 NDR (RE_ATTEMPTING), 1 return+refund, 1 courier config (Bluedart), 1 Shopify integration, 1 API key, 1 invited staff |

Seeded reference data: Carrier `BLUEDART` (id 1) + `DELHIVERY` (id 2, admin-created), 1 `CarrierRate` (STANDARD, zone A→B, base ₹40 + ₹10/kg, COD ₹20/1.5%).

Dev server: `"venv/Scripts/python.exe" manage.py runserver 127.0.0.1:8000`

---

## 🛠️ Common commands

```bash
# Backend (from backend/, venv active)
python manage.py check
python manage.py makemigrations <app>
python manage.py migrate
python manage.py runserver
python manage.py createsuperuser

# Frontend (from D:\My files\ship\Admin_UI)
npm run dev        # vite dev server
npm run build

# Windows shell = Git Bash. venv: backend\venv\Scripts\
```

---

## 📌 Conventions

- Naye Django app → `apps/<name>/`, `INSTALLED_APPS` me `apps.<name>` add, `config/urls.py` me route add.
- Har app: models, serializers, views, urls, admin, tests, migrations/.
- Shared base models/utils → `core/`.
- Timezone `Asia/Kolkata`, `USE_TZ=True`.
