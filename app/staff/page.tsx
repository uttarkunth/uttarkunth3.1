import { redirect } from 'next/navigation';
import { resolveFounderOrAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function StaffPortalIndexPage() {
  const { user, isAdmin } = await resolveFounderOrAdminSession();

  if (user && isAdmin) {
    redirect('/admin/dashboard');
  }

  redirect('/staff/login');
}
