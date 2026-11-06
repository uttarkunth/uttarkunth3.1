-- Migration: 20261106150000_founder_private_admins_and_platform_staff.sql
-- Purpose:
-- 1. Lock down public.platform_admins strictly to Founder (uttarkunth@gmail.com).
-- 2. Create clean public.platform_staff table with 4 departments: stays, productions, products, community.

-- 1. Lock down platform_admins to Founder only
ALTER TABLE IF EXISTS public.platform_admins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_admins FROM anon;
REVOKE ALL ON public.platform_admins FROM public;
GRANT SELECT ON public.platform_admins TO authenticated;

DROP POLICY IF EXISTS "founder_only_select" ON public.platform_admins;
DROP POLICY IF EXISTS "Founder strict access" ON public.platform_admins;
DROP POLICY IF EXISTS "service_and_definer_internal_access" ON public.platform_admins;

CREATE POLICY "service_and_definer_internal_access" ON public.platform_admins
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "founder_only_access" ON public.platform_admins
  FOR ALL TO authenticated
  USING (
    auth.jwt()->>'email' = 'uttarkunth@gmail.com' 
    OR auth.uid() = user_id
  )
  WITH CHECK (
    auth.jwt()->>'email' = 'uttarkunth@gmail.com'
  );

-- 2. Clean platform_staff table for operational staff across 4 departments
CREATE TABLE IF NOT EXISTS public.platform_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  department text NOT NULL CHECK (department IN ('stays', 'productions', 'products', 'community')),
  designation text NOT NULL DEFAULT 'Staff Associate',
  assigned_duties text,
  permissions text[] NOT NULL DEFAULT '{}'::text[],
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookup by email and department
CREATE INDEX IF NOT EXISTS idx_platform_staff_email ON public.platform_staff(email);
CREATE INDEX IF NOT EXISTS idx_platform_staff_dept ON public.platform_staff(department);

-- Enable Row Level Security
ALTER TABLE public.platform_staff ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_staff FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_staff TO authenticated;

-- Founder has full administrative access over all staff
DROP POLICY IF EXISTS "founder_full_access_platform_staff" ON public.platform_staff;
CREATE POLICY "founder_full_access_platform_staff" ON public.platform_staff
  FOR ALL TO authenticated
  USING (
    auth.jwt()->>'email' = 'uttarkunth@gmail.com'
    OR EXISTS (
      SELECT 1 FROM public.platform_admins pa 
      WHERE pa.user_id = auth.uid() AND pa.role = 'founder'
    )
  )
  WITH CHECK (
    auth.jwt()->>'email' = 'uttarkunth@gmail.com'
    OR EXISTS (
      SELECT 1 FROM public.platform_admins pa 
      WHERE pa.user_id = auth.uid() AND pa.role = 'founder'
    )
  );

-- Staff members can only view their own profile/duties
DROP POLICY IF EXISTS "staff_view_own_profile" ON public.platform_staff;
CREATE POLICY "staff_view_own_profile" ON public.platform_staff
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() 
    OR email = auth.jwt()->>'email'
  );
