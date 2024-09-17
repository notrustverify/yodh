import { addressFromContractId, hashMessage, Number256, SignerProvider, Token, ZERO_ADDRESS } from '@alephium/web3'
import { Gift } from 'artifacts/ts'
import { sha256 } from 'js-sha256'

export const createGift = async (
  amount: bigint,
  sender: any,
  senderAddress: string,
  secret: Uint8Array,
  announcementLockIntervall: bigint,
  tokens: Array<Token> = []
) => {
  return await Gift.deploy(sender, {
     initialAttoAlphAmount: amount * 10n ** 18n,
     initialTokenAmounts: tokens,
     initialFields: {
      sender: senderAddress,
      hashedSecret: sha256(secret),
      announcementLockIntervall: announcementLockIntervall,
      announcedAddress: ZERO_ADDRESS,
      announcementLockedUntil: 0n,
      version: 1n,
      isCancellable: false
     }
  })
}

export const checkHash = (secret: Uint8Array, hashedSecretContract: string | undefined) => {
  return sha256(secret) === hashedSecretContract
}

export const getContractState = async (contractId: string) => {
  return await Gift.at(addressFromContractId(contractId)).fetchState()
}

export const claim = async (signer: SignerProvider, secretDecoded: Uint8Array, contractId: string) => {
  return await Gift.at(addressFromContractId(contractId)).transact.withdraw({
    args: {
      secret: Buffer.from(secretDecoded).toString('hex')
    },
    signer: signer
  })
}

export const announce = async (signer: SignerProvider, contractId: string) => {
  return await Gift.at(addressFromContractId(contractId)).transact.announce({
    signer: signer
  })
}
