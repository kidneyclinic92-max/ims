# WareHouse.io - Inventory Management System

A comprehensive inventory management system built with Next.js, React, and TypeScript. This application provides a complete solution for tracking products, managing orders, generating reports, and analyzing inventory data.

## Features

### 📊 Dashboard
- Real-time overview of inventory statistics
- Visual charts and graphs for inventory analysis
- Low stock alerts
- Recent orders tracking
- Revenue overview

### 📦 Inventory Management
- Complete CRUD operations for inventory items
- Search, filter, and barcode/SKU scanning
- Low stock indicators
- Category organization
- Supplier and location management
- Min/Max stock levels with auto alerts
- Built-in compliance fields for age-restricted products

### 🔐 Authentication & Roles
- Secure login powered by JWTs
- Role-aware UI (Admin vs. Staff)
- Middleware protection for all dashboards
- Session handling with HttpOnly cookies

### 🛒 Orders Management
- Create and manage purchase orders
- Create and manage sales orders
- Order status tracking (Pending, Processing, Completed, Cancelled)
- Automatic inventory updates on order completion
- Order item management
- Customer and supplier tracking

### 📈 Reports & Analytics
- Revenue analytics
- Category breakdown
- Top selling items
- Order status distribution
- Monthly revenue trends
- JSON + CSV exports for inventory and orders

### ⚙️ Settings
- Company information configuration
- Notification preferences
- Auto-reorder settings
- Currency selection
- Data management tools

## Tech Stack

- **Framework**: Next.js 16
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **Icons**: Lucide React
- **State Management**: React Hooks with localStorage persistence
- **Auth**: Next.js Route Handlers, JWT (JOSE), bcryptjs

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm, yarn, pnpm, or bun package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd inventorymanagementsystem
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Demo credentials

- **Admin** — `admin / admin123`
- **Staff** — `staff / staff123`

## Project Structure

```
inventorymanagementsystem/
├── app/
│   ├── api/auth/           # Auth route handlers (login/logout/me)
│   ├── inventory/          # Inventory management page
│   ├── orders/             # Orders management page
│   ├── reports/            # Reports and analytics page
│   ├── settings/           # Settings page
│   ├── login/              # Public login page
│   ├── layout.tsx          # Root layout (with providers)
│   ├── page.tsx            # Dashboard page
│   └── globals.css         # Global styles
├── components/
│   ├── layout/             # Header & Sidebar
│   └── providers/          # Auth context provider
├── lib/
│   ├── auth.ts             # JWT helpers and types
│   ├── auth-users.ts       # Demo users + bcrypt auth
│   ├── export.ts           # CSV export helpers
│   ├── store.ts            # Data store and state management
│   └── types.ts            # TypeScript type definitions
└── public/                  # Static assets
```

## Data Storage

The application uses browser localStorage for data persistence. All inventory items and orders are stored locally in your browser. To backup your data:

1. Go to the Reports page
2. Use **JSON Export** for full backup or download **Inventory CSV / Orders CSV** for spreadsheets

## Key Features

### Inventory Management
- Add, edit, and delete inventory items
- Track quantities, prices, and costs
- Set minimum and maximum stock levels
- Organize by categories
- Barcode/SKU scanning and compliance controls

### Order Processing
- Create purchase orders (incoming inventory)
- Create sales orders (outgoing inventory)
- Automatic inventory quantity updates
- Order status management
- Customer and supplier tracking
- Fast item entry via scanner-ready input
- Compliance confirmation for age-restricted products

### Analytics
- Visual charts and graphs
- Revenue tracking
- Category analysis
- Top selling items
- Order statistics
- Export to CSV/JSON for external reporting

## Development

### Build for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Notes

- All data is stored locally in your browser's localStorage
- Data persists across browser sessions
- Export your data regularly for backup purposes
- The application includes sample data on first load
- Set an `AUTH_SECRET` environment variable in production to override the default JWT secret

## License

This project is private and proprietary.

## Support

For issues or questions, please contact the development team.
