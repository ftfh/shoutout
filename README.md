# Shoutout Booking Platform

A comprehensive, production-ready shoutout booking platform built with Next.js 15+ and Node.js 22+. Features three distinct role-based panels for Users, Creators, and Admins with complete functionality for managing shoutout bookings, payments, and content delivery.

## Features

### User Panel
- Secure registration and login with Cloudflare Turnstile protection
- Browse and search creators with advanced filtering
- Book shoutouts with crypto payments via NOWPayments
- Track order status and download completed shoutouts
- Manage profile and account settings

### Creator Panel
- Creator registration and customizable public profiles
- Comprehensive order management system
- Secure file upload and delivery system
- Earnings dashboard and withdrawal management
- Profile and shoutout offering management

### Admin Panel
- Secure admin access via private URL
- User and creator management with detailed analytics
- Order and payment oversight
- Withdrawal management and approval system
- Comprehensive activity logging and metrics
- Site settings and configuration management

## Technology Stack

- **Frontend & Backend**: Next.js 15+ with App Router
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT with role-based access control
- **Security**: Cloudflare Turnstile protection
- **Payments**: NOWPayments crypto integration
- **Storage**: DigitalOcean Spaces & Backblaze B2 Cloud Storage
- **Styling**: Tailwind CSS with shadcn/ui components

## Quick Start

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd shoutout-platform
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Fill in your environment variables
   ```

3. **Database Setup**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **First Time Admin Setup**
   - Navigate to `/admin` (this URL will be secured in production)
   - Create your first admin account on initial login

## Environment Variables

See `.env.example` for all required environment variables including:
- Database connection
- JWT secret key
- Cloudflare Turnstile keys
- NOWPayments API configuration
- Storage provider credentials (DigitalOcean Spaces or Backblaze B2)

## Database Schema

The platform uses a comprehensive database schema with the following main entities:
- **Users**: Customer accounts and profiles
- **Creators**: Creator accounts with earnings and settings
- **Orders**: Shoutout bookings and order management
- **Shoutouts**: Creator offerings and pricing
- **Withdrawals**: Creator payout requests and processing
- **Activity Logs**: Comprehensive audit trail (30-day retention)
- **Site Settings**: Admin-configurable platform settings

## Security Features

- JWT-based authentication with role separation
- Cloudflare Turnstile bot protection
- Secure password hashing with bcrypt
- Input validation with Zod schemas
- Activity logging for audit trails
- Secure file upload and delivery
- Payment verification and fraud protection

## API Routes

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/creators/register` - Creator registration
- `POST /api/creators/login` - Creator login
- `POST /api/admin/login` - Admin login

### Protected Routes
All user, creator, and admin routes are protected with JWT authentication and role-based access control.

## Production Deployment

1. Set up PostgreSQL database
2. Configure all environment variables
3. Run database migrations
4. Set up storage buckets (DigitalOcean Spaces or Backblaze B2)
5. Configure Cloudflare Turnstile
6. Set up NOWPayments account
7. Deploy to your preferred hosting platform

## Contributing

This is a production-ready platform designed for scalability and maintainability. The codebase follows industry best practices with:
- Modular architecture
- Comprehensive error handling
- Type safety with TypeScript
- Database migrations for safe schema updates
- Activity logging for compliance and debugging

## License

[Your License Here]