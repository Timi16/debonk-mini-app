import { NextRequest, NextResponse } from "next/server";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://170.75.163.164:5119';
export async function GET_ADDRESS(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const telegramId = searchParams.get('telegramId');
    const chain = searchParams.get('chain');

    if (!telegramId || !chain) {
      return NextResponse.json(
        { error: 'telegramId and chain are required' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${API_BASE_URL}/api/wallet/${telegramId}/${chain}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.error || 'Failed to fetch wallet address' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching wallet address:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
