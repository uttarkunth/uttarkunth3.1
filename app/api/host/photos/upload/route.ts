import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB maximum
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg'];

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in to upload photos.' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const kind = (formData.get('kind') as string) || 'property'; // 'property', 'room', 'washroom'

    if (!file) {
      return NextResponse.json({ error: 'No file provided in form data.' }, { status: 400 });
    }

    // 1. Enforce JPEG format strictly
    const isJpeg = ALLOWED_MIME_TYPES.includes(file.type.toLowerCase()) || 
                   file.name.toLowerCase().endsWith('.jpg') || 
                   file.name.toLowerCase().endsWith('.jpeg');

    if (!isJpeg) {
      return NextResponse.json({
        error: 'Invalid file format. Only JPEG (.jpg) images are accepted. Do not upload PNG or RAW formats.',
      }, { status: 400 });
    }

    // 2. Enforce 5MB limit
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({
        error: `File is too large (${(file.size / (1024 * 1024)).toFixed(2)} MB). Maximum allowed size is 5 MB. Please compress via TinyJPG.com before uploading.`,
      }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const fileExt = 'jpg';
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const storagePath = `host-uploads/${user.id}/${kind}_${Date.now()}_${cleanFileName}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await adminClient.storage
      .from('property-photos')
      .upload(storagePath, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }

    const { data: publicUrlData } = adminClient.storage
      .from('property-photos')
      .getPublicUrl(storagePath);

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
      path: storagePath,
      name: file.name,
      size: file.size,
    });
  } catch (err: any) {
    console.error('Error in photo upload route:', err);
    return NextResponse.json({ error: err.message || 'Internal server error during upload.' }, { status: 500 });
  }
}
