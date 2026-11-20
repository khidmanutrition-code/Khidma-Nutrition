# Khidmatul Ummah Shop BD — Enterprise E-commerce & ERP Platform Guide

## 1. System Overview
Full-stack React 19 + TypeScript + Tailwind CSS v4 + Express (`server.ts`) + Cloud Firestore & Firebase Authentication enterprise e-commerce, ERP, CRM, inventory, accounting, payment, and courier automation platform built for nationwide organic food & Sunnah retail/wholesale operations in Bangladesh (BDT ৳, Bengali & English).

---

## 2. Database Schema — 28 Collections (`firebase-blueprint.json` & `firestore.rules`)

### Core Storefront & Order Collections
- **`products/{productId}`**: `id`, `sku`, `barcode`, `name`, `englishName`, `shortDesc`, `category`, `categoryLabel`, `brand`, `sellerId`, `sellerName`, `isMall`, `freeShipping`, `warrantyLabel`, `price`, `originalPrice`, `wholesalePrice`, `minWholesaleQty`, `costPrice`, `discountPercent`, `soldCount`, `stockLeft`, `inStock`, `isHotDeal`, `isFeatured`, `isBestSeller`, `isNewArrival`, `image`, `videoUrl`, `gallery`, `origin`, `description`, `features`, `specifications`, `variants`.
- **`orders/{orderId}`**: `orderId`, `userId`, `customerEmail`, `customerName`, `phone`, `address`, `upazila`, `zone`, `zoneLabel`, `paymentMethod` (`Cash on Delivery`, `bKash`, `Nagad`, `Rocket`, `Upay`, `SSLCommerz`), `paymentLabel`, `paymentVerified`, `trxId`, `voucherCode`, `discount`, `deliveryFee`, `subtotal`, `total`, `courierProvider`, `consignmentId`, `trackingCode`, `customerCancelReason`, `refundRequested`, `refundReason`, `items`, `status` (`Pending`, `Confirmed`, `Processing`, `Ready to Ship`, `Shipped`, `Delivered`, `Cancelled`, `Returned`, `Refunded`).
- **`payment_transactions/{trxId}`**: Duplicate TrxID protection ledger (`trxId`, `orderId`, `userId`, `provider`, `amount`, `verified`).
- **`courier_parcels/{consignmentId}`**: Parcel dispatch tracking (`consignmentId`, `orderId`, `provider`, `trackingCode`, `status`, `codAmount`).
- **`vouchers/{code}`**: Promo codes & discount rules (`code`, `title`, `discount`, `minSpend`, `expiry`, `active`).
- **`store_settings/main`**: Notice banner, welcome popup, delivery fees, free shipping rules, merchant accounts (`bKash`, `Nagad`, `Rocket`, `Upay`, `SSLCommerz`), courier toggles, Meta Pixel / CAPI / GA4 / GTM IDs, Tax/Packaging/Gateway fee %, SEO metadata, maintenance mode, and hero banners.
- **`reviews/{reviewId}`**: Verified buyer ratings and reviews linked to `productId`.
- **`subscribers/{subscriberId}`**: Newsletter subscription registry.
- **`users/{userId}`** & **`users/{userId}/addresses/{addressId}`**: Customer profiles, OTP verification flags, and saved delivery addresses.

### Multi-Vendor Marketplace, Real-Time Chat & Loyalty Collections
- **`vendors/{vendorId}`**: Verified partner stores & Official Mall merchants (`storeName`, `slug`, `tier`, `kycStatus`, `commissionRate`, `positiveRatingPercent`, `shipOnTimePercent`, `chatResponsePercent`, `walletBalance`, `totalSales`, `followersCount`).
- **`vendor_kyc/{vendorId}`**: Seller NID, Trade License, TIN/BIN verification records (strict owner/admin access).
- **`sub_orders/{subOrderId}`**: Per-vendor split orders generated on checkout with platform commission fee (`commissionAmount`) and net seller payout (`sellerNetPayout`).
- **`product_questions/{questionId}`**: Public buyer Q&A with seller/admin official answers.
- **`seller_payouts/{payoutId}`**: Seller withdrawal settlement requests (`bKash`, `Nagad`, `Bank Transfer`).
- **`chat_messages/{msgId}`**: Persistent buyer-seller live chat history synced alongside Socket.io.
- **`loyalty_wallets/{uid}`**: Daily check-in streak, Loyalty Coins balance, Lucky Wheel spin tracking, referral code, and collected vouchers.

### Enterprise ERP, Accounting, CRM, HR & Security Collections
- **`warehouses/{warehouseId}`**: Multi-branch hubs (`main-dhaka`, `chuadanga-hub`, branch codes, managers).
- **`stock_movements/{movementId}`**: Batch & expiry-tracked inventory movements (`in`, `out`, `adjustment`, `transfer`, `return`).
- **`suppliers/{supplierId}`**: Collector/farmer directory (`name`, `phone`, `location`, `suppliedItems`, `lastBatchDate`, `active`).
- **`purchases/{purchaseId}`**: Supplier purchase orders (`poNumber`, `totalCost`, `paidAmount`, `dueAmount`, `status`).
- **`accounting_entries/{entryId}`**: Cashbook income/expense ledger and duplicate-protected automated order P&L entries (`pnl-order-{orderId}`).
- **`employees/{employeeId}`**: HR directory, department, designation, salary, attendance days, and leave tracking.
- **`cms_pages/{slug}`**: Dynamic informational pages (`about`, `contact`, `privacy`, `terms`, `shipping`, `returns`) and Organic Blog (`blog`).
- **`customers_crm/{customerId}`**: Customer groups (`Regular`, `VIP`, `Wholesale`), B2B registration requests, credit due ledger, and block status.
- **`admin_notifications/{notifId}`**: Real-time alerts for incoming orders, stock, and refund requests.
- **`admins/{uid}`**: 10-Role RBAC registry (`Super Admin`, `Admin`, `Manager`, `Accountant`, `Order Manager`, `Inventory Manager`, `Product Manager`, `Marketing Manager`, `Customer Support`, `Delivery Manager`) with granular permission flags (`view`, `create`, `edit`, `delete`, `approve`, `refund`, `export`, `settings`).
- **`audit_logs/{logId}`**: Append-only administrative & security audit trail.

---

## 3. REST API, Socket.io & PWA Endpoints (`server.ts`)
- `GET /api/health` — System health and configured payment/courier/analytics status.
- `POST /api/otp/send` & `POST /api/otp/verify` — Rate-limited BD mobile OTP verification (`5 req/min`, max verify attempts).
- `POST /api/payments/verify` — Validates `bKash`, `Nagad`, `Rocket`, `Upay`, `SSLCommerz` TrxID with duplicate transaction ID lock (`409 Conflict` on reuse).
- `POST /api/payments/sslcommerz/init` — SSLCommerz payment session initializer.
- `POST /api/payments/webhook/:provider` — Payment gateway webhook handler with HMAC/header validation (`PAYMENT_WEBHOOK_SECRET`).
- `POST /api/orders/split-checkout` — Splits multi-vendor carts into per-vendor `sub_orders` with commission calculation and broadcasts `order:new` Socket.io notifications.
- `POST /api/search/visual` — Dominant RGB swatch & visual similarity product matcher.
- `GET /api/chat/threads` & `GET /api/chat/messages/:roomId` — Buyer-seller live chat thread list and history alongside Socket.io (`/socket.io`, events `chat:join`, `chat:message`, `order:notify`, `order:new`).
- `POST /api/couriers/dispatch` & `POST /api/couriers/bulk-dispatch` — Single and batch parcel booking across `Steadfast`, `Pathao`, `RedX`, and `eCourier`.
- `GET /api/couriers/track/:provider/:consignmentId` — Live consignment status and timeline.
- `POST /api/erp/profit-calculate` — Server-side P&L engine calculating Gross Sales, Net Sales, COGS, Store Delivery Expense, Packaging, Payment Gateway Fee, Tax, and Net Profit with duplicate `orderId` protection.
- `POST /api/reports/export-csv` — UTF-8 BOM Bengali-compatible CSV report generator.
- `POST /api/notifications/send` — SMS / Email / Push notification dispatch hub.
- `POST /api/marketing/capi-event` — Server-side Meta Conversion API relay.
- `GET /api/feeds/google-merchant.xml` — Google Merchant Center RSS catalog feed.
- `POST /api/backup/export` & `POST /api/backup/restore` — JSON snapshot export and schema-validated restore.
- `GET /robots.txt` & `GET /sitemap.xml` — Dynamic crawler directives and XML sitemap for SEO indexing.
- **PWA Offline & Installability**: Configured via `vite-plugin-pwa` (`manifest.webmanifest` + `sw.js`) with in-app install guide & offline status indicator.

---

## 4. Admin Role Matrix (`admins/{uid}`)
| Role | Default Permissions |
| --- | --- |
| Super Admin / Admin | `view`, `create`, `edit`, `delete`, `approve`, `refund`, `export`, `settings` |
| Manager | `view`, `create`, `edit`, `approve`, `export` |
| Accountant | `view`, `create`, `edit`, `export` |
| Order Manager | `view`, `create`, `edit`, `approve`, `refund`, `export` |
| Inventory Manager | `view`, `create`, `edit`, `export` |
| Product Manager | `view`, `create`, `edit`, `delete` |
| Marketing Manager | `view`, `create`, `edit`, `export` |
| Customer Support | `view`, `edit`, `refund` |
| Delivery Manager | `view`, `edit`, `export` |

---

## 5. Development, Testing & Production Deployment
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start full-stack dev server (Express + Socket.io + Vite middleware on port `3000`):
   ```bash
   npm run dev
   ```
3. Portal URLs:
   - **Admin Console**: `/#admin` or `/?admin=1` (Sign in with `khidmanutrition@gmail.com` or an authorized admin UID).
   - **Seller Center Portal**: `/#seller` or `/?seller=1` (Vendor onboarding KYC, catalog upload, split sub-order shipping label print, Q&A reply, live chat, payouts).
4. Validate security rules & TypeScript build:
   ```bash
   npx eslint firestore.rules
   npm run lint
   npm run build
   ```
5. Start production server (`NODE_ENV=production node server.ts`):
   ```bash
   npm start
   ```
6. **Production Note**: Review and deploy `firestore.rules` in your Firebase Console/CLI before onboarding live production traffic, and configure `.env` secrets (`SSLCOMMERZ_*`, `STEADFAST_*`, `PAYMENT_WEBHOOK_SECRET`, `META_*`) in your hosting environment.
