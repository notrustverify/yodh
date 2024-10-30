import {
  addressFromContractId,
  ALPH_TOKEN_ID,
  DUST_AMOUNT,
  hashMessage,
  MINIMAL_CONTRACT_DEPOSIT,
  ONE_ALPH,
  Token,
  web3,
  ZERO_ADDRESS
} from '@alephium/web3'
import { PrivateKeyWallet } from '@alephium/web3-wallet'
import { mintToken } from '@alephium/web3-test'

import {
  alphBalanceOf,
  balanceOf,
  defaultSigner,
  deployGiftFactory,
  getRandomSigner,
  ORACLE_INIT_VALUE,
  transferTokenTo
} from './utils'
import { Gift, GiftFactory } from '../artifacts/ts'
import giftConfig from '../config'

describe('integration tests', () => {
  const defaultGroup = 0

  let sender: PrivateKeyWallet

  beforeEach(async () => {
    sender = await getRandomSigner(defaultGroup)

    web3.setCurrentNodeProvider('http://127.0.0.1:22973', undefined, fetch)

    //console.warn(`Sender: ${sender.address}`)
  })

  describe('factory', () => {
    it('should deploy', async () => {
      const contractResult = await deployGiftFactory(defaultSigner)
      expect(contractResult).toBeDefined()
      const giftFactory = contractResult.contractInstance

      const state = await GiftFactory.at(giftFactory.address).fetchState()
      expect(state.fields.giftTemplateId).toBeDefined()
    })
  })

  describe('gift creation', () => {
    it('should work for ALPH gift', async () => {
      const contractResult = await deployGiftFactory(defaultSigner)
      expect(contractResult).toBeDefined()
      const giftFactory = contractResult.contractInstance

      const hashedSecret = hashMessage('SECRET_SECRET', giftConfig.hashAlgo)

      const amountToGive = 10n * ONE_ALPH
      const totalAmountToCreateGift = amountToGive + MINIMAL_CONTRACT_DEPOSIT


      const giftArgs = {
        hashedSecret,
        announcementLockIntervall: 30n,
        version: 1n,
        isCancellable: true,
        announcedAddress: ZERO_ADDRESS,
        announcementLockedUntil: 0n,
        amount: amountToGive
      }
      const createGiftArgs = { ...giftArgs, givenTokenId: ALPH_TOKEN_ID }


      const txCreateGift = await giftFactory.transact.createGift({
        signer: sender,
        args: createGiftArgs,
        attoAlphAmount: totalAmountToCreateGift
      })

      // Check that event is emitted
      const { events } = await web3
        .getCurrentNodeProvider()
        .events.getEventsContractContractaddress(giftFactory.address, { start: 0 })
      expect(events.length).toEqual(1)

      const creationEvent = events[0]
      expect(creationEvent.txId).toEqual(txCreateGift.txId)

      expect(creationEvent.fields[0].type).toEqual('ByteVec')
      const giftContractId = creationEvent.fields[0].value as string
      const createdGift = Gift.at(addressFromContractId(giftContractId))
      expect(createdGift).toBeDefined()

      expect(creationEvent.fields[1].type).toEqual('Address')
      const giftContractCreator = creationEvent.fields[1].value
      expect(giftContractCreator).toEqual(sender.address)

      // Check that created event matches provided values
      const giftState = await Gift.at(createdGift.address).fetchState()
      expect(Object.keys(giftState.fields).length).toEqual(Object.keys(giftArgs).length + 1) // added sender and initialUsdPrice
      // Check that provided values are forwarded
      expect(giftState.fields.announcedAddress).toEqual(giftArgs.announcedAddress)
      expect(giftState.fields.announcementLockIntervall).toEqual(giftArgs.announcementLockIntervall)
      expect(giftState.fields.announcementLockedUntil).toEqual(giftArgs.announcementLockedUntil)
      expect(giftState.fields.hashedSecret).toEqual(giftArgs.hashedSecret)
      expect(giftState.fields.isCancellable).toEqual(giftArgs.isCancellable)
      expect(giftState.fields.version).toEqual(giftArgs.version)
      // Check that added fields are correctly computed
      expect(giftState.fields.sender).toEqual(sender.address)
      expect(giftState.fields.initialUsdPrice).toBeDefined()
      //expect(giftState.fields.initialUsdPrice).toEqual((amountToGive + MINIMAL_CONTRACT_DEPOSIT) / (ORACLE_INIT_VALUE*ALPH_PRICE_DECIMALS))
      // Gift should hold the expected value
      expect(giftState.asset.alphAmount).toEqual(amountToGive)
      expect(giftState.asset.tokens).toBeDefined()
      expect(giftState.asset.tokens?.length).toEqual(0)

      // Ensures that giftFactory did not take any assets
      const giftFactoryState = await GiftFactory.at(giftFactory.address).fetchState()
      expect(giftFactoryState.asset.alphAmount).toEqual(MINIMAL_CONTRACT_DEPOSIT)
      expect(giftFactoryState.asset.tokens).toBeDefined()
      expect(giftFactoryState.asset.tokens?.length).toEqual(0)
    })

    it('should work for non-ALPH gift', async () => {
      const contractResult = await deployGiftFactory(defaultSigner)
      expect(contractResult).toBeDefined()
      const giftFactory = contractResult.contractInstance

      // create fake token to be offered as gift
      const maxTokenAmount = 2000n * 10n ** 9n
      const customToken = await mintToken(defaultSigner.address, maxTokenAmount)
      const transferedAmount = maxTokenAmount / 10n
      await transferTokenTo(sender.address, customToken.tokenId, transferedAmount)

      expect(await alphBalanceOf(sender.address)).toBeGreaterThan(10n * ONE_ALPH)
      expect(await balanceOf(sender.address)).toEqual([{ id: customToken.tokenId, amount: transferedAmount }])

      const hashedSecret = hashMessage('SECRET_SECRET', giftConfig.hashAlgo)
      const tokenAmount = transferedAmount / 2n
      const token: Token = { id: customToken.tokenId, amount: tokenAmount }

      const giftArgs = {
        hashedSecret,
        announcementLockIntervall: 30n,
        version: 1n,
        isCancellable: true,
        announcedAddress: ZERO_ADDRESS,
        announcementLockedUntil: 0n,
        amount: tokenAmount
      }
      const createGiftArgs = { ...giftArgs, givenTokenId: customToken.tokenId }



      const txCreateGift = await giftFactory.transact.createGift({
        signer: sender,
        args: createGiftArgs,
        attoAlphAmount: DUST_AMOUNT + MINIMAL_CONTRACT_DEPOSIT,
        tokens: [token],
      })

      // Check that event is emitted
      const { events } = await web3
        .getCurrentNodeProvider()
        .events.getEventsContractContractaddress(giftFactory.address, { start: 0 })
      expect(events.length).toEqual(1)

      const creationEvent = events[0]
      expect(creationEvent.txId).toEqual(txCreateGift.txId)

      expect(creationEvent.fields[0].type).toEqual('ByteVec')
      const giftContractId = creationEvent.fields[0].value as string
      const createdGift = Gift.at(addressFromContractId(giftContractId))
      expect(createdGift).toBeDefined()

      expect(creationEvent.fields[1].type).toEqual('Address')
      const giftContractCreator = creationEvent.fields[1].value
      expect(giftContractCreator).toEqual(sender.address)

      // Check that created event matches provided values
      const giftState = await Gift.at(createdGift.address).fetchState()
      expect(Object.keys(giftState.fields).length).toEqual(Object.keys(giftArgs).length + 1) // added sender and initialUsdPrice
      // Check that provided values are forwarded
      expect(giftState.fields.announcedAddress).toEqual(giftArgs.announcedAddress)
      expect(giftState.fields.announcementLockIntervall).toEqual(giftArgs.announcementLockIntervall)
      expect(giftState.fields.announcementLockedUntil).toEqual(giftArgs.announcementLockedUntil)
      expect(giftState.fields.hashedSecret).toEqual(giftArgs.hashedSecret)
      expect(giftState.fields.isCancellable).toEqual(giftArgs.isCancellable)
      expect(giftState.fields.version).toEqual(giftArgs.version)
      // Check that added fields are correctly computed
      expect(giftState.fields.sender).toEqual(sender.address)
      expect(giftState.fields.initialUsdPrice).toBeDefined()
      expect(giftState.fields.initialUsdPrice).toEqual(0n) // Should be zero since non-alph token price not fetched
      // Gift should hold the expected value
      expect(giftState.asset.alphAmount).toEqual(MINIMAL_CONTRACT_DEPOSIT)
      expect(giftState.asset.tokens).toBeDefined()
      expect(giftState.asset.tokens?.length).toEqual(1)
      expect(giftState.asset.tokens?.at(0)).toEqual(token)

      // Ensures that giftFactory did not take any assets
      const giftFactoryState = await GiftFactory.at(giftFactory.address).fetchState()
      expect(giftFactoryState.asset.alphAmount).toEqual(MINIMAL_CONTRACT_DEPOSIT)
      expect(giftFactoryState.asset.tokens).toBeDefined()
      expect(giftFactoryState.asset.tokens?.length).toEqual(0)
    })
  })
})
