import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function LegacyHostPropertiesRedirect() {
  redirect('/account/stays/host/properties');
}
