const CACHE_DURATION = 60000 // 1 minute
const pendingRequests = new Map<string, Promise<number | null>>()
const priceCache = new Map<string, { price: number | null; timestamp: number }>()

export async function getCachedPrice(symbol: string): Promise<number | null> {
  const now = Date.now()

  // Check if we have a valid cached price
  const cached = priceCache.get(symbol)
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    console.log(`[v0] Using cached price for ${symbol}: $${cached.price}`)
    return cached.price
  }

  // Check if a request is already pending for this symbol
  if (pendingRequests.has(symbol)) {
    console.log(`[v0] Waiting for pending request for ${symbol}`)
    return pendingRequests.get(symbol)!
  }

  // Make new request
  const request = fetchPrice(symbol)
  pendingRequests.set(symbol, request)

  try {
    const price = await request
    priceCache.set(symbol, { price, timestamp: now })
    return price
  } finally {
    pendingRequests.delete(symbol)
  }
}

async function fetchPrice(symbol: string): Promise<number | null> {
  try {
    const res = await fetch(`/api/price?symbol=${encodeURIComponent(symbol)}`)
    const data = await res.json()
    return data.price || null
  } catch (error) {
    console.error(`[v0] Failed to fetch price for ${symbol}:`, error)
    return null
  }
}

export function clearPriceCache() {
  priceCache.clear()
}
