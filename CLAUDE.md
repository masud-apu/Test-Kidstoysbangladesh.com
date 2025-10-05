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

### Database Commands
- `pnpm db:generate`: Generate Drizzle migration files from schema changes
- `pnpm db:migrate`: Run database migrations
- `pnpm db:push`: Push schema directly to database (development only)
- `pnpm db:studio`: Open Drizzle Studio for database management

### Utility Scripts
- `pnpm import:csv`: Import products from CSV file (see scripts/import-csv.ts)
- `pnpm seed:admin`: Create/reset admin user with default credentials
- `pnpm reset:admin`: Reset admin password to default

## Project Architecture

KidsToysBangladesh.com is an e-commerce platform for kids' toys built with Next.js 15 App Router, featuring static site generation for optimal performance, admin dashboard for product/order management, and integrated email notifications.

### Tech Stack
- **Framework**: Next.js 15 with App Router and Turbopack
- **Language**: TypeScript with strict mode enabled
- **Styling**: TailwindCSS v4 with CSS variables
- **UI Components**: shadcn/ui components (New York style)
- **Database**: PostgreSQL (Neon Database) with Drizzle ORM
- **State Management**: Zustand (cart and UI state)
- **Forms**: React Hook Form with Zod validation
- **Email**: Resend for order confirmations and notifications
- **Storage**: Cloudflare R2 for PDF invoice storage
- **Analytics**: PostHog for product analytics
- **Icons**: Lucide React

### Database Schema (lib/schema.ts)

**Products Table**: Stores product catalog
- `handle`: URL-friendly slug for SEO
- `name`, `description`: Support Bengali/Bangla text
- `price`, `actualPrice`, `comparePrice`: Decimal pricing fields
- `quantity`, `completedOrders`: Inventory tracking
- `tags`, `images`: JSON arrays

**Orders Table**: Order management
- `orderId`: Unique order identifier (formatted)
- `status`: Order lifecycle (order_placed → confirmed → shipped → delivered)
- `customerName`, `customerEmail`, `customerPhone`, `customerAddress`: Customer details
- `itemsTotal`, `shippingCost`, `totalAmount`: Order totals
- `deliveryType`: 'inside' (Dhaka) or 'outside' (Dhaka)
- `promoCodeId`, `promoCode`, `promoCodeDiscount`: Promotional code support
- `invoiceUrl`, `paidReceiptUrl`: PDF document URLs (stored in R2)

**Order Items Table**: Line items for each order
- Stores product snapshot at time of order
- References both orders and products tables

**Promo Codes Table**: Discount code management
- `discountType`: 'percentage' or 'fixed'
- `isStoreWide` or `applicableProducts`: Scope control
- `usageLimit`, `usedCount`: Usage tracking
- `isActive`, `expiresAt`: Status and expiration

**Users & Sessions Tables**: Admin authentication
- Custom session-based auth (no external auth library)
- Password hashing with PBKDF2 via Web Crypto API
- See lib/auth.ts for authentication logic

### State Management Architecture

**Cart Store (lib/store.ts)**: Shopping cart using Zustand with persistence
- `items`: Cart items with quantities
- `selectedItems`: Item IDs selected for checkout (supports partial cart checkout)
- `directBuyItem`: Single-item "Buy Now" flow (bypasses cart)
- `deliveryType`: 'inside' or 'outside' Dhaka (affects shipping cost: 60 TK vs 120 TK)
- Key methods: `addToCart`, `updateQuantity`, `toggleItemSelection`, `setDirectBuy`

**UI Store (lib/ui-store.ts)**: Admin dashboard UI state
- Manages data table state, filters, and view preferences

### Authentication Flow (Admin Only)

1. User visits `/admin/*` routes
2. Middleware (middleware.ts) checks for session cookie
3. If no session → redirect to `/admin/login`
4. Login validates credentials via lib/auth.ts `authenticate()`
5. Session created with 7-day expiration
6. Session ID stored in HTTP-only cookie
7. Middleware injects user info into request headers for admin pages

Default admin credentials (change after first login):
- Username: `admin`
- Password: `Admin12345&`

### Email System (lib/email.ts)

Uses Resend API for transactional emails:
- **Order Confirmation**: Sent to customer + owner, includes PDF invoice attachment
- **Payment Confirmation**: Sent when order marked as paid, includes paid receipt PDF
- **Order Status Updates**: Sent on status changes (confirmed, shipped, delivered, etc.)

Email templates are inline HTML with responsive design and Bengali text support.

### PDF Generation (lib/pdf-generator.ts)

- Generates invoices and paid receipts using @react-pdf/renderer
- PDFs uploaded to Cloudflare R2 storage (lib/r2-storage.ts)
- Public URLs returned for email attachments and download links

### API Routes Structure

**Admin APIs** (`/api/admin/*`):
- `/admin/products`: CRUD operations for products
- `/admin/products/bulk-delete`: Delete multiple products
- `/admin/products/check-handle`: Validate unique product handles
- `/admin/products/import-csv`: Bulk import from CSV
- `/admin/orders`: Order management and status updates
- `/admin/orders/bulk-delete`: Delete multiple orders
- `/admin/promo-codes`: CRUD for promotional codes
- `/admin/account`: Admin account management

**Public APIs**:
- `/api/orders`: Create new customer orders (POST)
- `/api/products/bulk`: Fetch multiple products by IDs
- `/api/promo-codes/validate`: Validate promo code for checkout
- `/api/upload/image`: Image upload to Cloudinary

All admin routes protected by middleware session validation.

### Validation Layer (lib/validations/)

Zod schemas for type-safe validation:
- `product.ts`: Product creation/update schemas with handle validation
- `order.ts`: Order creation schema, status enum
- `promo-code.ts`: Promo code validation
- `validations.ts`: Shared schemas (cart items, customer info)

### Key Design Patterns

1. **Static Site Generation**: Product pages pre-rendered at build time for performance
2. **Dual Checkout Flow**: Both "Buy Now" (direct) and traditional cart checkout supported
3. **Optimistic Updates**: Admin dashboard uses optimistic UI updates for better UX
4. **Progressive Enhancement**: Core functionality works without JavaScript
5. **Internationalization Ready**: Bengali/Bangla text support throughout
6. **Mobile-First**: Responsive design prioritizing mobile users

### Relationship with Admin Dashboard

This frontend is a **separate application** from the admin dashboard:

**Shared (but duplicated - must keep in sync manually):**
- PostgreSQL database (all tables) - SAME database, different connections
- Drizzle ORM schema (lib/schema.ts) - **CRITICAL: Must be identical in both projects**
- Database utilities (lib/db.ts, lib/email.ts, lib/r2-storage.ts, lib/pdf-generator.ts)
- Validation schemas (lib/validations/)

**⚠️ IMPORTANT: When updating lib/schema.ts, you MUST update it in BOTH projects:**
- `/stuff/Study/projects/kids/Kidstoysbangladesh.com/lib/schema.ts`
- `/stuff/Study/projects/kids/admin/lib/schema.ts`

**⚠️ These files MUST be kept exactly the same in both projects:**
- `lib/schema.ts` - Database schema
- `lib/db.ts` - Database connection
- `lib/email.ts`, `lib/email-simple.ts` - Email services
- `lib/pdf-generator.ts`, `lib/invoice-pdf.tsx` - PDF generation
- `lib/r2-storage.ts` - File storage
- `lib/validations/` - All validation schemas

### Development Rules

- **Package Manager**: Always use pnpm (never npm or yarn)
- **Code Limits**: All code files must be under 250 lines
- **Reusability**: Reuse components and utilities whenever possible
- **Type Safety**: Use Zod for runtime validation, TypeScript for compile-time types
- **Database Changes**: Always generate migrations (don't use db:push in production)
- **Schema Sync**: When updating schema.ts or shared lib files, update BOTH projects