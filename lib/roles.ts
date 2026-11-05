// ============================================================================
// UTTARKUNTH UNIFIED MEMBER CAPABILITY RESOLVER
// Capabilities are granted strictly by verified database records across pillars,
// NEVER by self-declared user_metadata.role at signup.
// ============================================================================

export interface MemberCapabilitySnapshot {
  userId: string | null;
  isAuthenticated: boolean;
  isMember: boolean;
  isHost: boolean;
  ownedPropertiesCount: number;
  cohostedPropertiesCount: number;
  isApprovedSeller: boolean;
  isPendingSeller: boolean;
  sellerStatus: string | null;
  isApprovedFilmmaker: boolean;
  isPendingFilmmaker: boolean;
  filmmakerStatus: string | null;
  isCommunityContributor: boolean;
  badges: string[];
}

export function evaluateMemberCapabilities(input: {
  userId?: string | null;
  ownedPropertiesCount?: number;
  cohostedPropertiesCount?: number;
  sellerStatus?: string | null;
  filmmakerStatus?: string | null;
  communityParticipationsCount?: number;
  communityStoriesCount?: number;
}): MemberCapabilitySnapshot {
  const isAuthenticated = Boolean(input.userId && input.userId.trim());
  const owned = Math.max(0, Number(input.ownedPropertiesCount || 0));
  const cohosted = Math.max(0, Number(input.cohostedPropertiesCount || 0));
  const isHost = isAuthenticated && (owned > 0 || cohosted > 0);

  const sellerStatus = input.sellerStatus || null;
  const isApprovedSeller = isAuthenticated && sellerStatus === 'approved';
  const isPendingSeller =
    isAuthenticated &&
    Boolean(sellerStatus && ['pending', 'under_review', 'info_requested'].includes(sellerStatus));

  const filmmakerStatus = input.filmmakerStatus || null;
  const isApprovedFilmmaker =
    isAuthenticated && Boolean(filmmakerStatus && ['approved', 'in_discussion'].includes(filmmakerStatus));
  const isPendingFilmmaker = isAuthenticated && filmmakerStatus === 'pending';

  const isCommunityContributor =
    isAuthenticated &&
    (Number(input.communityParticipationsCount || 0) > 0 ||
      Number(input.communityStoriesCount || 0) > 0);

  const badges: string[] = [];
  if (isAuthenticated) badges.push('Uttarkunth Member');
  if (isHost) badges.push('Verified Homestay Host');
  if (isApprovedSeller) badges.push('Verified Artisan / Seller');
  else if (isPendingSeller) badges.push('Seller Applicant');
  if (isApprovedFilmmaker) badges.push('Uttarkunth Filmmaker');
  else if (isPendingFilmmaker) badges.push('Filmmaker Applicant');
  if (isCommunityContributor) badges.push('Karmayog Contributor');

  return {
    userId: input.userId || null,
    isAuthenticated,
    isMember: isAuthenticated,
    isHost,
    ownedPropertiesCount: owned,
    cohostedPropertiesCount: cohosted,
    isApprovedSeller,
    isPendingSeller,
    sellerStatus,
    isApprovedFilmmaker,
    isPendingFilmmaker,
    filmmakerStatus,
    isCommunityContributor,
    badges,
  };
}

export async function resolveMemberCapabilities(
  userId?: string | null
): Promise<MemberCapabilitySnapshot> {
  if (!userId || !userId.trim()) {
    return evaluateMemberCapabilities({ userId: null });
  }

  try {
    const { createAdminClient } = await import('./supabase/admin');
    const adminClient = createAdminClient();

    const { count: ownedCount } = await adminClient
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .eq('host_id', userId);

    let assignedCount = 0;
    try {
      const { count } = await (adminClient.from('property_hosts') as any)
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
      assignedCount = count || 0;
    } catch {
      assignedCount = 0;
    }

    let sellerStatus: string | null = null;
    try {
      const { data: sellerRow } = await (adminClient.from('sellers') as any)
        .select('status')
        .eq('user_id', userId)
        .maybeSingle();
      if (sellerRow) sellerStatus = sellerRow.status;
    } catch {
      sellerStatus = null;
    }

    let filmmakerStatus: string | null = null;
    try {
      const { data: filmRow } = await (adminClient.from('filmmaker_profiles') as any)
        .select('status')
        .eq('user_id', userId)
        .maybeSingle();
      if (filmRow) filmmakerStatus = filmRow.status;
    } catch {
      filmmakerStatus = null;
    }

    let communityParticipationsCount = 0;
    try {
      const { count } = await (adminClient.from('community_participations') as any)
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
      communityParticipationsCount = count || 0;
    } catch {
      communityParticipationsCount = 0;
    }

    let communityStoriesCount = 0;
    try {
      const { count } = await (adminClient.from('community_stories') as any)
        .select('id', { count: 'exact', head: true })
        .eq('author_id', userId);
      communityStoriesCount = count || 0;
    } catch {
      communityStoriesCount = 0;
    }

    return evaluateMemberCapabilities({
      userId,
      ownedPropertiesCount: ownedCount || 0,
      cohostedPropertiesCount: assignedCount,
      sellerStatus,
      filmmakerStatus,
      communityParticipationsCount,
      communityStoriesCount,
    });
  } catch (err) {
    console.error('Failed to resolve member capabilities:', err);
    return evaluateMemberCapabilities({ userId });
  }
}
