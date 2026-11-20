import React from 'react';
import SellerDashboardPage from '@/app/seller/dashboard/page';

export const dynamic = 'force-dynamic';

export default async function SellerWorkspacePage(props: {
  searchParams?: { tab?: string };
}) {
  return <SellerDashboardPage searchParams={props.searchParams} />;
}