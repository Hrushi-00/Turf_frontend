# Turf Booking Platform

A sports venue and turf booking platform designed to help customers
discover sports facilities, check availability, and book slots online.
The platform also includes business-side management and an admin
workflow for reviewing businesses and venues.

> **Project status:** Architecture and development baseline. Features
> described as planned or production-ready in the roadmap should not be
> interpreted as already implemented. Update this README as modules are
> completed.

## Table of Contents

-   [Overview](#overview)
-   [User Roles](#user-roles)
-   [Core Booking Flow](#core-booking-flow)
-   [Business Onboarding Flow](#business-onboarding-flow)
-   [Platform Architecture](#platform-architecture)
-   [Technology Stack](#technology-stack)
-   [Project Modules](#project-modules)
-   [API Structure](#api-structure)
-   [Getting Started](#getting-started)
-   [Docker and CI/CD](#docker-and-cicd)
-   [Environment Variables](#environment-variables)
-   [Security and Reliability](#security-and-reliability)
-   [Roadmap](#roadmap)
-   [Contributing](#contributing)
-   [Author](#author)

## Overview

The Turf Booking Platform is intended to evolve from a turf-focused
booking application into a multi-tenant sports venue marketplace.

Customers can discover sports venues, review venue details, check
available slots, and book a facility. Business owners can manage their
venues and bookings, while platform administrators can review
businesses, manage platform settings, and oversee operations.

### Goals

-   Make sports facility discovery and booking easier.
-   Provide separate experiences for customers, business owners, and
    administrators.
-   Support business-owned venues and tenant-level data isolation.
-   Handle availability, pricing, bookings, and payments reliably.
-   Establish a foundation that can scale to multiple locations and
    sports.

## User Roles

### Customer

Planned customer capabilities include:

-   Register and log in.
-   Browse and search venues.
-   Filter by sport, location, price, amenities, and availability.
-   View venue and facility details.
-   Check available slots and create a booking.
-   Pay online and view booking history.
-   Cancel or reschedule according to the applicable policy.
-   Receive booking updates and invoices.
-   Submit reviews after completed bookings.

### Business Owner

Business owners are intended to be able to:

-   Register a business and maintain its profile.
-   Submit verification/KYC documents for review.
-   Manage locations, venues, facilities, sports, schedules, and
    pricing.
-   View and manage bookings.
-   Manage staff and customer information within their business.
-   View analytics, subscription details, invoices, and payouts.
-   Respond to reviews and contact support.

Business owners must not approve their own business, modify
platform-controlled commission settings, or access another business's
data.

### Platform Admin

Admin capabilities are intended to include:

-   Manage users and businesses.
-   Review verification documents.
-   Approve or reject businesses and venues.
-   Manage subscription plans and platform fees.
-   Oversee bookings, payments, refunds, and disputes.
-   Moderate reviews and manage platform content.
-   View analytics and audit logs.
-   Suspend or reactivate resources when required.

## Core Booking Flow

``` text
Customer
   |
   v
Search venues
   |
   v
Select sport and venue
   |
   v
Select facility and date
   |
   v
Check available slots
   |
   v
Hold selected slot
   |
   v
Calculate price on the server
   |
   v
Create payment order
   |
   v
Complete payment
   |
   v
Verify payment on the server / process webhook
   |
   v
Confirm booking
   |
   +--> Generate invoice
   |
   +--> Send notification
```

A production implementation should verify payment on the server and
process payment webhooks securely. A successful frontend callback alone
must not be treated as proof that a payment has been completed.

## Business Onboarding Flow

``` text
Business signup
   |
   v
Verify email/mobile
   |
   v
Complete business profile
   |
   v
Submit verification documents
   |
   v
Create location, venue, and facilities
   |
   v
Configure sports, availability, and pricing
   |
   v
Submit for admin review
   |
   +--> Rejected / changes required --> Update and resubmit
   |
   v
Admin approval
   |
   v
Select subscription plan (where enabled)
   |
   v
Complete subscription payment (where enabled)
   |
   v
Business becomes eligible to go live
```

Business approval, subscription status, and operational status should be
maintained as separate lifecycle states.

## Platform Architecture

### Target architecture

``` text
                    Customers / Business / Admin
                                |
                             Web UI
                                |
                         Next.js Frontend
                                |
                         Node.js / Express API
                                |
          +---------------------+--------------------+
          |                     |                    |
       MongoDB                Redis            Object Storage
          |                     |                    |
          +---------------------+--------------------+
                                |
                       Queue / Background Workers
                                |
                +---------------+----------------+
                |                                |
          Payment Gateway                 Email / SMS / Push
                |
             Webhooks
```

This diagram represents the target architecture from the project
specification. Integrations such as Redis, object storage, background
workers, and payment webhooks should be marked as implemented only after
they are configured and tested in the repository.

### Domain model

The longer-term domain model separates the platform into these related
entities:

``` text
Business
  └── Location
       └── Venue
            └── Facility
                 ├── Sport
                 ├── Availability
                 ├── Pricing
                 ├── Maintenance
                 └── Bookings
```

The current project uses turf-oriented terminology. A gradual migration
toward the generic `Business → Location → Venue → Facility` model is
preferable to a single large rewrite.

## Technology Stack

The architecture specification identifies the following technologies:

  -----------------------------------------------------------------------
  Layer                               Technology / Approach
  ----------------------------------- -----------------------------------
  Frontend                            Next.js App Router

  Backend                             Node.js, Express.js

  Database                            MongoDB

  ODM                                 Mongoose, if used by the backend

  Cache and distributed locks         Redis (target architecture)

  Media                               Object storage and CDN (target
                                      architecture)

  Payments                            Payment gateway with server-side
                                      verification and webhooks

  Background work                     Queue and worker processes (target
                                      architecture)

  API design                          REST API
  -----------------------------------------------------------------------

Confirm the exact versions and installed packages from the repository's
`package.json` files before publishing a release.

## Project Modules

The platform is organized around the following domains:

-   **Authentication and identity:** Customer, business staff, and admin
    sessions with explicit roles.
-   **Business management:** Business profile, verification, ownership,
    and operational status.
-   **Venue and facility management:** Locations, turf/venue details,
    facilities, sports, amenities, and media.
-   **Availability and scheduling:** Weekly schedules, exceptions,
    maintenance blocks, and slot availability.
-   **Pricing:** Facility-specific pricing, peak/off-peak rules,
    discounts, and taxes.
-   **Bookings:** Slot holds, booking lifecycle, cancellation,
    rescheduling, and check-in.
-   **Payments and refunds:** Payment records, verification, refund
    workflows, and reconciliation.
-   **Subscriptions and settlements:** Business plans, platform fees,
    commission, settlements, and payouts.
-   **Notifications:** Booking, payment, verification, and subscription
    updates.
-   **Reviews and support:** Reviews, support tickets, and dispute
    handling.
-   **Admin and analytics:** Moderation, operational controls, reports,
    and audit logs.

Some modules above describe the target roadmap and may not yet be
implemented.

## API Structure

The current application uses `/api` routes, including routes such as:

``` text
/api/turfs
/api/business
/api/admin
/api/bookings
/api/user/bookings
```

The proposed versioned API structure is:

``` text
/api/v1/auth
/api/v1/users
/api/v1/businesses
/api/v1/locations
/api/v1/venues
/api/v1/facilities
/api/v1/sports
/api/v1/availability
/api/v1/pricing
/api/v1/bookings
/api/v1/slot-holds
/api/v1/payments
/api/v1/refunds
/api/v1/subscriptions
/api/v1/payouts
/api/v1/reviews
/api/v1/coupons
/api/v1/notifications
/api/v1/support
/api/v1/admin
```

The `/api/v1` routes are a proposed target structure, not a claim that
every endpoint currently exists. Migrate incrementally and avoid
breaking existing clients without a versioning plan.

## Getting Started

The repository's exact scripts and environment variable names should be
checked before running the project. The following is a general local
setup flow.

### Prerequisites

-   Node.js and npm compatible with the project's package files.
-   MongoDB connection (local MongoDB or MongoDB Atlas).
-   Git.
-   Any additional services required by the enabled features.

### Installation

``` bash
git clone https://github.com/Hrushi-00/Turf_frontend.git
cd Turf_frontend
npm install
```

Start the development server using the script defined in `package.json`,
for example:

``` bash
npm run dev
```

If this repository contains only the frontend, the backend API must be
started separately from its own repository or directory. Configure the
frontend API base URL to point to the running backend.

> If `npm run dev` is not defined, open `package.json` and use the
> available script instead. Do not assume the frontend and backend share
> the same start command.

## Docker and CI/CD

The production container is defined in `docker/Dockerfile`, uses Next.js standalone output, and runs as a
non-root user. Docker Compose reads the existing `APP_URL` setting from
`.env.local` and builds the image:

``` bash
docker compose --env-file .env.local up --build
```

Open <http://localhost:3000>. Set `APP_URL` to the reachable backend
origin (for example, `https://api.example.com`) before building. The
current Next.js configuration embeds this value during the build, so
build a separate image for each API environment.

The GitHub Actions workflow at `.github/workflows/ci-cd.yml` runs `npm
ci`, ESLint, and a production build for pull requests and pushes to
`main`. A push to `main` publishes `ghcr.io/<owner>/<repository>:latest`
and a commit SHA tag; pushing a version tag such as `v1.2.3` also
publishes version tags.

Before merging to `main`, add the repository variable `APP_URL` in
**Settings → Secrets and variables → Actions → Variables**. The workflow
uses the built-in `GITHUB_TOKEN` to publish to GitHub Container Registry;
allow package write access for Actions if the repository requires it.
Pull the image with:

``` bash
docker pull ghcr.io/<owner>/<repository>:latest
docker run --rm -p 3000:3000 ghcr.io/<owner>/<repository>:latest
```

This workflow publishes the deployable image to GHCR. Starting that image
on a hosting provider or server is the deployment step for the chosen
infrastructure.

## Environment Variables

Create a local `.env.local` or `.env` file according to the framework
and code in the repository. Use the exact variable names referenced by
the application.

Example placeholders:

``` env
# Frontend: use the variable name expected by your code
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Backend examples — configure in the backend project only
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=replace_with_a_secure_secret
PAYMENT_SECRET=your_payment_provider_secret
PAYMENT_WEBHOOK_SECRET=your_webhook_secret
```

Important:

-   These names are examples; verify them against the code before use.
-   Never commit `.env` files, database credentials, JWT secrets, or
    payment secrets.
-   Frontend-exposed variables (such as `NEXT_PUBLIC_*` in Next.js) must
    never contain private secrets.
-   Add local environment files to `.gitignore`.

## Security and Reliability

Important design requirements for a production deployment:

-   Enforce authentication, role permissions, and business/resource
    ownership on the server.
-   Prevent cross-business access to tenant-owned resources.
-   Validate request bodies, query parameters, route parameters, and
    uploaded files.
-   Calculate prices on the backend rather than trusting frontend
    totals.
-   Use atomic slot holds and concurrency-safe booking operations to
    prevent double booking.
-   Use idempotency for booking, payment, and refund operations.
-   Verify payment signatures and webhook events on the server.
-   Store timestamps consistently and interpret booking dates in the
    venue's timezone.
-   Keep financial and audit records traceable.
-   Rate-limit authentication and other sensitive endpoints.
-   Use secure headers, an explicit CORS allowlist, and managed secrets.
-   Add automated tests for booking, pricing, authorization, and payment
    workflows.

## Roadmap

### Phase 1 --- Stabilize the current application

-   [ ] Fix business/resource ownership checks.
-   [ ] Review booking status update authorization.
-   [ ] Restrict admin registration and privileged operations.
-   [ ] Align frontend and backend authentication response contracts.
-   [ ] Complete missing business/admin routes and dashboard actions.
-   [ ] Resolve media upload contract mismatches.
-   [ ] Correct date and timezone handling.
-   [ ] Align frontend filters with supported backend queries.

### Phase 2 --- Expand the business domain

-   [ ] Introduce business documents and staff management.
-   [ ] Add multiple locations.
-   [ ] Separate venues from bookable facilities.
-   [ ] Add configurable sports, amenities, and facility availability.
-   [ ] Add pricing rules and maintenance blocks.

### Phase 3 --- Harden booking and payments

-   [ ] Implement slot holds and expiry handling.
-   [ ] Prevent double booking under concurrent requests.
-   [ ] Add server-side payment verification and webhook handling.
-   [ ] Add cancellation, rescheduling, refunds, and invoice workflows.
-   [ ] Add idempotency and payment reconciliation.

### Phase 4 --- Operations and growth

-   [ ] Add subscriptions, commissions, settlements, and payouts where
    required.
-   [ ] Add notifications, reviews, support, and audit logs.
-   [ ] Add analytics and monitoring.
-   [ ] Add CI/CD, backups, and disaster-recovery procedures.
-   [ ] Consider future features such as wallet, memberships, team
    bookings, tournaments, and coach bookings.

## Contributing

1.  Fork the repository.
2.  Create a feature branch.
3.  Keep changes focused and follow the existing code style.
4.  Test the affected flows locally.
5.  Open a pull request with a clear description of the changes.

## Author

**Hrushikesh Kapse**

-   GitHub: [Hrushi-00](https://github.com/Hrushi-00)
-   Project repository:
    [Turf_frontend](https://github.com/Hrushi-00/Turf_frontend)

------------------------------------------------------------------------

If you find an issue or have a suggestion, please open an issue in the
repository.
