# DoogleOnline - Currency Exchange Platform

A modern, full-stack currency exchange platform supporting multiple payment methods including mobile money, banking, and cryptocurrency options.

## Features

### Core Functionality
- **Multi-Currency Exchange**: Support for 11+ payment methods including Zaad, Sahal, EVC Plus, eDahab, Premier Bank, MoneyGo, TRX, TRC20, PEB20, and USDC
- **Real-time Exchange Rates**: Dynamic currency conversion with live rate updates
- **Order Management**: Complete order lifecycle from creation to completion
- **Order Tracking**: Track orders using unique order IDs
- **Email Notifications**: Automated confirmations and status updates

### Admin Features
- **Admin Dashboard**: Comprehensive order management and analytics
- **Exchange Rate Management**: Update and control currency rates
- **Order Status Control**: Update order statuses with automatic notifications
- **Analytics & Reporting**: Detailed insights into platform performance
- **Contact Management**: Handle customer inquiries efficiently

### User Experience
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Real-time Notifications**: Live updates for order status changes
- **Order History**: Complete transaction history with filtering and export
- **Professional UI**: Clean, modern interface with intuitive navigation

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS + shadcn/ui components
- **Real-time**: WebSocket for live updates
- **Forms**: React Hook Form with Zod validation
- **State Management**: TanStack Query for server state

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd doogleonline
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your database credentials and configuration.

4. **Run database migrations**
   ```bash
   npm run db:push
   ```

5. **Seed the database (optional)**
   ```bash
   npm run db:seed
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## Admin Access

Access the admin dashboard at `/admin/login` with the following credentials:
- **Username**: Doogle
- **Password**: Aa121322@Doogle143

> **Important**: These are secure production credentials. Do not share or change them without proper authorization.

## API Endpoints

### Public Endpoints
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:orderId` - Get specific order
- `POST /api/contact` - Submit contact form
- `GET /api/exchange-rates` - Get current exchange rates

### Admin Endpoints
- `POST /api/admin/login` - Admin authentication
- `PATCH /api/orders/:orderId/status` - Update order status
- `POST /api/exchange-rates` - Update exchange rates

## Database Schema

The application uses the following main entities:
- **Orders**: Store exchange transactions
- **Contact Messages**: Handle customer inquiries
- **Exchange Rates**: Manage currency conversion rates
- **Users**: Admin user management

## Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
Ensure all required environment variables are set:
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Set to 'production'
- `PORT`: Server port (default: 5000)

### Database Setup
1. Create a PostgreSQL database
2. Run migrations: `npm run db:push`
3. Optionally seed data: `npm run db:seed`

## Security Features

- Input validation using Zod schemas
- SQL injection prevention with parameterized queries
- XSS protection with proper data sanitization
- Secure admin authentication
- Environment variable protection

## Support

For support and inquiries, use the contact form within the application or reach out through the admin dashboard.

## License

This project is proprietary software. All rights reserved.