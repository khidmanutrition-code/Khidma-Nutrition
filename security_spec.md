# Security Specification & Payload Audit (Khidmatul Ummah Shop BD)

## 1. Data Invariants
1. **Default-Deny Catch-All**: No Firestore path is readable or writable unless explicitly matched.
2. **Verified Identity**: All authenticated writes require `request.auth != null && request.auth.token.email_verified == true`.
3. **Bootstrapped & Role-Backed Admin**: Admin privileges are granted exclusively via `exists(/databases/$(database)/documents/admins/$(request.auth.uid))` or verified store owner email `khidmanutrition@gmail.com`. Client claims or user-supplied role fields are never trusted.
4. **PII Isolation**: `orders`, `users`, and `users/{userId}/addresses` contain PII (`phone`, `address`, `email`) and are strictly readable only by the owning UID or `isAdmin()`. No blanket `isSignedIn()` list/get access exists.
5. **Order State Integrity & Terminal Locking**: Customers can only create orders with `userId == request.auth.uid`, `status == 'Pending'`, and server timestamps (`request.time`). Non-admin owners may only cancel their own `'Pending'` order (updating only `status` and `updatedAt`). Once an order leaves `'Pending'` or reaches terminal states (`Delivered`, `Cancelled`), only `isAdmin()` may modify it.
6. **Immutable Audit Fields**: `createdAt`, `userId`, and `orderId` / `uid` cannot be altered after creation.
7. **Bounded Arrays & Strict String Lengths**: All arrays (`items`, `variants`, `gallery`, `features`) enforce explicit upper bounds (`size() <= MAX`), and all strings enforce explicit `size()` limits.

## 2. The "Dirty Dozen" Attack Payloads (Must All Return PERMISSION_DENIED)
1. **Shadow Field Injection on Product**: Create product with extra `{ isFeaturedAdminOverride: true }`.
2. **Non-Admin Product Mutation**: Non-admin user attempts to `update` product price to `1`.
3. **Spoofed Order Owner**: User A submits `orders/{id}` with `userId: "user_B"`.
4. **Order Status Shortcutting**: Customer creates an order with `status: "Delivered"` or updates `Pending` directly to `Confirmed`.
5. **Post-Terminal Order Tampering**: Customer attempts to change a `Delivered` order back to `Pending`.
6. **Admin Privilege Escalation**: Signed-in user attempts to write their own UID to `/admins/{myUid}`.
7. **Unverified Email Spoofing**: Token with `email: "khidmanutrition@gmail.com"` and `email_verified: false` attempts admin write.
8. **PII Blanket Scraping**: Signed-in user executes `list` on `/orders` without owning the returned documents.
9. **Resource Poisoning / Oversized Document ID**: Request to `create` `/products/{1500_char_id}` or invalid punctuation ID.
10. **Oversized String Payload (Denial of Wallet)**: Product `description` exceeding 2000 characters.
11. **Timestamp Forgery**: Creating an order with backdated `createdAt` instead of `request.time`.
12. **Unbounded Array Attack**: Creating an order with 50 line items or a product with 25 variants.
