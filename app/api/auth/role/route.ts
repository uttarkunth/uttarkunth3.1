import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkIsPlatformAdmin } from '@/lib/auth';
import {
  STAFF_ROLE_DEFINITIONS,
  resolveOperationalDepartment,
  type StaffRoleSlug,
} from '@/lib/staff-rbac-shared';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: true, isAdmin: false, staffProfile: null });
    }

    const isAdmin = await checkIsPlatformAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json({ ok: true, isAdmin: false, staffProfile: null });
    }

    let mfaAssuranceLevel: 'aal1' | 'aal2' = 'aal1';
    try {
      const { data: aalData } = await (supabase.auth as any).mfa.getAuthenticatorAssuranceLevel();
      if (aalData?.currentLevel === 'aal2') {
        mfaAssuranceLevel = 'aal2';
      }
    } catch {
      mfaAssuranceLevel = 'aal1';
    }

    const adminClient = createAdminClient();
    const { data: staffRow } = await (adminClient.from('staff_profiles' as any) as any)
      .select(
        'user_id, staff_id, full_legal_name, preferred_name, designation, department, role_slug, role_code, status, mfa_enrolled'
      )
      .eq('user_id', user.id)
      .maybeSingle();

    if (!staffRow) {
      return NextResponse.json({ ok: true, isAdmin: false, staffProfile: null });
    }

    const roleSlug = (staffRow.role_slug ||
      staffRow.role_code ||
      'operations_admin') as StaffRoleSlug;
    const roleDef =
      STAFF_ROLE_DEFINITIONS[roleSlug] || STAFF_ROLE_DEFINITIONS.operations_admin;
    const operationalDepartment = resolveOperationalDepartment(staffRow.department);

    return NextResponse.json({
      ok: true,
      isAdmin: true,
      isFounder: roleSlug === 'founder',
      mfaAssuranceLevel,
      staffProfile: {
        staff_id: staffRow.staff_id,
        full_name: staffRow.preferred_name || staffRow.full_legal_name || user.email,
        designation: staffRow.designation || roleDef.title,
        role: roleSlug,
        role_slug: roleSlug,
        role_title: roleDef.title,
        department: staffRow.department,
        operational_department: operationalDepartment,
        allowed_modules: roleDef.allowedModules,
        permissions: roleDef.permissions,
      },
    });
  } catch (err) {
    console.error('Failed to resolve user admin role:', err);
    return NextResponse.json({ ok: true, isAdmin: false, staffProfile: null });
  }
}
