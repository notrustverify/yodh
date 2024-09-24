import { hashMessage, ZERO_ADDRESS } from '@alephium/web3'
import { GiftTypes } from '../artifacts/ts'
import giftConfig from '../config'

export const defaultGiftParams: GiftTypes.Fields = {
  sender: ZERO_ADDRESS,
  hashedSecret: hashMessage('NOT_A_SECRET', giftConfig.hashAlgo),
  announcementLockIntervall: 0n,
  announcedAddress: ZERO_ADDRESS,
  announcementLockedUntil: 0n,
  version: 1n,
  isCancellable: true,
  initialUsdPrice: 0n
}
