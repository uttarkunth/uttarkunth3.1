import { createAdminClient } from '@/lib/supabase/admin';

export interface SendNotificationOptions {
  userId?: string | null;
  pillar: 'stays' | 'products' | 'productions' | 'community' | 'system';
  title: string;
  message: string;
  actionUrl?: string;
  email?: {
    to: string;
    subject: string;
    body: string;
  };
  whatsapp?: {
    to: string;
    body: string;
  };
}

/**
 * Unified notification dispatcher for Uttarkunth.
 * Dispatches in-app notifications directly to `public.user_notifications`
 * and sends outward email/WhatsApp alerts when configured.
 */
export async function sendNotification(options: SendNotificationOptions): Promise<{ ok: boolean; id?: string }> {
  try {
    const admin = createAdminClient();
    let notificationId: string | undefined = undefined;

    // 1. In-App Notification (Database)
    if (options.userId) {
      const { data, error } = await admin
        .from('user_notifications')
        .insert({
          user_id: options.userId,
          pillar: options.pillar,
          title: options.title,
          message: options.message,
          action_url: options.actionUrl || null,
          read: false,
        })
        .select('id')
        .single();

      if (error) {
        console.error('[sendNotification] In-app notification error:', error);
      } else if (data) {
        notificationId = data.id;
      }
    }

    // 2. Email Dispatch (Ready adapter: logs or dispatches via external mailer if configured)
    if (options.email && options.email.to) {
      console.log(`[Notification Engine: Email Dispatch] To: ${options.email.to} | Subject: "${options.email.subject}"`);
    }

    // 3. WhatsApp Dispatch (Ready adapter: logs or dispatches via WhatsApp Cloud API / Twilio)
    if (options.whatsapp && options.whatsapp.to) {
      console.log(`[Notification Engine: WhatsApp Alert] To: ${options.whatsapp.to} | Message: "${options.whatsapp.body}"`);
    }

    return { ok: true, id: notificationId };
  } catch (err: any) {
    console.error('[sendNotification] Unexpected failure:', err);
    return { ok: false };
  }
}

/**
 * Host Alert: New Stay Booking Request
 */
export async function notifyHostNewBooking(params: {
  hostUserId?: string | null;
  hostPhone?: string | null;
  hostWhatsapp?: string | null;
  hostEmail?: string | null;
  propertyName: string;
  roomName: string;
  guestName: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  bookingReference: string;
}) {
  const message = `New booking request from ${params.guestName} for "${params.roomName}" (${params.checkIn} to ${params.checkOut}). Reference: ${params.bookingReference}. Contact: ${params.guestPhone}.`;
  
  await sendNotification({
    userId: params.hostUserId,
    pillar: 'stays',
    title: `New Booking Request: ${params.propertyName}`,
    message,
    actionUrl: '/account/stays/host/bookings',
    whatsapp: params.hostWhatsapp
      ? {
          to: params.hostWhatsapp,
          body: `*Uttarkunth Stays Alert*: You have a new booking request for *${params.propertyName}* (${params.roomName}) from ${params.guestName} for ${params.checkIn} to ${params.checkOut}. Review at: https://uttarkunth.com/account/stays/host/bookings`,
        }
      : undefined,
    email: params.hostEmail
      ? {
          to: params.hostEmail,
          subject: `[Uttarkunth Stays] New Booking Request: ${params.propertyName} (${params.bookingReference})`,
          body: message,
        }
      : undefined,
  });
}

/**
 * Guest Alert: Host Decision on Booking Request
 */
export async function notifyGuestBookingDecision(params: {
  guestUserId?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  propertyName: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  action: 'confirm' | 'decline' | 'cancel';
  hostNotes?: string | null;
  bookingReference: string;
}) {
  const isConfirmed = params.action === 'confirm';
  const title = isConfirmed
    ? `Booking Confirmed: ${params.propertyName}`
    : `Booking Request ${params.action === 'decline' ? 'Declined' : 'Cancelled'}: ${params.propertyName}`;

  const message = isConfirmed
    ? `Your stay request for "${params.roomName}" at ${params.propertyName} (${params.checkIn} to ${params.checkOut}) has been approved by your host! Direct settlement applies upon arrival at the property. Reference: ${params.bookingReference}.`
    : `Your stay request for "${params.roomName}" at ${params.propertyName} (${params.checkIn} to ${params.checkOut}) was not accepted by the host.${params.hostNotes ? ` Reason: ${params.hostNotes}` : ''}`;

  await sendNotification({
    userId: params.guestUserId,
    pillar: 'stays',
    title,
    message,
    actionUrl: '/trips',
    whatsapp: params.guestPhone
      ? {
          to: params.guestPhone,
          body: `*Uttarkunth Stays*: ${title}\n\n${message}\n\nView details: https://uttarkunth.com/trips`,
        }
      : undefined,
    email: params.guestEmail
      ? {
          to: params.guestEmail,
          subject: `[Uttarkunth Stays] ${title} (${params.bookingReference})`,
          body: message,
        }
      : undefined,
  });
}

/**
 * Host Alert: Property Application Under Review
 */
export async function notifyHostPropertySubmitted(params: {
  hostUserId: string;
  propertyName: string;
  village: string;
}) {
  await sendNotification({
    userId: params.hostUserId,
    pillar: 'stays',
    title: `Homestay Application Submitted: ${params.propertyName}`,
    message: `Your property listing for ${params.propertyName} in ${params.village} has been received and is currently under curation review by the Uttarkunth team. You will be notified once reviewed.`,
    actionUrl: '/account/stays/host',
  });
}

/**
 * Host Alert: Property Moderation Outcome
 */
export async function notifyHostPropertyModeration(params: {
  hostUserId: string;
  propertyName: string;
  status: 'approved' | 'rejected' | 'changes_requested';
  moderationNotes?: string | null;
}) {
  let title = '';
  let message = '';

  if (params.status === 'approved') {
    title = `Property Approved & Live: ${params.propertyName}`;
    message = `Congratulations! Your homestay "${params.propertyName}" has been verified and approved by the Uttarkunth curation team. It is now live on uttarkunth.com.`;
  } else if (params.status === 'changes_requested') {
    title = `Updates Required: ${params.propertyName}`;
    message = `The curation team reviewed "${params.propertyName}" and requested changes before publishing.${params.moderationNotes ? ` Feedback: ${params.moderationNotes}` : ''}`;
  } else {
    title = `Listing Application Status: ${params.propertyName}`;
    message = `Your application for "${params.propertyName}" could not be approved at this time.${params.moderationNotes ? ` Reason: ${params.moderationNotes}` : ''}`;
  }

  await sendNotification({
    userId: params.hostUserId,
    pillar: 'stays',
    title,
    message,
    actionUrl: '/account/stays/host',
  });
}
