import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireStaffPermission, recordStaffAuditLog } from '@/lib/staff-rbac';
import { validateFileMagicBytes } from '@/lib/seller-verification';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Check host authorization and listing status
    const { data: property, error: propErr } = await adminClient
      .from('properties')
      .select('id, host_id, photos, published, moderation_status, pending_changes')
      .eq('id', params.id)
      .single();

    if (propErr || !property) {
      return NextResponse.json({ ok: false, error: 'Property not found' }, { status: 404 });
    }

    const isOwner = property.host_id === user.id;
    let isStaffAuthorized = false;
    let staffActor: { staff_id: string | null; role_slug: string } | null = null;

    if (!isOwner) {
      const staffCheck = await requireStaffPermission('stays.properties.edit', {
        requireMfaAal2: true,
        requiredDepartment: 'stays',
      });
      if (staffCheck.authorized && staffCheck.staffProfile) {
        isStaffAuthorized = true;
        staffActor = {
          staff_id: staffCheck.staffProfile.staff_id,
          role_slug: staffCheck.staffProfile.role_slug,
        };
      }
    }

    let isAuthorized = isOwner || isStaffAuthorized;

    if (!isAuthorized) {
      const { data: coHost } = await (adminClient.from('property_hosts') as any)
        .select('id')
        .eq('property_id', params.id)
        .eq('user_id', user.id)
        .in('role', ['manager']) // Only primary host or manager can upload photos; co-host is read-only
        .maybeSingle();

      isAuthorized = !!coHost;
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { ok: false, error: 'Forbidden: Insufficient permissions to upload photographs.' },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ ok: false, error: 'No file provided' }, { status: 400 });
    }

    // Validate type and size
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid file format. Only JPEG, PNG, and WebP images are permitted.',
        },
        { status: 400 }
      );
    }

    const MAX_SIZE = 10 * 1024 * 1024; // Matches the property-photos bucket's 10 MB limit
    if (file.size <= 0 || file.size > MAX_SIZE) {
      return NextResponse.json(
        {
          ok: false,
          error: 'File size exceeds maximum allowed limit of 10MB.',
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Server-side binary magic-byte inspection (rejects HTML/SVG/EXE disguised with image Content-Type)
    const magicCheck = validateFileMagicBytes(new Uint8Array(buffer), file.type);
    if (!magicCheck.valid) {
      return NextResponse.json(
        {
          ok: false,
          error: magicCheck.error || 'File content does not match declared image format.',
        },
        { status: 400 }
      );
    }

    const safeName = file.name
      .replace(/\.\.+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(0, 80);
    const storagePath = `properties/${property.id}/${Date.now()}-${randomUUID()}-${safeName}`;

    const { error: uploadErr } = await adminClient.storage
      .from('property-photos')
      .upload(storagePath, buffer, {
        contentType: file.type,
        cacheControl: '31536000',
        upsert: false,
      });

    if (staffActor) {
      await recordStaffAuditLog({
        actorUserId: user.id,
        actorEmail: user.email,
        staffId: staffActor.staff_id,
        roleSlug: staffActor.role_slug,
        action: 'property_photo_uploaded_by_staff',
        targetType: 'property',
        targetId: String(property.id),
        afterState: { storage_path: storagePath },
      });
    }
    const isAdmin = isStaffAuthorized;

    if (uploadErr) {
      throw uploadErr;
    }

    const { data: { publicUrl } } = adminClient.storage
      .from('property-photos')
      .getPublicUrl(storagePath);

    const isLiveApproved = property.published === true && property.moderation_status === 'approved';
    const currentPhotos = Array.isArray(property.photos) ? (property.photos as string[]) : [];
    const updatedPhotos = [...currentPhotos, publicUrl];

    if (isLiveApproved && !isAdmin) {
      // Stage photo addition in pending_changes so live listing is not modified before moderation
      const existingPending = (property.pending_changes as any) || {};
      const stagedPhotos = [...(existingPending.photos || currentPhotos), publicUrl];
      const stagedPayload = {
        ...existingPending,
        photos: stagedPhotos,
      };

      const { error: updatePropErr } = await adminClient
        .from('properties')
        .update({
          pending_changes: stagedPayload,
          pending_changes_status: 'pending',
          pending_changes_admin_notes: null,
          pending_changes_submitted_at: new Date().toISOString(),
          moderation_notes: 'New property photographs staged for administrative review. The approved photos remain live until approval.',
          updated_at: new Date().toISOString()
        })
        .eq('id', property.id);

      if (updatePropErr) throw updatePropErr;

      return NextResponse.json({
        ok: true,
        staged: true,
        photo_url: publicUrl,
        message: 'Photograph uploaded and staged for administrative moderation before appearing live.',
        photos: currentPhotos // Live photos remain unmodified
      });
    } else {
      // Draft property or administrator upload: updates photos directly
      const { error: updatePropErr } = await adminClient
        .from('properties')
        .update({
          photos: updatedPhotos,
          updated_at: new Date().toISOString()
        })
        .eq('id', property.id);

      if (updatePropErr) throw updatePropErr;

      return NextResponse.json({
        ok: true,
        staged: false,
        photo_url: publicUrl,
        photos: updatedPhotos
      });
    }
  } catch (err: any) {
    console.error('Photo upload error:', err);
    return NextResponse.json({
      ok: false,
      error: err.message || 'Failed to upload photo'
    }, { status: 500 });
  }
}
