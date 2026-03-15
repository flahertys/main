import { getPlayPickerMarkets } from '../lib/play-picker-backend';

export async function GET(req) {
  const markets = await getPlayPickerMarkets();
  return Response.json({ markets });
}

