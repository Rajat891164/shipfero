# 🔍 Shipfero — PRD Conformance Audit & Backlog (prd_audit.md)

> **What this is:** iteration-0 of the "check & fix against PRD" loop. Every gap between
> `converted.md` (the PRD) and the current code, sorted into what we can fix locally now
> vs. what's blocked on infra/vendors. The loop grinds **Tier A** top-to-bottom:
> read PRD section → fix → verify (browser/curl) → commit → tick the box → update this file.
>
> **Legend:** ⬜ todo · 🔄 in progress · ✅ done & verified · ⛔ blocked (out of scope)
> **Scope chosen (2026-07-16):** conformance pass on modules 1–14 — no new infra, no paid vendors.
> **Created:** 2026-07-16

---

## ⚠️ PRD scope note
PRD §Overview line: *"Current Scope: Read-Only Frontend — GET APIs only."* We've already
gone beyond that (write paths: recharge, book-AWB, NDR actions, etc.), which is fine —
but it means "conformance" here = the **feature/data-model** gaps below, not the read-only limit.

---

## 🟢 Tier A — in-scope conformance (the loop fixes these)

| # | Module | Gap (PRD ref) | Status |
|---|--------|---------------|--------|
| A1 | 11 Pricing | `pricing.CompareRatesView` returns **hardcoded** 3 couriers regardless of input; PRD wants real calc (base + per-kg + COD + fuel) from rate cards. | ✅ 2026-07-16 — now computes from `pricing.RateCard`: deterministic pincode→zone, weight-slab pick + ADDITIONAL increments, fuel %, COD `max(min, pct×amt)`. Verified curl + browser (₹203.55–₹224.25 for 560001→110001 1.5kg, was hardcoded ₹58–₹120). Breakdown fields added. |
| A2 | 9 Logistics | Serviceability computed from empty `carriers.CarrierRate`/`ServiceablePincode` → always "no carriers". | ✅ 2026-07-16 — extracted one shared rate engine `pricing/services.py::quote_all_carriers` used by BOTH compare and serviceability (kills the dual-rate duplication). Serviceability now returns real carriers/rates; `ServiceablePincode` honoured only when data exists. Verified curl + Logistics UI (Delhivery ₹203.55 / Bluedart ₹224.25). |
| A3 | 3 Channel | **Payment Method Mapping** not built (no model). PRD: unmapped store payment method → order flagged + processing blocked. | ✅ 2026-07-16 — added `ChannelPaymentMapping` model + `resolve_payment_type`; order create resolves the raw `store_payment_method` (unmapped → `is_payment_mapped=False` + flagged); the existing process guard blocks it. CRUD + `bulk-prepaid` + auto re-apply-to-flagged endpoints. Verified curl: unmapped→400 blocked→bulk-prepaid→200 processed. (Backend + API; wizard UI is optional follow-up.) |
| A4 | 3 Channel | **Status Pushback Config** not built (config only; the actual push to the store is Tier C/vendor). | ✅ 2026-07-16 — `ChannelStatusMapping` (platform_status → store_status, per-mapping `is_enabled`) + CRUD under `/api/integrations/<id>/status-mappings/` with PATCH toggle. Verified curl: create → toggle off → list. Actual push-to-store deferred (vendor). |
| A5 | 4 Dashboard | **Business Summary Charts** missing: 30-day shipment trend, delivery% vs RTO% donut, courier-wise split, channel-wise volume. Add aggregation endpoint + recharts on Dashboard. | ⬜ |
| A6 | 4 Dashboard | **Top 10** missing: top cities / products (SKU) / pincodes. Add aggregation endpoint + frontend. | ⬜ |
| A7 | 1 Onboarding | Frontend validations per PRD: GST 15-char format, password strength (≥8, 1 upper, 1 number), email-uniqueness check on blur. | ⬜ |
| A8 | 5/11 Orders | Volumetric weight `(L×B×H)/5000`, chargeable = MAX(actual, volumetric) — **verify** it's applied at booking; fix if not shown/used. | ⬜ |
| A9 | 7 NDR | **Verify** the 8 standard reason codes (DR-01…DR-08) exist as choices and courier raw codes map to them. | ⬜ |
| A10 | 10 Wallet | **Verify** COD Remittance tracking (model + view + per-courier float) exists; build the read view if missing. | ⬜ |
| A11 | 6 Track | **Verify** the public branded tracking endpoint is reachable without auth; bulk-track-via-CSV (small/sync) if easy. | ⬜ |

> Items A8–A11 start as **verify** — they may already be done from Phase 1; confirm before building.

---

## 🟠 Tier B — needs Phase 3 infra (Celery / Redis / S3) — deferred
- Async webhook processing; courier/channel health monitors (Celery Beat, uptime %, alerts).
- Real async report generation + Download Center (Celery + S3).
- Manifest PDF generation + S3; large CSV/Excel exports (Celery).
- Company-logo / KYC-document uploads → S3 pre-signed URLs.

## 🔴 Tier C — needs external paid vendors — deferred
- Customer SMS/Email/WhatsApp notifications (Twilio/MSG91/Meta WABA).
- Real wallet recharge (Razorpay/PayU) + penny-drop bank verify (Razorpay/Digio).
- Actual status-pushback API calls to Shopify/Amazon/etc.
- All 8 Add-ons (Module 12); Gen AI suite (Module 15, FastAPI + LLM).

---

## 📓 Iteration log
- **2026-07-16** — Backlog created (iteration 0). Full PRD read (modules 1–14), cross-checked vs code. Found the dual rate-system inconsistency (A1/A2) as the headline gap.
- **2026-07-16** — **A1 done.** Rewrote `pricing.CompareRatesView` to compute real rates from rate cards (zone derivation + slab + fuel + COD). Verified via curl and the Pricing estimator UI.
