import { Buffer } from 'buffer'

export function normalizeGiftAddress(address?: string) {
  return address?.split(':')[0] || ''
}

export function decodeGiftSecret(secret: string) {
  return new Uint8Array(Buffer.from(decodeURIComponent(secret), 'base64'))
}

export function formatGiftAmount(amount: string | bigint, decimals: number) {
  const digits = BigInt(amount)
    .toString()
    .padStart(decimals + 1, '0')
  if (!decimals) return digits
  const fraction = digits.slice(-decimals).replace(/0+$/, '')
  return `${digits.slice(0, -decimals)}${fraction ? `.${fraction}` : ''}`
}

export function claimPermissions({
  connected,
  busy,
  available,
  validSecret,
  announcedAddress,
  connectedAddress,
  zeroAddress,
  lockedUntil,
  now
}: {
  connected: boolean
  busy: boolean
  available: boolean
  validSecret: boolean
  announcedAddress?: string
  connectedAddress?: string
  zeroAddress: string
  lockedUntil: bigint
  now: number
}) {
  const announced = normalizeGiftAddress(announcedAddress)
  const owner = normalizeGiftAddress(connectedAddress)
  const isReserved = Boolean(announced && announced !== zeroAddress)
  const reservedForYou = isReserved && Boolean(owner && announced === owner)
  const timeLocked = lockedUntil > BigInt(now)
  const allowed = connected && !busy && available && validSecret
  return {
    reservedForYou,
    timeLocked,
    reservedForOther: isReserved && !reservedForYou && timeLocked,
    canUnwrap: allowed && !reservedForYou && !timeLocked,
    canClaim: allowed && reservedForYou
  }
}
