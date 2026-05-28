/*
  # GESTMAT - Enterprise Material Management System

  Creates the complete database schema for managing company equipment:
  
  ## Overview
  This migration sets up a comprehensive material management system with:
  - Employee management
  - Equipment/material inventory tracking
  - Loan/borrowing workflow with approval process
  - Breakdown/malfunction reporting
  
  ## Tables Created
  
  ### 1. employees
  Stores employee information for tracking who borrows equipment.
  - `id`: UUID primary key
  - `code`: Unique employee identifier (e.g., EMP001)
  - `first_name`: Employee first name
  - `last_name`: Employee last name
  - `email`: Unique email address
  - `phone`: Phone number
  - `user_id`: Optional link to Supabase auth user
  - `is_admin`: Boolean flag for admin privileges
  - `created_at`: Record creation timestamp
  
  ### 2. materials
  Tracks all company equipment/assets.
  - `id`: UUID primary key
  - `code`: Unique material identifier (e.g., MAT001)
  - `serial_number`: Device serial number
  - `name`: Material/equipment name
  - `quantity`: Total quantity owned
  - `available_quantity`: Currently available for borrowing
  - `acquisition_date`: When the item was acquired
  - `status`: Current state (available, borrowed, broken)
  - `image_url`: Optional equipment image
  - `created_at`: Record creation timestamp
  
  ### 3. loans (emprunts)
  Tracks equipment borrowing requests and returns.
  - `id`: UUID primary key
  - `material_id`: Reference to borrowed material
  - `employee_id`: Reference to borrowing employee
  - `quantity`: Number of items borrowed
  - `borrow_date`: When the loan started
  - `return_date`: Expected or actual return date
  - `status`: Request status (pending, approved, rejected, returned)
  - `notes`: Optional notes about the loan
  - `created_at`: Record creation timestamp
  
  ### 4. breakdowns (pannes)
  Tracks equipment malfunctions and issues.
  - `id`: UUID primary key
  - `material_id`: Reference to malfunctioning material
  - `description`: Description of the breakdown/issue
  - `reported_by`: Employee who reported the issue
  - `status`: Issue status (reported, in_progress, resolved)
  - `resolved_at`: When the issue was resolved
  - `created_at`: Record creation timestamp
  
  ## Security (RLS)
  - All tables have Row Level Security enabled
  - Policies restrict data access to authenticated users
  - Employees can only view their own loans and reports
  - Admins have full access to all data
  
  ## Important Notes
  1. UUID primary keys for secure, distributed identification
  2. Foreign key constraints ensure data integrity
  3. Automatic timestamps for audit trail
  4. Status enums for workflow management
  5. Cascade deletes for cleanup
*/

-- Create ENUM types for better data integrity
CREATE TYPE material_status AS ENUM ('available', 'borrowed', 'broken');
CREATE TYPE loan_status AS ENUM ('pending', 'approved', 'rejected', 'returned');
CREATE TYPE breakdown_status AS ENUM ('reported', 'in_progress', 'resolved');

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Materials table
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  serial_number TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  available_quantity INTEGER NOT NULL DEFAULT 1,
  acquisition_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status material_status NOT NULL DEFAULT 'available',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_quantity CHECK (quantity >= 0 AND available_quantity >= 0),
  CONSTRAINT available_not_greater_than_total CHECK (available_quantity <= quantity)
);

-- Loans table
CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  borrow_date DATE NOT NULL DEFAULT CURRENT_DATE,
  return_date DATE,
  status loan_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_loan_quantity CHECK (quantity > 0)
);

-- Breakdowns table
CREATE TABLE IF NOT EXISTS breakdowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  reported_by UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  status breakdown_status NOT NULL DEFAULT 'reported',
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_employees_code ON employees(code);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_materials_code ON materials(code);
CREATE INDEX IF NOT EXISTS idx_materials_status ON materials(status);
CREATE INDEX IF NOT EXISTS idx_loans_material ON loans(material_id);
CREATE INDEX IF NOT EXISTS idx_loans_employee ON loans(employee_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_breakdowns_material ON breakdowns(material_id);
CREATE INDEX IF NOT EXISTS idx_breakdowns_status ON breakdowns(status);

-- Enable RLS on all tables
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE breakdowns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employees table
CREATE POLICY "Admins can view all employees"
  ON employees FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid() AND e.is_admin = true
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Admins can insert employees"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid() AND e.is_admin = true
    )
  );

CREATE POLICY "Admins can update employees"
  ON employees FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid() AND e.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid() AND e.is_admin = true
    )
  );

CREATE POLICY "Admins can delete employees"
  ON employees FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid() AND e.is_admin = true
    )
  );

-- RLS Policies for materials table
CREATE POLICY "Authenticated users can view materials"
  ON materials FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert materials"
  ON materials FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update materials"
  ON materials FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE user_id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can delete materials"
  ON materials FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- RLS Policies for loans table
CREATE POLICY "Users can view their own loans or admins view all"
  ON loans FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE user_id = auth.uid() AND is_admin = true
    )
    OR
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert loan requests"
  ON loans FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM employees WHERE user_id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update all loans"
  ON loans FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE user_id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can delete loans"
  ON loans FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- RLS Policies for breakdowns table
CREATE POLICY "Users can view relevant breakdowns"
  ON breakdowns FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE user_id = auth.uid() AND is_admin = true
    )
    OR
    reported_by IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can report breakdowns"
  ON breakdowns FOR INSERT
  TO authenticated
  WITH CHECK (
    reported_by IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update breakdowns"
  ON breakdowns FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE user_id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can delete breakdowns"
  ON breakdowns FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materials_updated_at
  BEFORE UPDATE ON materials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loans_updated_at
  BEFORE UPDATE ON loans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_breakdowns_updated_at
  BEFORE UPDATE ON breakdowns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert demo admin employee (this will be linked after auth)
INSERT INTO employees (code, first_name, last_name, email, phone, is_admin)
VALUES ('ADMIN', 'Admin', 'User', 'admin@gestmat.com', '+1 234 567 890', true)
ON CONFLICT (email) DO NOTHING;
