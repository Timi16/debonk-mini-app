import { NextResponse } from "next/server";


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://170.75.163.164:5119';
export async function GET_CHAINS() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chains`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.error || 'Failed to fetch chains' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching chains:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}