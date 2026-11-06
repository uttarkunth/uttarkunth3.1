import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendNotification } from '@/lib/notifications';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      identityType,
      leadName,
      contactEmail,
      contactPhone,
      contactWhatsapp,
      village,
      district,
      ventureName,
      category,
      whyStarted,
      vision,
      karmayogAttachment,
      detailsWhenWhereWhyHow,
      voluntaryFundCommitment,
    } = body;

    if (!leadName || !contactPhone || !ventureName || !whyStarted) {
      return NextResponse.json(
        { error: 'Missing required fields: Name, Phone, Venture Name and Problem Statement are mandatory.' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const adminClient = createAdminClient();

    // Store in community_participations
    const structuredMotivation = JSON.stringify({
      identityType: identityType || 'individual',
      ventureName,
      category: category || 'Grassroots Innovation',
      location: `${village || 'Unknown Village'}, ${district || 'Himachal Pradesh'}`,
      whyStarted,
      vision,
      karmayogAttachment,
      detailsWhenWhereWhyHow,
      voluntaryFundCommitment: voluntaryFundCommitment || 'Self-determined share of profits',
      contactWhatsapp: contactWhatsapp || contactPhone,
    }, null, 2);

    const { error: insertError } = await adminClient
      .from('community_participations')
      .insert({
        user_id: user?.id || null,
        initiative_slug: 'uttarkunth-jari-community',
        full_name: leadName,
        email: contactEmail || 'community@uttarkunth.com',
        phone: contactPhone,
        skills: `Venture: ${ventureName} (${category})`,
        duration: identityType,
        motivation: structuredMotivation,
        status: 'pending_review',
        admin_notes: 'Submitted via Mountain Entrepreneur & Community Ecosystem Portal',
      });

    if (insertError) {
      console.warn('Database record warning in community submission:', insertError.message);
    }

    // Notify founder Gaurav Negi
    try {
      await sendNotification({
        pillar: 'community',
        title: `[New Community Venture] ${ventureName} - ${leadName}`,
        message: `Applicant: ${leadName} (${identityType})
Venture: ${ventureName} (${category})
Location: ${village}, ${district}
Contact: ${contactPhone} / ${contactEmail}
Why Started: ${whyStarted}
Karmayog Connection: ${karmayogAttachment}`,
        email: {
          to: 'uttarkunth@gmail.com',
          subject: `[New Community Venture] ${ventureName} - ${leadName}`,
          body: `Applicant: ${leadName} (${identityType})
Venture: ${ventureName} (${category})
Location: ${village}, ${district}
Contact: ${contactPhone} / ${contactEmail}
Why Started: ${whyStarted}
Karmayog Connection: ${karmayogAttachment}`,
        },
      });
    } catch (notifErr) {
      console.warn('Founder notification failed:', notifErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Your venture application has been submitted to the Uttarkunth Community Council. We will review your initiative and reach out via WhatsApp/Phone.',
    });
  } catch (err: any) {
    console.error('Error submitting community venture application:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to submit application. Please try again or reach out directly on WhatsApp.' },
      { status: 500 }
    );
  }
}
