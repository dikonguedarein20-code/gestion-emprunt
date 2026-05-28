/*
  # GESTMAT - Demo Data Seed

  Populates the database with sample data for demonstration purposes.
  
  ## Data Added
  
  ### 1. Demo Materials
  - 10 sample equipment items (laptops, printers, projectors, etc.)
  - Various statuses: available, borrowed, broken
  - Realistic serial numbers and quantities
  
  ### 2. Demo Employees
  - 5 sample employees for testing
  - Mix of regular employees and potential admin users
  - Realistic contact information
  
  ### 3. Demo Loans
  - Sample loan records in various states
  - pending, approved, and returned loans
  - Associated with demo employees and materials
  
  ### 4. Demo Breakdowns
  - Sample breakdown/issue reports
  - Various statuses for testing workflow
  
  ## Important Notes
  1. All demo users use the same password: 'password123'
  2. Materials include commonly borrowed equipment types
  3. Data is safe to modify or reset
  4. Employee codes follow EMP### format
  5. Material codes follow MAT### format
*/

-- Insert demo materials
INSERT INTO materials (code, serial_number, name, description, quantity, available_quantity, acquisition_date, status) VALUES
('MAT001', 'DELL-XPS-15-001', 'Dell XPS 15 Laptop', 'High-performance laptop with 16GB RAM and 512GB SSD', 5, 3, '2024-01-15', 'available'),
('MAT002', 'HP-LASER-002', 'HP LaserJet Pro Printer', 'Office printer with wireless connectivity', 3, 2, '2024-02-10', 'available'),
('MAT003', 'EPSON-PROJ-003', 'Epson Pro EX9220 Projector', 'Full HD projector with 3000 lumens', 2, 1, '2024-03-05', 'available'),
('MAT004', 'CANON-SCAN-004', 'Canon CanoScan Scanner', 'High-resolution flatbed scanner', 4, 4, '2024-01-20', 'available'),
('MAT005', 'CISCO-ROUTER-005', 'Cisco Router RV340', 'Dual WAN gigabit VPN router', 2, 1, '2024-02-28', 'borrowed'),
('MAT006', 'DELL-MON-006', 'Dell UltraSharp Monitor 27"', '4K UHD monitor with USB-C hub', 8, 6, '2024-03-15', 'available'),
('MAT007', 'LOGI-WEBCAM-007', 'Logitech C920 Webcam', 'Full HD webcam with stereo audio', 10, 5, '2024-04-01', 'available'),
('MAT008', 'APC-UPS-008', 'APC UPS 1500VA', 'Battery backup with surge protection', 2, 0, '2024-04-10', 'broken'),
('MAT009', 'APPLE-IPAD-009', 'Apple iPad Pro 12.9"', 'Tablet with Apple Pencil support', 6, 4, '2024-05-01', 'available'),
('MAT010', 'JBL-SPEAKER-010', 'JBL Portable Speaker', 'Bluetooth speaker for presentations', 4, 3, '2024-05-15', 'available'),
('MAT011', 'DELL-DESK-011', 'Dell Desktop Tower', 'Desktop PC with i7 processor, 32GB RAM', 3, 2, '2024-06-01', 'available'),
('MAT012', 'NETGEAR-SWITCH-012', 'Netgear 24-Port Switch', 'Gigabit managed network switch', 1, 1, '2024-06-15', 'available');

-- Insert demo employees (note: they need to register through auth first, but we'll create the employee records)
INSERT INTO employees (code, first_name, last_name, email, phone, password, is_admin) VALUES
('EMP001', 'Jean', 'Dupont', 'jean.dupont@example.com', '+33 1 23 45 67 89', 'password123', false),
('EMP002', 'Marie', 'Martin', 'marie.martin@example.com', '+33 1 98 76 54 32', 'password123', false),
('EMP003', 'Pierre', 'Bernard', 'pierre.bernard@example.com', '+33 6 12 34 56 78', 'password123', false),
('EMP004', 'Sophie', 'Petit', 'sophie.petit@example.com', '+33 6 87 65 43 21', 'password123', false),
('EMP005', 'Luc', 'Robert', 'luc.robert@example.com', '+33 1 11 22 33 44', 'password123', false),
('EMP006', 'Camille', 'Richard', 'camille.richard@example.com', '+33 6 55 44 33 22', 'password123', false),
('EMP007', 'Thomas', 'Durand', 'thomas.durand@example.com', '+33 1 44 55 66 77', 'password123', false),
('EMP008', 'Emma', 'Moreau', 'emma.moreau@example.com', '+33 6 11 11 22 22', 'password123', false)
ON CONFLICT (email) DO NOTHING;

-- Insert demo loans (we'll use first two employees and materials)
DO $$
DECLARE
  emp1_id UUID;
  emp2_id UUID;
  emp3_id UUID;
  mat1_id UUID;
  mat2_id UUID;
  mat3_id UUID;
  mat4_id UUID;
BEGIN
  SELECT id INTO emp1_id FROM employees WHERE email = 'jean.dupont@example.com';
  SELECT id INTO emp2_id FROM employees WHERE email = 'marie.martin@example.com';
  SELECT id INTO emp3_id FROM employees WHERE email = 'pierre.bernard@example.com';
  
  SELECT id INTO mat1_id FROM materials WHERE code = 'MAT001';
  SELECT id INTO mat2_id FROM materials WHERE code = 'MAT002';
  SELECT id INTO mat3_id FROM materials WHERE code = 'MAT003';
  SELECT id INTO mat4_id FROM materials WHERE code = 'MAT007';

  -- Pending loan
  IF emp1_id IS NOT NULL AND mat1_id IS NOT NULL THEN
    INSERT INTO loans (material_id, employee_id, quantity, borrow_date, return_date, status)
    VALUES (mat1_id, emp1_id, 1, CURRENT_DATE, CURRENT_DATE + 7, 'pending');
  END IF;

  -- Approved loan
  IF emp2_id IS NOT NULL AND mat2_id IS NOT NULL THEN
    INSERT INTO loans (material_id, employee_id, quantity, borrow_date, return_date, status)
    VALUES (mat2_id, emp2_id, 1, CURRENT_DATE - 5, CURRENT_DATE + 2, 'approved');
  END IF;

  -- Returned loan
  IF emp3_id IS NOT NULL AND mat3_id IS NOT NULL THEN
    INSERT INTO loans (material_id, employee_id, quantity, borrow_date, return_date, status)
    VALUES (mat3_id, emp3_id, 1, CURRENT_DATE - 20, CURRENT_DATE - 10, 'returned');
  END IF;

  -- Another pending
  IF emp1_id IS NOT NULL AND mat4_id IS NOT NULL THEN
    INSERT INTO loans (material_id, employee_id, quantity, borrow_date, return_date, status)
    VALUES (mat4_id, emp1_id, 2, CURRENT_DATE + 1, CURRENT_DATE + 8, 'pending');
  END IF;
END $$;

-- Insert demo breakdowns
DO $$
DECLARE
  emp1_id UUID;
  emp2_id UUID;
  mat_broken_id UUID;
  mat_avail_id UUID;
BEGIN
  SELECT id INTO emp1_id FROM employees WHERE email = 'jean.dupont@example.com';
  SELECT id INTO emp2_id FROM employees WHERE email = 'sophie.petit@example.com';
  SELECT id INTO mat_broken_id FROM materials WHERE code = 'MAT008';
  SELECT id INTO mat_avail_id FROM materials WHERE code = 'MAT001';

  -- Reported breakdown (already broken)
  IF emp1_id IS NOT NULL AND mat_broken_id IS NOT NULL THEN
    INSERT INTO breakdowns (material_id, description, reported_by, status)
    VALUES (mat_broken_id, 'Battery backup not working. Device does not turn on after power outage.', emp1_id, 'reported');
  END IF;

  -- In progress breakdown
  IF emp2_id IS NOT NULL AND mat_avail_id IS NOT NULL THEN
    INSERT INTO breakdowns (material_id, description, reported_by, status)
    VALUES (mat_avail_id, 'Laptop screen flickering intermittently. Issue started yesterday during video call.', emp2_id, 'in_progress');
  END IF;

  -- Resolved breakdown
  IF emp1_id IS NOT NULL AND mat_avail_id IS NOT NULL THEN
    INSERT INTO breakdowns (material_id, description, reported_by, status, resolved_at)
    VALUES (mat_avail_id, 'Previous issue with keyboard - some keys not responding. Fixed by cleaning.', emp1_id, 'resolved', CURRENT_DATE - 30);
  END IF;
END $$;
