import { web3, DUST_AMOUNT, ONE_ALPH, MINIMAL_CONTRACT_DEPOSIT, ZERO_ADDRESS, convertAlphAmountWithDecimals } from '@alephium/web3'
import { expectAssertionError, mintToken } from '@alephium/web3-test'
import { PrivateKeyWallet } from '@alephium/web3-wallet'

import { alphBalanceOf, DEFAULT_ALPH_AMOUNT_RANDOM_SIGNER, defaultSigner, deployGift, getRandomSigner } from './utils'
import { Gift } from '../artifacts/ts'

web3.setCurrentNodeProvider("http://127.0.0.1:22973", undefined, fetch);

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

  it('should deploy and have balance', async () => {
    const alphAmount = 10n * ONE_ALPH
    const contractResult = await deployGift(defaultSigner, defaultSigner.address, alphAmount, "my-secret", 2n)
    expect(contractResult).toBeDefined()
    const gift = contractResult.contractInstance

    const state = await Gift.at(gift.address).fetchState()
    expect(state.asset.alphAmount).toEqual(alphAmount)
  })

  it('should deploy and have balance in non-alph token', async () => {
    const tokenAmount = 10n
    const customToken = await mintToken(defaultSigner.address, 2000n * 10n ** 9n);
    
    const contractResult = await deployGift(defaultSigner, defaultSigner.address, MINIMAL_CONTRACT_DEPOSIT + DUST_AMOUNT, "my-secret", 2n, [{ id: customToken.tokenId, amount: tokenAmount }])
    expect(contractResult).toBeDefined()
    const contractAddress = contractResult.contractInstance.address

    const state = await Gift.at(contractAddress).fetchState()

    expect(state.asset.tokens![0].id).toEqual(customToken.tokenId)
    expect(state.asset.tokens![0].amount).toEqual(tokenAmount)
  })

  it('should lock the contract when someone announced', async () => {
    const alphAttoAmount = convertAlphAmountWithDecimals(10)!
    const contractResult = await deployGift(sender, sender.address, alphAttoAmount, "my-secret", 1000n)
    expect(contractResult).toBeDefined()
    const gift = contractResult.contractInstance

    const txAnnounce = await gift.transact.announce({
      signer: receiver
    })
    const announcementTime = BigInt(Date.now())

    const announcedState = await gift.fetchState()
    expect(announcedState.fields.announcedAddress).toEqual(receiver.address)
    expect(announcedState.fields.announcementLockedUntil).toBeGreaterThan(announcementTime)

    await expectAssertionError(gift.transact.announce({
      signer: attacker
    }), gift.address, Gift.consts.ErrorCodes.GiftLocked)

    const announcedAfterState = await gift.fetchState()
    expect(announcedAfterState.fields.announcedAddress).toEqual(receiver.address)
    expect(announcedAfterState.fields.announcementLockedUntil).toEqual(announcedState.fields.announcementLockedUntil)
  })

  it('should be the contract paying for announcements', async () => {
    const alphAmount = 10n * ONE_ALPH
    const contractResult = await deployGift(sender, sender.address, alphAmount, "my-secret", 30n)
    expect(contractResult).toBeDefined()

    const gift = contractResult.contractInstance
    const initialState = await gift.fetchState()
    expect(initialState.fields.announcedAddress).toEqual(ZERO_ADDRESS)
    expect(initialState.fields.announcementLockedUntil).toEqual(0n)

    // Receiver wallet is empty
    expect(await alphBalanceOf(receiver.address)).toEqual(DEFAULT_ALPH_AMOUNT_RANDOM_SIGNER)

    await gift.transact.announce({
      signer: receiver,      
    })
    const announcementTime = BigInt(Date.now())

    const announcedState = await gift.fetchState()
    expect(announcedState.fields.announcedAddress).toEqual(receiver.address)
    expect(announcedState.fields.announcementLockedUntil).toBeGreaterThan(announcementTime)
  })

  /*
  it('should withdraw on devnet', async () => {
    const signer = await testNodeWallet()
    const deployments = await deployToDevnet()

    // Test with all of the addresses of the wallet
    for (const account of await signer.getAccounts()) {
      const testAddress = account.address
      await signer.setSelectedAccount(testAddress)
      const testGroup = account.group

      const faucet = deployments.getInstance(TokenFaucet, testGroup)
      if (faucet === undefined) {
        console.log(`The contract is not deployed on group ${account.group}`)
        continue
      }

      expect(faucet.groupIndex).toEqual(testGroup)
      const initialState = await faucet.fetchState()
      const initialBalance = initialState.fields.balance

      // Call `withdraw` function 10 times
      for (let i = 0; i < 10; i++) {
        await faucet.transact.withdraw({
          signer: signer,
          attoAlphAmount: DUST_AMOUNT * 3n,
          args: { amount: 1n }
        })

        const newState = await faucet.fetchState()
        const newBalance = newState.fields.balance
        expect(newBalance).toEqual(initialBalance - BigInt(i) - 1n)
      }
    }
  }, 20000)
  */
})