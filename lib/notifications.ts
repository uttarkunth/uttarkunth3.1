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
 * Clean phone number to international E.164 without spaces/dashes (e.g. +919816012345 or 919816012345)
 */
export function cleanPhoneNumber(phone?: string | null): string {
  if (!phone) return '';
  let clean = phone.replace(/[^0-9+]/g, '');
  if (clean.startsWith('+')) clean = clean.substring(1);
  // Default to India country code 91 if 10 digits
  if (clean.length === 10) clean = '91' + clean;
  return clean;
}

/**
 * Generate direct WhatsApp Web / App Click-to-Chat URL
 */
export function getWhatsAppDirectUrl(phone: string, text: string): string {
  const cleaned = cleanPhoneNumber(phone);
  if (!cleaned) return '';
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`;
}

/**
 * Internal Notification Dispatcher
 * Records immutable record in notification_events table and optionally triggers Resend or WhatsApp Cloud API
 */
export async function sendNotification(options: SendNotificationOptions): Promise<{ ok: boolean; id?: string }> {
  try {
    const adminClient = createAdminClient();

    // 1. Persist notification event to database
    const { data, error } = await adminClient
      .from('notification_events')
      .insert({
        user_id: options.userId || null,
        pillar: options.pillar,
        channel: options.whatsapp ? 'whatsapp' : (options.email ? 'email' : 'in_app'),
        title: options.title,
        message: options.message,
        action_url: options.actionUrl || null,
        metadata: {
          email: options.email,
          whatsapp: options.whatsapp,
        },
        status: 'sent',
      })
      .select('id')
      .single();

    if (error) {
      console.warn('Failed to persist notification event to database:', error.message);
    }

    // 2. Dispatch Email via Resend if RESEND_API_KEY is configured
    if (options.email && process.env.RESEND_API_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || 'Uttarkunth <stays@uttarkunth.com>',
            to: options.email.to,
            subject: options.email.subject,
            html: options.email.body.replace(/\n/g, '<br />'),
          }),
        });
      } catch (emailErr) {
        console.error('Failed to dispatch external email:', emailErr);
      }
    }

    // 3. Dispatch WhatsApp via WhatsApp Cloud API if credentials are configured
    if (options.whatsapp && process.env.WHATSAPP_API_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
      try {
        const toClean = cleanPhoneNumber(options.whatsapp.to);
        if (toClean) {
          await fetch(`https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              recipient_type: 'individual',
              to: toClean,
              type: 'text',
              text: { body: options.whatsapp.body },
            }),
          });
        }
      } catch (waErr) {
        console.error('Failed to dispatch external WhatsApp message:', waErr);
      }
    }

    return { ok: true, id: data?.id };
  } catch (err) {
    console.error('sendNotification error:', err);
    return { ok: false };
  }
}

/**
 * Dispatch booking request notification to Host
 */
export async function notifyHostNewBooking(params: {
  hostUserId: string;
  hostPhone?: string | null;
  hostEmail?: string | null;
  propertyName: string;
  roomName: string;
  guestName: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  bookingRef: string;
  totalPrice: number;
}) {
  const title = `New Booking Request: ${params.bookingRef}`;
  const message = `Guest ${params.guestName} has requested ${params.roomName} at ${params.propertyName} from ${params.checkIn} to ${params.checkOut}. Total: ₹${params.totalPrice.toLocaleString('en-IN')}. Please accept or decline in your host portal.`;
  const actionUrl = `/account/stays/host`;

  const waBody = `*UTTARKUNTH STAYS — NEW BOOKING REQUEST*\n\n` +
    `Namaste! A new booking request has arrived for *${params.propertyName}*.\n\n` +
    `• Booking Ref: ${params.bookingRef}\n` +
    `• Room: ${params.roomName}\n` +
    `• Guest: ${params.guestName} (${params.guestPhone})\n` +
    `• Dates: ${params.checkIn} to ${params.checkOut}\n` +
    `• Total Amount: ₹${params.totalPrice.toLocaleString('en-IN')}\n\n` +
    `Please log in to your Host Dashboard to Accept or Decline:\n` +
    `https://uttarkunth.com/account/stays/host`;

  return sendNotification({
    userId: params.hostUserId,
    pillar: 'stays',
    title,
    message,
    actionUrl,
    email: params.hostEmail
      ? {
          to: params.hostEmail,
          subject: `[Uttarkunth] New Booking Request: ${params.bookingRef} — ${params.propertyName}`,
          body: message + `\n\nGuest Contact: ${params.guestPhone}\nView details: https://uttarkunth.com${actionUrl}`,
        }
      : undefined,
    whatsapp: params.hostPhone
      ? {
          to: params.hostPhone,
          body: waBody,
        }
      : undefined,
  });
}

/**
 * Dispatch booking confirmation / rejection notification to Guest
 */
export async function notifyGuestBookingDecision(params: {
  guestUserId: string;
  guestPhone?: string | null;
  guestEmail?: string | null;
  propertyName: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  bookingRef: string;
  decision: 'confirmed' | 'cancelled';
  cancellationReason?: string | null;
  hostPhone?: string | null;
  hostWhatsapp?: string | null;
}) {
  const isConfirmed = params.decision === 'confirmed';
  const title = isConfirmed
    ? `Booking Confirmed: ${params.propertyName} (${params.bookingRef})`
    : `Booking Request Declined: ${params.propertyName} (${params.bookingRef})`;

  const message = isConfirmed
    ? `Great news! Your booking request for ${params.roomName} at ${params.propertyName} has been confirmed by the host. Check-in: ${params.checkIn}. Safe travels!`
    : `Your booking request for ${params.propertyName} could not be confirmed. Reason: ${params.cancellationReason || 'Host unavailable on these dates'}.`;

  const actionUrl = `/guest/trips`;

  const waBody = isConfirmed
    ? `*UTTARKUNTH STAYS — BOOKING CONFIRMED!*\n\n` +
      `Namaste! Your stay has been confirmed by the host.\n\n` +
      `• Property: *${params.propertyName}*\n` +
      `• Room: ${params.roomName}\n` +
      `• Dates: ${params.checkIn} to ${params.checkOut}\n` +
      `• Booking Reference: *${params.bookingRef}*\n\n` +
      (params.hostPhone ? `Host Contact: ${params.hostPhone}\n` : '') +
      `View your trip itinerary: https://uttarkunth.com/guest/trips\n\n` +
      `Settle payments directly with your host upon arrival. Have a wonderful Himalayan journey!`
    : `*UTTARKUNTH STAYS — RESERVATION UPDATE*\n\n` +
      `Namaste. Your booking request for *${params.propertyName}* (${params.bookingRef}) could not be accommodated by the host.\n` +
      (params.cancellationReason ? `Note: ${params.cancellationReason}\n` : '') +
      `\nYou can explore other verified Himalayan stays at https://uttarkunth.com/stays.`;

  return sendNotification({
    userId: params.guestUserId,
    pillar: 'stays',
    title,
    message,
    actionUrl,
    email: params.guestEmail
      ? {
          to: params.guestEmail,
          subject: `[Uttarkunth] ${title}`,
          body: message + `\n\nView Trip Details: https://uttarkunth.com${actionUrl}`,
        }
      : undefined,
    whatsapp: params.guestPhone
      ? {
          to: params.guestPhone,
          body: waBody,
        }
      : undefined,
  });
}

/**
 * Notify Host when they submit their property for verification
 */
export async function notifyHostPropertySubmitted(params: {
  hostUserId: string;
  hostEmail?: string | null;
  hostPhone?: string | null;
  propertyName: string;
}) {
  const title = `Property Submitted for Review: ${params.propertyName}`;
  const message = `Your property "${params.propertyName}" has been submitted for verification. Our local team is reviewing your rooms, photography, and amenities. You will receive updates via WhatsApp and email once approved.`;
  const actionUrl = `/account/stays/host`;

  const waBody = `*UTTARKUNTH STAYS — LISTING UNDER REVIEW*\n\n` +
    `Namaste! We have received your property listing application for *${params.propertyName}*.\n\n` +
    `• Status: Under Verification by Uttarkunth Council\n` +
    `• Our local mountain team is reviewing your room amenities, photography standards, and location details.\n\n` +
    `You will receive immediate notifications here on WhatsApp once your property goes live. Track your status anytime at https://uttarkunth.com/account/stays/host.`;

  return sendNotification({
    userId: params.hostUserId,
    pillar: 'stays',
    title,
    message,
    actionUrl,
    email: params.hostEmail
      ? {
          to: params.hostEmail,
          subject: `[Uttarkunth] Your property listing "${params.propertyName}" is under review`,
          body: message + `\n\nTrack progress: https://uttarkunth.com${actionUrl}`,
        }
      : undefined,
    whatsapp: params.hostPhone
      ? {
          to: params.hostPhone,
          body: waBody,
        }
      : undefined,
  });
}

/**
 * Notify Host upon property approval or rejection by admin / staff
 */
export async function notifyHostPropertyModeration(params: {
  hostUserId: string;
  hostEmail?: string | null;
  hostPhone?: string | null;
  propertyName: string;
  status: 'approved' | 'rejected' | 'changes_requested';
  adminNotes?: string | null;
  slug?: string;
}) {
  const isApproved = params.status === 'approved';
  const title = isApproved
    ? `Congratulations! "${params.propertyName}" is now Live on Uttarkunth Stays`
    : `Update on your property listing "${params.propertyName}"`;

  const message = isApproved
    ? `Your property "${params.propertyName}" has been verified and published to the public directory. Guests can now view your rooms and submit booking requests.`
    : `Our review team has requested updates for "${params.propertyName}". Notes: ${params.adminNotes || 'Please review your listing information.'}`;

  const actionUrl = isApproved && params.slug ? `/stays/${params.slug}` : `/account/stays/host`;

  const waBody = isApproved
    ? `*UTTARKUNTH STAYS — CONGRATULATIONS! YOUR LISTING IS LIVE!*\n\n` +
      `Namaste! We are thrilled to welcome *${params.propertyName}* to the Uttarkunth Himalayan Stays directory.\n\n` +
      `• Public Listing: https://uttarkunth.com${actionUrl}\n` +
      `• Host Portal: https://uttarkunth.com/account/stays/host\n\n` +
      `You will receive WhatsApp alerts whenever a traveler requests a room at your property. Welcome to authentic Himalayan hospitality!`
    : `*UTTARKUNTH STAYS — LISTING REVIEW UPDATE*\n\n` +
      `Namaste. The review team has evaluated your listing for *${params.propertyName}*.\n\n` +
      `Feedback: ${params.adminNotes || 'Please update your listing photos or room features as per guidelines.'}\n\n` +
      `Please log in to your dashboard to edit and resubmit: https://uttarkunth.com/account/stays/host`;

  return sendNotification({
    userId: params.hostUserId,
    pillar: 'stays',
    title,
    message,
    actionUrl,
    email: params.hostEmail
      ? {
          to: params.hostEmail,
          subject: `[Uttarkunth] ${title}`,
          body: message + `\n\n${params.adminNotes ? `Review notes: ${params.adminNotes}\n\n` : ''}Access: https://uttarkunth.com${actionUrl}`,
        }
      : undefined,
    whatsapp: params.hostPhone
      ? {
          to: params.hostPhone,
          body: waBody,
        }
      : undefined,
  });
}
