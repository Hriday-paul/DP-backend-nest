# DigiMart

DigiMart is the backend for a digital product marketplace. It powers the sale and automated delivery of digital goods such as AI API keys (e.g. ChatGPT/OpenAI credits), Google storage upgrades, software licenses, subscriptions, gift codes, and similar products. It handles the catalog, orders, payments, inventory of deliverable items, and background fulfillment, all backed by a relational database for reliable state tracking.

## Overview

Digital products have different needs from physical goods: delivery must be instant, stock is made of unique items (keys, codes, accounts), and every order needs a clear audit trail. DigiMart handles this by treating each deliverable as a tracked inventory item, confirming payment through webhooks, and fulfilling orders in background jobs so the API stays fast and the delivery process can retry safely on failure.

## Key Features

- **Product Catalog**: Categories, products, and variants/plans (e.g. API credit tiers, 100GB / 200GB / 2TB storage plans) with pricing, descriptions, and availability.
- **Authentication & Accounts**: Registration, login, JWT-based sessions, role-based access (customer, admin, support).
- **Cart & Orders**: Create orders from one or more products, with a full status lifecycle (`PENDING → PAID → FULFILLING → DELIVERED / FAILED / REFUNDED`).
- **Secure Credential Storage**: Sensitive deliverables are encrypted at rest and only decrypted when delivered to the buyer.
- **Automated Delivery**: After payment, a background job assigns inventory, delivers the product (on-screen, email, or both), and updates the order. Products that need manual or API-based provisioning (e.g. storage upgrades) are routed to the matching fulfillment handler.
- **Job Queue Management**: Fulfillment, email delivery, order expiry, and cleanup run through BullMQ with retry logic, backoff strategies, and status tracking.
- **Order & Audit Trail**: Every order, payment event, inventory movement, and delivery attempt is persisted for support and dispute handling.
- **Admin Tools**: Manage products, bulk-upload inventory, view orders, issue refunds, and monitor low stock.
- **Scalable Architecture**: Decoupled API, worker, and storage concerns so each can scale independently.

## Technology Stack

| Layer | Technology |
|---|---|
| Backend Framework | [NestJS](https://nestjs.com/) — modular, TypeScript-based Node.js framework |
| ORM | [Prisma](https://www.prisma.io/) — type-safe database access and migrations |
| Database | [PostgreSQL](https://www.postgresql.org/) — users, products, inventory, orders, payments |
| Job Queue | [BullMQ](https://docs.bullmq.io/) — Redis-backed queue for fulfillment, emails, and scheduled tasks |
| Language | TypeScript |
| Queue Backend | Redis (required by BullMQ)