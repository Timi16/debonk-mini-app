import { NextRequest, NextResponse } from "next/server";


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://170.75.163.164:5119';
export async function GET_POSITIONS(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const telegramId = searchParams.get('telegramId');
    const chain = searchParams.get('chain');

    if (!telegramId) {
      return NextResponse.json(
        { error: 'telegramId is required' },
        { status: 400 }
      );
    }

    // Build API URL based on whether chain filter is provided
    let apiUrl = `${API_BASE_URL}/api/positions/${telegramId}`;
    if (chain) {
      apiUrl += `/chain/${chain}`;
    }

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Don't cache for real-time positions
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.error || 'Failed to fetch positions' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching positions:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}