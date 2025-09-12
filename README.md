# KidsToysBangladesh - E-commerce Website

A modern, fast, and SEO-optimized e-commerce website for selling kids toys in Bangladesh. Built with Next.js 15, featuring static site generation, real-time cart management, and integrated email notifications.

## 🌟 Features

- **Static Site Generation (SSG)** - Lightning-fast page loads with pre-rendered product pages
- **Modern Stack** - Next.js 15 with App Router, TypeScript, and Turbopack
- **Database Integration** - PostgreSQL with Drizzle ORM and Neon Database
- **Shopping Cart** - Advanced cart system with item selection and quantity management
- **Dual Checkout** - Both "Buy Now" direct purchase and traditional cart checkout
- **Email Notifications** - Automated order confirmations via Resend
- **Mobile Responsive** - Optimized for all devices
- **Bengali Language Support** - Multi-language content with custom fonts
- **SEO Optimized** - Comprehensive metadata, Open Graph, structured data
- **Social Integration** - WhatsApp and phone call integration for customer support

## 🚀 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS v4 with CSS Variables
- **UI Components**: shadcn/ui (New York style)
- **Database**: PostgreSQL with Neon Database
- **ORM**: Drizzle ORM
- **State Management**: Zustand
- **Form Handling**: React Hook Form with Zod validation
- **Email Service**: Resend
- **Package Manager**: pnpm

## 🏗️ Project Structure

```
kid/
├── app/                    # Next.js App Router pages
│   ├── api/orders/        # Order processing API
│   ├── cart/              # Shopping cart page
│   ├── checkout/          # Checkout flow
│   ├── product/[slug]/    # Dynamic product pages (SSG)
│   ├── layout.tsx         # Root layout with SEO metadata
│   ├── page.tsx           # Home page
│   ├── sitemap.ts         # Dynamic sitemap generation
│   └── robots.ts          # SEO robots.txt
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   ├── header.tsx        # Navigation header
│   ├── product-card.tsx  # Product display card
│   ├── structured-data.tsx # SEO structured data
│   └── ...
├── lib/                   # Core utilities and configurations
│   ├── db.ts             # Database connection
│   ├── schema.ts         # Database schema definitions
│   ├── store.ts          # Zustand state management
│   ├── email.ts          # Email templates and service
│   └── validations.ts    # Zod schemas
└── drizzle/              # Database migrations
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended package manager)
- PostgreSQL database (Neon recommended)
- Resend API key for emails

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kid
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   Create a `.env.local` file:
   ```env
   DATABASE_URL="postgresql://..."
   RESEND_API_KEY="re_..."
   RESEND_FROM_EMAIL="no-reply@yourdomain.com"
   ```

4. **Database Setup**
   ```bash
   # Generate and run migrations
   pnpm db:generate
   pnpm db:migrate
   
   # Seed initial admin user
   pnpm seed:admin
   
   # Optional: Seed with sample data
   # Use the sample-products.sql file to populate products
   ```

5. **Development Server**
   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📦 Build & Deploy

### Static Generation
```bash
pnpm build
```

This will:
- Pre-render all product pages as static HTML
- Generate optimized bundles
- Create sitemap.xml and robots.txt

### Production Deployment
The app is optimized for deployment on Vercel, Netlify, or any Node.js hosting platform.

**Environment Variables Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `RESEND_API_KEY` - For email notifications
- `RESEND_FROM_EMAIL` - Sender email address

## 🎯 Key Features Explained

### Product Management
- Products are stored in PostgreSQL with Drizzle ORM
- Handle-based URLs for SEO-friendly routing (`/product/toy-car`)
- Support for multiple images, pricing, and markdown descriptions

### Shopping Cart
- Persistent cart state with Zustand
- Item selection for partial checkout
- Quantity management with real-time updates
- Support for both cart-based and direct "Buy Now" purchases

### Order Processing
- Automated email notifications (customer + owner)
- Order tracking with unique IDs
- Integration with WhatsApp for customer support

### SEO Optimization
- Dynamic metadata generation for all pages
- Open Graph and Twitter Card support
- Structured data (JSON-LD) for rich snippets
- Dynamic sitemap generation
- Optimized robots.txt

## 🔧 Development Guidelines

- **Package Manager**: Always use `pnpm` (never npm or yarn)
- **Code Limits**: All files should be under 250 lines
- **Commit Messages**: Follow conventional commit format
- **TypeScript**: Strict mode enabled with proper typing

## 📝 Database Schema

### Products Table
- `id` - Primary key
- `handle` - URL-friendly unique identifier
- `name` - Product name (supports Bengali)
- `price` - Current selling price
- `comparePrice` - Original/compare price (optional)
- `tags` - JSON array of tags
- `images` - JSON array of image URLs
- `description` - Markdown-supported description

### Users Table (Admin Authentication)
- `id` - Primary key
- `username` - Admin username
- `hashedPassword` - Encrypted password
- `role` - User role (default: admin)
- `createdAt` - Account creation timestamp

### Sessions Table
- `id` - Session identifier
- `userId` - Reference to users table
- `expiresAt` - Session expiration
- `createdAt` - Session creation timestamp

## 🔐 Admin Access

**Default Admin Credentials:**
- **Username:** `admin`
- **Password:** `Admin12345&`

**Important Security Notes:**
- Change the default admin password immediately after first login
- Admin credentials are automatically seeded when running `pnpm seed:admin`
- Admin dashboard available at `/admin` (barebone layout)
- Admin login available at `/admin/login`

## 🤝 Contributing

1. Follow the existing code style and patterns
2. Ensure all files stay under 250 lines
3. Test thoroughly before committing
4. Use `pnpm` for all package operations

## 📄 License

This project is proprietary software for KidsToysBangladesh.

---

**Contact**: +8801735547173 | apu.sns@gmail.com

Built with ❤️ for kids and parents in Bangladesh. 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
