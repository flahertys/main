import {
    enforceRateLimit,
    enforceTrustedOrigin,
    isJsonContentType,
    sanitizePlainText,
} from '@/lib/security';
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PreferredContact = 'phone' | 'email' | 'text';

type SnowRemovalLeadPayload = {
  name?: unknown;
  phone?: unknown;
  email?: unknown;
  preferredContact?: unknown;
  address?: unknown;
  sqFt?: unknown;
  notes?: unknown;
};

type SnowRemovalLeadRecord = {
  submittedAt: string;
  source: string;
  name: string;
  phone: string;
  email: string;
  preferredContact: PreferredContact;
  address: string;
  sqFt: string;
  notes: string;
};

type DeliveryResult = {
  attempted: boolean;
  delivered: boolean;
  channel: 'none' | 'resend' | 'smtp';
  reason?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function sendLeadNotificationByResend(lead: SnowRemovalLeadRecord) {
  const resendApiKey = String(process.env.RESEND_API_KEY || '').trim();
  const toEmail = String(process.env.SNOW_REMOVAL_TO_EMAIL || '').trim();
  const fromEmail = String(process.env.SNOW_REMOVAL_FROM_EMAIL || '').trim();

  if (!resendApiKey || !toEmail || !fromEmail) {
    return {
      attempted: false,
      delivered: false,
      channel: 'none' as const,
      reason: 'Missing RESEND_API_KEY, SNOW_REMOVAL_TO_EMAIL, or SNOW_REMOVAL_FROM_EMAIL',
    };
  }

  const lines = [
    `New snow-removal lead received at ${lead.submittedAt}`,
    '',
    `Name: ${lead.name}`,
    `Phone: ${lead.phone || '(not provided)'}`,
    `Email: ${lead.email || '(not provided)'}`,
    `Preferred Contact: ${lead.preferredContact}`,
    `Address: ${lead.address || '(not provided)'}`,
    `Square Footage: ${lead.sqFt || '(not provided)'}`,
    '',
    'Notes:',
    lead.notes || '(none)',
  ];

  const html = `
    <h2>New Snow Removal Lead</h2>
    <p><strong>Submitted:</strong> ${escapeHtml(lead.submittedAt)}</p>
    <ul>
      <li><strong>Name:</strong> ${escapeHtml(lead.name)}</li>
      <li><strong>Phone:</strong> ${escapeHtml(lead.phone || '(not provided)')}</li>
      <li><strong>Email:</strong> ${escapeHtml(lead.email || '(not provided)')}</li>
      <li><strong>Preferred Contact:</strong> ${escapeHtml(lead.preferredContact)}</li>
      <li><strong>Address:</strong> ${escapeHtml(lead.address || '(not provided)')}</li>
      <li><strong>Square Footage:</strong> ${escapeHtml(lead.sqFt || '(not provided)')}</li>
    </ul>
    <p><strong>Notes:</strong></p>
    <pre>${escapeHtml(lead.notes || '(none)')}</pre>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      subject: `New Snow Removal Lead: ${lead.name}`,
      text: lines.join('\n'),
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Resend API error (${response.status}): ${body || 'Unknown error'}`);
  }

  return {
    attempted: true,
    delivered: true,
    channel: 'resend' as const,
  };
}

async function sendLeadNotificationBySmtp(lead: SnowRemovalLeadRecord) {
  const host = String(process.env.SMTP_HOST || '').trim();
  const port = Number(String(process.env.SMTP_PORT || '').trim() || 0);
  const user = String(process.env.SMTP_USER || '').trim();
  const pass = String(process.env.SMTP_PASS || '').trim();
  const secure = String(process.env.SMTP_SECURE || '').trim().toLowerCase() === 'true' || port === 465;

  const fromEmail = String(process.env.SMTP_FROM || process.env.SNOW_REMOVAL_FROM_EMAIL || '').trim();
  const toEmail = String(process.env.SMTP_TO || process.env.SNOW_REMOVAL_TO_EMAIL || '').trim();

  if (!host || !port || !user || !pass || !fromEmail || !toEmail) {
    return {
      attempted: false,
      delivered: false,
      channel: 'none' as const,
      reason: 'Missing SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, or destination email',
    };
  }

  const lines = [
    `New snow-removal lead received at ${lead.submittedAt}`,
    '',
    `Name: ${lead.name}`,
    `Phone: ${lead.phone || '(not provided)'}`,
    `Email: ${lead.email || '(not provided)'}`,
    `Preferred Contact: ${lead.preferredContact}`,
    `Address: ${lead.address || '(not provided)'}`,
    `Square Footage: ${lead.sqFt || '(not provided)'}`,
    '',
    'Notes:',
    lead.notes || '(none)',
  ];

  const html = `
    <h2>New Snow Removal Lead</h2>
    <p><strong>Submitted:</strong> ${escapeHtml(lead.submittedAt)}</p>
    <ul>
      <li><strong>Name:</strong> ${escapeHtml(lead.name)}</li>
      <li><strong>Phone:</strong> ${escapeHtml(lead.phone || '(not provided)')}</li>
      <li><strong>Email:</strong> ${escapeHtml(lead.email || '(not provided)')}</li>
      <li><strong>Preferred Contact:</strong> ${escapeHtml(lead.preferredContact)}</li>
      <li><strong>Address:</strong> ${escapeHtml(lead.address || '(not provided)')}</li>
      <li><strong>Square Footage:</strong> ${escapeHtml(lead.sqFt || '(not provided)')}</li>
    </ul>
    <p><strong>Notes:</strong></p>
    <pre>${escapeHtml(lead.notes || '(none)')}</pre>
  `;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  await transporter.sendMail({
    from: fromEmail,
    to: toEmail,
    subject: `New Snow Removal Lead: ${lead.name}`,
    text: lines.join('\n'),
    html,
    replyTo: lead.email || undefined,
  });

  return {
    attempted: true,
    delivered: true,
    channel: 'smtp' as const,
  };
}

function normalizePreferredContact(
  preferredContact: unknown,
  hasPhone: boolean,
  hasEmail: boolean,
): PreferredContact {
  const raw = typeof preferredContact === 'string' ? preferredContact.trim().toLowerCase() : '';

  if (raw === 'email' && hasEmail) return 'email';
  if (raw === 'text' && hasPhone) return 'text';
  if (raw === 'phone' && hasPhone) return 'phone';

  if (hasPhone) return 'phone';
  return 'email';
}

export async function POST(request: NextRequest) {
  const originViolation = enforceTrustedOrigin(request);
  if (originViolation) {
    return originViolation;
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: 'snow-removal:contact',
    max: 20,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  if (!isJsonContentType(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Expected JSON request body.',
      },
      {
        status: 415,
        headers: rateLimit.headers,
      },
    );
  }

  try {
    const payload = (await request.json()) as SnowRemovalLeadPayload;

    const name = sanitizePlainText(String(payload.name ?? ''), 120);
    const phone = sanitizePlainText(String(payload.phone ?? ''), 60);
    const email = sanitizePlainText(String(payload.email ?? ''), 120).toLowerCase();
    const address = sanitizePlainText(String(payload.address ?? ''), 220);
    const sqFt = sanitizePlainText(String(payload.sqFt ?? ''), 120);
    const notes = sanitizePlainText(String(payload.notes ?? ''), 1_000);

    if (!name) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Please provide your name.',
        },
        {
          status: 400,
          headers: rateLimit.headers,
        },
      );
    }

    if (!phone && !email) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Please provide a phone number or email address.',
        },
        {
          status: 400,
          headers: rateLimit.headers,
        },
      );
    }

    if (email && !emailPattern.test(email)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Please enter a valid email address.',
        },
        {
          status: 400,
          headers: rateLimit.headers,
        },
      );
    }

    const preferredContact = normalizePreferredContact(payload.preferredContact, Boolean(phone), Boolean(email));

    const leadRecord: SnowRemovalLeadRecord = {
      submittedAt: new Date().toISOString(),
      source: 'snow-removal-contact-form',
      name,
      phone,
      email,
      preferredContact,
      address,
      sqFt,
      notes,
    };

    console.info('[snow-removal] lead received', leadRecord);

    let delivery: DeliveryResult = {
      attempted: false,
      delivered: false,
      channel: 'none' as const,
      reason: 'Not configured',
    };

    try {
      const smtpResult = await sendLeadNotificationBySmtp(leadRecord);
      if (smtpResult.delivered) {
        delivery = smtpResult;
      } else {
        const resendResult = await sendLeadNotificationByResend(leadRecord);
        const attemptedAny = smtpResult.attempted || resendResult.attempted;

        delivery = {
          attempted: attemptedAny,
          delivered: resendResult.delivered,
          channel: resendResult.channel,
          reason: resendResult.delivered
            ? undefined
            : smtpResult.reason || resendResult.reason || 'No email delivery route configured',
        };
      }

      if (delivery.delivered) {
        console.info('[snow-removal] lead dispatched', {
          channel: delivery.channel,
          submittedAt: leadRecord.submittedAt,
          name: leadRecord.name,
        });
      }

      if (!delivery.delivered && delivery.reason) {
        console.warn('[snow-removal] lead accepted but delivery pending', {
          reason: delivery.reason,
          submittedAt: leadRecord.submittedAt,
          name: leadRecord.name,
        });
      }

    } catch (notifyError) {
      console.error('[snow-removal] notification delivery failed', notifyError);
      delivery = {
        attempted: true,
        delivered: false,
        channel: 'none',
        reason: 'Notification send failed for SMTP/Resend routes',
      };
    }

    return NextResponse.json(
      {
        ok: true,
        message: delivery.delivered
          ? 'Request received and delivered to dispatch.'
          : 'Request received.',
        delivery,
      },
      {
        status: 200,
        headers: rateLimit.headers,
      },
    );
  } catch (error) {
    console.error('[snow-removal] contact submission failed', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Unable to process your request right now. Please try again in a moment.',
      },
      {
        status: 500,
        headers: rateLimit.headers,
      },
    );
  }
}
