import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function LegacyHostCalendarRedirect() {
  redirect('/account/stays/host/calendar');
}
