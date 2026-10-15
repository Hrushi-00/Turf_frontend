# Admin API Reference

Admin API endpoints are mounted under `/api`. Examples below show the request
body and the response contract returned by the current implementation.

## Authentication

Send the admin JWT on protected endpoints:

```http
Authorization: Bearer <admin-jwt>
Content-Type: application/json
```

The accepted roles are `Admin` and `SuperAdmin`. To register the first/admin
account, configure `ADMIN_REGISTRATION_KEY` on the server and send it in the
`x-admin-registration-key` header. Do not put real passwords, tokens, or
registration keys in this document.

### Admin authentication endpoints

| Method | Endpoint | Request body / headers | Success response |
|---|---|---|---|
| POST | `/api/admin/auth/register` | Body: `{"username":"admin_user","email":"admin@example.com","password":"StrongPass1"}`. Header: `x-admin-registration-key: <configured-key>`. | `201`: `{"success":true,"token":"<jwt>","admin":{"id":"<id>","username":"admin_user","email":"admin@example.com","role":"Admin"},"user":{...}}` |
| POST | `/api/admin/auth/login` | Body: `{"email":"admin@example.com","password":"StrongPass1"}` | `200`: same token/admin/user structure as registration |
| GET | `/api/admin/auth/profile` | No body. Admin Bearer token required. | `200`: `{"success":true,"admin":{...},"user":{"id":"<id>","username":"admin_user","email":"admin@example.com","role":"Admin"}}` |
| PUT | `/api/admin/auth/profile` | Body: `{"username":"new_admin_name","email":"new@example.com"}`. At least one field required. | `200`: `{"success":true,"message":"Profile updated successfully","admin":{...},"user":{...}}` |
| PATCH | `/api/admin/auth/password` | Body: `{"currentPassword":"StrongPass1","newPassword":"NewStrongPass2"}` | `200`: `{"success":true,"message":"Password changed successfully"}` |

Registration requires a username (3–30 letters, digits or underscores), valid
email, and a password with at least 6 characters including upper/lowercase
letters and a number. Login does not return a password.

## Turf administration

All endpoints in this section require an admin Bearer token.

| Method | Endpoint | Request body / query | Success response |
|---|---|---|---|
| GET | `/api/admin/turfs` | No body | `200`: `{"success":true,"count":1,"data":[...turfs]}` |
| POST | `/api/admin/turfs` | Turf JSON body below. Multipart uploads are also supported. | `201`: `{"success":true,"message":"Turf created successfully","data":{...turf}}` |
| PUT | `/api/admin/turfs/:id` | Partial turf JSON body below; at least one field or image file is required. | `200`: `{"success":true,"data":{...turf},"message":"Turf updated successfully"}` |
| DELETE | `/api/admin/turfs/:id` | No body | `200`: `{"success":true,"message":"Turf deleted successfully"}` |
| PATCH | `/api/admin/turfs/:id/meta` | Body below | `200`: `{"success":true,"data":{...metaInfo},"message":"Turf meta info updated successfully"}` |
| POST | `/api/admin/turfs/:id/approve` | No body | `200`: `{"success":true,"data":{...turf},"message":"Turf approved successfully"}` |
| POST | `/api/admin/turfs/:id/reject` | No body | `200`: `{"success":true,"data":{...turf},"message":"Turf rejected successfully"}` |

Create turf request:

```json
{
  "ownerDetails": {
    "name": "Turf Owner",
    "contactNumber": "+919876543210",
    "email": "owner@example.com"
  },
  "turfDetails": {
    "turfName": "Central Arena",
    "description": "Outdoor football turf with changing facilities.",
    "sportsAvailable": ["Football"],
    "surfaceType": "Artificial grass",
    "dimensions": { "length": 40, "width": 20, "unit": "meters" },
    "capacity": 14
  },
  "location": {
    "address": "10 Main Road",
    "city": "Pune",
    "state": "Maharashtra",
    "zipCode": "411001",
    "coordinates": { "type": "Point", "coordinates": [73.8567, 18.5204] }
  },
  "pricing": {
    "weekdayRate": 1200,
    "weekendRate": 1600,
    "currency": "INR",
    "minimumBookingHours": 1
  },
  "availability": { "openingTime": "06:00", "closingTime": "23:00" },
  "gallery": { "mainImage": "https://example.com/turf.jpg" },
  "amenities": ["Parking", "Floodlights"]
}
```

For multipart requests, nested fields can be sent as JSON strings or flattened
keys (for example, `turfDetails[turfName]`). Optional image files use
`mainImage` and `thumbnailImages`.

Turf metadata request (send one or more fields):

```json
{
  "isApproved": true,
  "isFeatured": false,
  "isTrending": true,
  "popularityScore": 10
}
```

## Bookings

| Method | Endpoint | Request body / query | Success response |
|---|---|---|---|
| GET | `/api/admin/bookings` | No body | `200`: `{"success":true,"count":1,"bookings":[...bookings]}` |
| PATCH | `/api/admin/bookings/:id` | Body below | `200`: `{"success":true,"message":"Booking updated successfully","booking":{...booking}}` |
| GET | `/api/admin/booking-stats` | No body | `200`: `{"success":true,"data":{"totalBookings":0,"totalRevenue":0,...}}` |

Update booking request:

```json
{ "bookingStatus": "confirmed" }
```

Allowed `bookingStatus` values: `pending`, `confirmed`, `cancelled`, `completed`.
At least one status field is required.

## Business verification and documents

| Method | Endpoint | Request body / query | Success response |
|---|---|---|---|
| GET | `/api/admin/businesses` | Optional query: `status` (`PENDING`, `APPROVED`, `REJECTED`, `REQUIRES_ACTION`, `ALL`), `page`, `limit` (1–100) | `200`: success envelope with `data`, `total`, `page`, and `pages` |
| PATCH | `/api/admin/businesses/:id/approval` | Body below | `200`: `{"success":true,"data":{...business}}` |
| GET | `/api/admin/business-documents` | Optional query: `status` (`PENDING_REVIEW`, `APPROVED`, `REJECTED`, `ALL`), `page`, `limit` | `200`: paginated success envelope with documents in `data` |
| GET | `/api/admin/business-documents/:id/download` | No body | `200`: `{"success":true,"data":{"url":"<temporary-download-url>",...}}` |
| PATCH | `/api/admin/business-documents/:id/review` | Body below | `200`: `{"success":true,"data":{...document}}` |

Business approval request:

```json
{ "approvalStatus": "REQUIRES_ACTION", "reason": "Please provide a clearer registration document." }
```

`approvalStatus` is `APPROVED`, `REJECTED`, or `REQUIRES_ACTION`. `reason` is
required unless approving.

Document review request:

```json
{ "status": "REJECTED", "rejectionReason": "The uploaded document is unreadable." }
```

`status` is `APPROVED` or `REJECTED`; `rejectionReason` is required for
rejections.

## Venue verification (disabled)

Admin venue listing and approval routes are disabled for the turf-only product flow. Existing venue records are retained. Use turf moderation endpoints for active listings.
## Analytics and audit logs

| Method | Endpoint | Request body / query | Success response |
|---|---|---|---|
| GET | `/api/analytics/admin` | No body | `200`: admin dashboard object in a success envelope |
| GET | `/api/admin/audit-logs` | Optional query: `page`, `limit` (1–100), `actorId`, `entityId`, `action`, `entityType` | `200`: `{"success":true,"data":[...logs],"total":0,"page":1,"pages":0}` |

## Financial administration

| Method | Endpoint | Request body / query | Success response |
|---|---|---|---|
| GET | `/api/financials/admin/rules` | No body | `200`: `{"success":true,"data":{...financialRule}}` |
| PATCH | `/api/financials/admin/rules` | Body below | `200`: `{"success":true,"data":{...financialRule}}` |
| GET | `/api/financials/admin/ledger` | Optional query: `page`, `limit` (1–100), `businessId`, `entryType` (`BOOKING_CAPTURE`, `BOOKING_REFUND`, `PAYOUT`, `ADJUSTMENT`) | `200`: paginated success envelope with ledger entries |
| GET | `/api/financials/admin/payouts` | Optional query: `page`, `limit` (1–100), `businessId` | `200`: paginated success envelope with payout entries |
| GET | `/api/financials/admin/settlements` | Optional query: `page`, `limit` (1–100), `businessId`, `status` (`PENDING`, `PROCESSING`, `PROCESSED`, `FAILED`, `HELD`) | `200`: paginated success envelope with settlements |
| POST | `/api/financials/admin/settlements/:businessId` | No body | `201`: `{"success":true,"data":{...settlement}}` |
| PATCH | `/api/financials/admin/settlements/:id` | Body below | `200`: `{"success":true,"data":{...settlement}}` |

Financial rule request:

```json
{ "bookingCommissionBps": 750 }
```

`bookingCommissionBps` is an integer from 0 to 10000 (basis points).

Settlement update request:

```json
{
  "status": "PROCESSED",
  "externalReference": "BANK-TRANSFER-123",
  "failureReason": "Only used when status is FAILED."
}
```

`status` is required and must be `PROCESSING`, `PROCESSED`, `FAILED`, or
`HELD`. `externalReference` and `failureReason` are optional.

## Payment refunds

| Method | Endpoint | Request body / query | Success response |
|---|---|---|---|
| GET | `/api/payments/admin/refunds-required` | Optional query: `page`, `limit` (1–100) | `200`: `{"success":true,"data":[...payments],"total":0,"page":1,"pages":0}` |
| POST | `/api/payments/admin/:id/refund` | No body. Header `Idempotency-Key` (8–120 characters). | `202`: `{"success":true,"data":{...refundRequest}}` |

## Wallet adjustments

| Method | Endpoint | Request body / headers | Success response |
|---|---|---|---|
| POST | `/api/wallet/admin/users/:userId/adjust` | Header `Idempotency-Key` (8–128 characters); body below | `201`: success envelope with the wallet ledger entry |

```json
{
  "direction": "CREDIT",
  "amountPaise": 50000,
  "reason": "Approved customer service adjustment"
}
```

`direction` is `CREDIT` or `DEBIT`; `amountPaise` must be a positive integer.

## Membership plans

| Method | Endpoint | Request body | Success response |
|---|---|---|---|
| GET | `/api/memberships/admin/plans` | No body | `200`: `{"success":true,"data":[...plans]}` |
| POST | `/api/memberships/admin/plans` | Create body below | `201`: `{"success":true,"data":{...plan}}` |
| PATCH | `/api/memberships/admin/plans/:id` | Any subset of create fields plus optional `status` | `200`: `{"success":true,"data":{...plan}}` |

Create membership plan request:

```json
{
  "name": "Gold",
  "description": "Premium member benefits",
  "pricePaise": 49900,
  "durationDays": 365,
  "discountBps": 500,
  "priorityBooking": true,
  "features": ["Priority booking", "Member discount"]
}
```

`name`, `pricePaise`, and `durationDays` are required. Optional fields:
`description`, `discountBps` (0–10000), `priorityBooking`, `features` (up to 50
strings), and update-only `status` (`ACTIVE` or `INACTIVE`).

## Business subscriptions

| Method | Endpoint | Request body / query | Success response |
|---|---|---|---|
| GET | `/api/subscriptions/admin/plans` | No body | `200`: `{"success":true,"data":[...plans]}` |
| POST | `/api/subscriptions/admin/plans` | Create body below | `201`: `{"success":true,"data":{...plan}}` |
| PATCH | `/api/subscriptions/admin/plans/:id` | Any subset of create fields | `200`: `{"success":true,"data":{...plan}}` |
| GET | `/api/subscriptions/admin/subscriptions` | Optional pagination query: `page`, `limit` | `200`: paginated success envelope with subscriptions |

Create subscription plan request:

```json
{
  "name": "Business Pro",
  "slug": "business-pro",
  "description": "Tools for growing businesses",
  "monthlyPricePaise": 99900,
  "quarterlyPricePaise": 269900,
  "yearlyPricePaise": 999900,
  "trialDays": 14,
  "status": "ACTIVE"
}
```

Required fields: `name`, `slug`, and all three prices. Prices are integer
paise (minimum 100). `trialDays` is 0–90; `status` is `ACTIVE` or `INACTIVE`.

## Sports catalog

| Method | Endpoint | Request body | Success response |
|---|---|---|---|
| GET | `/api/sports/admin` | No body | `200`: `{"success":true,"data":[...sports]}` |
| POST | `/api/sports/admin` | Create body below | `201`: `{"success":true,"data":{...sport}}` |
| PATCH | `/api/sports/admin/:id` | Any subset of create fields plus optional `status` | `200`: `{"success":true,"data":{...sport}}` |

```json
{
  "name": "Football",
  "slug": "football",
  "description": "Association football",
  "iconUrl": "https://example.com/football.svg"
}
```

`name` and a lowercase, URL-safe `slug` (2–60 characters) are required.
`status` can be `ACTIVE` or `INACTIVE`.

## Support tickets

| Method | Endpoint | Request body / query | Success response |
|---|---|---|---|
| GET | `/api/support/admin` | Optional query: `status`, `priority`, `page`, `limit` (1–100) | `200`: `{"success":true,"data":[...tickets],"total":0,"page":1,"pages":0}` |
| GET | `/api/support/admin/:id` | No body | `200`: `{"success":true,"data":{...ticket}}` |
| POST | `/api/support/admin/:id/replies` | Body below | `200`: `{"success":true,"data":{...updatedTicket}}` |
| PATCH | `/api/support/admin/:id` | Body below | `200`: `{"success":true,"data":{...updatedTicket}}` |

Reply body:

```json
{ "message": "We are checking this issue and will update you shortly." }
```

Ticket update body (send `status`, `priority`, or both):

```json
{ "status": "IN_PROGRESS", "priority": "HIGH" }
```

Statuses: `IN_PROGRESS`, `WAITING_FOR_USER`, `WAITING_FOR_BUSINESS`,
`RESOLVED`, `CLOSED`. Priorities: `LOW`, `MEDIUM`, `HIGH`, `URGENT`.

## Review moderation

| Method | Endpoint | Request body / query | Success response |
|---|---|---|---|
| GET | `/api/reviews/admin` | Optional query: `status` (`PENDING`, `PUBLISHED`, `HIDDEN`, `ALL`), `page`, `limit` (1–100) | `200`: paginated success envelope with reviews |
| PATCH | `/api/reviews/admin/:id` | Body below | `200`: `{"success":true,"data":{...review}}` |

```json
{ "status": "HIDDEN", "reason": "Contains personal information." }
```

`status` is `PUBLISHED` or `HIDDEN`; `reason` is required when hiding a review.

## Error responses

Validation errors return HTTP `400`:

```json
{
  "success": false,
  "errors": [
    { "field": "bookingStatus", "message": "Invalid booking status" }
  ]
}
```

Most controller/service errors return `{"success":false,"message":"..."}`.
Authentication failures generally return HTTP `401`; insufficient admin role
returns HTTP `403`. A missing route returns HTTP `404` with
`{"success":false,"message":"Route not found"}`. Successful list responses and
resource envelopes vary slightly by module; see each endpoint's response
example above.
