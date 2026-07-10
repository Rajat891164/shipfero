📄 PRODUCT REQUIREMENTS DOCUMENT (PRD)Courier Aggregator Platform |
Django + React.js + PostgreSQL | Akshay Tomar | 2026
areee mere bhai es format me banao ar BRD and FRD hta do
Akshay, bilkul! Yeh raha clean PRD — sirf Features detail mein, BRD aur FRD
completely hataaye, same format mein:
# 📄 # PRODUCT REQUIREMENTS
# DOCUMENT (PRD)
## Courier Aggregator Platform | Django + React.js
## + PostgreSQL | Akshay Tomar | 2026
## 🏗 ## Project Overview
Goal: Ek multi-courier aggregation platform banana jahan D2C merchants apne
sabhi courier partners ek single dashboard se manage kar sakein.
Stack: Django + React.js (Vite) + PostgreSQL | JWT Auth | Celery + Redis | AWS S3
Scale: 100K orders/day | 10,000+ active merchants | 15+ courier partners
Current Scope: Read-Only Frontend — React UI se sirf data dekha ja sakta hai,
GET APIs only
## 📋 ## Module Sequence
# Module Purpose
1 Onboarding Signup → KYC → Bank → Pickup → Live
2 Courier Integration Courier APIs setup per merchant

---

3 Platform / Channel Integration 
Shopify, Amazon, WooCommerce
connect
4 Dashboard Overview, charts, pending actions
5 Orders New → Process → Manifest → Book
6 Track AWB tracking, webhooks, notifications
7 NDR Non-delivery management
8 Returns RTO + reverse pickup
9 Logistics Couriers, serviceability, pickup
10 Wallet Balance, billing, COD remittance
11 Pricing Zone-wise rate cards
12 Add-ons Protect, EDD, COD verify, WhatsApp
13 Reports MIS, exports, scheduled reports
14 Settings Profile, KYC, staff, bank

---

15 Gen AI + Agentic Suite AI layer (premium add-on)
## 🗂 ## Module-wise Feature List
## Module 1 — Onboarding
Django App: accounts/ | Frontend Route: /register, /onboarding/*
## Sub-sections
● Step 1 — Registration — Account create karna
● Step 2 — Email Verification — OTP se confirm
● Step 3 — Business Profile — Company details
● Step 4 — KYC Documents — Verification documents upload
● Step 5 — Bank Details — COD remittance account
● Step 6 — Pickup Location — Warehouse address
● Step 7 — Plan Selection — Subscription choose
● Step 8 — Onboarding Checklist — Getting started dashboard
## Features
Step 1 — Registration
● Full Name, Business Email (UNIQUE), Phone, Company Name, GST, PAN,
Password
● Real-time email uniqueness check on blur
● GST format validation (15-char alphanumeric)
● Password strength indicator (min 8 chars, 1 uppercase, 1 number)
● On submit: merchants row created, kyc_status='pending',
email_verified=FALSE
● Verification email sent via SMTP (Sendgrid / AWS SES)
● Referral code field (optional) for partner tracking
Step 2 — Email Verification
● 6-digit OTP sent to registered email (valid 15 minutes)
● Resend OTP button (60 second cooldown)
● On OTP verified: email_verified = TRUE
● JWT access + refresh token issued on success
● Merchant redirected to onboarding Step 3
Step 3 — Business Profile

---

● Business Type: Proprietorship / Pvt Ltd / LLP / Partnership
● Industry: Fashion / Electronics / Health / Food / Other
● Monthly Shipment Volume: <100 / 100–500 / 500–2000 / 2000–10000 /
10000+
● Website URL (optional)
● Company Logo upload → S3 storage
● Used to suggest plan and pre-select couriers
Step 4 — KYC Documents
● PAN Card (mandatory)
● GST Certificate (mandatory for GST-registered businesses)
● Aadhaar Card (identity proof)
● Company Registration Certificate (Pvt Ltd / LLP)
● File upload → S3 pre-signed URL → merchant_kyc table
● document_type, document_number, document_url, status='pending' stored
● Admin reviews → status = 'verified' / 'rejected', rejection reason
shown
● Re-upload option if rejected
● SLA: KYC reviewed within 24 hours
● AWB booking BLOCKED until kyc_status = 'verified'
Step 5 — Bank Details
● Account Holder Name, Bank Name, Account Number, IFSC, Account Type
(Savings/Current)
● merchant_bank_details table row created
● Penny drop verification: ₹1 test transfer via Razorpay/Digio API
● is_verified = TRUE on successful penny drop
● COD remittance BLOCKED until bank account verified
Step 6 — Pickup Location
● Location Name (e.g., "Mumbai Warehouse")
● Contact Person Name, Contact Phone
● Address Line 1, Address Line 2, City, State, Pincode
● GSTIN of warehouse (if different from company GST)
● is_default flag — one default always required
● pickup_locations table row created
● Multiple warehouse locations supported
● Min 1 pickup location required before first shipment booking
Step 7 — Plan Selection

---

Plan
Monthly
Orders Price Key Features
Starter Up to 500 Free 2 couriers, basic reports
Growth 500–5,000 
₹2,999/m
o
5 couriers, NDR WhatsApp, scheduled
reports
Pro 5,000–20,000 
₹7,999/m
o
All couriers, COD verify, AI courier
selector
Enterpri
se
20,000–1,00,00
0 
Custom All AI features, dedicated support
●
merchant_plans table: plan_name, features_json JSONB, price, status
● 14-day Pro trial auto-applied for all new merchants
● Plan upgrade available anytime from Settings
Step 8 — Onboarding Checklist
● 9-step progress bar shown on dashboard until 100% complete
● Steps: Account Created → Email Verified → Business Profile → KYC → Bank
Details → Pickup Location → Channel Connected → Courier Configured →
First Shipment
● Each step is clickable → navigates directly to that section
● Real-time status update as merchant completes each step
● Auto-hides permanently when all 9 steps are ✅
● Checklist can be re-opened from Help menu anytime
## Module 2 — Courier Integration
Django App: logistics/ | Frontend Route: /settings/couriers
## Sub-sections
● Courier Catalog — Available couriers list

---

● Add Courier Wizard — Step-by-step setup
● Credentials Management — View, edit, revoke
● Courier Health Monitor — API status & uptime
● Test Connection — Live verification
● Serviceability Check — Pincode-wise availability
## Features
Courier Catalog
Courier Modes COD Prepaid Reverse Max Wt
Bluedart Express ✅ ✅ ✅ 50 kg
Delhivery Express Express ✅ ✅ ✅ 30 kg
Delhivery Surface Surface ✅ ✅ ✅ 100 kg
DTDC-DP Express ✅ ✅ ✅ 30 kg
Amazon Shipping Express ❌ ✅ ❌ 25 kg
Aramex Express/Intl ✅ ✅ ✅ 30 kg
Blitz Express ✅ ✅ ❌ 10 kg
Xpressbees Express ✅ ✅ ✅ 30 kg
Ecom Express Express ✅ ✅ ✅ 30 kg

---

●
Per courier card: Logo, Name, Modes, COD/Prepaid/Reverse flags, Max
weight
● Already configured couriers show "Configured ✅" green badge
● "Add Courier" button → opens setup wizard
● Filter by: Mode (Surface/Express) / COD supported / Reverse supported
Add Courier Wizard — 6 Steps
● Step 1 — Select Courier: Pick from catalog. If already configured → "Edit
existing" option shown
● Step 2 — Account Mode: COD only / Prepaid only / Both — controls which
order types this courier handles
● Step 3 — Enter Credentials: Login ID, Licence Key, API Token, API
Version, Vendor Code, Origin Area Code, Customer Code Prepaid, Customer
Code COD — all fields masked, "Show" toggle available — AES-256 encrypted
before DB save
● Step 4 — Configure Settings: Label Type (A4/A6/Thermal), OTP-based
Delivery ON/OFF, Forward Active, Reverse Active, Shipping Mode
(Surface/Air/Express)
● Step 5 — Test Connection: Live API ping with entered credentials — ✅
Pass → proceed / ❌ Fail → specific error shown — Save button DISABLED
until test passes
● Step 6 — Confirm & Save: Full summary (masked credentials) → Confirm
→ courier_integrations row created → Success notification shown
Credentials Management
● All configured couriers in card layout
● Each card shows: Courier name + logo, Account mode, masked credentials
(last 4 chars: ••••••3K9X), label type, OTP setting, forward/reverse status,
date configured
● Edit: Pre-filled wizard opens at Step 3 → test connection mandatory before
save
● Delete: Checks in-transit shipments — blocked if any exist with message: "34
shipments currently in transit. Cannot delete."
● Every credential change logged: who changed, when, what was changed
Courier Health Monitor
● Per courier real-time status: 🟢 Healthy / 🟡 Slow (>3s response) / 🔴 Down
● Last API response time in ms + "Last checked: X minutes ago"
● Uptime Stats: Last 24 hours / Last 7 days / Last 30 days uptime %
● Alert History: Last 5 downtime incidents — start time, end time, duration
● Auto-alerts: 3 consecutive failed pings → email + dashboard banner to
merchant

---

● Downtime >30 minutes → escalation notification
● Courier restored → "Courier is back online" notification
● Background health ping every 5 minutes via Celery Beat
Test Connection (Standalone Tool)
● Available from courier detail page anytime (not just during wizard)
● Use case: AWB booking fails suddenly → merchant manually re-tests
● Result: ✅ Pass with response time / ❌ Fail with exact error (invalid key /
courier down / network issue)
● "Fix Credentials" shortcut button on failure
Serviceability Check Tool
● Inputs: Pickup Pincode + Delivery Pincode + Weight (kg) + COD/Prepaid +
optional L×B×H (cm)
● Output per courier: Serviceable YES/NO, Reason if NO, Estimated TAT
(days), Calculated Rate (₹), Mode
● Non-serviceable couriers greyed out at bottom
● Tags: 💰 Cheapest / ⚡ Fastest / ⭐ Recommended (AI-powered on Pro
plan — best balance of cost + TAT + delivery success rate)
## Module 3 — Platform / Channel Integration
Django App: integrations/ | Frontend Route: /settings/integrations
## Sub-sections
● Channel Catalog — All supported platforms
● Connect Wizard — Step-by-step setup
● Payment Method Mapping — COD vs Prepaid mapping
● Status Pushback Config — Update order status on store
● Sync Settings — Auto-sync, filter rules
● Sync Logs & Health — Integration monitoring
## Features
Channel Catalog
Platform Auth Method Sync Type
Shopify OAuth 2.0 Webhook + Polling (15 min)

---

WooCommerce API Key + Secret Polling (15 min)
Amazon SP-API (OAuth) Polling (15 min)
Flipkart API Key + Secret Polling (15 min)
Magento 2 OAuth 2.0 Polling (30 min)
Wix OAuth 2.0 Webhook + Polling (30 min)
BigCommerce API Key Webhook + Polling (15 min)
Zoho Commerce OAuth 2.0 Polling (30 min)
Instamojo API Key + Secret Polling (30 min)
OpenCart API Key Polling (30 min)
Connect Wizard — 7 Steps
● Step 1 — Select Platform: Channel catalog with logo + auth method shown
● Step 2 — Authentication: OAuth redirect for Shopify/Amazon/Wix OR
manual API key entry for WooCommerce/Flipkart — all credentials AES-256
encrypted
● Step 3 — Store Details: Store name, Store URL, Store email, Company
name, Store GST number
● Step 4 — Sync Settings: Auto-sync ON/OFF, sync-by-status (e.g., only
"Processing" orders), historical import up to 90 days, auto-update order info
toggle

---

● Step 5 — Payment Method Mapping: Map store payment method names
→ COD / Prepaid. Example: "Cash on Delivery" → COD, "Razorpay" →
Prepaid. Unmapped methods flagged — order processing blocked until
mapped
● Step 6 — Status Pushback: Map platform delivery status → store order
status. Example: "delivered" → "Completed" on Shopify. Per-mapping toggle
ON/OFF. "Test Pushback" button
● Step 7 — Test & Activate: Fetch 5 latest orders preview → merchant
confirms data looks correct → is_active = TRUE → integration live
Order Pull Flow
text
Channel API / Webhook
↓
Parse order payload (per-channel format)
↓
Map payment method via channel_payment_mappings
↓
Create: orders + order_customer + order_items rows
↓
Log in integration_sync_logs
↓
Status update → push to channel store
Payment Method Mapping
● Per channel separate mapping screen
● Merchant sees all payment methods from store → maps each to COD or
Prepaid
● Unmapped method → order gets flagged in New Orders tab with warning
● Bulk map: "Set all unmapped as Prepaid" option
● New payment methods from channel auto-detected and flagged for mapping
Status Pushback Config
● Map every platform status to corresponding channel store status
● Example mappings:
Platform Status Channel Store Status

---

Booked Processing
In Transit Shipped
Out for Delivery Out for Delivery
Delivered Completed
RTO Initiated Cancelled
●
Per-mapping toggle: Enable / Disable individually
● Test button: simulate pushback to verify channel accepts status update
● Status pushed within 15 minutes of delivery event
Sync Settings Management
● Sync frequency: Real-time (webhook) / Every 15 min / Every 30 min / Manual
only
● Min order amount filter: skip orders below ₹X (to avoid test/sample orders)
● SKU exclusion list: specific products never synced
● Sync start date: historical import range (up to 90 days back)
● Manual "Sync Now" button: immediate trigger, shows progress spinner +
result
Sync Logs & Health
● Last 50 syncs per integration displayed
● Per log: timestamp, orders pulled, orders created, orders failed, error details
(expandable)
● Health badge: 🟢 Healthy (last sync <30 min) / 🟡 Warning (30 min–2 hr) /
🔴 Down (>2 hr)
● Auto-alert to merchant after 3 consecutive failed syncs via email + dashboard
● "Re-sync Failed Orders" button: retry failed orders from a specific sync log
## Module 4 — Dashboard
Django App: accounts/ + aggregated APIs | Frontend Route: /dashboard

---

## Sub-sections
● Overview — Platform ka main landing screen after login
● Shipment Status — Status-wise order counts
● Business Summary Charts — Trends and comparisons
● Pending Actions — Alerts requiring immediate attention
● Getting Started Checklist — New merchant guide
● Courier Dashboard — Per-courier mini stats
● Top 10 — Best performing cities/products/pincodes
## Features
Overview Cards
● Total Orders Today — COUNT(orders) filtered by created_at = today
● Total Revenue Today — SUM(order_amount) where created_at = today
● Total Shipments Booked Today — count from shipments table
● Wallet Balance — live from merchants.wallet_balance (real-time, never
cached)
Shipment Status Breakdown
● Count per status: Booked / In-Transit / Out for Delivery / Delivered / RTO /
On Hold / Cancelled
● Visual bar chart + donut chart per status
● Date filter: Today / Last 7 Days / Last 30 Days / Custom Range
● Each status card clickable → navigates to filtered Orders/Track list
Business Summary Charts
● Daily shipment trend line chart (last 30 days)
● Delivery % vs RTO % donut chart
● Courier-wise shipment split: per courier booked/delivered/RTO counts
● Channel-wise order volume: Shopify vs Amazon vs WooCommerce bar chart
Pending Actions Widget
● 🔴 Low wallet balance alert (below configurable threshold — default ₹500)
● 🟠 New unprocessed orders count (order_status = 'new')
● 🟡 NDR action pending count (>48 hrs without merchant action)
● 🔵 KYC incomplete / document re-upload required alert
● Each alert is clickable → navigates to that module directly
● Widget always visible above the fold on login
Getting Started Checklist (new merchants only)
● KYC status — Pending / Verified
● Pickup location added — Yes / No

---

● Wallet recharged — Yes / No
● First channel connected — Yes / No
● First shipment booked — Yes / No
● Progress bar (e.g., 3/5 complete)
● Each item links to relevant module
● Auto-hides when all 5 steps are complete
Courier Dashboard
● Per courier mini-card: Booked / Delivered / RTO / NDR counts today
● Courier API health indicator: 🟢 Active / 🔴 Inactive
● Average TAT (days) per courier for last 30 days
● Sortable by: Delivery % / NDR % / Volume
Top 10 View
● Top 10 delivery cities by order volume
● Top 10 products shipped by SKU frequency
● Top 10 pincodes by delivery success rate
● Each section has "View All" link to respective module/filter
## Module 5 — Orders
Django App: orders/ | Frontend Routes: /orders, /orders/:id
## Sub-sections
● New Orders — Freshly imported, unprocessed
● Process Orders — Ready for AWB booking
● Pickup & Manifests — Pickup scheduling, manifest PDF
● Track — Quick track from order context
● All Orders — Complete orders list with all statuses
## Features
Order List View
● Paginated orders table (50 per page, cursor-based for 100K scale)
● Columns: Order ID, Channel, Customer Name, City, Pincode, Amount,
Payment Type (COD/Prepaid), Status, Created Date, AWB Number
● Search by: Order ID, Customer Name, Phone Number, AWB Number
● Filter by: Status / Date Range / Channel / Payment Method / City / State /
Courier
New Orders Tab
● Orders with order_status = 'new' — just arrived from channel sync

---

● Channel source badge: Shopify 🟢 / Amazon 🟠 / WooCommerce 🔵
● Flag orders with missing weight/dimensions — clearly marked, AWB booking
blocked
● Bulk select + "Process Selected" action button
Process Orders Tab
● Orders validated and ready for AWB booking
● Courier auto-suggested based on merchant_couriers configuration
● Weight + dimension confirmation screen before booking
● COD amount verification for COD payment orders
● Bulk process: up to 500 orders per batch
● Wallet balance check shown before processing — alert if insufficient
Pickup & Manifests Tab
● Group booked orders by: Pickup Location + Courier + Date
● Generate Manifest PDF: list of AWBs scheduled for pickup
● Pickup request scheduling with courier
● Manifest status: Scheduled / Picked Up / Partial Pickup
● Download Manifest PDF link (from AWS S3)
● Mark Pickup Done: updates shipment status to In-Transit
Order Detail Page (/orders/:id)
● Customer Info: Full name, phone, email, full shipping address + billing
address (if different), pincode, city, state
● Business Details: GSTIN + E-way Bill number (for B2B orders)
● Order Items Table: Product name, SKU, quantity, unit price, discount, tax
%, HSN code, weight (gm), dimensions L×B×H (cm)
● Shipment Section: AWB number, Courier name, Label PDF download,
Current shipment status
● Embedded Tracking Timeline: Latest 5 tracking events inline
● NDR Section: Shown only if NDR exists — reason code, last action, attempt
number
Order Status Flow
text
New → Booked → In Transit → Out for Delivery → Delivered
↓
NDR Created
↓
Re-attempt / Reschedule / Update Address
↓

---

Delivered OR RTO Initiated
↓
Cancelled
All Orders Tab
● Every order regardless of status
● Advanced filters including date range up to 365 days
● Export all filtered results to CSV / Excel (Celery background task for large
exports)
## Module 6 — Track
Django App: tracking/ | Frontend Route: /track
## Sub-sections
● Shipped Orders — Active in-transit shipments
● Branded Tracking Page — Public customer tracking URL
● Tracking Webhooks — Courier → Platform incoming webhooks
● Order Notifications — SMS/Email/WhatsApp to customers
● Analytics — TAT, delivery %, delay analysis
## Features
Track Search
● Search by AWB Number — single shipment instant result
● Search by Order ID — finds linked AWB automatically
● Bulk Track via CSV upload (up to 1000 AWBs at a time)
● Bulk result: downloadable CSV with latest status + location for all AWBs
Tracking Timeline View
● Step-by-step visual stepper (Flipkart/Amazon-style)
● Per event: event_status, event_location, event_timestamp, remarks
● Courier's raw status code shown alongside platform-mapped readable label
● Color-coded: Green (positive) / Yellow (pending) / Red (failed attempt)
● Latest event highlighted at top
Branded Tracking Page
● Public URL per merchant: track.platform.com/{merchant_slug}/{awb}
● No login required — accessible by end customer directly
● Merchant's logo, brand colors, social media links displayed
● Full tracking timeline visible to customer

---

● Optional marketing banner slot (discount coupon / upsell product)
● Rate-limited at 60 requests/minute per IP for protection
Tracking Webhooks (Incoming)
● Receiver endpoint per courier: POST
/api/v1/webhooks/courier/{courier_code}/
● Supports all 15+ courier webhook payload formats
● HMAC signature validation per courier for security
● Celery async task processes each webhook — non-blocking, <2 min to
dashboard
● Duplicate event detection: same AWB + status + timestamp → skipped
silently
Order Notifications (Customer-facing)
● SMS via Twilio/MSG91 at milestones: Booked, Out for Delivery, Delivered,
Failed Attempt
● Email with branded merchant template
● WhatsApp notifications (if NDR WhatsApp add-on enabled)
● Per-merchant custom notification templates
● Template variables: {customer_name}, {awb}, {courier_name}, {edd},
{tracking_url}
● Notification delivery log: sent / failed / delivered status per message
Tracking Analytics
● Average TAT: delivered_at - booked_at per courier
● Delivery % by courier / by zone / by city
● In-transit delay report: shipments exceeding expected TAT
● First attempt delivery rate per courier
● Date filter: Last 7 / 30 / 90 days
## Module 7 — NDR (Non-Delivery Report)
Django App: ndr/ | Frontend Route: /ndr
## Sub-sections
● NDR Dashboard — Summary counts overview
● Action Pending — NDRs needing merchant action
● Action Taken — NDRs with recorded actions
● RTO / Delivered — Final status NDRs
● All NDR — Complete list
## Features

---

NDR Dashboard
● Summary cards: Total NDRs / Action Pending / Action Taken / RTO Initiated
/ Delivered after NDR
● Top 5 NDR reason codes — horizontal bar chart
● NDR count by courier — comparative view
● NDR aging buckets: <24 hr / 24–48 hr / >48 hr (color coded)
● Day-wise NDR trend chart (last 30 days)
● NDR-to-Delivery conversion rate prominently displayed
Standard NDR Reason Codes
● DR-01: Customer not available
● DR-02: Refused delivery
● DR-03: Wrong / incomplete address
● DR-04: Consignee out of station
● DR-05: COD amount not ready
● DR-06: Shipment damaged
● DR-07: Fake delivery attempt (courier fraud)
● DR-08: Business / shop closed
● All courier-specific raw reason codes mapped to these 8 platform standard
codes
Action Pending Tab
● NDRs where ndr_status = 'pending' and no action recorded
● 🔴 Red badge for NDRs >48 hours without action
● Available Actions per NDR:
● Re-attempt delivery (next available date)
● Reschedule delivery (specific date/time slot)
● Update customer address (edit address fields inline)
● Initiate RTO (return to origin)
● Mark as Fake Attempt (courier accountability)
● Bulk Action: select up to 100 NDRs → apply same action in one click
● Action recorded: action type + who took action + timestamp
Action Taken Tab
● NDRs with recorded actions: action type, staff name, timestamp
● Outcome tracking: Delivered after re-attempt ✅ / Failed again → new NDR
created 🔄
RTO / Delivered Tab
● Final resolved NDRs only
● Delivered: successfully delivered after NDR resolution
● RTO: escalated → linked entry in Returns module

---

● NDR-to-delivery conversion rate shown per courier
NDR Escalation Flow
text
1st Delivery Fail → NDR Created → Merchant action within 48
hrs
↓
2nd Delivery Fail → Escalation alert → Priority tag
↓
3rd Delivery Fail → Auto-RTO initiated (if configured)
● attempt_number tracked per NDR
● Max attempts: configurable per merchant (default: 3)
● Auto-RTO trigger can be enabled/disabled from NDR settings
## Module 8 — Returns
Django App: returns/ | Frontend Route: /returns
## Sub-sections
● View Orders — All return / RTO orders
● Pickup Failed Report — Failed return pickups
● Integrations — Channel-synced return status
● Refunds — Refund processing status
● Return Settings — Auto/Manual configuration
## Features
Returns List
● RTO (Return to Origin) + Reverse Pickup (customer-initiated) combined list
● Columns: Return AWB, Original AWB, Customer Name, Return Reason, Type,
Status, Created Date
● Filter by: Return Type / Status / Courier / Date Range
● Quick stats bar: Total Returns / RTO Count / Reverse Pickup Count / Pickup
Failed Count
RTO Orders
● Auto-created after max NDR attempts exhausted
● return_type = 'RTO'
● Full return journey tracking (same visual stepper as forward tracking)

---

● Status flow: Initiated → Courier Picked Up → In Transit → Received at
Warehouse
● Merchant clicks "Mark Received" → confirms return at warehouse →
triggers refund check
Reverse Pickup (Merchant-Initiated Return)
● Merchant creates return manually for customer-requested return
● return_type = 'reverse'
● Return AWB generated via courier API
● Customer notified: pickup scheduled date + return AWB
● Full tracking on return journey
Pickup Failed Report
● Returns where courier's pickup attempt failed
● Reason: Customer not available / Address not found / Customer refused
pickup
● Retry pickup scheduling available
● Escalation alert after 2 consecutive failed pickup attempts
Refunds
● Refund status per return: Pending / Initiated / Completed
● Refund amount + method (original payment gateway / wallet credit / bank
transfer)
● Full refund timeline log per return order
Return Settings
● Auto-RTO threshold: max NDR attempts before auto-RTO (default 3, max
configurable 5)
● Reverse pickup: Auto-create on customer request OR Manual approval by
merchant
● Return reason codes: customizable list shown to customer during return
request
● Channel sync: auto-push return status back to
Shopify/WooCommerce/Amazon
Return Analytics
● Return rate by product SKU — identify high-return products
● Return rate by courier and by city/state
● Average return cycle time (initiated → received at warehouse)
● Top 10 most common return reasons
## Module 9 — Logistics

---

Django App: logistics/ | Frontend Route: /logistics
## Sub-sections
● Courier Partners List — All available couriers
● Serviceability Check — Pincode-wise availability tool
● Pickup Locations — Warehouse management
● Manage Couriers — Enable/disable per merchant
● Courier Performance — Stats per courier
## Features
Courier Partners List
● All platform-supported couriers with: logo, name, modes,
COD/Prepaid/Reverse support flags, max weight, current health status
● Active / Inactive indicator per courier
Serviceability Check Tool
● Inputs: Pickup Pincode + Delivery Pincode + Weight (kg) + COD/Prepaid
● Output: All active couriers — Serviceable YES/NO, Reason if NO, TAT,
Calculated Rate, Mode
● Non-serviceable couriers greyed out with reason
● 💰 Cheapest / ⚡ Fastest tags highlighted
Pickup Locations (Warehouses)
● List all merchant warehouses with: name, contact, full address, pincode,
GSTIN, default flag
● Add new warehouse, Edit existing, Set as Default
● Multiple warehouses fully supported
● Delete blocked if active shipments linked to that location
Manage Couriers
● Toggle enable/disable for each courier per merchant
● Controls which couriers appear in AWB booking flow
● View courier credentials (masked) with link to Courier Integration settings
Courier Performance Dashboard
● Per courier: Delivery %, Average TAT (days), NDR %, RTO %
● Date filter: Last 7 / 30 / 90 days
● Sortable columns: click to sort by Delivery % / NDR % / Volume
● Data-driven courier decision support
## Module 10 — Wallet

---

Django App: wallet/ | Frontend Route: /wallet
## Sub-sections
● Wallet Balance — Live balance overview
● Wallet Recharge — Add credits
● Transaction History — Full debit/credit log
● COD Remittance — Track COD from couriers
● Rate Card — Zone-wise pricing view
● Billing / Invoices — Shipment charge records
## Features
Wallet Balance Overview
● Current balance displayed prominently (real-time, not cached)
● 🔴 Low balance warning badge when below configurable threshold (default
₹500)
● Quick "Recharge Now" button directly on balance card
● Estimated orders remaining based on average shipment cost
Wallet Recharge
● Payment via Razorpay / PayU / UPI / Net Banking
● Minimum ₹100, no maximum limit
● On success: wallet_transactions credit row created instantly
● balance_after stored per transaction for audit trail
● GST invoice auto-generated per recharge
Transaction History
● Complete log: date, type, amount, balance_after, description, reference ID
● Transaction types: Recharge / Shipment Charge / COD Received / Add-on
Charge / Refund / Manual Adjustment
● Filter by: type / date range
● Export to CSV / PDF
COD Remittance
● Track all COD amounts receivable from each courier partner
● Per remittance record: Amount, UTR Number, Remittance Date, Status,
Courier
● Status: Pending / Received / Delayed (>expected date)
● COD Float View: Total in-transit COD not yet remitted — by courier
● UTR number stored for bank reconciliation
● Remittance cycle reference per courier:
● Delhivery: D+2 weekdays
● Bluedart: D+7 weekdays

---

● Xpressbees: D+3 weekdays
Rate Card View
● Zone-wise rates per courier: zone, weight slab from/to, base price,
additional/kg, COD charge, fuel surcharge %
● Filter by courier to compare full rate cards
● Downloadable as PDF or Excel
Billing / Invoices
● Per-AWB charge record with breakdown: base charge + COD charge + fuel
surcharge + add-on charges
● Monthly consolidated GST invoice auto-generated
● Download any month's invoice as PDF
## Module 11 — Pricing
Django App: pricing/ | Frontend Route: /pricing
## Sub-sections
● Zone-wise Rate Table — Per courier per zone
● Weight Slabs — Weight-based pricing tiers
● COD Charges — COD fee per courier zone
● Fuel Surcharge — % applied on base charge
● Rate Comparison Tool — Compare all couriers instantly
## Features
Zone-wise Rate Table
● Full rate matrix per courier — filterable by courier name
● Columns: Zone (A/B/C/D/E), Weight From (kg), Weight To (kg), Base Price
(₹), Additional/kg (₹), COD Charge (₹), Fuel Surcharge (%)
● Rate card is read-only for merchants — platform admin manages rates
● Downloadable as PDF or Excel
Weight Slabs
Slab Weight Range
Slab 1 0 – 0.5 kg

---

Slab 2 0.5 – 1 kg
Slab 3 1 – 2 kg
Slab 4 2 – 5 kg
Slab 5 5 – 10 kg
Slab 6 10 kg+ (per-kg billing)
Volumetric Weight
● Formula: (Length cm × Breadth cm × Height cm) / 5000
● Chargeable weight = MAX(actual weight, volumetric weight)
● Shown at booking screen before confirmation
Rate Comparison Tool
● Inputs: Pickup Pincode, Delivery Pincode, Weight (kg), COD/Prepaid,
optional dimensions
● Output: All serviceable couriers with fully calculated total rate (base + COD +
fuel)
● 💰 Cheapest highlighted / ⚡ Fastest highlighted
● One-click select from comparison → directly book AWB
## Module 12 — Add-ons
Django App: addons/ | Frontend Route: /addons
## 8 Add-ons
🛡 Shipway Protect (Shipment Insurance)
● Coverage for lost or damaged shipments
● Premium = configurable % of shipment value, wallet deducted at AWB
booking
● Claim portal: merchant raises claim → uploads AWB + photo/video proof

---

● Claim status: Approved / Rejected / Under Review
● Approved claims → payout credited directly to merchant wallet
● Claim window: 7 days from delivery failure event
📅 EDD Widget (Expected Delivery Date)
● JavaScript snippet for merchant's store product / checkout page
● Customer sees: "Estimated delivery by Wednesday, April 23"
● API returns EDD based on: delivery pincode + active courier + current date +
day of week
● Customizable message template and widget color
● Works for all active couriers simultaneously
📞 COD Verification
● Auto OTP SMS or auto-voice call to customer before COD order dispatch
● Reduces fake / unintentional COD placements → directly reduces RTO
● 3 contact attempts before timeout (configurable up to 24 hours)
● Unconfirmed after timeout → merchant alert → optional order cancellation
● Verification log: order ID, phone, method used, status, attempt timestamps
💬 NDR WhatsApp
● Auto WhatsApp message to customer when NDR is created
● Template example: "Your delivery failed. Reply 1 to reschedule, Reply 2 to
update address"
● Customer reply automatically triggers corresponding action in NDR module
● WhatsApp Business API (Meta) — pre-approved message templates only
● Log per NDR: message sent, customer response, timestamps
📞 NDR Calling
● Manual or auto-dialer call for high-priority unresolved NDRs
● Call log per NDR: agent name, call time, call duration, outcome
● Outcomes: Agreed to re-attempt / Refused / No response / Wrong number
● Outcome feeds back into NDR module for next action decision
● Best for high-value COD orders where WhatsApp alone is insufficient
🎉 Shipway Delight (Post-Delivery Engagement)
● Auto-trigger exactly when shipment_status = 'delivered'
● Sends: review request + discount coupon + customer satisfaction survey link
● Fully customizable message template per merchant
● Channel: SMS + WhatsApp + Email (all three or any combination)
● Analytics: review link clicks, survey responses, coupon redemptions
📋 Logistics Plans (Subscription Management)

---

● Plan management with feature gating via features_json JSONB
● Active plan shown with remaining days
● Plan upgrade / downgrade with effective date
● Full plan change history logged
🔔 Order Notifications (Customer Communication)
● Custom SMS / Email / WhatsApp templates per shipment milestone
● Milestones: Order Confirmed / Dispatched / Out for Delivery / Delivered /
Delivery Failed / RTO Initiated
● Per-merchant template customization
● Template variables: {customer_name}, {awb}, {courier_name}, {edd},
{tracking_url}
● Notification delivery log with status: Sent / Delivered / Failed / Retried
## Module 13 — Reports
Django App: reports/ | Frontend Route: /reports
## Sub-sections
● Master MIS | Orders Report | Current Shipment | NDR Report | In-Transit
Delay | Product-wise | Scheduled Reports | Download Center
## Features
Report Data Filters Export
Master MIS 
Orders + Shipments + Tracking +
Returns + NDR joined
Date / Status /
Courier / Channel
CSV +
Excel
Orders
Report 
orders + order_customer 
Date / Status /
Channel
CSV /
Excel
Current
Shipment
Active shipments (not
delivered/rto) 
Courier / Date CSV

---

NDR Report ndr_events 
Status / Courier /
Reason / Date
CSV /
Excel
In-Transit
Delay 
tracking_events (TAT exceeded) 
Courier / Zone /
Days delayed 
CSV
Product-wi
se Status 
order_items GROUP BY SKU Date / Courier Excel
Scheduled
Reports 
Configured auto-reports 
Daily / Weekly /
Monthly
Email
delivery
Download
Center 
All past generated reports Past 90 days 
Re-dow
nload
●
All heavy reports (>50K rows) run as Celery background tasks — never
blocks UI
● Progress indicator on screen: frontend polls status every 3 seconds
● Pre-signed S3 URL (valid 24 hours) for secure download
● Scheduled reports: Celery Beat cron → auto-generate → email delivery to
configured recipients
## Module 14 — Settings
Django App: accounts/ | Frontend Route: /settings
## Sub-sections
● Profile | KYC | Bank Details | API Keys | Staff Management | Audit
Logs
## Features
Profile Management
● Editable fields: Name, Email, Phone, Company Name, GST Number, PAN
Number

---

● Email change → re-verification OTP required
● Company logo upload (stored in private S3)
KYC Management
● Upload / re-upload documents: PAN, GST Certificate, Aadhaar, Company
Registration
● Current status per document: Pending / Under Review / Verified / Rejected
● Rejection reason displayed with re-upload button
● All documents stored in private S3 — never publicly accessible
Bank Details
● View current bank account with penny drop verified ✅ badge
● Change bank account: requires fresh penny drop verification before activation
API Keys
● Generate / Regenerate / Revoke merchant-level API key
● Regeneration immediately invalidates old key
● Usage log: last used timestamp, requesting IP, endpoint called
● Key stored as hash in DB — plain text never saved
Staff Management
● Add staff via email invite — staff sets own password
● Roles available: Admin / Operations / Finance / Read-Only
● Granular permissions via permissions JSONB:
● text
● {"orders": true, "wallet": false, "reports": true,
"settings": false}
● Permissions enforced at API level — not just UI
● Instant revoke: one click → all sessions invalidated immediately
Audit Logs
● Every settings change logged: who did it, what changed, when, from which IP
● Immutable log — cannot be edited or deleted
● Filter by: action type / date range / staff member
## Module 15 — Gen AI + Agentic AI Suite
Premium Add-on | FastAPI microservice + Django integration
## Gen AI Features

---

Feature What It Does
Business
Benefit
AI Courier
Selector
ML scoring: 40% cost + 30% delivery rate + 20%
TAT + 10% NDR → top 3 couriers with reason
Best courier
every single
time
RTO Risk
Scorer
Per-order Low/Medium/High score based on
COD + Tier-3 city + order value + address quality
+ customer history
Proactive RTO
reduction
Address
Intelligence
Typo correction, incomplete detection, pincode
vs city mismatch alert before booking
Zero
bad-address
NDRs
NDR AI
Classifier
Reason code analysis → best action suggestion
+ WhatsApp reply sentiment → intent detection
Faster NDR to
delivery
conversion
Natural
Language
Reports
Type plain English query → AI generates chart +
answer instantly
No manual
navigation
needed
COD Float
Predictor
Analyzes in-transit COD → predicts next 7 days
remittance per courier
Cash flow
visibility
Churn
Prediction
21-day inactive merchant → risk flag →
personalized re-engagement campaign
Merchant
retention

---

AI Daily
Briefing
Dashboard opens → AI-written daily summary:
key stats, anomalies, recommended actions
Zero
information
overload
## Agentic AI Features
Agent Trigger Autonomous Actions
Expected
Outcome
Agent Trigger Autonomous Actions
Expected
Outcome
Onboarding
Agent
New
merchant
signup
KYC nudge → courier setup guide
→ first shipment walkthrough
0 → First
shipment in
24 hours
NDR
Resolution
Agent
NDR event
created
Analyze reason → WhatsApp
customer → parse reply → auto
re-attempt or initiate RTO
+15–20%
NDR-to-deliv
ery rate
Courier
Optimization
Agent
Every day at
6 AM
Yesterday's performance analyzed
→ today's optimal courier
assignments → merchant report
sent
Cost
savings +
better
delivery %
Wallet
Management
Agent
Real-time
balance
monitoring
Threshold breach → Razorpay
recharge link sent → COD
remittance follow-up if delayed >3
days
Zero
wallet-block
situations

---

Returns
Minimization
Agent
RTO rate
>15% in 7
days
Root cause analysis →
recommendations → force COD
verify on high-risk orders
Sustained
RTO rate
reduction
Customer
Experience
Agent (Future)
Customer
query via
WhatsApp
Answers order status, EDD, refund
queries → escalates to human
only for complex cases
24/7
support,
zero human
agents