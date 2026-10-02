import { claimPermissions, decodeGiftSecret, formatGiftAmount, normalizeGiftAddress } from '../src/services/claim'

const base = {
  connected: true,
  busy: false,
  available: true,
  validSecret: true,
  announcedAddress: 'zero',
  connectedAddress: 'my-wallet',
  zeroAddress: 'zero',
  lockedUntil: 0n,
  now: 1000
}

describe('claim permissions', () => {
  it('starts with unwrapping an available gift', () => {
    expect(claimPermissions(base)).toMatchObject({ canUnwrap: true, canClaim: false })
  })
  it('allows the reserving wallet to receive immediately during its reservation', () => {
    expect(claimPermissions({ ...base, announcedAddress: 'my-wallet:0', lockedUntil: 2000n })).toMatchObject({
      canUnwrap: false,
      canClaim: true,
      reservedForYou: true
    })
  })
  it('blocks other wallets until the reservation expires, then allows unwrapping', () => {
    expect(claimPermissions({ ...base, announcedAddress: 'other-wallet', lockedUntil: 2000n })).toMatchObject({
      canUnwrap: false,
      canClaim: false,
      reservedForOther: true
    })
    expect(claimPermissions({ ...base, announcedAddress: 'other-wallet', lockedUntil: 1000n })).toMatchObject({
      canUnwrap: true,
      canClaim: false,
      reservedForOther: false
    })
  })
  it('respects scheduled opening times', () => {
    expect(claimPermissions({ ...base, lockedUntil: 2000n })).toMatchObject({ canUnwrap: false, timeLocked: true })
  })
  it.each([{ connected: false }, { busy: true }, { available: false }, { validSecret: false }])(
    'blocks signing when %j',
    (condition) => {
      expect(claimPermissions({ ...base, ...condition })).toMatchObject({ canUnwrap: false, canClaim: false })
      expect(claimPermissions({ ...base, announcedAddress: 'my-wallet', ...condition })).toMatchObject({
        canUnwrap: false,
        canClaim: false
      })
    }
  )
})

describe('gift display and decoding', () => {
  it('shows amounts without floating point rounding or scientific notation', () => {
    expect(formatGiftAmount(1n, 18)).toBe('0.000000000000000001')
    expect(formatGiftAmount(123450000000000000000n, 18)).toBe('123.45')
    expect(formatGiftAmount(12345n, 0)).toBe('12345')
  })
  it('decodes a URL encoded binary gift secret', () => {
    expect(decodeGiftSecret('%2F%2F8%3D')).toEqual(new Uint8Array([255, 255]))
  })
  it('normalizes SDK address suffixes', () => {
    expect(normalizeGiftAddress('address:0')).toBe('address')
    expect(normalizeGiftAddress()).toBe('')
  })
})
