import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function LegacyHostProfileRedirect() {
  redirect('/account/stays/host');
}
