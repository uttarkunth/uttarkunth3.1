import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateFileMagicBytes } from '@/lib/seller-verification';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const ALLOWED_CATEGORIES = ['general', 'room', 'washroom', 'cover'] as const;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized. Please sign in to upload photos.' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const categoryInput = String(formData.get('category') || formData.get('kind') || 'general');
    const category = categoryInput === 'property' ? 'general' : categoryInput;

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: 'No file provided in form data.' }, { status: 400 });
    }

    if (!ALLOWED_CATEGORIES.includes(category as (typeof ALLOWED_CATEGORIES)[number])) {
      return NextResponse.json({ ok: false, error: 'Invalid photo category.' }, { status: 400 });
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Photo size must be between 1 byte and 10 MB. This file is ' +
            (file.size / (1024 * 1024)).toFixed(2) + ' MB.',
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const magicCheck = validateFileMagicBytes(buffer, file.type || undefined);
    if (!magicCheck.valid || !magicCheck.detectedMime || !ALLOWED_MIME_TYPES.includes(magicCheck.detectedMime)) {
      return NextResponse.json(
        {
          ok: false,
          error: magicCheck.error || 'Only genuine JPEG, PNG and WebP image files are accepted.',
        },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    const lastDot = file.name.lastIndexOf('.');
    const originalBaseName = lastDot > 0 ? file.name.slice(0, lastDot) : file.name;
    const safeBaseName = originalBaseName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60) || 'property-photo';
    const extension = MIME_EXTENSIONS[magicCheck.detectedMime];
    const storagePath = 'host-uploads/' + user.id + '/' + category + '/' +
      Date.now() + '-' + randomUUID() + '-' + safeBaseName + '.' + extension;

    const { error: uploadError } = await adminClient.storage
      .from('property-photos')
      .upload(storagePath, buffer, {
        contentType: magicCheck.detectedMime,
        cacheControl: '31536000',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ ok: false, error: 'Upload failed: ' + uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = adminClient.storage
      .from('property-photos')
      .getPublicUrl(storagePath);

    return NextResponse.json({
      ok: true,
      success: true,
      url: publicUrlData.publicUrl,
      path: storagePath,
      name: file.name,
      size: file.size,
      mimeType: magicCheck.detectedMime,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error during photo upload.';
    console.error('Error in photo upload route:', err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
