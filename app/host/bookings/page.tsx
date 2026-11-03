import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function LegacyHostBookingsRedirect() {
  redirect('/account/stays/host/bookings');
}
