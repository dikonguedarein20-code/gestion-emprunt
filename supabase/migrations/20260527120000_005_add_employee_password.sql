-- Add support for employee passwords
ALTER TABLE employees
  ADD COLUMN password TEXT;

-- Seed existing employee rows with the demo password if not already set
UPDATE employees
SET password = 'password123'
WHERE password IS NULL;
