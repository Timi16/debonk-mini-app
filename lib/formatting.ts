export const formatMarketCap = (mc: number): string => {
  if (mc >= 1e9) return `$${(mc / 1e9).toFixed(1)}B`
  if (mc >= 1e6) return `$${(mc / 1e6).toFixed(1)}M`
  if (mc >= 1e3) return `$${(mc / 1e3).toFixed(1)}K`
  return `$${mc.toFixed(0)}`
}

export const formatChange = (val: number | undefined): string => {
  if (val === undefined) return "0.00%"
  return `${val >= 0 ? "+" : ""}${val.toFixed(2)}%`
}

export const formatPrice = (price: number, decimals = 4): string => {
  return `$${price.toFixed(decimals)}`
}

export const formatVolume = (volume: number): string => {
  return `$${volume.toLocaleString()}`
}
