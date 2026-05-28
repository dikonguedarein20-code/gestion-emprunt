/*
  # Simplify RLS for Demo System

  Changes RLS policies to work with anonymous access for demo purposes.
  This allows the custom localStorage-based authentication to work.

  ## Security Warning
  This removes authentication requirements from RLS policies.
  DO NOT use in production - this is for demo/development only.
*/

-- Disable RLS temporarily for demo
ALTER TABLE materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE loans DISABLE ROW LEVEL SECURITY;
ALTER TABLE breakdowns DISABLE ROW LEVEL SECURITY;

-- Re-enable with anonymous access policies
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE breakdowns ENABLE ROW LEVEL SECURITY;

-- Materials policies with anonymous access
CREATE POLICY "Allow anonymous read access on materials"
  ON materials FOR SELECT
  USING (true);

CREATE POLICY "Allow anonymous insert on materials"
  ON materials FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update on materials"
  ON materials FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete on materials"
  ON materials FOR DELETE
  USING (true);

-- Employees policies with anonymous access
CREATE POLICY "Allow anonymous read access on employees"
  ON employees FOR SELECT
  USING (true);

CREATE POLICY "Allow anonymous insert on employees"
  ON employees FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update on employees"
  ON employees FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete on employees"
  ON employees FOR DELETE
  USING (true);

-- Loans policies with anonymous access
CREATE POLICY "Allow anonymous read access on loans"
  ON loans FOR SELECT
  USING (true);

CREATE POLICY "Allow anonymous insert on loans"
  ON loans FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update on loans"
  ON loans FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete on loans"
  ON loans FOR DELETE
  USING (true);

-- Breakdowns policies with anonymous access
CREATE POLICY "Allow anonymous read access on breakdowns"
  ON breakdowns FOR SELECT
  USING (true);

CREATE POLICY "Allow anonymous insert on breakdowns"
  ON breakdowns FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update on breakdowns"
  ON breakdowns FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete on breakdowns"
  ON breakdowns FOR DELETE
  USING (true);
