# Multi-Vendor E-Commerce Marketplace Backend

Welcome to the **Multi-Vendor Marketplace Backend** – a highly scalable, enterprise-grade, and production-ready RESTful API built with **Node.js, Express, TypeScript, and Prisma ORM**. 

This system is architected to handle high concurrency (optimized for 3000+ concurrent requests) with robust role-based access control (RBAC), multi-tenant seller storefronts, real-time inventory safety locks, and automated payment/fulfillment workflows.

---

##  Core Features

###  Advanced Authentication & Security
* **Triple-Cookie Strategy:** Secure HttpOnly, SameSite, and Secure flags for `token`, `accessToken`, and `refreshToken`.
* **Security Mechanisms:** Built-in timing-attack protection via dummy hashing, global error protection (`headersSent` guard), and validation schema enforcement.

###  Multi-Vendor Architecture (Seller Dashboard)
* Sellers can provision and self-manage isolated storefronts, inventories, and products.
* Independent order routing and sub-order structures for precise vendor payouts.

### -Time Cart & High-Concurrency Checkout
* Strict inventory checks to avoid overselling under race conditions.
* **Stripe Integration:** Dynamic Checkout sessions with multi-network automated retries (`maxNetworkRetries: 3`) and lock-free execution.
* **Stripe Webhooks:** Safe asynchronous order provisioning and processing.

###  Admin Governance
* Platform-wide analytics, seller verification systems, product approval workflows, and roles override.

---

## Tech Stack

* **Runtime:** Node.js v18+
* **Language:** TypeScript 5.x+ (ESNext/Bundler compatible)
* **Framework:** Express.js
* **Database ORM:** Prisma ORM (PostgreSQL recommended)
* **Payment Gateway:** Stripe API (Latest 2026 Stable SDK)
* **Security:** JWT (JSON Web Tokens), Bcrypt.js, CORS

---

##  System Architecture & API Endpoints