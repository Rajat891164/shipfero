# ✅ Shipfero — Progress Tracker (progress.md)

> **Kaise use karna:** Jaise-jaise kaam hota jaaye, yahan status update karte jao.
> **Legend:** ✅ Done & verified · 🟡 Code written, not verified/migrated · 🔴 Broken/blocker · ⬜ Not started
> **Last updated:** 2026-07-10 (Phase 0 complete)

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

## ✅ Phase 0 — DONE (2026-07-10)

Backend ab cleanly chalta hai, migrated hai, aur end-to-end login+onboarding verified real PostgreSQL par.

- [x] **B1** — `pricing/models.py` duplicate `rto_charge` field fixed. (`4bae33f`)
- [x] **B2** — Sabhi 13 apps ki migrations generate + apply hui. venv Django 5.1.11 use kiya (pehle galti se global Python 4.2.30 use ho gaya tha — un migrations ko discard karke dobara sahi version se banaya). (`9415e0b`)
- [x] **B3** — `config.settings` package confirmed working (`DJANGO_ENV=development` default). `settings_old.py` abhi bhi hai, cleanup pending (low priority, harmless).
- [x] **B4** — PostgreSQL running (v13), `shipfero_db` + schema `shipfero` already existed, sab 48 tables ab bane hain.
- [x] **B5 (new, found+fixed)** — `/api/auth/token/` aur `/token/refresh/` routes hi register nahi the (SimpleJWT installed tha but wired nahi). Add kiya `accounts/urls.py` me. (`f84f339`)

**End-to-end verified (real DB, not mocked):**
```
POST /api/auth/signup/        -> User + Merchant created
POST /api/auth/token/         -> JWT access+refresh
POST /api/auth/send-email-otp/ + verify-email-otp/  -> onboarding_step 1 -> 3
GET  /api/merchants/me/, /api/merchants/onboarding/status/  -> correct data
```

**venv note:** `backend/venv` me `djangorestframework-simplejwt` missing thi (requirements.txt me thi par install nahi hui) — `pip install -r requirements.txt` re-run karke fix kiya. **Hamesha `backend/venv/Scripts/python.exe` use karo**, system/global `python` nahi (usme Django 4.2.30 hai, alag environment).

---

## 🟡 Known non-blocking issue (Phase 1 me fix karna)

Kai views (`couriers`, `integrations`, `reports`, etc.) `self.request.user.merchant` directly access karte hain bina `DoesNotExist` handle kiye → agar user ke paas Merchant na ho (e.g. internal staff/superuser) to **500** aata hai instead of clean 403/404. Per-module verification ke time isko wrap karo (try/except ya ek shared mixin/permission class se).

`User.mobile` field required hai (`unique=True`, no `default`, no `null=True`) lekin `REQUIRED_FIELDS` me nahi — signup serializer isse pass kar deta hai theek se, par agar kabhi `createsuperuser` se mobile na diya jaaye to empty string set hoti hai (unique constraint risk agar 2+ superuser bina mobile ke banaye jaayein).

---

## 📊 Module-wise Status

| # | Module | App | Code | Migrated | API tested | Frontend wired |
|---|--------|-----|------|----------|-----------|----------------|
| 1 | Onboarding | accounts+merchants | ✅ | ✅ | ✅ signup/login/OTP verified | 🔴 mismatch |
| 2 | Courier Integration | couriers | 🟡 | ✅ | ⬜ (500 w/o merchant ctx) | 🔴 |
| 3 | Channel Integration | integrations | 🟡 | ✅ | ⬜ (500 w/o merchant ctx) | 🔴 |
| 4 | Dashboard | aggregated | 🟡 | — | ⬜ | 🔴 |
| 5 | Orders | orders | 🟡 | ✅ | ⬜ (500 w/o merchant ctx) | 🔴 |
| 6 | Track | tracking | 🟡 | ✅ | ⬜ | 🔴 |
| 7 | NDR | ndr | 🟡 | ✅ | ⬜ (500 w/o merchant ctx) | 🔴 |
| 8 | Returns | returns | 🟡 | ✅ | ⬜ (500 w/o merchant ctx) | 🔴 |
| 9 | Logistics | carriers | 🟡 | ✅ | ✅ public list 200 OK | 🔴 |
| 10 | Wallet | billing | 🟡 | ✅ | ⬜ (500 w/o merchant ctx) | 🔴 |
| 11 | Pricing | pricing | ✅ fixed | ✅ | ✅ 200 OK | 🔴 |
| 12 | Add-ons | addons | ⬜ | ⬜ | ⬜ | 🟡 page hai |
| 13 | Reports | reports | 🟡 | ✅ | ⬜ (500 w/o merchant ctx) | 🔴 |
| 14 | Settings | accounts | 🟡 | ✅ | ⬜ | 🔴 |
| 15 | Gen AI | FastAPI | ⬜ | ⬜ | ⬜ | ⬜ |

> "500 w/o merchant ctx" = tested with a superuser (no Merchant row) → hits the known non-blocking issue above. Endpoint code itself runs and queries the DB correctly; needs testing with a real merchant-linked user (Phase 1 per-module pass).

---

## 🧩 Frontend Pages (Admin_UI/src/pages)

Scaffolded (UI bana, backend se juda nahi): Login, Onboarding, Dashboard, Orders, OrderDetail, Track, NDR, Returns, Wallet, Pricing, Reports, Settings, Integrations, CourierSettings, Logistics, AddOns.

- [ ] `api.js` ko current backend endpoints par re-point karo
- [ ] JWT refresh flow implement karo (abhi commented/mock)
- [ ] Har page ko real API se wire karo

---

## 🔜 Next Up (proposed order — plan me detail)

1. ~~Fix blockers B1–B4 → backend cleanly runs + migrates.~~ ✅ Done (Phase 0)
2. ~~Verify onboarding flow end-to-end~~ ✅ Done for signup→OTP→email-verify. Business-profile→KYC→bank→pickup→plan steps still to test.
3. Per-module: seed merchant-linked test data → API test each app → fix `user.merchant` 500s → mark ✅.
4. Frontend `api.js` rewire → page-by-page integration.
5. Celery + S3 wiring for tracking webhooks / reports.
6. Add-ons + Gen AI (future).

---

## 📝 Changelog

- **2026-07-10** — Initial verified audit. Docs banaye (project.md, progress.md, memory.md). Blockers identify kiye (pricing bug, 13 missing migrations, frontend endpoint mismatch).
- **2026-07-10** — **Phase 0 complete.** Git baseline committed (`db318c0`). Pricing bug fixed (`4bae33f`). All 13 apps migrated to real PostgreSQL — 48 tables live (`9415e0b`). Found+fixed missing JWT token routes (`f84f339`). End-to-end verified: signup → JWT login → email OTP → onboarding_step advance, against real `shipfero_db`. Dev server running locally for continued testing.
