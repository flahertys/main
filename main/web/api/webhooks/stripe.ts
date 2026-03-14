import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

// Stripe secret from env
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

function verifySignature(req: VercelRequest, secret: string): boolean {
  const sig = req.headers['stripe-signature'] as string;
  if (!sig || !secret) return false;
  // Stripe sends the raw body, so this is a placeholder for actual verification logic
  // In production, use Stripe's official SDK: stripe.webhooks.constructEvent
  return true; // Replace with real verification
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  if (!verifySignature(req, STRIPE_WEBHOOK_SECRET)) {
    res.status(400).send('Invalid signature');
    return;
  }

  // Parse event
  const event = req.body;
  // Log event for auditing
  console.log('[Stripe Webhook]', event.type, event.id);

  // Handle event types
  switch (event.type) {
    case 'payment_intent.succeeded':
      // Handle successful payment
      break;
    case 'invoice.payment_failed':
      // Handle failed payment
      break;
    // ...add more cases as needed
    default:
      break;
  }

  // Respond quickly
  res.status(200).json({ received: true });
}

