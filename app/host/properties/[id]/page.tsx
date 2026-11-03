import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface LegacyProps {
  params: { id: string };
}

export default function LegacyHostPropertyDetailRedirect({ params }: LegacyProps) {
  redirect(`/account/stays/host/properties/${params.id}`);
}
