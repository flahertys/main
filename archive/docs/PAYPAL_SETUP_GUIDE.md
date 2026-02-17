# PayPal Integration Setup Guide

This guide walks you through setting up your PayPal Business account with the TradeHax backend payment processing system.

## Prerequisites

- PayPal Business Account (or Business account upgrade from Personal)
- Backend server running (`backend/server.js`)
- Node.js 16+

## Step 1: Create/Access PayPal Sandbox (Testing)

1. Go to **https://developer.paypal.com/dashboard**
2. Sign in with your PayPal account
3. Click **Sandbox** (left sidebar) to switch from Live to Sandbox for testing
4. Go to **Apps & Credentials** → **Sandbox** tab
5. Under "Merchant Accounts", you'll see a test business account (usually `sb-xxxxx@business.example.com`)

## Step 2: Get Your Sandbox Credentials

1. In **Apps & Credentials** → **Sandbox** tab
2. Look for **Merchant Accounts** section
3. For your sandbox business account, click **View Credentials**
4. Copy:
   - **Client ID** (starts with `ASxxx...`)
   - **Secret** (long string)

These are your **PAYPAL_CLIENT_ID** and **PAYPAL_SECRET** for testing.

## Step 3: Create `.env` File in Backend

Create `.backend/.env` file (copy from `.backend/.env.example`):

```bash
# Existing variables...
NODE_ENV=sandbox
PORT=3001
BACKEND_URL=http://localhost:3001
FRONTEND_URL=http://localhost:5000

# PayPal Configuration
PAYPAL_CLIENT_ID=ASxxx_your_sandbox_client_id_here
PAYPAL_SECRET=xxxxx_your_sandbox_secret_here
PAYPAL_WEBHOOK_ID=WH_xxxxx  # Get this after setting up webhook
```

**Do NOT commit `.env` to git** - it's already in `.gitignore`

## Step 4: Test Locally

1. Install dependencies:
```bash
cd backend
npm install
```

2. Start backend server:
```bash
npm run dev
```

Should see:
```
Server running on http://localhost:3001
PayPal SDK initialized (Sandbox mode)
```

3. Open checkout page:
```
http://localhost:5000/checkout.html?service=repair
```

4. Select service → Select **PayPal** → Proceed
   - Should redirect to PayPal Sandbox login
   - Use test credentials from PayPal Dashboard

## Step 5: Switch to Live (Production)

When ready for real payments:

1. Go to **https://developer.paypal.com/dashboard** → **Live** tab
2. Click **View Credentials** on your business account
3. Copy **Live Client ID** and **Secret**

4. Update `.env`:
```bash
NODE_ENV=production
PAYPAL_CLIENT_ID=YOUR_LIVE_CLIENT_ID
PAYPAL_SECRET=YOUR_LIVE_SECRET
BACKEND_URL=https://api.tradehax.net
```

5. Deploy backend to production server

## Step 6: Set Up Webhooks (Optional but Recommended)

Webhooks let PayPal notify your server of payment events.

1. Go to **https://developer.paypal.com/dashboard** → **Sandbox/Live**
2. Left sidebar → **Webhooks**
3. Click **Create Webhook**
4. **Endpoint URL**: `https://api.tradehax.net/api/paypal/webhook`
5. **Events to Subscribe To**:
   - ✓ CHECKOUT.ORDER.COMPLETED
   - ✓ PAYMENT.CAPTURE.COMPLETED
   - ✓ PAYMENT.CAPTURE.DENIED
   - ✓ PAYMENT.CAPTURE.REFUNDED
6. Click **Create Webhook**
7. Copy **Webhook ID** and add to `.env`:
```bash
PAYPAL_WEBHOOK_ID=WH_xxxxx
```

## Endpoint Reference

### Create Payment Order
```bash
POST /api/paypal/create-order
Content-Type: application/json

{
  "service": "repair",
  "amount": 150,
  "description": "Device Repair Service"
}

# Response:
{
  "id": "7TV80927N8371922J",
  "status": "CREATED",
  "links": [
    {
      "rel": "approve",
      "href": "https://www.paypal.com/checkoutnow?token=EC-7TV80927N8371922J"
    }
  ]
}
```

### Capture Order
```bash
POST /api/paypal/capture-order
Content-Type: application/json

{
  "orderId": "7TV80927N8371922J"
}

# Response:
{
  "success": true,
  "orderId": "7TV80927N8371922J",
  "status": "COMPLETED",
  "amount": "150.00",
  "service": "repair",
  "payer": {...},
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Get Order Details
```bash
GET /api/paypal/order/7TV80927N8371922J

# Response:
{
  "id": "7TV80927N8371922J",
  "status": "COMPLETED",
  "payer": {...},
  "purchase_units": [...]
}
```

## Troubleshooting

### "Invalid Client ID"
- Check `.env` file has correct `PAYPAL_CLIENT_ID`
- Make sure you're using Sandbox credentials for testing
- Don't have extra spaces in credentials

### "Failed to create payment order"
- Backend server must be running
- Check `BACKEND_URL` matches frontend requests
- Review backend logs for error details

### PayPal redirects to error page
- Confirm `FRONTEND_URL` matches your domain
- Check `return_url` and `cancel_url` in PayPal routes

### Webhook not triggering
- Verify webhook is created in PayPal Dashboard
- Check `PAYPAL_WEBHOOK_ID` in `.env`
- PayPal needs public HTTPS URL (can't test localhost webhooks)

## Security Checklist

- [ ] Never commit `.env` to git
- [ ] Use Sandbox credentials for development/testing only
- [ ] Rotate Live credentials annually
- [ ] Enable webhook signature verification (implement in production)
- [ ] Add rate limiting to `/api/paypal/*` endpoints
- [ ] Log all payment events for auditing
- [ ] Enable two-factor authentication on PayPal account

## Next Steps

1. **Data Storage**: Add database table to store orders:
   ```sql
   CREATE TABLE payments (
     id UUID PRIMARY KEY,
     paypal_order_id VARCHAR UNIQUE,
     service VARCHAR,
     amount DECIMAL(10,2),
     status VARCHAR,
     payer_email VARCHAR,
     payer_name VARCHAR,
     created_at TIMESTAMP,
     captured_at TIMESTAMP
   );
   ```

2. **Email Notifications**: Send customer receipt emails on successful capture

3. **Admin Dashboard**: Track payments, refunds, and service requests

4. **Error Handling**: Add retry logic and dead-letter queue for failed captures

5. **Compliance**: Ensure PCI DSS compliance (you're not storing cards - PayPal is!)

---

**Questions?** Contact PayPal support or check https://developer.paypal.com/docs
