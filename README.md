# Multi-Vendor E-Commerce Marketplace Backend

Welcome to the **Multi-Vendor Marketplace Backend** – a production-ready, role-based RESTful API built with **Node.js, Express, TypeScript, and Prisma ORM**.

This system supports multi-tenant seller storefronts, Stripe-based checkout and webhooks, return/refund/dispute workflows, delivery partner management, and admin governance tooling.

---

## Core Features

### Authentication & Security
- **Triple-Cookie Strategy:** `token` (24h), `accessToken` (15m), and `refreshToken` (7d) stored as `HttpOnly`, `SameSite: lax`, and `Secure` in production.
- **JWT-based RBAC:** Role-aware access middleware for `USER`, `ADMIN`, `SELLER`, and `DELIVERY`.
- **Timing-Attack Protection:** Dummy bcrypt hash used on login when a user is not found to keep response time consistent.
- **Security Middleware:** `helmet`, `cors`, `compression`, `cookie-parser`, rate limiting, and Zod request validation.
- **Global Error Handling:** Prisma-specific error mapping (`P2002`, `P2025`, validation errors) and JWT error normalization.

### Multi-Vendor Architecture
- Sellers apply for storefronts and manage isolated products, inventories, and sub-order fulfillments.
- `MasterOrder` / `SubOrder` / `SubOrderItem` structure for precise vendor routing and payouts.
- Seller-controlled sub-order status updates and delivery assignment.

### Cart, Checkout & Payments
- Strict cart and inventory-aware checkout flow.
- **Stripe Integration:** Dynamic checkout session creation with `maxNetworkRetries: 3` and configurable timeouts.
- **Stripe Webhooks:** Asynchronous order provisioning and processing via `POST /api/webhooks/stripe`.

### Returns, Refunds & Disputes
- Customers can raise return requests tied to sub-orders.
- Sellers resolve returns; admins process refunds.
- Dispute workflow with statuses (`OPEN`, `RESOLVED`, `CLOSED`) and admin adjudication.

### Delivery Management
- Delivery men register and maintain profiles.
- Sellers and admins assign delivery men to sub-orders.
- Delivery partners view assignments and update delivery status.

### Admin Governance
- Dashboard stats, user/seller/product/order/fulfillment oversight.
- Seller approval/rejection, product blocking/unblocking, user blocking/unblocking.
- Order cancellation and delivery assignment at platform level.
- Audit log querying for admin actions.

### Media & Content
- **Cloudinary:** Product and media image uploads with automatic optimization.
- **Page Content:** Public and admin-managed CMS-like page content routes.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 20+ |
| Language | TypeScript 5.x |
| Framework | Express.js 5 |
| Database ORM | Prisma ORM 7.8 |
| Database | PostgreSQL (Neon recommended) |
| Payments | Stripe SDK (API version `2026-6-18`) |
| Media | Cloudinary |
| Auth | JWT + Bcryptjs |
| Validation | Zod |
| Security | Helmet, CORS, Compression |
| Build | tsup (CJS, Node 20 target) |
| Dev | tsx watch |

---

## Project Structure

```
src/
  app.ts                      # Express app, middleware, route registration
  index.ts                    # HTTP server bootstrap
  prisma/
    client.ts                 # Prisma client singleton
  config/
    stripe.ts                 # Stripe client factory
    cloudinary.ts             # Cloudinary config + upload helpers
  redis.ts                    # Redis client stub (future caching / rate-limit store)
  middleware/
    authenticate.ts           # JWT extraction from cookies / Bearer header
    authorize.ts              # Role-based access control
    validation.ts             # Zod schema validation wrapper
    rateLimit.ts              # Rate limiting
    rawbody.ts                # Raw body parser for Stripe webhooks
    errorHandler.ts           # Global async error handler
    optionalAuthenticate.ts   # Optional authentication middleware
  utlits/
    ApiError.ts               # Structured API error class
    resPonse.ts               # Response helper utilities
  modules/
    auth/                     # Register, login, refresh, logout, profile
    user/                     # Get/update current user
    seller/                   # Seller application, profile, sub-order status
    product/                  # Product CRUD, my-products, listing
    category/                 # Category management
    cart/                     # Cart operations
    checkout/                 # Checkout initiation and success verification
    webhook/                  # Stripe webhook listener
    orders/                   # Customer order listing, details, receive order
    fulfillment/              # Fulfillment lifecycle
    review/                   # Product reviews
    refund/                   # Returns, refunds, disputes
    admin/                    # Admin stats, users, sellers, products, orders
    delivery/                 # Delivery partner registration and assignments
    pageContent/              # Public and admin page content
    auditLog/                 # Admin audit log retrieval
    Productview/              # Product view tracking
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database (local or Neon)
- Stripe account with secret and webhook keys
- Cloudinary account

### Environment Variables

Create a `.env` file in the project root:

```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@host:5432/neondb?schema=public

# JWT
JWT_SECRET=...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run generate

# Run database migrations
npm run migrate

# Start development server (hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Database Tooling

```bash
# Apply pending migrations
npx prisma migrate dev

# Open Prisma Studio
npm run studio

# Push schema without migration files
npm run push

# Pull schema from database
npm run pull
```

### Stripe Webhooks (Local Development)

```bash
npm run stripe:webhook
```

This forwards Stripe events to `http://localhost:5000/api/webhooks/stripe`.

---

## API Endpoints

Base path: `/api`

### Authentication
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/auth/register` | Public | Register a new user |
| POST | `/auth/login` | Public | Login and set auth cookies |
| POST | `/auth/refresh-token` | Public | Refresh access token |
| POST | `/auth/logout` | Authenticated | Clear auth cookies |
| GET | `/auth/me` | Authenticated | Current user profile |
| PATCH | `/auth/update-profile` | Authenticated | Update name/email |

### Users
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/users/me` | Authenticated | Get current user |
| PATCH | `/users/me` | Authenticated | Update current user |

### Sellers
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/sellers/apply` | Authenticated | Apply as seller |
| GET | `/sellers/profile` | Seller | Get seller profile |
| PATCH | `/sellers/sub-orders/:id/status` | Seller | Update sub-order status |
| PATCH | `/sellers/sub-orders/:id/assign-delivery` | Seller | Assign delivery man |

### Products
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/products` | Public | List products |
| GET | `/products/:id` | Public | Get product details |
| GET | `/products/my-products` | Seller/Admin | Seller's own products |
| POST | `/products` | Seller/Admin | Create product |
| PUT | `/products/:id` | Seller/Admin | Update product |

### Categories
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/categories` | Public | List categories |
| GET | `/categories/:id` | Public | Get category |
| POST | `/categories` | Admin | Create category |
| PUT | `/categories/:id` | Admin | Update category |
| DELETE | `/categories/:id` | Admin | Delete category |

### Cart
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/cart` | Authenticated | Get user cart |
| POST | `/cart` | Authenticated | Add item to cart |
| POST | `/cart/items` | Authenticated | Add item to cart |
| PUT | `/cart/items/:id` | Authenticated | Update item quantity |
| DELETE | `/cart/items/:id` | Authenticated | Remove cart item |
| DELETE | `/cart` | Authenticated | Empty cart |

### Checkout
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/checkout` | Authenticated | Initiate Stripe checkout |
| GET | `/checkout/success` | Authenticated | Verify successful checkout |

### Orders
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/orders` | Authenticated | Customer's orders |
| GET | `/orders/:id` | Authenticated | Order details |
| PATCH | `/orders/:id/receive` | Customer | Mark order as received |

### Fulfillments
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/fulfillments` | Authenticated | List fulfillments |
| POST | `/fulfillments` | Authenticated | Create fulfillment |
| PATCH | `/fulfillments/:id` | Authenticated | Update fulfillment |

### Reviews
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/reviews` | Public | List reviews |
| POST | `/reviews` | Authenticated | Create review |
| PATCH | `/reviews/:id` | Authenticated | Update review |
| DELETE | `/reviews/:id` | Authenticated | Delete review |

### Refunds & Disputes
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/refunds/returns` | Authenticated | Create return request |
| GET | `/refunds/my/returns` | Authenticated | My return requests |
| PATCH | `/refunds/returns/:id/resolve` | Seller | Resolve return |
| PATCH | `/refunds/returns/:id/refund` | Admin | Process refund |
| POST | `/refunds/disputes/:returnId` | Authenticated | Raise dispute |
| PATCH | `/refunds/disputes/:disputeId/resolve` | Admin | Resolve dispute |
| GET | `/refunds/seller/returns` | Seller | Seller returns |
| GET | `/refunds/admin/returns` | Admin | All returns |
| GET | `/refunds/admin/disputes` | Admin | All disputes |

### Admin
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/admin/stats` | Admin | Dashboard stats |
| GET | `/admin/users` | Admin | List users |
| PATCH | `/admin/users/:id/seller-status` | Admin | Approve/reject seller |
| PATCH | `/admin/users/:id/active` | Admin | Block/unblock user |
| GET | `/admin/products` | Admin | List products |
| PATCH | `/admin/products/:id/status` | Admin | Block/unblock product |
| DELETE | `/admin/products/:id` | Admin | Delete product |
| GET | `/admin/orders` | Admin | List orders |
| PATCH | `/admin/orders/:id/cancel` | Admin | Cancel order |
| GET | `/admin/fulfillments` | Admin | List fulfillments |
| PATCH | `/admin/sub-orders/:id/assign-delivery` | Admin | Assign delivery man |

### Delivery
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/delivery/register` | Public | Register as delivery man |
| GET | `/delivery/me` | Delivery | My profile |
| GET | `/delivery/my-assignments` | Delivery | My assignments |
| GET | `/delivery` | Admin | List delivery men |
| GET | `/delivery/approved` | Admin/Seller | Approved delivery men |
| PATCH | `/delivery/:id/status` | Admin | Update delivery status |
| DELETE | `/delivery/:id` | Admin | Delete delivery man |

### Page Content
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/page-content` | Public | Public page content |
| GET | `/page-content/:key` | Public | Page content by key |
| POST | `/page-content` | Admin | Create/update page content |
| GET | `/admin/page-content` | Admin | List all page content |
| DELETE | `/admin/page-content/:id` | Admin | Delete page content |

### Audit Logs
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/admin/audit-logs` | Admin | List audit logs with filters |

### Webhooks
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/api/webhooks/stripe` | Public (Stripe signature) | Stripe event handler |

---

## Middleware

- `authenticate`: Verifies JWT from `accessToken` / `token` cookies or `Authorization: Bearer` header.
- `authorize(...roles)`: Restricts route access to specified roles.
- `validation(schema)`: Validates `req.body`, `req.query`, or `req.params` against Zod schemas.
- `rateLimit(windowMs, max)`: Basic rate limiting.
- `rawBody`: Captures raw request body for Stripe signature verification.
- `errorHandler`: Final error-catching middleware with Prisma and JWT awareness.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Run production server |
| `npm run generate` | Generate Prisma client |
| `npm run migrate` | Run Prisma migrations |
| `npm run studio` | Open Prisma Studio |
| `npm run push` | Push schema to database |
| `npm run stripe:webhook` | Forward Stripe events to local server |
| `npm run lint` | Run ESLint |

---

## Notes

- The project targets **Node.js 20+**.
- Default server port is **5000**.
- Redis client is stubbed for future caching and rate-limit store integration.
- No automated test suite is configured at this time.
