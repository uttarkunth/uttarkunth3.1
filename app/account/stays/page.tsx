import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function AccountStaysPage() {
  redirect('/trips');
}
