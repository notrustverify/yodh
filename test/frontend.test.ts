import { convertToInt, getGiftUrl } from '../src/services/utils'
import { Buffer } from 'buffer'

describe('gift amount input', () => {
  it.each([
    ['10', 10n, 0],
    ['0.000000000000000001', 1n, 18],
    ['12345678901234567890.123456789012345678', 12345678901234567890123456789012345678n, 18],
    ['1.20', 120n, 2]
  ])('preserves the exact value of %s', (input, amount, decimals) => {
    expect(convertToInt(input as string)).toEqual([amount, decimals])
  })
  it.each(['', '0', '0.00', '-1', '1.2.3', '1e5', 'NaN', '.5', '1.'])('rejects invalid amount %s', (input) => {
    expect(() => convertToInt(input)).toThrow()
  })
})

describe('gift links', () => {
  it('round-trips a binary secret and messages containing URL delimiters', () => {
    const secret = new Uint8Array([0, 255, 128, 63, 254])
    const message = 'Happy birthday! & # + 🎉'
    const url = new URL(getGiftUrl('a'.repeat(64), secret, message))
    const params = new URLSearchParams(url.hash.slice(1))
    expect(params.get('contract')).toBe('a'.repeat(64))
    expect(params.get('msg')).toBe(message)
    expect(new Uint8Array(Buffer.from(params.get('secret')!, 'base64'))).toEqual(secret)
  })
})

describe('password-protected PDF links', () => {
  it('omits both the secret and password while preserving the message', () => {
    const message = 'A gift & a surprise!'
    const url = new URL(getGiftUrl('b'.repeat(64), new TextEncoder().encode('private-password'), message, true))
    const params = new URLSearchParams(url.hash.slice(1))
    expect(params.get('contract')).toBe('b'.repeat(64))
    expect(params.get('msg')).toBe(message)
    expect(params.has('secret')).toBe(false)
    expect(url.toString()).not.toContain('private-password')
  })
})
