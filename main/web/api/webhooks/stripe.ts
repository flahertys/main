import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import getRawBody from 'raw-body';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' });

// Stripe secret from env
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

export const config = {
  api: {
    bodyParser: false, // Disable body parsing to get raw body
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  let event;
  try {
    const rawBody = await getRawBody(req);
    const sig = req.headers['stripe-signature'] as string;
    event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('Stripe webhook signature verification failed:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

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
