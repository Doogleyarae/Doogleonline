# DoogleOnline - Currency Exchange Platform

## Overview

DoogleOnline is a modern, full-stack currency exchange platform that enables users to exchange between multiple payment methods including mobile money, banking, and cryptocurrency options. The platform supports 11+ payment methods and provides real-time exchange rates with automated order processing.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state management
- **Form Management**: React Hook Form with Zod validation
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Real-time Communication**: WebSocket for live order updates
- **Session Management**: Connect-pg-simple for PostgreSQL session storage
- **Email Service**: Mock email service with extensible interface for production integrations

### Database Design
- **Orders Table**: Stores exchange transactions with status tracking
- **Contact Messages**: Customer inquiries and support requests
- **Exchange Rates**: Dynamic currency conversion rates managed by admin
- **Currency Limits**: Configurable min/max transaction amounts per currency pair
- **Users**: Admin authentication and role management

## Key Components

### Order Management System
- **Order Creation**: Generates unique order IDs and stores transaction details
- **Status Tracking**: Five-state workflow (pending → paid → processing → completed/cancelled)
- **Auto-completion**: 15-minute timer automatically completes paid orders
- **Real-time Updates**: WebSocket notifications for status changes

### Exchange Rate Engine
- **Dynamic Rates**: Admin-configurable exchange rates between all supported currencies
- **Rate Calculation**: Real-time conversion with transparent fee structure
- **Currency Limits**: Per-currency minimum and maximum transaction amounts

### Admin Dashboard
- **Order Management**: Update order statuses with automatic email notifications
- **Rate Management**: Configure exchange rates and currency limits
- **Analytics**: Comprehensive reporting on transactions and platform performance
- **Contact Management**: Handle customer inquiries efficiently

### User Experience Features
- **Form Memory**: Auto-save user input with opt-in data persistence
- **Scroll Memory**: Restore scroll positions when navigating between pages
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Real-time Notifications**: Live updates for order status changes

## Data Flow

1. **Order Creation**: User submits exchange request → System validates input and creates order → Email confirmation sent
2. **Payment Processing**: Admin marks order as paid → 15-minute processing timer starts → Auto-completion or manual intervention
3. **Real-time Updates**: Status changes trigger WebSocket notifications → Email notifications sent → UI updates automatically
4. **Rate Management**: Admin updates exchange rates → System recalculates conversions → New rates apply to subsequent orders

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection pooling
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form handling and validation
- **zod**: Runtime type validation
- **ws**: WebSocket implementation

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **date-fns**: Date manipulation utilities

### Development Tools
- **typescript**: Type safety across the entire stack
- **vite**: Fast development server and build tool
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production

## Deployment Strategy

### Replit Deployment
- **Auto-deployment**: Configured for Replit's autoscale deployment target
- **Database**: PostgreSQL module automatically provisioned
- **Environment**: Node.js 20 runtime with web and PostgreSQL modules
- **Build Process**: `npm run build` → `npm run start` for production

### Manual Deployment
- **Prerequisites**: Node.js 18+, PostgreSQL database
- **Database Setup**: `npm run db:push` for schema migration
- **Production Build**: Vite builds client, esbuild bundles server
- **Process Management**: Single Node.js process serving both API and static files

### Configuration
- **Environment Variables**: Database URL, admin credentials, optional SMTP settings
- **Security**: Session-based authentication for admin panel
- **Static Assets**: Served directly by Express in production

## Changelog

Changelog:
- June 13, 2025. Initial setup
- June 14, 2025. Complete admin dashboard integration with live exchange rates, balance management, and dynamic wallet addresses
- June 14, 2025. Implemented unified amount formatting system removing unnecessary decimal places
- June 14, 2025. Added balance tracking with automatic deduction on order creation

## User Preferences

Preferred communication style: Simple, everyday language.