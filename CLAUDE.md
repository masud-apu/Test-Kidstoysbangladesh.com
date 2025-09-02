# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**IMPORTANT: Always use pnpm instead of npm for this project.**

- `pnpm dev`: Start development server with Turbopack
- `pnpm build`: Build the project for production with Turbopack
- `pnpm start`: Start the production server
- `pnpm lint`: Run ESLint for code quality checks
- `pnpm db:generate`: Generate Drizzle migration files
- `pnpm db:migrate`: Run database migrations
- `pnpm db:push`: Push schema directly to database (development)
- `pnpm db:studio`: Open Drizzle Studio for database management

## Project Architecture

This is a Next.js 15 application using the App Router with TypeScript. The project is set up with modern tooling and follows current Next.js best practices.

### Tech Stack
- **Framework**: Next.js 15 with App Router and Turbopack
- **Language**: TypeScript with strict mode enabled
- **Styling**: TailwindCSS v4 with CSS variables
- **UI Components**: shadcn/ui components (New York style)
- **Database**: Drizzle ORM with Neon Database
- **State Management**: Zustand
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React

### Project Structure
- `app/`: Next.js App Router pages and layouts
- `components/ui/`: shadcn/ui components library
- `lib/`: Utility functions and shared logic
- `hooks/`: Custom React hooks

### Key Configurations
- **TypeScript**: Configured with Next.js plugin and path aliases (`@/*` maps to root)
- **ESLint**: Uses Next.js recommended config with TypeScript support
- **shadcn/ui**: Configured with New York style, RSC enabled, using Lucide icons
- **Tailwind**: Uses CSS variables for theming with neutral base color

### Database Setup
The project includes Drizzle ORM and Neon Database integration. Database schema and migrations should be managed through Drizzle Kit.

## E-commerce Project Requirements

### Functionality
- **Pages**: Home page (product listing), Product detail page, Checkout page
- **Performance**: Mostly static rendering, mobile-friendly, optimized for speed
- **Internationalization**: Bangla font support for multilingual content

### Product Schema
Products have the following fields:
- `id`: Unique identifier
- `name`: Product name (supports Bangla text)
- `price`: Current selling price
- `compare_price`: Original/compare price (for showing discounts)
- `tags`: Array of tags for categorization
- `images`: Array of product images
- `description`: Product description (supports Bangla text)

### Development Rules
- **Package Manager**: Always use pnpm (never npm or yarn)
- **Code Limits**: All code files must be under 250 lines
- **Reusability**: Reuse components whenever possible
- **Documentation**: Check documentation before implementation
- **State Management**: Use Zustand for cart and global state
- **Validation**: Use Zod for all data validation
- **Database**: PostgreSQL with Neon DB and Drizzle ORM