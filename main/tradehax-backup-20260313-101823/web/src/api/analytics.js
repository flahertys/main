import { getSignalAccuracy } from '../api/db/metrics-repository';

export async function GET(req) {
  // Parse query parameters
  const url = new URL(req.url);
  const metric = url.searchParams.get('metric');

  if (metric === 'signals') {
    const data = await getSignalAccuracy(30);
    return Response.json(data);
  }

  return Response.json({ error: 'Unknown metric' }, { status: 400 });
}

