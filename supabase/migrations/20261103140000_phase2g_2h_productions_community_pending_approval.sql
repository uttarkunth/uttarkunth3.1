-- ============================================================================
-- UTTARKUNTH — PHASE 2G & 2H DATABASE SCHEMA (PENDING PRODUCTION APPROVAL)
-- Platform: Uttarkunth (https://uttarkunth.com)
-- Status: LOCAL PENDING APPROVAL — DO NOT RUN ON REMOTE PRODUCTION WITHOUT EXPLICIT PERMISSION
-- Modules:
--   1. Phase 2G: Filmmaker Profiles & Film Proposals (Creative Co-Productions)
--   2. Phase 2H: Community Initiatives, Participations & Oral Archive Stories
--   3. Phase 2I: In-Dashboard Activity & Notifications Hub
-- ============================================================================

-- 1. FILMMAKER PROFILES
CREATE TABLE IF NOT EXISTS public.filmmaker_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  location text NOT NULL,
  creative_role text NOT NULL CHECK (creative_role IN ('director', 'cinematographer', 'sound_recordist', 'editor', 'writer', 'researcher', 'other')),
  skills text[] NOT NULL DEFAULT '{}',
  portfolio_url text,
  bio text NOT NULL,
  collaboration_interests text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'in_discussion')),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. PRODUCTION PROPOSALS
CREATE TABLE IF NOT EXISTS public.production_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  filmmaker_id uuid REFERENCES public.filmmaker_profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('documentary', 'cultural_monologue', 'visual_essay', 'oral_history', 'environmental', 'other')),
  synopsis text NOT NULL,
  concept text NOT NULL,
  proposed_location text NOT NULL,
  cultural_relevance text NOT NULL,
  support_needed text[] NOT NULL DEFAULT '{}',
  estimated_budget numeric(12,2) CHECK (estimated_budget IS NULL OR estimated_budget >= 0),
  portfolio_links text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'revision_requested', 'rejected', 'in_production', 'completed')),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. COMMUNITY INITIATIVES (Grassroots Pillars)
CREATE TABLE IF NOT EXISTS public.community_initiatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  category text NOT NULL,
  valley text NOT NULL,
  location text NOT NULL,
  tagline text NOT NULL,
  description text NOT NULL,
  objectives text[] NOT NULL DEFAULT '{}',
  outcomes text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'upcoming', 'archived', 'planning')),
  cohort_schedule text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. COMMUNITY PARTICIPATIONS (Residencies & Fellowships)
CREATE TABLE IF NOT EXISTS public.community_participations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  initiative_slug text NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  skills text NOT NULL,
  duration text NOT NULL,
  motivation text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'completed')),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. COMMUNITY STORIES (Oral Archive & Field Chronicles)
CREATE TABLE IF NOT EXISTS public.community_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text NOT NULL,
  author_role text NOT NULL,
  village text NOT NULL,
  valley text NOT NULL,
  title text NOT NULL,
  excerpt text NOT NULL,
  content text NOT NULL,
  consent_given boolean NOT NULL DEFAULT false CHECK (consent_given = true),
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'published', 'rejected')),
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6. USER NOTIFICATIONS (Activity Hub)
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pillar text NOT NULL CHECK (pillar IN ('stays', 'products', 'productions', 'community', 'system')),
  title text NOT NULL,
  message text NOT NULL,
  action_url text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_filmmaker_profiles_user ON public.filmmaker_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_production_proposals_user ON public.production_proposals(user_id);
CREATE INDEX IF NOT EXISTS idx_production_proposals_status ON public.production_proposals(status);
CREATE INDEX IF NOT EXISTS idx_community_initiatives_slug ON public.community_initiatives(slug);
CREATE INDEX IF NOT EXISTS idx_community_participations_user ON public.community_participations(user_id);
CREATE INDEX IF NOT EXISTS idx_community_stories_status ON public.community_stories(status);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON public.user_notifications(user_id, read);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.filmmaker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES

-- Filmmaker Profiles
CREATE POLICY "filmmaker_select_own_or_admin" ON public.filmmaker_profiles
  FOR SELECT TO authenticated, anon
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    public.is_platform_admin()
  );

CREATE POLICY "filmmaker_insert_own_or_admin" ON public.filmmaker_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id OR
    public.is_platform_admin()
  );

CREATE POLICY "filmmaker_update_own_or_admin" ON public.filmmaker_profiles
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id OR
    public.is_platform_admin()
  );

-- Production Proposals
CREATE POLICY "proposals_select_own_or_admin" ON public.production_proposals
  FOR SELECT TO authenticated, anon
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    public.is_platform_admin()
  );

CREATE POLICY "proposals_insert_own_or_admin" ON public.production_proposals
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id OR
    public.is_platform_admin()
  );

CREATE POLICY "proposals_update_admin_only" ON public.production_proposals
  FOR UPDATE TO authenticated
  USING (public.is_platform_admin());

-- Community Initiatives
CREATE POLICY "initiatives_select_public" ON public.community_initiatives
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "initiatives_admin_all" ON public.community_initiatives
  FOR ALL TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- Community Participations
CREATE POLICY "participations_select_own_or_admin" ON public.community_participations
  FOR SELECT TO authenticated, anon
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    public.is_platform_admin()
  );

CREATE POLICY "participations_insert_any" ON public.community_participations
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "participations_update_admin" ON public.community_participations
  FOR UPDATE TO authenticated
  USING (public.is_platform_admin());

-- Community Stories
CREATE POLICY "stories_select_published_or_author" ON public.community_stories
  FOR SELECT TO anon, authenticated
  USING (
    status = 'published' OR
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    public.is_platform_admin()
  );

CREATE POLICY "stories_insert_consent_verified" ON public.community_stories
  FOR INSERT TO anon, authenticated
  WITH CHECK (consent_given = true);

CREATE POLICY "stories_update_admin" ON public.community_stories
  FOR UPDATE TO authenticated
  USING (public.is_platform_admin());

-- User Notifications
CREATE POLICY "notifications_select_own" ON public.user_notifications
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id OR
    public.is_platform_admin()
  );

CREATE POLICY "notifications_update_own" ON public.user_notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert_admin" ON public.user_notifications
  FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_admin());

-- TABLE PRIVILEGES
GRANT SELECT, INSERT, UPDATE ON public.filmmaker_profiles TO authenticated;
GRANT SELECT, INSERT ON public.production_proposals TO authenticated;
GRANT SELECT ON public.community_initiatives TO anon, authenticated;
GRANT SELECT, INSERT ON public.community_participations TO anon, authenticated;
GRANT SELECT, INSERT ON public.community_stories TO anon, authenticated;
GRANT SELECT, UPDATE ON public.user_notifications TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
