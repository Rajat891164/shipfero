# ✅ Shipfero — Progress Tracker (progress.md)

> **Kaise use karna:** Jaise-jaise kaam hota jaaye, yahan status update karte jao.
> **Legend:** ✅ Done & verified · 🟡 Code written, not verified/migrated · 🔴 Broken/blocker · ⬜ Not started
> **Last updated:** 2026-07-10

---

## 🎯 Real Ground-Truth (verified, not just claimed)

`docs/PROJECT_ANALYSIS.md` sab apps ko "DONE" bolta hai — lekin **"done" ka matlab sirf code likha gaya hai**, migrate/test nahi hua. Actual verified state:

| Area | Reality |
|------|---------|
| Backend models/views/serializers/urls | Sab 15 apps ke liye **likhe gaye** (models 1542 lines, views 2467 lines) |
| Migrations | Sirf `accounts` (3) + `merchants` (1). **Baaki 13 apps ki migrations MISSING** → DB tables nahi bane |
| `python manage.py check` | 🔴 **FAIL** — `pricing.RateCard.rto_charge` duplicate field |
| Database | PostgreSQL `shipfero_db` / schema `shipfero` — **running/populated verify nahi hua** |
| Frontend (Admin_UI) | 16 pages scaffolded, par `api.js` **purane endpoints** par (`/accounts/`, `/logistics/`, `/wallet/balance/`) — current backend se **mismatch**, abhi effectively mock |
| Root `database/ frontend/ ui/ deployment/` | Khaali placeholders |

---

## 🔴 Blockers (pehle inhe fix karo)

- [ ] **B1** — `pricing/models.py`: `RateCard.rto_charge` duplicate field → `check` fail. Fix karo.
- [ ] **B2** — 13 apps ke liye `makemigrations` + `migrate` chahiye (shipments, carriers, billing, notifications, orders, tracking, ndr, returns, couriers, integrations, pricing, reports; admin_panel me models nahi).
- [ ] **B3** — Confirm karo `config.settings` package (`config/settings/__init__.py`) sahi environment (development) load karta hai; purana `config/settings_old.py` cleanup.
- [ ] **B4** — PostgreSQL up hai + `shipfero` schema bana hai — verify.

---

## 📊 Module-wise Status

| # | Module | App | Code | Migrated | API tested | Frontend wired |
|---|--------|-----|------|----------|-----------|----------------|
| 1 | Onboarding | accounts+merchants | ✅ | ✅ | ⬜ | 🔴 mismatch |
| 2 | Courier Integration | couriers | 🟡 | 🔴 | ⬜ | 🔴 |
| 3 | Channel Integration | integrations | 🟡 | 🔴 | ⬜ | 🔴 |
| 4 | Dashboard | aggregated | 🟡 | — | ⬜ | 🔴 |
| 5 | Orders | orders | 🟡 | 🔴 | ⬜ | 🔴 |
| 6 | Track | tracking | 🟡 | 🔴 | ⬜ | 🔴 |
| 7 | NDR | ndr | 🟡 | 🔴 | ⬜ | 🔴 |
| 8 | Returns | returns | 🟡 | 🔴 | ⬜ | 🔴 |
| 9 | Logistics | carriers | 🟡 | 🔴 | ⬜ | 🔴 |
| 10 | Wallet | billing | 🟡 | 🔴 | ⬜ | 🔴 |
| 11 | Pricing | pricing | 🔴 bug | 🔴 | ⬜ | 🔴 |
| 12 | Add-ons | addons | ⬜ | ⬜ | ⬜ | 🟡 page hai |
| 13 | Reports | reports | 🟡 | 🔴 | ⬜ | 🔴 |
| 14 | Settings | accounts | 🟡 | partial | ⬜ | 🔴 |
| 15 | Gen AI | FastAPI | ⬜ | ⬜ | ⬜ | ⬜ |

---

## 🧩 Frontend Pages (Admin_UI/src/pages)

Scaffolded (UI bana, backend se juda nahi): Login, Onboarding, Dashboard, Orders, OrderDetail, Track, NDR, Returns, Wallet, Pricing, Reports, Settings, Integrations, CourierSettings, Logistics, AddOns.

- [ ] `api.js` ko current backend endpoints par re-point karo
- [ ] JWT refresh flow implement karo (abhi commented/mock)
- [ ] Har page ko real API se wire karo

---

## 🔜 Next Up (proposed order — plan me detail)

1. Fix blockers B1–B4 → backend cleanly runs + migrates.
2. Verify onboarding flow end-to-end (signup→OTP→profile→KYC→bank→pickup→plan).
3. Per-module: migrate → seed test data → API test → mark ✅.
4. Frontend `api.js` rewire → page-by-page integration.
5. Celery + S3 wiring for tracking webhooks / reports.
6. Add-ons + Gen AI (future).

---

## 📝 Changelog

- **2026-07-10** — Initial verified audit. Docs banaye (project.md, progress.md, memory.md). Blockers identify kiye (pricing bug, 13 missing migrations, frontend endpoint mismatch).
