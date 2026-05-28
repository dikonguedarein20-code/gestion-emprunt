# GESTMAT - Enterprise Material Management System

A comprehensive material management application for tracking company equipment, managing loans, reporting breakdowns, and optimizing inventory.

## Features

### For Administrators
- **Dashboard**: Real-time statistics with visual charts showing material distribution
- **Employee Management**: Full CRUD operations for managing team members
- **Material Management**: Track inventory, quantities, and equipment status
- **Loan Management**: Approve or reject loan requests, track returns
- **Breakdown Reports**: Manage and resolve equipment issues

### For Employees
- **Browse Materials**: View all available equipment
- **Loan Requests**: Submit requests to borrow equipment
- **Report Issues**: Report equipment malfunctions or problems

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom animations
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth with email/password
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **Routing**: React Router v6

## Database Schema

### Tables

1. **employees**
   - `id`: UUID (Primary Key)
   - `code`: Unique employee identifier
   - `first_name`, `last_name`: Employee name
   - `email`: Unique email address
   - `phone`: Phone number
   - `user_id`: Link to Supabase auth user
   - `is_admin`: Admin privileges flag

2. **materials**
   - `id`: UUID (Primary Key)
   - `code`: Unique material identifier
   - `serial_number`: Equipment serial number
   - `name`: Equipment name
   - `quantity`: Total quantity owned
   - `available_quantity`: Currently available count
   - `status`: available | borrowed | broken
   - `acquisition_date`: Purchase date

3. **loans**
   - `id`: UUID (Primary Key)
   - `material_id`: Reference to material
   - `employee_id`: Reference to employee
   - `quantity`: Number of items borrowed
   - `borrow_date`: Loan start date
   - `return_date`: Expected/actual return date
   - `status`: pending | approved | rejected | returned

4. **breakdowns**
   - `id`: UUID (Primary Key)
   - `material_id`: Reference to material
   - `description`: Issue description
   - `reported_by`: Employee who reported
   - `status`: reported | in_progress | resolved
   - `resolved_at`: Resolution timestamp

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `.env`:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

### Demo Data

The application comes with pre-seeded demo data including:
- 12 sample equipment items
- 8 demo employees
- Sample loan requests in various states
- Sample breakdown reports

### Authentication

The app uses custom authentication with the following credentials:

**Admin:**
- Username: `admin`
- Password: `12345`

**Employees:**
- Username: Employee code (e.g., `EMP001`, `EMP002`)
- Password: `12345`

Session is stored in localStorage for persistence.

## Architecture

```
src/
├── components/          # Reusable UI components
│   ├── AdminLayout.tsx  # Admin dashboard layout with sidebar
│   └── UserLayout.tsx   # User dashboard layout with sidebar
├── contexts/            # React contexts for global state
│   ├── AuthContext.tsx  # Authentication state management
│   └── ToastContext.tsx # Notification system
├── lib/                 # Utility libraries
│   └── supabase.ts      # Supabase client configuration
├── pages/
│   ├── admin/          # Admin-only pages
│   │   ├── AdminDashboard.tsx
│   │   ├── EmployeesPage.tsx
│   │   ├── MaterialsPage.tsx
│   │   ├── LoansPage.tsx
│   │   └── BreakdownsPage.tsx
│   ├── user/           # Employee pages
│   │   ├── UserDashboard.tsx
│   │   ├── MakeRequestPage.tsx
│   │   └── ReportBreakdownPage.tsx
│   └── LandingPage.tsx # Public landing page
└── types/              # TypeScript type definitions
    └── database.ts     # Database types from Supabase
```

## Security

### Row Level Security (RLS)

All tables have RLS enabled with restrictive policies:
- Employees can only view their own loans and reports
- Admins have full access to all data
- Public material viewing for authenticated users
- Proper ownership checks on all operations

### Best Practices

- Never trust client-side data alone
- All sensitive operations verified server-side
- JWT tokens managed by Supabase Auth
- No direct database credentials in client code

## UI/UX Features

- Modern glassmorphism design
- Smooth animations and transitions
- Responsive design (mobile, tablet, desktop)
- Dark mode optimized
- Toast notifications for user feedback
- Loading states and error handling
- Pagination for large datasets
- Search and filter functionality
- Confirmation dialogs for destructive actions

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

### Code Style

- TypeScript strict mode enabled
- Functional components with hooks
- Clean, modular architecture
- Proper error handling
- Responsive design patterns

## License

MIT License - feel free to use this project for your own purposes.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## Support

For issues or feature requests, please open an issue in the repository.

---

Built with modern web technologies for efficient enterprise material management.
