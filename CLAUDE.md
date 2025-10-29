# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## CRITICAL: Project Separation

**THIS IS THE FRONTEND/CUSTOMER-FACING PROJECT ONLY. DO NOT MODIFY THE ADMIN PROJECT.**

This frontend is located at `/stuff/Study/projects/kids/Kidstoysbangladesh.com/`
The admin dashboard is at `/stuff/Study/projects/kids/admin/`

**NEVER create, modify, or suggest changes to files in `/stuff/Study/projects/kids/admin/`**
**ALL frontend/customer-facing work must be done in `/stuff/Study/projects/kids/Kidstoysbangladesh.com/` only**

## Development Commands

**IMPORTANT: Always use pnpm instead of npm for this project.**

### Core Commands
- `pnpm dev`: Start development server with Turbopack
- `pnpm build`: Build the project for production with Turbopack
- `pnpm start`: Start the production server
- `pnpm lint`: Run ESLint for code quality checks

**Note**: This frontend project has NO direct database access. All database operations are handled by the admin backend at `localhost:3001`. Database commands, utility scripts, and admin tools are located in the `/stuff/Study/projects/kids/admin/` project.

## Project Architecture

KidsToysBangladesh.com is an e-commerce platform for kids' toys built with Next.js 15 App Router, featuring static site generation for optimal performance. This is the **customer-facing frontend only** - all backend operations (database, email, file storage, admin dashboard) are handled by a separate admin backend server.

### Tech Stack
- **Framework**: Next.js 15 with App Router and Turbopack
- **Language**: TypeScript with strict mode enabled
- **Styling**: TailwindCSS v4 with CSS variables
- **UI Components**: shadcn/ui components (New York style)
- **Data Layer**: API client (lib/api-client.ts) - NO direct database access
- **State Management**: Zustand (cart and UI state)
- **Forms**: React Hook Form with Zod validation
- **Analytics**: PostHog for product analytics
- **Icons**: Lucide React

### API Communication

This frontend communicates with the admin backend via HTTP APIs:

- **Admin Backend URL**: `http://localhost:3001` (configurable via `NEXT_PUBLIC_ADMIN_API_URL`)
- **API Client**: `lib/api-client.ts` provides centralized functions (`apiGet`, `apiPost`, `apiPut`, `apiDelete`)
- **Next.js Rewrites**: `next.config.ts` proxies `/api/*` requests to admin backend to avoid CORS issues
- **Data Fetching**: Server components use `fetch()` with revalidation for SSG/ISR, client components use the API client

### Database Schema Reference

**IMPORTANT**: This frontend does NOT have direct database access. The schema is managed by the admin backend. The information below is for reference only to understand the data structures returned by API endpoints.

**Products Table**: Product catalog (accessed via `/api/products` endpoint)
- `handle`: URL-friendly slug for SEO
- `title`, `description`: Support Bengali/Bangla text
- `variants`: Product variants with price, compareAtPrice, inventory
- `tags`, `images`: Arrays of metadata

**Orders Table**: Order management (accessed via `/api/orders` endpoint)
- `orderId`: Unique order identifier (formatted)
- `status`: Order lifecycle (order_placed → confirmed → shipped → delivered)
- Customer details, shipping info, totals
- `deliveryType`: 'inside' (Dhaka 60 TK) or 'outside' (Dhaka 120 TK)

**Promo Codes**: Discount codes (accessed via `/api/promo-codes/validate` endpoint)
- `discountType`: 'percentage' or 'fixed'
- Validation returns discount amount and applicability

All database operations, email sending, PDF generation, and file storage are handled by the admin backend at `/stuff/Study/projects/kids/admin/`.

### State Management Architecture

**Cart Store (lib/store.ts)**: Shopping cart using Zustand with localStorage persistence
- `items`: Cart items with quantities
- `selectedItems`: Item IDs selected for checkout (supports partial cart checkout)
- `directBuyItem`: Single-item "Buy Now" flow (bypasses cart)
- `deliveryType`: 'inside' or 'outside' Dhaka (affects shipping cost: 60 TK vs 120 TK)
- Key methods: `addToCart`, `updateQuantity`, `toggleItemSelection`, `setDirectBuy`

**Note**: This is a customer-facing frontend with no authentication. Admin authentication and authorization are handled entirely by the admin backend at `/stuff/Study/projects/kids/admin/`.

### API Endpoints Used by Frontend

**IMPORTANT**: All API endpoints below are hosted by the admin backend at `localhost:3001`. The frontend accesses them via Next.js rewrites configured in `next.config.ts`.

**Public APIs** (used by customer-facing frontend):
- `GET /api/products` - Fetch products list (supports `?limit=` parameter)
- `GET /api/products/[handle]` - Fetch single product by handle
- `POST /api/orders` - Create new customer order
- `GET /api/orders/track?orderId=` - Track order status
- `POST /api/promo-codes/validate` - Validate promo code for checkout

**How API Calls Work**:
1. Frontend calls `apiPost('/api/orders', data)` using `lib/api-client.ts`
2. Next.js rewrite proxies to `http://localhost:3001/api/orders`
3. Admin backend processes request, interacts with database
4. Response returned to frontend
5. Frontend updates UI based on response

The admin backend handles all admin routes (`/api/admin/*`), database operations, email sending, PDF generation, and file storage.

### Client-Side Validation (lib/validations/)

Zod schemas for client-side form validation:
- `validations.ts`: Cart items, customer info, checkout form validation

Server-side validation is handled by the admin backend.

### Key Design Patterns

1. **API-Based Architecture**: Frontend has NO direct database access - all data via HTTP APIs
2. **Static Site Generation**: Product pages pre-rendered at build time using API data fetching
3. **Dual Checkout Flow**: Both "Buy Now" (direct) and traditional cart checkout supported
4. **Progressive Enhancement**: Core functionality works without JavaScript
5. **Internationalization Ready**: Bengali/Bangla text support throughout
6. **Mobile-First**: Responsive design prioritizing mobile users

### Relationship with Admin Backend

This frontend is a **completely separate application** from the admin backend:

**Frontend (this project):**
- Location: `/stuff/Study/projects/kids/Kidstoysbangladesh.com/`
- Purpose: Customer-facing e-commerce website
- Tech: Next.js 15 with App Router (static site generation)
- Data Access: HTTP APIs only (via `lib/api-client.ts`)
- Database: NO direct database connection
- Auth: None (public site)

**Admin Backend:**
- Location: `/stuff/Study/projects/kids/admin/`
- Purpose: Admin dashboard + API server
- Tech: Next.js 15 with database, email, file storage
- Data Access: Direct PostgreSQL access via Drizzle ORM
- Database: Full database access with migrations
- Auth: Session-based authentication for admin users

**Communication:**
- Frontend → Backend: HTTP requests via Next.js rewrites
- Backend → Frontend: JSON API responses
- No shared code between projects (separate node_modules, package.json, etc.)

**⚠️ CRITICAL RULES:**
1. **NEVER** create database files in frontend (`lib/db.ts`, `lib/schema.ts`, etc.)
2. **NEVER** import backend utilities in frontend (email, PDF, storage, etc.)
3. **ALWAYS** use API calls for data operations
4. **NEVER** modify files in `/stuff/Study/projects/kids/admin/` from frontend project
5. If you need data, create/use an API endpoint in the admin backend

### Development Rules

- **Package Manager**: Always use pnpm (never npm or yarn)
- **Code Limits**: All code files must be under 250 lines
- **Reusability**: Reuse components and utilities whenever possible
- **Type Safety**: Use Zod for runtime validation, TypeScript for compile-time types
- **API-First**: Never add database code to frontend - always use API endpoints from admin backend
- **Project Separation**: Work only in this frontend project, never modify `/stuff/Study/projects/kids/admin/`