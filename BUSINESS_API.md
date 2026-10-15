# Business API Reference

Business API endpoints are mounted under `/api`. This document covers
business-owner authentication, business profile/operations, and shared
customer-facing services available to a business account.

## Authentication

Protected endpoints require a BusinessUser JWT:

```http
Authorization: Bearer <business-jwt>
Content-Type: application/json
```

Signup/login tokens are returned as `token`. The app accepts business
credentials at `/api/business/auth/*`; `/api/business/*` is the separate
business-management API.

### Business account authentication

| Method | Endpoint | Request body | Success response |
|---|---|---|---|
| POST | `/api/business/auth/signup` | `{"username":"venue_owner","email":"owner@example.com","password":"StrongPass1"}` | `201`: `{"success":true,"token":"<jwt>","businessUser":{"id":"<id>","username":"venue_owner","email":"owner@example.com","role":"BusinessUser"},"user":{...}}` |
| POST | `/api/business/auth/login` | `{"email":"owner@example.com","password":"StrongPass1"}` | `200`: same token/businessUser/user shape as signup, with `message:"Login successful"` |
| GET | `/api/business/auth/profile` | No body | `200`: `{"success":true,"businessUser":{...},"user":{...}}` |
| PUT | `/api/business/auth/profile` | `{"username":"updated_owner","email":"new@example.com"}`; send at least one field | `200`: `{"success":true,"message":"Profile updated successfully","businessUser":{...},"user":{...}}` |
| PATCH | `/api/business/auth/password` | `{"currentPassword":"StrongPass1","newPassword":"NewStrongPass2"}` | `200`: `{"success":true,"message":"Password changed successfully"}` |

Username must be 3–30 letters, digits or underscores. Password must be at least
6 characters and contain uppercase/lowercase letters and a number.

## Business profile and verification

| Method | Endpoint | Request body | Success response |
|---|---|---|---|
| GET | `/api/business/profile` | No body | `200`: `{"success":true,"data":{...businessProfile}}` (data is `null` before profile creation) |
| PUT | `/api/business/profile` | Complete profile body below | `201` on first save or `200` on update: `{"success":true,"created":true,"data":{...businessProfile}}` |

The profile response includes owner details, verification documents, owned turfs with gallery images, and the current subscription.

Profile body:

```json
{
  "legalName": "Central Sports Private Limited",
  "displayName": "Central Sports",
  "description": "Sports venue operator",
  "businessType": "private_limited",
  "contactEmail": "contact@example.com",
  "contactPhone": "+919876543210",
  "website": "https://example.com",
  "registrationNumber": "REG-123456",
  "taxIdMasked": "****1234",
  "timezone": "Asia/Kolkata",
  "address": {
    "line1": "10 Main Road",
    "line2": "Suite 2",
    "city": "Pune",
    "state": "Maharashtra",
    "country": "India",
    "postalCode": "411001"
  }
}
```

Required fields: `legalName`, `displayName`, `contactEmail`, `contactPhone`,
and `address.line1`, `address.city`, `address.state`, `address.country`,
`address.postalCode`. `businessType` may be `individual`, `partnership`,
`private_limited`, `llp`, or `other`. Editing a saved profile sends it back for
review.

### Verification documents

| Method | Endpoint | Request body / query | Success response |
|---|---|---|---|
| GET | `/api/business/documents` | No body | `200`: `{"success":true,"data":[...documents]}` |
| POST | `/api/business/documents` | `multipart/form-data`; fields and file below | `201`: `{"success":true,"data":{...document}}` |
| GET | `/api/business/documents/:id/download` | No body | `200`: `{"success":true,"data":{"url":"<temporary-url>","expiresInSeconds":300}}` |

Multipart fields: `documentType` (one of `IDENTITY_PROOF`,
`BUSINESS_REGISTRATION`, `TAX_DOCUMENT`, `ADDRESS_PROOF`, `BANK_VERIFICATION`,
`AUTHORIZATION`), optional `documentNumber`, optional ISO `expiryDate`, and
required file field `document`. Allowed files are PDF, JPEG, PNG or WebP, up to
5 MB. Document numbers are masked in the response.

## Disabled venue and facility APIs

Location, venue, facility, facility availability-rule and facility pricing-rule routes are disabled for the turf-only product flow. Existing stored venue/location/facility data is retained and is not modified by these API changes.
## Turf management

These endpoints manage the bookable Turf records. Turf records include gallery images.

| Method | Endpoint | Request body | Success response |
|---|---|---|---|
| GET | `/api/business/turfs` | No body | `200`: `{"success":true,"count":0,"data":[...ownedTurfs]}` |
| POST | `/api/business/turfs/upload` | `multipart/form-data` image fields `mainImage` and/or `thumbnailImages` | `201`: `{"success":true,"data":{"gallery":{...}}}` |
| POST | `/api/business/turfs` | Turf create JSON/multipart body | `201`: `{"success":true,"message":"Turf created successfully","data":{...turf}}` |
| PUT | `/api/business/turfs/:id` | Partial turf JSON/multipart body | `200`: `{"success":true,"data":{...turf},"message":"Turf updated successfully"}` |
| DELETE | `/api/business/turfs/:id` | No body | `200`: `{"success":true,"message":"Turf deleted successfully"}` |

The create body follows the nested format documented in
[ADMIN_API.md](./ADMIN_API.md#turf-administration). The business account may
only access its own turfs.

## Customer turf bookings

Customer booking requests require a user JWT. The `turfId` field is required; facility-based booking is not accepted.

| Method | Endpoint | Request body | Success response |
|---|---|---|---|
| POST | `/api/bookings` | `{"turfId":"<turf-id>","date":"2026-11-01","timeSlot":"18:00-19:00","paymentMethod":"online"}` | `201`: created booking in a success envelope |

Dates use `YYYY-MM-DD` and time slots use `HH:MM-HH:MM`. For online payment, create and verify the payment using `/api/payments/orders` and `/api/payments/verify`.
## Bookings, stats, and review replies

| Method | Endpoint | Request body | Success response |
|---|---|---|---|
| GET | `/api/business/bookings` | No body | `200`: `{"success":true,"count":0,"bookings":[...ownedBookings]}` |
| GET | `/api/business/booking-stats` | No body | `200`: `{"success":true,"data":{"totalBookings":0,"totalRevenue":0,"paidBookings":0,"pendingBookings":0}}` |
| PATCH | `/api/business/bookings/:id` | `{"bookingStatus":"confirmed"}` | `200`: `{"success":true,"message":"Booking updated successfully","booking":{...booking}}` |
| PATCH | `/api/business/reviews/:id/response` | `{"response":"Thank you for your feedback."}` | `200`: `{"success":true,"data":{...review}}` |

Booking `bookingStatus` values accepted by validation are `pending`,
`confirmed`, `cancelled`, and `completed`. The service enforces valid state
transitions, payment capture before confirming online bookings, and prevents
changing payment status through this endpoint. Businesses can reply only to
published reviews for resources they own.

## Financials

| Method | Endpoint | Query | Success response |
|---|---|---|---|
| GET | `/api/financials/business/statement` | Optional `page`, `limit` (1–100) | `200`: `{"success":true,"data":{"entries":[...],"totals":{"grossPaise":0,"commissionPaise":0,"payablePaise":0,"reservedPaise":0,"availablePaise":0},"page":1,"pages":0,"totalEntries":0}}` |
| GET | `/api/financials/business/settlements` | Optional `page`, `limit` | `200`: paginated settlement data in a success envelope |
| GET | `/api/financials/business/payouts` | Optional `page`, `limit` | `200`: same business settlement list response |

Money values ending in `Paise` are integer paise. If no business profile exists,
these endpoints return `404`.

## Business subscriptions

| Method | Endpoint | Request body / headers | Success response |
|---|---|---|---|
| GET | `/api/subscriptions/plans` | No body | `200`: `{"success":true,"data":[...activePlans]}` |
| POST | `/api/subscriptions/trial` | `{"planId":"<plan-id>"}` | `201`: `{"success":true,"data":{...trialSubscription}}` |
| POST | `/api/subscriptions/free` | `{"planId":"<plan-id>","billingCycle":"MONTHLY"}` | `201`: `{"success":true,"data":{...activeSubscription}}` |
| POST | `/api/subscriptions/checkout` | Required `Idempotency-Key` header (max 120 chars); body below | `201`: `{"success":true,"data":{"id":"<payment-id>","subscriptionId":"<id>","amountPaise":99900,"currency":"INR","status":"CREATED","providerOrderId":"<order-id>","provider":"razorpay","keyId":"<public-key>"}}` |
| POST | `/api/subscriptions/verify` | Verification body below | `200`: `{"success":true,"data":{"status":"ACTIVE","subscriptionId":"<id>"}}` (exact data depends on provider result) |
| GET | `/api/subscriptions/me` | No body | `200`: `{"success":true,"data":{...currentSubscription}}` or `data:null` |
| POST | `/api/subscriptions/cancel` | No body | `200`: `{"success":true,"data":{...subscriptionWithCancellationScheduled}}` |
| GET | `/api/invoices/me` | No body | `200`: `{"success":true,"data":[...businessInvoices]}` |

Checkout body:

```json
{ "planId": "<plan-id>", "billingCycle": "MONTHLY" }
```

`billingCycle` is `MONTHLY`, `QUARTERLY` or `YEARLY`.

Verify body:

```json
{
  "orderId": "<provider-order-id>",
  "paymentId": "<provider-payment-id>",
  "signature": "<64-character-hex-signature>"
}
```

The business must have an approved profile to activate a free plan, start a trial, or checkout. Plans may use a zero price for any billing cycle; activate that cycle through `POST /api/subscriptions/free` without Razorpay. A plan with `trialDays` greater than zero can start one trial per business through `POST /api/subscriptions/trial`. Set `trialDays` to `30` for a one-month trial. The business is active during the trial; once it expires, the business is paused unless a paid subscription has started. To continue service, create and verify a checkout before or after trial expiry.

## Notifications

| Method | Endpoint | Request body / query | Success response |
|---|---|---|---|
| GET | `/api/notifications` | Optional `page`, `limit` (1–100) | `200`: `{"success":true,"data":[...notifications],"total":0,"unread":0,"page":1,"pages":0}` |
| PATCH | `/api/notifications/:id/read` | No body | `200`: `{"success":true,"data":{...notification}}` |
| GET | `/api/notifications/preferences` | No body | `200`: `{"success":true,"data":{...preferences}}` |
| PATCH | `/api/notifications/preferences` | One or more preference booleans below | `200`: `{"success":true,"data":{...preferences}}` |

```json
{ "booking": true, "payment": true, "reminder": true, "marketing": false, "offers": false, "security": true }
```

## Support

| Method | Endpoint | Request body / query | Success response |
|---|---|---|---|
| GET | `/api/support` | No body | `200`: `{"success":true,"data":[...yourTickets]}` |
| POST | `/api/support` | New ticket body below | `201`: `{"success":true,"data":{...ticket}}` |
| GET | `/api/support/:id` | No body | `200`: `{"success":true,"data":{...ticket}}` |
| POST | `/api/support/:id/replies` | `{"message":"Any update on this issue?"}` | `200`: `{"success":true,"data":{...updatedTicket}}` |

New ticket body:

```json
{
  "category": "VENUE",
  "priority": "MEDIUM",
  "subject": "Venue listing question",
  "bookingId": "<optional-booking-id>",
  "message": "Please help me update my venue listing."
}
```

Categories: `BOOKING`, `PAYMENT`, `REFUND`, `BUSINESS`, `VENUE`, `ACCOUNT`,
`TECHNICAL`, `OTHER`. Priorities: `LOW`, `MEDIUM`, `HIGH`, `URGENT`.

## Common errors

Validation errors return HTTP `400`:

```json
{
  "success": false,
  "errors": [{ "field": "contactPhone", "message": "Invalid value" }]
}
```

Most operation errors use `{"success":false,"message":"..."}`. Missing/invalid
authentication generally returns `401`; wrong role returns `403`. Resource
responses use the examples above; pagination and nested structures differ by
module.
