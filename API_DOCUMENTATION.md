# API Documentation

## Overview

This document describes the available API endpoints in the TradeHax AI platform. All API routes are built with Next.js App Router and are located in the `app/api/` directory.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://tradehaxai.tech/api`

## Authentication

Currently, API endpoints do not require authentication. Authentication will be added in future updates for protected endpoints.

## API Endpoints

### 1. Claim API

#### GET /api/claim

Check the status of the claim endpoint.

**Request:**
```bash
curl -X GET https://tradehaxai.tech/api/claim
```

**Response:**
```json
{
  "status": "ok",
  "message": "Claim endpoint is live."
}
```

**Status Codes:**
- `200 OK`: Endpoint is operational

---

#### POST /api/claim

Submit a claim for rewards.

**Request:**
```bash
curl -X POST https://tradehaxai.tech/api/claim \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "Your_Solana_Wallet_Address",
    "amount": 100,
    "claimType": "daily_reward"
  }'
```

**Request Body:**
```json
{
  "walletAddress": "string (required)",
  "amount": "number (optional)",
  "claimType": "string (optional)"
}
```

**Response:**
```json
{
  "status": "ok",
  "received": {
    "walletAddress": "Your_Solana_Wallet_Address",
    "amount": 100,
    "claimType": "daily_reward"
  }
}
```

**Status Codes:**
- `200 OK`: Claim processed successfully
- `400 Bad Request`: Invalid request data
- `500 Internal Server Error`: Server error

**Notes:**
- This endpoint is currently a placeholder and returns the received data
- Full claim processing logic will be implemented based on business requirements
- May require wallet signature verification in the future

---

### 2. Subscribe API

#### POST /api/subscribe

Subscribe to the newsletter.

**Request:**
```bash
curl -X POST https://tradehaxai.tech/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

**Request Body:**
```json
{
  "email": "string (required, valid email format)"
}
```

**Success Response:**
```json
{
  "success": true
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid email address"
}
```

**Status Codes:**
- `200 OK`: Subscription successful
- `400 Bad Request`: Invalid email format
- `500 Internal Server Error`: Server error

**Email Validation:**
- Must contain `@` symbol
- Must be a valid email format

**Notes:**
- Currently logs email to console
- Integration with email service provider (Mailchimp, SendGrid, etc.) is needed
- No duplicate email checking implemented yet

---

## Error Handling

All API endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": "Error message description",
  "code": "ERROR_CODE" // Optional
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `INVALID_EMAIL` | Email address is not valid |
| `MISSING_REQUIRED_FIELD` | Required field is missing from request |
| `INTERNAL_ERROR` | Internal server error occurred |
| `INVALID_WALLET` | Wallet address is invalid |
| `RATE_LIMIT_EXCEEDED` | Too many requests |

---

## Rate Limiting

**Current Status**: Not implemented

**Planned Implementation**:
- 100 requests per minute per IP
- 1000 requests per hour per IP
- Rate limit headers will be included in responses

Example rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1609459200
```

---

## CORS Configuration

CORS is configured in `vercel.json` to allow requests from:
- `https://tradehaxai.tech`
- `https://www.tradehaxai.tech`

Development mode allows `localhost` origins.

---

## Request Headers

### Required Headers

```
Content-Type: application/json
```

### Optional Headers

```
Accept: application/json
User-Agent: Your-App-Name/1.0
```

---

## Security

### Implemented Security Measures

1. **Input Validation**: All inputs are validated before processing
2. **Error Sanitization**: Error messages don't expose sensitive information
3. **HTTPS Only**: Production endpoints require HTTPS
4. **CSP Headers**: Content Security Policy headers are enforced
5. **XSS Protection**: Cross-site scripting protection enabled

### Recommended Client-Side Practices

1. Always use HTTPS in production
2. Validate data before sending to API
3. Handle errors gracefully
4. Implement proper timeout handling
5. Don't expose API responses directly to users

---

## Examples

### JavaScript/TypeScript (Fetch API)

```typescript
// Subscribe to newsletter
async function subscribeToNewsletter(email: string) {
  try {
    const response = await fetch('/api/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (data.success) {
      console.log('Subscription successful!');
    } else {
      console.error('Subscription failed:', data.error);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
}

// Claim rewards
async function claimReward(walletAddress: string) {
  try {
    const response = await fetch('/api/claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress,
        claimType: 'daily_reward'
      }),
    });

    const data = await response.json();
    console.log('Claim response:', data);
  } catch (error) {
    console.error('Claim error:', error);
  }
}
```

### React Component Example

```tsx
import { useState } from 'react';

function NewsletterSubscribe() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
      />
      <button type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
      </button>
      {status === 'success' && <p>Subscribed successfully!</p>}
      {status === 'error' && <p>Subscription failed. Please try again.</p>}
    </form>
  );
}
```

### Python Example

```python
import requests
import json

# Subscribe to newsletter
def subscribe_to_newsletter(email):
    url = "https://tradehaxai.tech/api/subscribe"
    payload = {"email": email}
    headers = {"Content-Type": "application/json"}
    
    response = requests.post(url, json=payload, headers=headers)
    return response.json()

# Claim rewards
def claim_reward(wallet_address):
    url = "https://tradehaxai.tech/api/claim"
    payload = {
        "walletAddress": wallet_address,
        "claimType": "daily_reward"
    }
    headers = {"Content-Type": "application/json"}
    
    response = requests.post(url, json=payload, headers=headers)
    return response.json()

# Usage
result = subscribe_to_newsletter("user@example.com")
print(result)
```

---

## Future Enhancements

### Planned Features

1. **Authentication & Authorization**
   - JWT-based authentication
   - API key management
   - OAuth integration

2. **Rate Limiting**
   - Per-user rate limits
   - IP-based throttling
   - Configurable limits

3. **WebSocket Support**
   - Real-time updates
   - Live trading data
   - Notification system

4. **Additional Endpoints**
   - User management
   - Trading history
   - Portfolio analytics
   - NFT operations

5. **Enhanced Claim System**
   - Wallet signature verification
   - Transaction history
   - Reward calculation
   - Anti-fraud measures

6. **Email Service Integration**
   - Mailchimp/SendGrid integration
   - Email verification
   - Unsubscribe handling
   - Template management

---

## Testing

### Testing the API Locally

1. Start the development server:
```bash
npm run dev
```

2. Test endpoints using curl, Postman, or browser DevTools

### Automated Testing

```bash
# Coming soon
npm run test:api
```

---

## Support

For API-related issues or questions:
- Open an issue on GitHub
- Check the main [README.md](../README.md) for general documentation
- Email: support@tradehaxai.tech

---

## Changelog

### v1.0.0 (Current)
- Initial API documentation
- Claim endpoint (placeholder)
- Subscribe endpoint (functional)
- Basic error handling

---

**Last Updated**: January 27, 2026
