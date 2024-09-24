import {
  addressFromContractId,
  ALPH_TOKEN_ID,
  DUST_AMOUNT,
  hashMessage,
  MINIMAL_CONTRACT_DEPOSIT,
  Number256,
  ONE_ALPH,
  SignerProvider,
  SignExecuteContractMethodParams,
  Token,
  ZERO_ADDRESS
} from '@alephium/web3'
import { Gift, GiftFactory, GiftFactoryTypes, GiftTypes } from 'artifacts/ts'
import { sha256 } from 'js-sha256'
import { GIFT_FACTORY_CONTRACT_ADDRESS } from './utils'

export const createGift = async (
  amount: bigint,
  sender: any,
  senderAddress: string,
  secret: Uint8Array,
  announcementLockIntervall: bigint,
  tokenId: string,
  decimal: number
) => {
  const data: GiftFactoryTypes.SignExecuteMethodParams<'createGift'> = {
    args: {
      hashedSecret: sha256(secret),
      announcementLockIntervall: announcementLockIntervall,
      version: 0n,
      isCancellable: false,
      announcedAddress: ZERO_ADDRESS,
      announcementLockedUntil: 0n,
      givenTokenId: ALPH_TOKEN_ID
    },
    signer: sender,
    attoAlphAmount: amount * ONE_ALPH
  }

  console.log(data)
  if (tokenId !== ALPH_TOKEN_ID) {
    data.args.givenTokenId = tokenId

    data.attoAlphAmount = MINIMAL_CONTRACT_DEPOSIT
    data.tokens = [{ id: tokenId, amount: amount * 10n ** BigInt(decimal) }]
  }

  return await GiftFactory.at(GIFT_FACTORY_CONTRACT_ADDRESS).transact.createGift(data)
}

export const giftDeposit = async (
  contractId: string,
  amount: bigint,
  sender: any,
  tokenId: string,
  decimal: number
) => {
  const data: GiftTypes.SignExecuteMethodParams<'deposit'> = {
    args: {
      tokenId: ALPH_TOKEN_ID
    },
    signer: sender,
    attoAlphAmount: amount * ONE_ALPH
  }

  if (tokenId !== ALPH_TOKEN_ID) {
    data.args.tokenId = tokenId

    data.attoAlphAmount = MINIMAL_CONTRACT_DEPOSIT
    data.tokens = [{ id: tokenId, amount: amount * 10n ** BigInt(decimal) }]
  }

  return await Gift.at(addressFromContractId(contractId)).transact.deposit(data)
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
