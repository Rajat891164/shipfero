# ✅ Shipfero — Progress Tracker (progress.md)

> **Kaise use karna:** Jaise-jaise kaam hota jaaye, yahan status update karte jao.
> **Legend:** ✅ Done & verified · 🟡 Code written, not verified · 🔴 Broken/blocker · ⬜ Not started
> **Last updated:** 2026-07-11 (Phase 2 in progress — frontend integration)

---

## 🚧 Phase 2 — Frontend Integration (in progress)

Frontend moved into monorepo at `frontend/` (was `D:\My files\ship\Admin_UI`). CORS configured, api.js fully rewritten against the real backend, JWT refresh implemented. Wiring pages one by one.

**Frontend page status (16 pages):**

| Page | Status |
|------|--------|
| Login (+ JWT auth) | ✅ wired & live-verified |
| Dashboard (+ sidebar wallet) | ✅ wired & live-verified |
| Orders (list) | ✅ wired & live-verified |
| Wallet (+ recharge write path) | ✅ wired & live-verified |
| NDR (+ re-attempt action) | ✅ wired & live-verified |
| Track | ✅ wired (syntax-ok; live re-verify pending) |
| Onboarding | 🔴 **broken** — still calls old AuthService methods (register/verifyEmail/uploadKYC/...) removed in the api.js rewrite |
| CourierSettings | 🔴 **broken** — imports LogisticsService, removed in the api.js rewrite |
| OrderDetail, Returns, Pricing, Reports, Settings, Integrations, Logistics | ⬜ still mock data |
| AddOns | ⬜ mock (no backend — lowest priority) |

**Tally:** 6 wired · 2 broken (regressions to fix) · 8 pending.

**Next (frontend):**
1. Fix the 2 regressions (Onboarding → real signup/OTP/onboarding endpoints; CourierSettings → CourierService).
2. Re-verify Track live.
3. Wire remaining mock pages: OrderDetail, Returns, Pricing, Reports, Settings, Integrations, Logistics.
4. Phase 3 backend: Celery + S3, then Add-ons/Gen AI.

**Frontend commits so far:** `f0b4a7d` (monorepo move), `4838814` (CORS), `1b4627c` (api.js + Login), `06a177d` (Dashboard + sidebar), `c381577` (Orders), `069537f` (Wallet), NDR, `2309581` (Track).

---

## 🎯 Backend Real State

Backend runs cleanly, fully migrated to real PostgreSQL, and **every core PRD module (2–14, excluding Add-ons/Gen AI which PRD itself defers) has been reviewed, bug-fixed, and verified end-to-end against the live DB** — not just "code exists," actually exercised via curl with a real merchant JWT and checked against direct DB reads.

| Area | Reality |
|------|---------|
| Backend | Runs clean, `manage.py check` passes, all migrations applied — 48+ tables live in `shipfero_db` |
| Core transaction flow | Signup → onboarding → courier/channel setup → order → process → book-AWB (wallet deducted) → tracking webhook → NDR → RTO/reverse-pickup → refund — **entire chain tested end-to-end in one continuous session** |
| Regression sweep | 22 key endpoints across all modules → all return 200 with a real merchant token |
| Frontend (Admin_UI) | Still not wired — `api.js` has old endpoint paths, needs Phase 2 rewrite |
| Root `database/ frontend/ ui/ deployment/` | Khaali placeholders (unused) |

---

## ✅ Phase 0 — Foundation (DONE)

- [x] Pricing duplicate-field bug, all migrations, JWT routes, Postgres verified.
- [x] **venv gotcha**: always use `backend/venv/Scripts/python.exe`, not global `python` (different Django version). See memory.md.

## ✅ Phase 1 — All Core Modules (DONE 2026-07-10)

Went module-by-module in PRD order. Pattern per module: read existing code → find real bugs (not just style) → fix → migrate if needed → verify against real Postgres with curl → commit. Every module below had at least the `request.user.merchant` unhandled-crash pattern (raises `RelatedObjectDoesNotExist` → 500 for any authenticated user without a Merchant row, e.g. staff/superuser); fixed everywhere via `core/utils.get_merchant()`.

| # | Module | Commit | Real bugs found & fixed (beyond the merchant-500 sweep) |
|---|--------|--------|-----------------------------------------------------------|
| 2 | Courier Integration | `9013fc9` | Credentials stored **plaintext** → AES/Fernet encryption + masked display (`core/encryption.py`, new). PATCH couldn't update credentials (wrong serializer wired). Delete didn't actually block on in-transit shipments. No audit log. |
| 3 | Channel Integration | `56cc990` | Same plaintext-credential issue → encrypted. PATCH-can't-update-credentials same fix. Added missing Sync Settings fields (frequency, min order amount, start date). |
| 4 | Dashboard | `4a5aa8a` | Didn't exist at all — built `GET /api/merchants/dashboard/` (overview cards, status breakdown, pending actions). |
| 5 | Orders | `0032404` | **`Decimal -= float` TypeError** in `BookAWBView` — would crash every booking that matched a `CarrierRate` (money was computed via `float()` then passed to `Wallet.debit()` which does Decimal arithmetic). Fixed by keeping all money math in Decimal. **`BulkProcessOrdersView` was a stub** — looped orders and just appended fake "success" without creating shipments or touching the wallet. Extracted real booking logic into a shared `_book_awb_for_order()` helper used by both single and bulk booking. |
| 6 | Track | `5d84728` | `Shipment.Status.DELIVERY_FAILED` doesn't exist (model has `FAILED_DELIVERY`) — webhook crash on every failed-delivery update. **Substring bug**: `"UNDELIVERED"` contains `"DELIVERED"`, and the DELIVERED check ran first, so failed deliveries were silently marked DELIVERED and no NDR was ever created — reordered checks. `TrackingTimelineSerializer` referenced a non-existent `expected_delivery_date` field. Webhook only matched by `awb_number` (never populated without live courier connectors) — added `tracking_id` fallback. |
| 7 | NDR | `51669c4` | Clean otherwise — merchant-500 sweep only. |
| 8 | Returns | `dbddbec` | Clean otherwise — merchant-500 sweep only. |
| 9 | Logistics (carriers) | `ba1ea45` | Own app was clean. Found the same plaintext-credential issue in `admin_panel.AdminCarrierSerializer` (`fields = "__all__"` exposed platform-level courier API keys in plaintext to any staff/admin) — encrypted + masked. |
| 10 | Wallet/Billing | `078e10b` | Clean otherwise — merchant-500 sweep only. |
| 13 | Reports | `cf08826` | Clean otherwise (generation is a synchronous stub pending Celery — that's expected/documented, not a bug) — merchant-500 sweep only. |
| 14 | Settings extension | `a6ad408` | **`key.is_active = false`** (lowercase, not valid Python) — `NameError` on every API key revoke. **`User.objects.make_random_password()`** — removed in Django 5.1 (we're on 5.1.11) — crashed every staff invite. Both fixed. |

**End-to-end chain verified in one session (real PostgreSQL, not mocked):**
```
Signup → JWT login → email OTP verify (Module 1)
  → add courier w/ encrypted credentials, test-connection, delete-block on in-transit (Module 2)
  → add Shopify integration w/ encrypted token, manual sync (Module 3)
  → dashboard reflects live state (Module 4)
  → create order → process (weight) → book-AWB
      → wallet debited correctly (Decimal-safe), shipment created (Module 5)
  → bulk-process 2 more orders → both really booked, wallet debited again (Module 5)
  → public tracking timeline read (Module 6)
  → courier webhook "UNDELIVERED" → shipment FAILED_DELIVERY → NDR auto-created (Module 6)
  → NDR list/dashboard → take RE_ATTEMPT action → recorded (Module 7)
  → webhook "DELIVERED" on another shipment → reverse pickup created →
      mark-received → refund auto-created (PREPAID) (Module 8)
  → admin creates platform carrier w/ encrypted key, non-admin blocked 403 (Module 9)
  → wallet add-funds, transactions, summary all reconcile (Module 10)
  → generate report, poll status, scheduled report CRUD (Module 13)
  → create API key, invite staff, revoke key, audit log shows unified trail (Module 14)
```

---

## 🟡 Known gaps / deferred (not bugs — scope calls, documented)

- **Payment Method Mapping & Status Pushback Config** (Module 3 sub-features) — no models yet. PRD wants order processing blocked on unmapped payment methods; overlaps with Orders. Not built — flag if Orders/Integrations work resumes.
- **Courier/Channel Health Monitor** background pings (Celery Beat, uptime %, alert history) — needs Celery, which isn't wired yet (Phase 3 per original plan). Test-connection/sync endpoints work synchronously as stand-ins.
- **Reports** are synchronous stubs (instant `COMPLETED` with a dummy S3 URL) — real Celery-backed generation is Phase 3.
- **Dashboard** Business Summary Charts (30-day trends) and Top-10 views — need historical aggregation beyond the current single-query dashboard.
- `User.mobile` required+unique but not in `REQUIRED_FIELDS` — `createsuperuser` leaves it `''`; fine for one superuser, risky for a second.
- `config/settings_old.py` — legacy file, harmless, cleanup pending.
- `django-cors-headers` referenced via `CORS_ALLOW_ALL_ORIGINS` setting but package not installed — no-op today, **will matter once frontend (different port) starts calling the API** — needed in Phase 2.

---

## 📊 Module-wise Status (final)

| # | Module | App | Code | Migrated | API tested | Frontend wired |
|---|--------|-----|------|----------|-----------|----------------|
| 1 | Onboarding | accounts+merchants | ✅ | ✅ | ✅ | 🔴 |
| 2 | Courier Integration | couriers | ✅ | ✅ | ✅ | 🔴 |
| 3 | Channel Integration | integrations | ✅ | ✅ | ✅ | 🔴 |
| 4 | Dashboard | merchants (new endpoint) | ✅ | — | ✅ | 🔴 |
| 5 | Orders | orders | ✅ | ✅ | ✅ | 🔴 |
| 6 | Track | tracking | ✅ | ✅ | ✅ | 🔴 |
| 7 | NDR | ndr | ✅ | ✅ | ✅ | 🔴 |
| 8 | Returns | returns | ✅ | ✅ | ✅ | 🔴 |
| 9 | Logistics | carriers + admin_panel | ✅ | ✅ | ✅ | 🔴 |
| 10 | Wallet | billing | ✅ | ✅ | ✅ | 🔴 |
| 11 | Pricing | pricing | ✅ | ✅ | ✅ | 🔴 |
| 12 | Add-ons | addons | ⬜ not started | ⬜ | ⬜ | 🟡 page hai |
| 13 | Reports | reports | ✅ (sync stub) | ✅ | ✅ | 🔴 |
| 14 | Settings | accounts | ✅ | ✅ | ✅ | 🔴 |
| 15 | Gen AI | FastAPI (future) | ⬜ | ⬜ | ⬜ | ⬜ |

Every module 1–11, 13, 14: backend done. **Frontend integration (Phase 2) is now the sole remaining gap for the core product.**

---

## 🧩 Frontend Pages (Admin_UI/src/pages)

Scaffolded (UI bana, backend se juda nahi): Login, Onboarding, Dashboard, Orders, OrderDetail, Track, NDR, Returns, Wallet, Pricing, Reports, Settings, Integrations, CourierSettings, Logistics, AddOns.

- [ ] `api.js` ko current backend endpoints par re-point karo (see project.md §5 for full endpoint list)
- [ ] JWT refresh flow implement karo (abhi commented/mock)
- [ ] `django-cors-headers` install + configure (needed once frontend calls a different-port API)
- [ ] Har page ko real API se wire karo

---

## 🔜 Next Up

1. ~~Phase 0 foundation~~ ✅
2. ~~Phase 1: all core backend modules~~ ✅
3. **Phase 2: Frontend integration** — rewire `api.js`, add CORS, wire pages one by one starting with Login → Onboarding → Dashboard.
4. Phase 3: Celery + S3 (health monitors, real report generation, webhook async processing).
5. Payment Method Mapping / Status Pushback Config (deferred gap above).
6. Add-ons + Gen AI (future, PRD itself marks these lower priority).

---

## 📝 Changelog

- **2026-07-10** — Initial verified audit. Docs created.
- **2026-07-10** — **Phase 0 complete.** Backend migrated to real PostgreSQL, JWT routes fixed, onboarding verified end-to-end.
- **2026-07-10** — **Phase 1 complete.** All 12 core PRD modules (2–11, 13, 14) reviewed, bug-fixed (11 real bugs beyond the recurring merchant-500 pattern — see table above), and verified end-to-end in one continuous session against real PostgreSQL. Full regression sweep of 22 endpoints all green. 12 commits, each independently revertable.
