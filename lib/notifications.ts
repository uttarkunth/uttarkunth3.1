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
  if (clean.startsWith('0')) {
    clean = '91' + clean.slice(1);
  } else if (!clean.startsWith('+') && !clean.startsWith('91') && clean.length === 10) {
    clean = '91' + clean;
  }
  return clean.replace(/^\+/, '');
}

/**
 * Generate a direct WhatsApp Web / App chat URL with prefilled text
 */
export function getWhatsAppDirectUrl(phone: string, text: string): string {
  const cleaned = cleanPhoneNumber(phone);
  return `https://api.whatsapp.com/send?phone=${cleaned}&text=${encodeURIComponent(text)}`;
}

/**
 * Unified notification dispatcher for Uttarkunth.
 * Dispatches in-app notifications directly to `public.user_notifications`
 * and sends outward email/WhatsApp alerts via configured gateways (Resend, WhatsApp Cloud API, Twilio).
 */
export async function sendNotification(options: SendNotificationOptions): Promise<{ ok: boolean; id?: string }> {
  try {
    const admin = createAdminClient();
    let notificationId: string | undefined = undefined;

    // 1. In-App Notification (Database table public.user_notifications)
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

    // 2. Email Dispatch (Resend API or SMTP if configured)
    if (options.email && options.email.to) {
      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey && !resendApiKey.includes('placeholder')) {
        try {
          const fromAddress = process.env.EMAIL_FROM || 'Uttarkunth Stays <stays@uttarkunth.com>';
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: fromAddress,
              to: [options.email.to],
              subject: options.email.subject,
              text: options.email.body,
            }),
          });
          console.log(`[Notification Engine: Email Sent via Resend] To: ${options.email.to}`);
        } catch (mailErr) {
          console.error('[sendNotification] Resend email dispatch failed:', mailErr);
        }
      } else {
        console.log(`[Notification Engine: Email Logged] To: ${options.email.to} | Subject: "${options.email.subject}"`);
      }
    }

    // 3. WhatsApp Dispatch (Meta WhatsApp Cloud API or Twilio if configured)
    if (options.whatsapp && options.whatsapp.to) {
      const waToken = process.env.WHATSAPP_API_TOKEN;
      const waPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      const cleanTo = cleanPhoneNumber(options.whatsapp.to);

      if (waToken && waPhoneId && cleanTo) {
        try {
          await fetch(`https://graph.facebook.com/v19.0/${waPhoneId}/messages`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${waToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              recipient_type: 'individual',
              to: cleanTo,
              type: 'text',
              text: { preview_url: true, body: options.whatsapp.body },
            }),
          });
          console.log(`[Notification Engine: WhatsApp Sent via Cloud API] To: ${cleanTo}`);
        } catch (waErr) {
          console.error('[sendNotification] WhatsApp Cloud API dispatch failed:', waErr);
        }
      } else {
        console.log(`[Notification Engine: WhatsApp Alert Logged] To: ${options.whatsapp.to} | Message: "${options.whatsapp.body}"`);
      }
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
  const message = `New booking request from ${params.guestName} for "${params.roomName}" (${params.checkIn} to ${params.checkOut}). Reference: #${params.bookingReference}. Contact: ${params.guestPhone}.`;
  const whatsappTarget = params.hostWhatsapp || params.hostPhone;

  await sendNotification({
    userId: params.hostUserId,
    pillar: 'stays',
    title: `New Booking Request: ${params.propertyName}`,
    message,
    actionUrl: '/account/stays/host/bookings',
    whatsapp: whatsappTarget
      ? {
          to: whatsappTarget,
          body: `*Uttarkunth Stays Alert*: You have a new booking request for *${params.propertyName}* (${params.roomName})!\n\n• Guest: ${params.guestName} (${params.guestPhone})\n• Dates: ${params.checkIn} to ${params.checkOut}\n• Ref: #${params.bookingReference}\n\nReview & decide: https://uttarkunth.com/account/stays/host/bookings`,
        }
      : undefined,
    email: params.hostEmail
      ? {
          to: params.hostEmail,
          subject: `[Uttarkunth Stays] New Booking Request: ${params.propertyName} (#${params.bookingReference})`,
          body: `Dear Host,

You have received a new booking request for "${params.propertyName}"!

Reservation Details:
• Room: ${params.roomName}
• Guest Name: ${params.guestName}
• Guest Phone: ${params.guestPhone}
• Check-In: ${params.checkIn}
• Check-Out: ${params.checkOut}
• Booking Reference: #${params.bookingReference}

Payment Policy:
Uttarkunth does not collect online booking payments. Guests pay you directly upon arrival.

Please review and approve or decline this request on your host dashboard:
https://uttarkunth.com/account/stays/host/bookings

Warm regards,
Uttarkunth Stays Team`,
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
    ? `Your stay request for "${params.roomName}" at ${params.propertyName} (${params.checkIn} to ${params.checkOut}) has been approved by your host! Direct settlement applies upon arrival at the property. Reference: #${params.bookingReference}.`
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
          subject: `[Uttarkunth Stays] ${title} (#${params.bookingReference})`,
          body: `Dear Guest,

${message}

Stay Summary:
• Property: ${params.propertyName}
• Room: ${params.roomName}
• Check-In: ${params.checkIn}
• Check-Out: ${params.checkOut}
• Reference: #${params.bookingReference}
${params.hostNotes ? `• Host Note: ${params.hostNotes}\n` : ''}
${isConfirmed ? '\nReminder: Direct settlement with your host applies at the property upon check-in.\n' : ''}
View reservation details:
https://uttarkunth.com/trips

Warm regards,
Uttarkunth Stays Team`,
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
  hostEmail?: string | null;
  hostPhone?: string | null;
  hostWhatsapp?: string | null;
}) {
  const whatsappTarget = params.hostWhatsapp || params.hostPhone;
  const message = `Your property listing for "${params.propertyName}" in ${params.village} has been received and is currently under curation review by the Uttarkunth team. You will be notified once reviewed.`;

  await sendNotification({
    userId: params.hostUserId,
    pillar: 'stays',
    title: `Homestay Application Submitted: ${params.propertyName}`,
    message,
    actionUrl: '/account/stays/host',
    whatsapp: whatsappTarget
      ? {
          to: whatsappTarget,
          body: `*Uttarkunth Stays*: Thank you for listing *${params.propertyName}* (${params.village})! Your homestay is under curation review by our team. We verify all homestays to ensure quality standards. You can track your status at: https://uttarkunth.com/account/stays/host`,
        }
      : undefined,
    email: params.hostEmail
      ? {
          to: params.hostEmail,
          subject: `[Uttarkunth Stays] Listing Under Review: ${params.propertyName}`,
          body: `Dear Host,

Thank you for submitting your homestay "${params.propertyName}" (${params.village}) to Uttarkunth Stays!

Your listing is currently under curation review. Our team will verify your property details, room configurations, and photography standards within 24-48 hours.

Once approved, your property will go live on uttarkunth.com and guests will be able to discover and request stays with you.

Track your application status anytime:
https://uttarkunth.com/account/stays/host

Warm regards,
Uttarkunth Stays Team`,
        }
      : undefined,
  });
}

/**
 * Host Alert: Property Moderation Outcome (Approved / Live / Changes Requested / Rejected)
 */
export async function notifyHostPropertyModeration(params: {
  hostUserId: string;
  propertyName: string;
  status: 'approved' | 'rejected' | 'changes_requested' | 'corrections_requested';
  moderationNotes?: string | null;
  hostEmail?: string | null;
  hostPhone?: string | null;
  hostWhatsapp?: string | null;
}) {
  let title = '';
  let message = '';
  let whatsappBody = '';

  const whatsappTarget = params.hostWhatsapp || params.hostPhone;

  if (params.status === 'approved') {
    title = `Property Approved & Live: ${params.propertyName}`;
    message = `Congratulations! Your homestay "${params.propertyName}" has been verified and approved by the Uttarkunth curation team. It is now live on uttarkunth.com!`;
    whatsappBody = `*Uttarkunth Stays*: 🎉 Congratulations! Your homestay *${params.propertyName}* has been approved and is now live on uttarkunth.com! Guests can now discover and book your rooms. Manage your homestay: https://uttarkunth.com/account/stays/host`;
  } else if (params.status === 'changes_requested') {
    title = `Updates Required: ${params.propertyName}`;
    message = `The curation team reviewed "${params.propertyName}" and requested changes before publishing.${params.moderationNotes ? ` Feedback: ${params.moderationNotes}` : ''}`;
    whatsappBody = `*Uttarkunth Stays*: The curation team reviewed *${params.propertyName}* and requested updates before publishing.${params.moderationNotes ? ` Feedback: ${params.moderationNotes}` : ''} Please update your listing at: https://uttarkunth.com/account/stays/host`;
  } else if (params.status === 'corrections_requested') {
    title = `Corrections Requested: ${params.propertyName}`;
    message = `The proposed updates to your existing listing "${params.propertyName}" have been returned for corrections. Your currently approved listing remains live and unchanged. Please review the administrator's feedback and edit the same proposal before resubmitting.${params.moderationNotes ? ` Administrator feedback: ${params.moderationNotes}` : ''}`;
    whatsappBody = `*Uttarkunth Stays*: Your proposed changes for *${params.propertyName}* need corrections. Your existing approved listing remains live and unchanged. Please edit the same proposal and resubmit it for approval.${params.moderationNotes ? `\n\nAdministrator feedback: ${params.moderationNotes}` : ''}\n\nOpen your host dashboard: https://uttarkunth.com/account/stays/host`;
  } else {
    title = `Listing Application Status: ${params.propertyName}`;
    message = `Your application for "${params.propertyName}" could not be approved at this time.${params.moderationNotes ? ` Reason: ${params.moderationNotes}` : ''}`;
    whatsappBody = `*Uttarkunth Stays*: Your listing application for *${params.propertyName}* could not be approved at this time.${params.moderationNotes ? ` Reason: ${params.moderationNotes}` : ''}`;
  }

  await sendNotification({
    userId: params.hostUserId,
    pillar: 'stays',
    title,
    message,
    actionUrl: '/account/stays/host',
    whatsapp: whatsappTarget
      ? {
          to: whatsappTarget,
          body: whatsappBody,
        }
      : undefined,
    email: params.hostEmail
      ? {
          to: params.hostEmail,
          subject: `[Uttarkunth Stays] ${title}`,
          body: `Dear Host,

${message}

You can access your host dashboard anytime to update rates, room features, or photos:
https://uttarkunth.com/account/stays/host

Warm regards,
Uttarkunth Stays Team`,
        }
      : undefined,
  });
}
