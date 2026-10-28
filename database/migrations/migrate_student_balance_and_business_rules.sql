-- Migration: Add balance to students and support tuition wallet & business rules
ALTER TABLE students ADD COLUMN IF NOT EXISTS balance DECIMAL(14, 2) NOT NULL DEFAULT 0.00;
