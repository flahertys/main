import { enforceRateLimit, enforceTrustedOrigin } from '@/lib/security';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type EnvCheck = {
  key: string;
  required: boolean;
};

const checks: EnvCheck[] = [
  { key: 'NEXT_PUBLIC_EMAILJS_SERVICE_ID', required: false },
  { key: 'NEXT_PUBLIC_EMAILJS_TEMPLATE_ID', required: false },
  { key: 'NEXT_PUBLIC_EMAILJS_PUBLIC_KEY', required: false },
  { key: 'SMTP_HOST', required: false },
  { key: 'SMTP_PORT', required: false },
  { key: 'SMTP_USER', required: false },
  { key: 'SMTP_PASS', required: false },
  { key: 'SMTP_FROM', required: false },
  { key: 'SMTP_TO', required: false },
  { key: 'RESEND_API_KEY', required: false },
  { key: 'SNOW_REMOVAL_FROM_EMAIL', required: false },
  { key: 'SNOW_REMOVAL_TO_EMAIL', required: false },
];

function isPlaceholder(value: string) {
  const normalized = value.toLowerCase();
  return (
    !normalized ||
    normalized.includes('your_') ||
    normalized.includes('replace_') ||
    normalized.endsWith('_id') ||
    normalized.endsWith('_key')
  );
}

function isConfigured(key: string) {
  const value = String(process.env[key] || '').trim();
  return value.length > 0 && !isPlaceholder(value);
}

function getMissing(keys: string[]) {
  return keys.filter((key) => !isConfigured(key));
}

export async function GET(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: 'snow-removal:health',
    max: 120,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  const allKeys = checks.map((item) => item.key);
  const missingAll = allKeys.filter((key) => !isConfigured(key));

  const emailJsKeys = [
    'NEXT_PUBLIC_EMAILJS_SERVICE_ID',
    'NEXT_PUBLIC_EMAILJS_TEMPLATE_ID',
    'NEXT_PUBLIC_EMAILJS_PUBLIC_KEY',
  ];

  const smtpBaseKeys = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'];
  const smtpDestinationConfigured = isConfigured('SMTP_TO') || isConfigured('SNOW_REMOVAL_TO_EMAIL');

  const resendKeys = ['RESEND_API_KEY', 'SNOW_REMOVAL_FROM_EMAIL', 'SNOW_REMOVAL_TO_EMAIL'];

  const missingEmailJs = getMissing(emailJsKeys);
  const missingSmtpBase = getMissing(smtpBaseKeys);
  const missingResend = getMissing(resendKeys);

  const emailJsReady = missingEmailJs.length === 0;
  const smtpReady = missingSmtpBase.length === 0 && smtpDestinationConfigured;
  const resendReady = missingResend.length === 0;

  const routesReady = {
    emailjs: emailJsReady,
    smtp: smtpReady,
    resend: resendReady,
  };

  const ready = emailJsReady || smtpReady || resendReady;

  return NextResponse.json(
    {
      ok: true,
      ready,
      timestamp: new Date().toISOString(),
      routes: {
        ready: routesReady,
        missing: {
          emailjs: missingEmailJs,
          smtp: smtpDestinationConfigured ? missingSmtpBase : [...missingSmtpBase, 'SMTP_TO or SNOW_REMOVAL_TO_EMAIL'],
          resend: missingResend,
        },
      },
      checks: {
        total: allKeys.length,
        configured: allKeys.length - missingAll.length,
        missing: missingAll,
      },
      note: 'Values are intentionally not returned. Only readiness metadata is exposed.',
    },
    { headers: rateLimit.headers },
  );
}
