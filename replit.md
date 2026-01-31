# School ERP System

## Overview

A production-grade School ERP (Enterprise Resource Planning) system built with the MERN stack. The application manages students, classes, attendance, assignments, fees, and user authentication for educational institutions. The system is designed to be stateless at the application layer, with all persistent data stored in an external MongoDB Atlas database to ensure data survives container restarts.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with Vite for fast development and optimized production builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Structure**: RESTful endpoints under `/api/` prefix
- **Authentication**: JWT-based stateless authentication with role-based access control (RBAC)
- **Roles**: admin, teacher, student, parent

### Data Layer
- **Primary Database**: MongoDB Atlas (cloud-hosted) via Mongoose ODM
- **Schema Definition**: Zod schemas in `shared/schema.ts` for validation and type safety
- **Legacy Config**: Drizzle config exists for PostgreSQL but MongoDB is the active database
- **Connection**: Environment variable `MONGODB_URI` for database connection string

### Shared Code
- **Location**: `shared/` directory contains schemas and route definitions
- **Schema Types**: User, Class, Section, Student, Attendance, Assignment, Submission, Fee
- **Route Contracts**: Type-safe API route definitions with Zod validation in `shared/routes.ts`

### Build System
- **Development**: tsx for running TypeScript directly, Vite dev server with HMR
- **Production**: esbuild for server bundling, Vite for client build
- **Output**: Server bundles to `dist/index.cjs`, client builds to `dist/public/`

### Key Design Decisions

1. **Stateless Application Layer**: Application code is treated as disposable; all business data persists in MongoDB Atlas. This allows container recreation without data loss.

2. **Monorepo Structure**: Single repository houses both client (`/client`) and server (`/server`) with clear separation and shared types.

3. **Type-Safe API Contracts**: Shared Zod schemas ensure frontend and backend stay in sync for request/response validation.

4. **JWT Authentication**: Tokens stored client-side, validated via middleware. Requires `JWT_SECRET` or `SESSION_SECRET` environment variable.

## External Dependencies

### Required Environment Variables
- `MONGODB_URI` - MongoDB Atlas connection string (required)
- `JWT_SECRET` or `SESSION_SECRET` - Secret key for JWT signing (required)
- `DATABASE_URL` - PostgreSQL URL (for Drizzle, may be unused if using MongoDB)

### Third-Party Services
- **MongoDB Atlas** - Cloud database for persistent storage
- **Replit Plugins** - Runtime error overlay, cartographer, and dev banner for development

### Key NPM Packages
- **Database**: mongoose, drizzle-orm, drizzle-kit
- **Authentication**: jsonwebtoken, bcrypt/bcryptjs
- **API**: express, cors
- **Validation**: zod, @hookform/resolvers
- **UI**: Full Radix UI primitive suite, recharts, lucide-react, framer-motion
- **Date Handling**: date-fns

## Recent Changes

### 2026-01-31: Frontend ERP Module Implementation
- Extended CRUD hooks in `client/src/hooks/`:
  - `use-classes.ts` - Full CRUD with create, update, delete mutations for classes and sections
  - `use-students.ts` - Full CRUD with student enrollment and update functionality
  - `use-fees.ts` - Fee creation and mark-as-paid functionality
- Implemented admin pages:
  - `client/src/pages/admin/classes.tsx` - Class management with sections dialog, add/edit/delete
  - `client/src/pages/admin/students.tsx` - Student enrollment with class/section selection, guardian info
  - `client/src/pages/admin/fees.tsx` - Fee records with status filtering, payment tracking, summary cards
- All pages include loading states, error handling, and toast notifications
- Student creation flow: Creates user account first via /api/auth/register, then student record

### 2026-01-28: Backend Authentication System Implementation
- Created `server/db.ts` for MongoDB Atlas connection management
- Rewrote `server/storage.ts` replacing MemStorage with Mongoose-based persistence
- Implemented full IStorage interface with Mongoose models for: User, Class, Section, Student, Attendance, Assignment, Submission, Fee
- Created authentication routes in `server/routes.ts`:
  - `POST /api/register` - User registration with password hashing
  - `POST /api/login` - JWT token generation on successful login
  - `GET /api/me` - Get current authenticated user
- Added JWT middleware for protected routes with role-based access control
- Added CORS support for frontend-backend communication
- All CRUD endpoints for classes, sections, students, attendance, assignments, submissions, and fees