import {
  web3,
  DUST_AMOUNT,
  ONE_ALPH,
  MINIMAL_CONTRACT_DEPOSIT,
  ZERO_ADDRESS,
  stringToHex,
  Token,
  ALPH_TOKEN_ID
} from '@alephium/web3'
import { expectAssertionError, mintToken } from '@alephium/web3-test'
import { PrivateKeyWallet } from '@alephium/web3-wallet'

import {
  alphBalanceOf,
  balanceOf,
  DEFAULT_ALPH_AMOUNT_RANDOM_SIGNER,
  defaultSigner,
  deployGift,
  getRandomSigner,
  transferTokenTo
} from './utils'
import { Gift } from '../artifacts/ts'

describe('integration tests', () => {
  const defaultGroup = 0

  let sender: PrivateKeyWallet
  let receiver: PrivateKeyWallet
  let attacker: PrivateKeyWallet

  beforeEach(async () => {
    sender = await getRandomSigner(defaultGroup)
    receiver = await getRandomSigner(defaultGroup)
    attacker = await getRandomSigner(defaultGroup)

    web3.setCurrentNodeProvider('http://127.0.0.1:22973', undefined, fetch)
  })

  describe('deployment', () => {
    it('should deploy and have balance', async () => {
      const alphAmount = 10n * ONE_ALPH
      const contractResult = await deployGift(defaultSigner, defaultSigner.address, alphAmount, 'my-secret', 2n)
      expect(contractResult).toBeDefined()
      const gift = contractResult.contractInstance

      const state = await Gift.at(gift.address).fetchState()
      expect(state.asset.alphAmount).toEqual(alphAmount)
    })

    it('should deploy and have balance in non-alph token', async () => {
      const tokenAmount = 10n
      const customToken = await mintToken(defaultSigner.address, 2000n * 10n ** 9n)

      const token: Token = { id: customToken.tokenId, amount: tokenAmount }
      const contractResult = await deployGift(
        defaultSigner,
        defaultSigner.address,
        MINIMAL_CONTRACT_DEPOSIT,
        'my-secret',
        2n,
        token
      )
      expect(contractResult).toBeDefined()
      const contractAddress = contractResult.contractInstance.address

      const state = await Gift.at(contractAddress).fetchState()

      expect(state.asset.tokens).toBeDefined()
      expect((state.asset.tokens as Token[]).length).toEqual(1)
      expect((state.asset.tokens as Token[])[0].id).toEqual(customToken.tokenId)
      expect((state.asset.tokens as Token[])[0].amount).toEqual(tokenAmount)
    })
  })

  describe('announce', () => {
    it('should lock the contract when someone announced', async () => {
      const alphAttoAmount = 10n * ONE_ALPH
      const contractResult = await deployGift(sender, sender.address, alphAttoAmount, 'my-secret', 1000n)
      expect(contractResult).toBeDefined()
      const gift = contractResult.contractInstance

      const announcementTime = BigInt(Date.now())
      await gift.transact.announce({
        signer: receiver
      })

      const announcedState = await gift.fetchState()
      expect(announcedState.fields.announcedAddress).toEqual(receiver.address)
      expect(announcedState.fields.announcementLockedUntil).toBeGreaterThan(announcementTime)

      await expectAssertionError(
        gift.transact.announce({
          signer: attacker
        }),
        gift.address,
        Gift.consts.ErrorCodes.GiftLocked
      )

      const announcedAfterState = await gift.fetchState()
      expect(announcedAfterState.fields.announcedAddress).toEqual(receiver.address)
      expect(announcedAfterState.fields.announcementLockedUntil).toEqual(announcedState.fields.announcementLockedUntil)
    })

    it('should be the contract paying for announcements', async () => {
      const alphAmount = 10n * ONE_ALPH
      const contractResult = await deployGift(sender, sender.address, alphAmount, 'my-secret', 30n)
      expect(contractResult).toBeDefined()

      const gift = contractResult.contractInstance
      const initialState = await gift.fetchState()
      expect(initialState.fields.announcedAddress).toEqual(ZERO_ADDRESS)
      expect(initialState.fields.announcementLockedUntil).toEqual(0n)

      // Receiver wallet is empty
      expect(await alphBalanceOf(receiver.address)).toEqual(DEFAULT_ALPH_AMOUNT_RANDOM_SIGNER)

      const announcementTime = BigInt(Date.now())
      await gift.transact.announce({
        signer: receiver
      })

      const announcedState = await gift.fetchState()
      expect(announcedState.fields.announcedAddress).toEqual(receiver.address)
      expect(announcedState.fields.announcementLockedUntil).toBeGreaterThan(announcementTime)
    })
  })

  describe('withdraw', () => {
    it('should work for the expected users', async () => {
      const secret = 'my-secret'
      const alphAttoAmount = 10n * ONE_ALPH
      const contractResult = await deployGift(sender, sender.address, alphAttoAmount, secret, 10n * 1000n)
      expect(contractResult).toBeDefined()
      const gift = contractResult.contractInstance

      const announcementTime = BigInt(Date.now())
      await gift.transact.announce({
        signer: receiver
      })

      const announcedState = await gift.fetchState()
      expect(announcedState.fields.announcedAddress).toEqual(receiver.address)
      expect(announcedState.fields.announcementLockedUntil).toBeGreaterThan(announcementTime)

      // It should fail when secret is wrong
      await expectAssertionError(
        gift.transact.withdraw({
          signer: receiver,
          args: {
            secret: stringToHex('wrong-secret') // This is a wrong secret
          }
        }),
        gift.address,
        Gift.consts.ErrorCodes.WrongSecret
      )

      // It should fail when the withdrawer has not announce (even if has the secret)
      await expectAssertionError(
        gift.transact.withdraw({
          signer: attacker, // The attacker sign the tx
          args: {
            secret: stringToHex(secret)
          }
        }),
        gift.address,
        Gift.consts.ErrorCodes.UnannouncedCaller
      )

      // Legit call should work
      const txWithdraw = await gift.transact.withdraw({
        signer: receiver,
        args: {
          secret: stringToHex(secret)
        }
      })
      expect(txWithdraw).toBeDefined()
      expect(gift.fetchState).rejects.toThrowError(/^Cannot read properties of undefined \(reading 'address'\)/)
    })
  })

  describe('deposit', () => {
    it('should work for ALPH tokens on ALPH gift', async () => {
      const secret = 'my-secret'
      const alphAttoAmount = 10n * ONE_ALPH
      const contractResult = await deployGift(sender, sender.address, alphAttoAmount, secret, 10n * 1000n)
      expect(contractResult).toBeDefined()
      const gift = contractResult.contractInstance

      const depositAmount = 5n * ONE_ALPH
      const txDeposit = await gift.transact.deposit({
        signer: attacker,
        args: {
          tokenId: ALPH_TOKEN_ID
        },
        attoAlphAmount: depositAmount
      })
      expect(txDeposit).toBeDefined()

      const depositState = await gift.fetchState()
      expect(depositState.asset.alphAmount).toEqual(alphAttoAmount + depositAmount)
      expect(depositState.asset.tokens).toBeDefined()
      expect((depositState.asset.tokens as Token[]).length).toEqual(0)
    })

    it('should work for ALPH tokens on non-ALPH gift', async () => {
      const secret = 'my-secret'
      const alphAttoAmount = MINIMAL_CONTRACT_DEPOSIT

      const maxTokenAmount = 2000n * ONE_ALPH
      const customToken = await mintToken(defaultSigner.address, maxTokenAmount)
      const transferedAmount = maxTokenAmount / 10n
      await transferTokenTo(sender.address, customToken.tokenId, transferedAmount)

      expect(await alphBalanceOf(sender.address)).toBeGreaterThan(10n * ONE_ALPH)
      expect(await balanceOf(sender.address)).toEqual([{ id: customToken.tokenId, amount: transferedAmount }])

      const tokenAmount = transferedAmount / 2n
      const token: Token = { id: customToken.tokenId, amount: tokenAmount }
      const contractResult = await deployGift(sender, sender.address, alphAttoAmount, secret, 2n, token)
      expect(contractResult).toBeDefined()
      const gift = contractResult.contractInstance

      const depositAmount = 5n * ONE_ALPH
      const txDeposit = await gift.transact.deposit({
        signer: attacker,
        args: {
          tokenId: ALPH_TOKEN_ID
        },
        attoAlphAmount: depositAmount
      })
      expect(txDeposit).toBeDefined()

      const depositState = await gift.fetchState()
      expect(depositState.asset.alphAmount).toEqual(alphAttoAmount + depositAmount)
      expect(depositState.asset.tokens).toBeDefined()
      expect((depositState.asset.tokens as Token[]).length).toEqual(1)
      expect((depositState.asset.tokens as Token[])[0]).toEqual(token)
    })

    it('should work for non-ALPH tokens on ALPH gift', async () => {
      const secret = 'my-secret'
      const alphAttoAmount = 10n * ONE_ALPH
      const contractResult = await deployGift(sender, sender.address, alphAttoAmount, secret, 10n * 1000n)
      expect(contractResult).toBeDefined()
      const gift = contractResult.contractInstance

      const maxTokenAmount = 2000n * ONE_ALPH
      const customToken = await mintToken(defaultSigner.address, maxTokenAmount)
      const transferedAmount = maxTokenAmount / 10n
      await transferTokenTo(attacker.address, customToken.tokenId, transferedAmount)

      expect(await alphBalanceOf(attacker.address)).toBeGreaterThan(10n * ONE_ALPH)
      expect(await balanceOf(attacker.address)).toEqual([{ id: customToken.tokenId, amount: transferedAmount }])

      const depositAmount = transferedAmount / 2n
      const token = { id: customToken.tokenId, amount: depositAmount }
      const txDeposit = await gift.transact.deposit({
        signer: attacker,
        args: {
          tokenId: token.id
        },
        attoAlphAmount: DUST_AMOUNT,
        tokens: [token]
      })
      expect(txDeposit).toBeDefined()

      const depositState = await gift.fetchState()
      expect(depositState.asset.alphAmount).toEqual(alphAttoAmount)
      expect(depositState.asset.tokens).toBeDefined()
      expect((depositState.asset.tokens as Token[]).length).toEqual(1)
      expect((depositState.asset.tokens as Token[])[0]).toEqual(token)
    })

    it('should work for non-ALPH tokens on same non-ALPH gift', async () => {
      const secret = 'my-secret'
      const alphAttoAmount = MINIMAL_CONTRACT_DEPOSIT

      const maxTokenAmount = 2000n * ONE_ALPH
      const customToken = await mintToken(defaultSigner.address, maxTokenAmount)
      const transferedAmount = maxTokenAmount / 10n
      await transferTokenTo(sender.address, customToken.tokenId, transferedAmount)
      expect(await alphBalanceOf(sender.address)).toBeGreaterThan(10n * ONE_ALPH)
      expect(await balanceOf(sender.address)).toEqual([{ id: customToken.tokenId, amount: transferedAmount }])

      const tokenAmount = transferedAmount / 2n
      const token: Token = { id: customToken.tokenId, amount: tokenAmount }
      const contractResult = await deployGift(sender, sender.address, alphAttoAmount, secret, 2n, token)
      expect(contractResult).toBeDefined()
      const gift = contractResult.contractInstance

      await transferTokenTo(attacker.address, customToken.tokenId, transferedAmount)
      expect(await alphBalanceOf(attacker.address)).toBeGreaterThan(10n * ONE_ALPH)
      expect(await balanceOf(attacker.address)).toEqual([{ id: customToken.tokenId, amount: transferedAmount }])

      const txDeposit = await gift.transact.deposit({
        signer: attacker,
        args: {
          tokenId: token.id
        },
        attoAlphAmount: DUST_AMOUNT,
        tokens: [token]
      })
      expect(txDeposit).toBeDefined()

      const depositState = await gift.fetchState()
      expect(depositState.asset.alphAmount).toEqual(alphAttoAmount)
      expect(depositState.asset.tokens).toBeDefined()
      expect((depositState.asset.tokens as Token[]).length).toEqual(1)
      expect((depositState.asset.tokens as Token[])[0]).toEqual({ id: token.id, amount: 2n * tokenAmount })
    })

    it('should work for non-ALPH tokens on different non-ALPH gift', async () => {
      const secret = 'my-secret'
      const alphAttoAmount = MINIMAL_CONTRACT_DEPOSIT

      const maxTokenAAmount = 2000n * ONE_ALPH
      const customTokenA = await mintToken(defaultSigner.address, maxTokenAAmount)
      const transferedAmountA = maxTokenAAmount / 10n
      await transferTokenTo(sender.address, customTokenA.tokenId, transferedAmountA)
      expect(await alphBalanceOf(sender.address)).toBeGreaterThan(10n * ONE_ALPH)
      expect(await balanceOf(sender.address)).toEqual([{ id: customTokenA.tokenId, amount: transferedAmountA }])

      const tokenAAmount = transferedAmountA / 2n
      const tokenA: Token = { id: customTokenA.tokenId, amount: tokenAAmount }
      const contractResult = await deployGift(sender, sender.address, alphAttoAmount, secret, 2n, tokenA)
      expect(contractResult).toBeDefined()
      const gift = contractResult.contractInstance

      const maxTokenBAmount = 2000n * ONE_ALPH
      const customTokenB = await mintToken(defaultSigner.address, maxTokenBAmount)
      const transferedAmountB = maxTokenAAmount / 10n
      await transferTokenTo(attacker.address, customTokenB.tokenId, transferedAmountB)
      expect(await alphBalanceOf(attacker.address)).toBeGreaterThan(10n * ONE_ALPH)
      expect(await balanceOf(attacker.address)).toEqual([{ id: customTokenB.tokenId, amount: transferedAmountB }])

      const tokenBAmount = transferedAmountB / 2n
      const tokenB: Token = { id: customTokenB.tokenId, amount: tokenBAmount }
      const txDeposit = await gift.transact.deposit({
        signer: attacker,
        args: {
          tokenId: tokenB.id
        },
        attoAlphAmount: DUST_AMOUNT,
        tokens: [tokenB]
      })
      expect(txDeposit).toBeDefined()

      const depositState = await gift.fetchState()
      expect(depositState.asset.alphAmount).toEqual(alphAttoAmount)
      expect(depositState.asset.tokens).toBeDefined()
      expect((depositState.asset.tokens as Token[]).length).toEqual(2)
      const foundToken = [false, false]
      const expectedTokenIds = [tokenA.id, tokenB.id]
      for (const tokenInAsset of depositState.asset.tokens as Token[])
        for (let i = 0; i < expectedTokenIds.length; i++)
          if (tokenInAsset.id === expectedTokenIds[i]) foundToken[i] = true

      for (const isExpectedTokenFound of foundToken) expect(isExpectedTokenFound).toBeTruthy()
    })
  })
})
