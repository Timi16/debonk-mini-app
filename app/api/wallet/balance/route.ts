import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://170.75.163.164:5119';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const telegramId = searchParams.get('telegramId');
    const chain = searchParams.get('chain');
    const tokenAddress = searchParams.get('tokenAddress');

    if (!telegramId || !chain) {
      return NextResponse.json(
        { error: 'telegramId and chain are required' },
        { status: 400 }
      );
    }

    // Build API URL based on whether tokenAddress is provided
    let apiUrl = `${API_BASE_URL}/api/balance/${telegramId}/${chain}`;
    if (tokenAddress) {
      apiUrl += `/${tokenAddress}`;
    }

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Don't cache for real-time balance
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.error || 'Failed to fetch balance' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching balance:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
