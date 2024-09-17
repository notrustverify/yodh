import { web3, TestContractParams, addressFromContractId, AssetOutput, ZERO_ADDRESS, stringToHex, DEFAULT_GAS_AMOUNT, ContractOutput, convertAlphAmountWithDecimals, ContractDestroyedEvent, Contract } from '@alephium/web3'
import { expectAssertionError, randomContractId } from '@alephium/web3-test'

import { Gift, GiftTypes } from '../artifacts/ts'
import { getRandomSigner } from './utils';
import { PrivateKeyWallet } from '@alephium/web3-wallet';

web3.setCurrentNodeProvider("http://127.0.0.1:22973", undefined, fetch);

// From https://docs.alephium.org/dapps/constants
const MAX_GAS_PER_TX = convertAlphAmountWithDecimals(0.5)!
const MAX_EXECUTION_FEE_PER_TX = convertAlphAmountWithDecimals(1)! // Unsure

describe('unit tests', () => {
  let testContractId: string
  let testTokenId: string
  let testContractAddress: string
  let contractVersion: bigint
  let sender: PrivateKeyWallet
  let receiver: PrivateKeyWallet
  let attacker: PrivateKeyWallet
  let testParamsFixture: TestContractParams<GiftTypes.Fields, { secret: string }>

  // We initialize the fixture variables before all tests
  beforeEach(async () => {
    testContractId = randomContractId()
    testTokenId = testContractId
    testContractAddress = addressFromContractId(testContractId)
    contractVersion = 1n

    sender = await getRandomSigner()
    receiver = await getRandomSigner()
    attacker = await getRandomSigner()
  
    testParamsFixture = {
      // a random address that the test contract resides in the tests
      address: testContractAddress,
      // assets owned by the test contract before a test
      initialAsset: { alphAmount: 10n ** 18n },
      // initial state of the test contract
      initialFields: {
        sender: sender.address,
        hashedSecret: stringToHex("super-secret"),
        announcementLockIntervall: 10n * 1000n, // in milliseconds
        version: contractVersion,
        announcedAddress: ZERO_ADDRESS,
        announcementLockedUntil: 0n,
        isCancellable: true,
      },
      // arguments to test the target function of the test contract
      testArgs: { secret: stringToHex("test-secret") },
      // assets owned by the caller of the function
      //inputAssets: [{ address: testAddress, asset: { alphAmount: 10n ** 18n } }]
    }

    //console.warn(`ContractAddress: ${testContractAddress}\nSender: ${sender.address}\nReceiver: ${receiver.address}`)
  })

  /*
  describe('test withdraw', () => {
    it('should work', async () => {
      const testParams = testParamsFixture
      const testResult = await Gift.tests.announce(testParams)

      // only one contract involved in the test
      const contractState = testResult.contracts[0] as GiftTypes.State
      expect(contractState.address).toEqual(testContractAddress)
      expect(contractState.fields.supply).toEqual(10n ** 18n)
      // the balance of the test token is: 10 - 1 = 9
      expect(contractState.fields.balance).toEqual(9n)
      // double check the balance of the contract assets
      expect(contractState.asset).toEqual({ alphAmount: 10n ** 18n, tokens: [{ id: testTokenId, amount: 9n }] })

      // three transaction outputs in total
      expect(testResult.txOutputs.length).toEqual(3)

      // the first transaction output is for the token
      const tokenOutput = testResult.txOutputs[0] as AssetOutput
      expect(tokenOutput.type).toEqual('AssetOutput')
      expect(tokenOutput.address).toEqual(testAddress)
      expect(tokenOutput.alphAmount).toEqual(DUST_AMOUNT) // dust amount
      // the caller withdrawn 1 token from the contract
      expect(tokenOutput.tokens).toEqual([{ id: testTokenId, amount: 1n }])

      // the second transaction output is for the ALPH
      const alphOutput = testResult.txOutputs[1] as AssetOutput
      expect(alphOutput.type).toEqual('AssetOutput')
      expect(alphOutput.address).toEqual(testAddress)
      expect(alphOutput.alphAmount).toBeLessThan(10n ** 18n) // the caller paid gas
      expect(alphOutput.tokens).toEqual([])

      // the third transaction output is for the contract
      const contractOutput = testResult.txOutputs[2]
      expect(contractOutput.type).toEqual('ContractOutput')
      expect(contractOutput.address).toEqual(testContractAddress)
      expect(contractOutput.alphAmount).toEqual(10n ** 18n)
      // the contract has transferred 1 token to the caller
      expect(contractOutput.tokens).toEqual([{ id: testTokenId, amount: 9n }])

      // a `Withdraw` event is emitted when the test passes
      expect(testResult.events.length).toEqual(1)
      const event = testResult.events[0] as TokenFaucetTypes.WithdrawEvent
      // the event is emitted by the test contract
      expect(event.contractAddress).toEqual(testContractAddress)
      // the name of the event is `Withdraw`
      expect(event.name).toEqual('Withdraw')
      // the first field of the event
      expect(event.fields.to).toEqual(testAddress)
      // the second field of the event
      expect(event.fields.amount).toEqual(1n)

      // the test framework support debug messages too
      // debug will be disabled automatically at the deployment to real networks
      expect(testResult.debugMessages).toEqual([
        { contractAddress: testContractAddress, message: 'The current balance is 10' }
      ])
    })
    */

  describe('announce', () => {
    it('should work', async () => {
      const testResult = await Gift.tests.announce({ ...testParamsFixture, inputAssets: [
        { address: receiver.address, asset: { alphAmount: 10n ** 18n } }
      ] })

      // only one contract involved in the test
      expect(testResult.contracts.length).toEqual(1)
      const contractState = testResult.contracts[0] as GiftTypes.State
      expect(contractState.address).toEqual(testContractAddress)

      // The announcement should be locked
      expect(contractState.fields.announcedAddress).toEqual(receiver.address)
      expect(contractState.fields.announcementLockedUntil).toBeGreaterThan(BigInt(Date.now()))

      // only UTXO is fees
      expect(testResult.txOutputs.length).toEqual(2)

      // for the execution fees of the function
      const execFeesOutput = testResult.txOutputs[0] as AssetOutput
      expect(execFeesOutput.type).toEqual('AssetOutput')
      expect(execFeesOutput.address).toEqual(receiver.address) // the caller of the function have to pay execution fees
      expect(execFeesOutput.alphAmount).toEqual(MAX_EXECUTION_FEE_PER_TX)
      expect(execFeesOutput.tokens).toEqual([])
      
      // for the execution fees
      const gasFeesOutput = testResult.txOutputs[1] as ContractOutput
      expect(gasFeesOutput.type).toEqual('ContractOutput')
      expect(gasFeesOutput.address).toEqual(testContractAddress)  // the contract paid gas
      expect(gasFeesOutput.alphAmount).toBeLessThanOrEqual(MAX_GAS_PER_TX)//10n ** 18n)
      expect(gasFeesOutput.tokens).toEqual([])

      // a `Lock` event is emitted when the test passes
      expect(testResult.events.length).toEqual(1)
      const event = testResult.events[0] as GiftTypes.LockEvent
      // the event is emitted by the test contract
      expect(event.contractAddress).toEqual(testContractAddress)
      expect(event.name).toEqual('Lock')
      expect(event.fields.by).toEqual(receiver.address)
      expect(event.fields.by).toEqual(contractState.fields.announcedAddress)
      expect(event.fields.until).toBeGreaterThan(BigInt(Date.now()))
      expect(event.fields.until).toEqual(contractState.fields.announcementLockedUntil)

      // no debug message should be emitted
      expect(testResult.debugMessages.length).toEqual(0)

      // there should be no return value
      expect(testResult.returns).toBeNull()
    })
  })

  describe("withdraw", () => {
    it('should fail when user did not announced before', async () => {
      await expectAssertionError(Gift.tests.withdraw({ ...testParamsFixture, inputAssets: [
        { address: receiver.address, asset: { alphAmount: 10n ** 18n } }
      ] }), testContractAddress, Gift.consts.ErrorCodes.UnannouncedCaller)
    })
  })

  describe("resetLock", () => {
    it('should work if right caller', async () => {
      // We first need to make some annoucement to be able to detect the reset is functional
      const testResultAnnounce = await Gift.tests.announce({ ...testParamsFixture, inputAssets: [
        { address: receiver.address, asset: { alphAmount: 10n ** 18n } }
      ] })

      expect(testResultAnnounce.contracts.length).toEqual(1)
      const contractStateAfterAnnouncement = testResultAnnounce.contracts[0] as GiftTypes.State
      // The announcement should be locked
      expect(contractStateAfterAnnouncement.fields.announcementLockedUntil).toBeGreaterThan(BigInt(Date.now()))

      const testResult = await Gift.tests.resetLock({ ...testParamsFixture, inputAssets: [
        { address: sender.address, asset: { alphAmount: 10n ** 18n } }
      ] })

      // only one contract involved in the test
      expect(testResult.contracts.length).toEqual(1)
      const contractState = testResult.contracts[0] as GiftTypes.State
      expect(contractState.address).toEqual(testContractAddress)

      // The announcement locked time should be zero (resetted)
      expect(contractState.fields.announcementLockedUntil).toEqual(0n)

      // only UTXO is fees
      expect(testResult.txOutputs.length).toEqual(1)

      // the only transaction output is for the execution fees
      const alphOutput = testResult.txOutputs[0] as AssetOutput
      expect(alphOutput.type).toEqual('AssetOutput')
      expect(alphOutput.address).toEqual(sender.address)
      expect(alphOutput.alphAmount).toBeLessThan(10n ** 18n) // the caller paid gas
      expect(alphOutput.tokens).toEqual([])

      // no event is emitted when the test passes
      expect(testResult.events.length).toEqual(0)

      // no debug message should be emitted
      expect(testResult.debugMessages.length).toEqual(0)

      // there should be no return value
      expect(testResult.returns).toBeNull()
    })

    it('should fail when wrong caller', async () => {
      // We first need to make some annoucement to be able to detect the reset is functional
      const testResultAnnounce = await Gift.tests.announce({ ...testParamsFixture, inputAssets: [
        { address: receiver.address, asset: { alphAmount: 10n ** 18n } }
      ] })
      expect(testResultAnnounce.contracts.length).toEqual(1)
      const contractStateAfterAnnouncement = testResultAnnounce.contracts[0] as GiftTypes.State
      
      // The announcement should be locked
      expect(contractStateAfterAnnouncement.fields.announcementLockedUntil).toBeGreaterThan(BigInt(Date.now()))

      const testParams = { ...testParamsFixture, inputAssets: [
        { address: attacker.address, asset: { alphAmount: 10n ** 18n } }
      ] }

      // reset should fail since wrong caller
      await expectAssertionError(Gift.tests.resetLock(testParams), testContractAddress, Gift.consts.ErrorCodes.CallerIsNotSender)
    })
  })

  describe("cancel", () => {
    it('should work if cancellable', async () => {
      let testParams = { ...testParamsFixture, inputAssets: [
        { address: sender.address, asset: { alphAmount: 10n ** 18n } }
      ] }
      testParams.initialFields.isCancellable = true
      const testResult = await Gift.tests.cancel(testParams)

      // no contract involved since destroyed
      expect(testResult.contracts.length).toEqual(0)

      // the content of the contract should return to the sender
      expect(testResult.txOutputs.length).toEqual(1)

      const alphOutput = testResult.txOutputs[0] as AssetOutput
      expect(alphOutput.type).toEqual('AssetOutput')
      expect(alphOutput.address).toEqual(sender.address)
      //expect(alphOutput.alphAmount).toEqual(testParamsFixture.initialAsset?.alphAmount) // WTF?
      expect(alphOutput.tokens).toEqual([])

      // no event is emitted when the test passes
      expect(testResult.events.length).toEqual(2)
      const acceptedEventsType: { [typeName: string]: number } = { ['Cancel']: 0, ['ContractDestroyed']: 0 }
      for (let eventIndex = 0; eventIndex < testResult.events.length; eventIndex++) {      
        let event = testResult.events[eventIndex]
        expect(Object.keys(acceptedEventsType)).toContain(event.name)
        switch (event.name) {
          case 'Cancel':
            const cancelEvent = event as GiftTypes.CancelEvent
            expect(cancelEvent.contractAddress).toEqual(testContractAddress)
            break
          case 'ContractDestroyed':
            const destroyEvent = event as ContractDestroyedEvent
            expect(destroyEvent.fields.address).toEqual(testContractAddress)
            break
          default:
            expect('type not supported').toBeNull() // Case should not happen
        }
        acceptedEventsType[event.name]++
      }
      for (let eventType in acceptedEventsType)
        expect(acceptedEventsType[eventType]).toEqual(1)  // Each event type should be emitted once

      // no debug message should be emitted
      expect(testResult.debugMessages.length).toEqual(0)

      // the returned value should be correct
      expect(testResult.returns).toBeNull()
    })

    it('should fail if wrong caller', async () => {
      let testParams = { ...testParamsFixture, inputAssets: [
        { address: attacker.address, asset: { alphAmount: 10n ** 18n } }
      ] }
      testParams.initialFields.isCancellable = true
      await expectAssertionError(Gift.tests.cancel(testParams), testContractAddress, Gift.consts.ErrorCodes.CallerIsNotSender)
    })

    it('should fail if not cancellable', async () => {
      let testParams = { ...testParamsFixture, inputAssets: [
        { address: sender.address, asset: { alphAmount: 10n ** 18n } }
      ] }
      testParams.initialFields.isCancellable = false
      await expectAssertionError(Gift.tests.cancel(testParams), testContractAddress, Gift.consts.ErrorCodes.CancelIsNotAllowed)
    })
  })

  describe("getVersion", () => {
    it('should return the version', async () => {
      const testResult = await Gift.tests.getVersion(testParamsFixture)

      // only one contract involved in the test
      expect(testResult.contracts.length).toEqual(1)
      const contractState = testResult.contracts[0] as GiftTypes.State
      expect(contractState.address).toEqual(testContractAddress)

      // no fees to fetch contract state
      expect(testResult.txOutputs.length).toEqual(0)

      // no event is emitted when the test passes
      expect(testResult.events.length).toEqual(0)

      // no debug message should be emitted
      expect(testResult.debugMessages.length).toEqual(0)

      // the returned value should be correct
      expect(testResult.returns).toEqual(contractVersion)
    })
  })

  describe("isCancellable", () => {
    const values = [true, false]

    test.each(values)('should return correct value for contract isCancellable set with %p', async (value: boolean) => {
      let testParams = testParamsFixture
      testParams.initialFields.isCancellable = value
      const testResult = await Gift.tests.isCancellable(testParams)

      // only one contract involved in the test
      expect(testResult.contracts.length).toEqual(1)
      const contractState = testResult.contracts[0] as GiftTypes.State
      expect(contractState.address).toEqual(testContractAddress)

      // no fees to fetch contract state
      expect(testResult.txOutputs.length).toEqual(0)

      // no event is emitted when the test passes
      expect(testResult.events.length).toEqual(0)

      // no debug message should be emitted
      expect(testResult.debugMessages.length).toEqual(0)

      // the returned value should be correct
      expect(testResult.returns).toEqual(value)
    })
  })
})
