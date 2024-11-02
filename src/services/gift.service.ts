import {
  addressFromContractId,
  ALPH_TOKEN_ID,
  DUST_AMOUNT,
  hashMessage,
  MINIMAL_CONTRACT_DEPOSIT,
  Number256,
  number256ToBigint,
  number256ToNumber,
  ONE_ALPH,
  SignerProvider,
  SignExecuteContractMethodParams,
  Token,
  ZERO_ADDRESS
} from '@alephium/web3'
import { Gift, GiftFactory, GiftFactoryTypes, GiftTypes, Giftv2 } from 'artifacts/ts'
import { sha256 } from 'js-sha256'
import { GIFT_FACTORY_ADDRESS } from './utils'

export const createGift = async (
  amount: bigint,
  decimalsAmount: number,
  sender: any,
  senderAddress: string,
  secret: Uint8Array,
  announcementLockIntervall: bigint,
  tokenId: string,
  decimal: number,
  announcementLockedUntil: bigint
) => {
   const amountDecimals = BigInt(decimal-decimalsAmount)

   const data: GiftFactoryTypes.SignExecuteMethodParams<'createGift'> = {
    args: {
       hashedSecret: sha256(secret),
       announcementLockIntervall: announcementLockIntervall,
       version: 1n,
       isCancellable: true,
       announcedAddress: ZERO_ADDRESS,
       announcementLockedUntil: announcementLockedUntil,
       givenTokenId: ALPH_TOKEN_ID,
       amount: amount*10n**amountDecimals
    },
    signer: sender,
    attoAlphAmount: amount*10n**amountDecimals
  }

  if (tokenId !== ALPH_TOKEN_ID) {
    data.args.givenTokenId = tokenId
    data.args.amount = amount*10n ** amountDecimals

    data.attoAlphAmount = MINIMAL_CONTRACT_DEPOSIT + DUST_AMOUNT
    data.tokens = [{ id: tokenId, amount: amount * 10n ** amountDecimals }]
  }

  return await GiftFactory.at(GIFT_FACTORY_ADDRESS).transact.createGift(data)
}

export const giftDeposit = async (
  contractId: string,
  amount: bigint,
  decimalsAmount: number,
  sender: SignerProvider,
  tokenId: string,
  decimal: number
) => {
   const amountDecimals = BigInt(decimal-decimalsAmount)

  const data: GiftTypes.SignExecuteMethodParams<'deposit'> = {
    args: {
      tokenId: ALPH_TOKEN_ID
    },
    signer: sender,
    attoAlphAmount: amount * amountDecimals
  }

  if (tokenId !== ALPH_TOKEN_ID) {
    data.args.tokenId = tokenId

    data.attoAlphAmount = MINIMAL_CONTRACT_DEPOSIT
    data.tokens = [{ id: tokenId, amount: amount * 10n ** amountDecimals }]
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

export const claimv2 = async (signer: SignerProvider, secretDecoded: Uint8Array, contractId: string, addressWithdrawTo: string) => {
   console.log(addressWithdrawTo)
   return await Giftv2.at(addressFromContractId(contractId)).transact.withdraw({
     args: {
        secret: Buffer.from(secretDecoded).toString('hex'),
        to: addressWithdrawTo
     },
     signer: signer
   })
 }


export const announce = async (signer: SignerProvider, contractId: string) => {
  return await Gift.at(addressFromContractId(contractId)).transact.announce({
    signer: signer
  })
}

export const cancel = async (signer: SignerProvider, contractId: string) => {
   return await Gift.at(addressFromContractId(contractId)).transact.cancel({
     signer: signer
   })
 }
