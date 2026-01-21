import { NextRequest, NextResponse } from 'next/server';

// Example: POST /api/claim
export async function POST(req: NextRequest) {
  // Parse request body
  const data = await req.json();
  // TODO: Implement claim logic (validate wallet, process claim, etc.)
  // For now, just echo back
  return NextResponse.json({ status: 'ok', received: data });
}

// Example: GET /api/claim
export async function GET() {
  // TODO: Implement claim status logic
  return NextResponse.json({ status: 'ok', message: 'Claim endpoint is live.' });
}
