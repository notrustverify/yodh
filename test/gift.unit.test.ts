import {
  web3,
  TestContractParams,
  addressFromContractId,
  AssetOutput,
  ZERO_ADDRESS,
  stringToHex,
  ContractDestroyedEvent,
  ALPH_TOKEN_ID,
  ONE_ALPH,
  MINIMAL_CONTRACT_DEPOSIT
} from '@alephium/web3'
import { expectAssertionError, randomContractId } from '@alephium/web3-test'
import { PrivateKeyWallet } from '@alephium/web3-wallet'

import { Gift, GiftTypes } from '../artifacts/ts'
import { getRandomSigner, MAX_EXECUTION_FEE_PER_TX, MAX_GAS_PER_TX } from './utils'

web3.setCurrentNodeProvider('http://127.0.0.1:22973', undefined, fetch)

const TEST_SECRET = stringToHex('super-secret')
const INITIAL_AMOUT = 10n * ONE_ALPH + MINIMAL_CONTRACT_DEPOSIT

describe('unit tests', () => {
  let testContractId: string
  //let testTokenId: string
  let testContractAddress: string
  let contractVersion: bigint
  let sender: PrivateKeyWallet
  let receiver: PrivateKeyWallet
  let attacker: PrivateKeyWallet
  let testParamsFixture: TestContractParams<GiftTypes.Fields, { secret: string }>

  // We initialize the fixture variables before all tests
  beforeEach(async () => {
    testContractId = randomContractId()
    //testTokenId = testContractId
    testContractAddress = addressFromContractId(testContractId)
    contractVersion = 1n

    sender = await getRandomSigner()
    receiver = await getRandomSigner()
    attacker = await getRandomSigner()

    testParamsFixture = {
      // a random address that the test contract resides in the tests
      address: testContractAddress,
      // assets owned by the test contract before a test
      initialAsset: { alphAmount: INITIAL_AMOUT },
      // initial state of the test contract
      initialFields: {
        sender: sender.address,
        hashedSecret: TEST_SECRET,
        announcementLockIntervall: 10n * 1000n, // in milliseconds
        version: contractVersion,
        announcedAddress: ZERO_ADDRESS,
        announcementLockedUntil: 0n,
        isCancellable: true,
        initialUsdPrice: 0n
      },
      // arguments to test the target function of the test contract
      testArgs: { secret: stringToHex('test-secret') }
      // assets owned by the caller of the function
      //inputAssets: [{ address: testAddress, asset: { alphAmount: ONE_ALPH } }]
    }

    //console.warn(`ContractAddress: ${testContractAddress}\nSender: ${sender.address}\nReceiver: ${receiver.address}\nAttacker: ${attacker.address}`)
  })

  describe('announce', () => {
    it('should work', async () => {
      const testResult = await Gift.tests.announce({
        ...testParamsFixture,
        inputAssets: [{ address: receiver.address, asset: { alphAmount: MAX_EXECUTION_FEE_PER_TX } }]
      })

      // only one contract involved in the test
      expect(testResult.contracts.length).toEqual(1)
      const contractState = testResult.contracts[0] as GiftTypes.State
      expect(contractState.address).toEqual(testContractAddress)

      // The announcement should be locked
      expect(contractState.fields.announcedAddress).toEqual(receiver.address)
      expect(contractState.fields.announcementLockedUntil).toBeGreaterThan(BigInt(Date.now()))

      // only UTXO is fees
      expect(testResult.txOutputs.length).toEqual(1)

      // for the execution fees of the function
      const execFeesOutput = testResult.txOutputs[0] as AssetOutput
      expect(execFeesOutput.type).toEqual('AssetOutput')
      expect(execFeesOutput.address).toEqual(receiver.address) // the caller of the function have to pay fees
      expect(execFeesOutput.alphAmount).toBeLessThanOrEqual(MAX_EXECUTION_FEE_PER_TX)
      expect(execFeesOutput.tokens).toEqual([])

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

  describe('withdraw', () => {
    // Other tests are performed as integration tests

    it('should fail when user did not announced before', async () => {
      await expectAssertionError(
        Gift.tests.withdraw({
          ...testParamsFixture,
          inputAssets: [{ address: receiver.address, asset: { alphAmount: ONE_ALPH } }]
        }),
        testContractAddress,
        Gift.consts.ErrorCodes.UnannouncedCaller
      )
    })
  })

  describe('deposit', () => {
    it('should allow users to deposit ALPH tokens', async () => {
      const depositAmount = 5n * ONE_ALPH
      const testResult = await Gift.tests.deposit({
        ...testParamsFixture,
        testArgs: {
          tokenId: ALPH_TOKEN_ID
        },
        inputAssets: [{ address: attacker.address, asset: { alphAmount: MAX_GAS_PER_TX + depositAmount } }]
      })

      // only one contract involved in the test
      expect(testResult.contracts.length).toEqual(1)
      const contractState = testResult.contracts[0] as GiftTypes.State
      expect(contractState.address).toEqual(testContractAddress)

      // only UTXO is user deposit
      expect(testResult.txOutputs.length).toEqual(1)

      /* FIXME: error in generated UTXO?
          Received ContractOutput where user should transfer amount to contract
      // for the execution fees of the function
      const execFeesOutput = testResult.txOutputs[0] as AssetOutput
      expect(execFeesOutput.type).toEqual('AssetOutput')
      expect(execFeesOutput.address).toEqual(attacker.address)
      expect(execFeesOutput.alphAmount).toEqual(depositAmount)
      expect(execFeesOutput.tokens).toEqual([])
      */

      // a `Lock` event is emitted when the test passes
      expect(testResult.events.length).toEqual(1)
      const event = testResult.events[0] as GiftTypes.DepositEvent
      // the event is emitted by the test contract
      expect(event.contractAddress).toEqual(testContractAddress)
      expect(event.name).toEqual('Deposit')
      expect(event.fields.by).toEqual(attacker.address)
      expect(event.fields.tokenId).toEqual(ALPH_TOKEN_ID)
      expect(event.fields.amount).toEqual(depositAmount)

      // no debug message should be emitted
      expect(testResult.debugMessages.length).toEqual(0)

      // there should be no return value
      expect(testResult.returns).toBeNull()
    })
  })

  describe('resetLock', () => {
    it('should work if right caller', async () => {
      // We first need to make some annoucement to be able to detect the reset is functional
      const testResultAnnounce = await Gift.tests.announce({
        ...testParamsFixture,
        inputAssets: [{ address: receiver.address, asset: { alphAmount: ONE_ALPH } }]
      })

      expect(testResultAnnounce.contracts.length).toEqual(1)
      const contractStateAfterAnnouncement = testResultAnnounce.contracts[0] as GiftTypes.State
      // The announcement should be locked
      expect(contractStateAfterAnnouncement.fields.announcementLockedUntil).toBeGreaterThan(BigInt(Date.now()))

      const testResult = await Gift.tests.resetLock({
        ...testParamsFixture,
        inputAssets: [{ address: sender.address, asset: { alphAmount: ONE_ALPH } }]
      })

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
      expect(alphOutput.alphAmount).toBeLessThan(ONE_ALPH) // the caller paid gas
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
      const testResultAnnounce = await Gift.tests.announce({
        ...testParamsFixture,
        inputAssets: [{ address: receiver.address, asset: { alphAmount: ONE_ALPH } }]
      })
      expect(testResultAnnounce.contracts.length).toEqual(1)
      const contractStateAfterAnnouncement = testResultAnnounce.contracts[0] as GiftTypes.State

      // The announcement should be locked
      expect(contractStateAfterAnnouncement.fields.announcementLockedUntil).toBeGreaterThan(BigInt(Date.now()))

      const testParams = {
        ...testParamsFixture,
        inputAssets: [{ address: attacker.address, asset: { alphAmount: ONE_ALPH } }]
      }

      // reset should fail since wrong caller
      await expectAssertionError(
        Gift.tests.resetLock(testParams),
        testContractAddress,
        Gift.consts.ErrorCodes.CallerIsNotSender
      )
    })
  })

  describe('cancel', () => {
    it('should work if cancellable', async () => {
      const testParams = {
        ...testParamsFixture,
        inputAssets: [{ address: sender.address, asset: { alphAmount: ONE_ALPH } }]
      }
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

      // expected events are emitted when the test passes
      expect(testResult.events.length).toEqual(2)
      const acceptedEventsType: { [typeName: string]: number } = { ['Cancel']: 0, ['ContractDestroyed']: 0 }
      for (let eventIndex = 0; eventIndex < testResult.events.length; eventIndex++) {
        const event = testResult.events[eventIndex]
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
      for (const eventType in acceptedEventsType) expect(acceptedEventsType[eventType]).toEqual(1) // Each event type should be emitted once

      // no debug message should be emitted
      expect(testResult.debugMessages.length).toEqual(0)

      // the returned value should be correct
      expect(testResult.returns).toBeNull()
    })

    it('should fail if wrong caller', async () => {
      const testParams = {
        ...testParamsFixture,
        inputAssets: [{ address: attacker.address, asset: { alphAmount: ONE_ALPH } }]
      }
      testParams.initialFields.isCancellable = true
      await expectAssertionError(
        Gift.tests.cancel(testParams),
        testContractAddress,
        Gift.consts.ErrorCodes.CallerIsNotSender
      )
    })

    it('should fail if not cancellable', async () => {
      const testParams = {
        ...testParamsFixture,
        inputAssets: [{ address: sender.address, asset: { alphAmount: ONE_ALPH } }]
      }
      testParams.initialFields.isCancellable = false
      await expectAssertionError(
        Gift.tests.cancel(testParams),
        testContractAddress,
        Gift.consts.ErrorCodes.CancelIsNotAllowed
      )
    })
  })

  describe('getVersion', () => {
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

  describe('isCancellable', () => {
    const values = [true, false]

    test.each(values)('should return correct value for contract isCancellable set with %p', async (value: boolean) => {
      const testParams = testParamsFixture
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
