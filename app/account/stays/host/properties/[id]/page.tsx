import React from 'react';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { checkPropertyHostAccess, PREVIEW_HOST_PROPERTIES } from '@/lib/host';
import { PropertyEditor } from '@/components/host/property-editor';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface HostPropertyDetailPageProps {
  params: {
    id: string;
  };
}

export default async function HostPropertyDetailPage({
  params,
}: HostPropertyDetailPageProps) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const previewProperty = PREVIEW_HOST_PROPERTIES.find((p) => p.id === params.id);
  if (previewProperty) {
    return <PropertyEditor initialProperty={previewProperty} />;
  }

  const access = user
    ? await checkPropertyHostAccess(params.id, user.id)
    : { isAuthorized: false, role: null, property: undefined };

  if (!access.isAuthorized || !access.property) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#263D32]">Access Restricted</h2>
        <p className="text-xs text-[#665E52] leading-relaxed">
          You are not registered as an authorized host or co-host for this property. If you believe this is an error, please contact Uttarkunth administration.
        </p>
        <Link
          href="/account/stays/host/properties"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#263D32] text-[#FFFDF9] text-xs font-semibold rounded-xl shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to My Properties</span>
        </Link>
      </div>
    );
  }

  return <PropertyEditor initialProperty={access.property} />;
}
