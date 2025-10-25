import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chainSymbol = searchParams.get("symbol") || "SOL"

    const COINGECKO_SIMPLE_PRICE = "https://api.coingecko.com/api/v3/simple/price"

    // Map symbols to CoinGecko IDs
    const COINGECKO_ID_MAP: Record<string, string> = {
      ETH: "ethereum",
      BNB: "binancecoin",
      MATIC: "matic-network",
      AVAX: "avalanche-2",
      FTM: "fantom",
      SOL: "solana",
      "0G": "zero-gravity",
    }

    const id = COINGECKO_ID_MAP[chainSymbol]
    if (!id) {
      return NextResponse.json({ error: `No mapping found for ${chainSymbol}` }, { status: 400 })
    }

    const params = new URLSearchParams({
      ids: id,
      vs_currencies: "usd",
    })

    const headers: Record<string, string> = { Accept: "application/json" }
    if (process.env.COINGECKO_API_KEY) {
      headers["x-cg-demo-api-key"] = process.env.COINGECKO_API_KEY
    }

    const res = await fetch(`${COINGECKO_SIMPLE_PRICE}?${params.toString()}`, {
      headers,
      cache: "no-store",
    })

    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`CoinGecko request failed (${res.status}): ${body}`)
    }

    const data = await res.json()
    const price = data?.[id]?.usd

    if (typeof price !== "number") {
      throw new Error(`Invalid response from CoinGecko: missing ${id}.usd`)
    }

    return NextResponse.json({ price })
  } catch (error) {
    console.error("Price API error:", error)
    return NextResponse.json({ error: "Failed to fetch price", price: 150 }, { status: 500 })
  }
}
