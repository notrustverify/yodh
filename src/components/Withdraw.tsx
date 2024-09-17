'use client'
import React, { useCallback, useEffect, useRef } from 'react'
import { FC, useState } from 'react'
import styles from '../styles/Gift.module.css'
import { announce, checkHash, claim, createGift, getContractState } from '@/services/gift.service'
import { TxStatus } from './TxStatus'
import { AlephiumConnectButton, useWallet } from '@alephium/web3-react'
import {
  addressFromContractId,
  ContractState,
  Fields,
  node,
  number256ToNumber,
  ONE_ALPH,
  waitForTxConfirmation,
  ZERO_ADDRESS
} from '@alephium/web3'
import { GiftTypes } from 'artifacts/ts'
import Hash from './Hash'
import { contractExists, shortAddress, WithdrawState } from '@/services/utils'
import Link from 'next/link'
import Head from 'next/head'
import { Icon } from '@iconify/react'
import { Footer } from './Footer'
import { Locked } from './Locked'

export const WithdrawDapp = ({
  contractId,
  secret,
  message
}: {
  contractId: string
  secret: string
  message: string
}) => {
  const { signer, account, connectionStatus } = useWallet()
  const [ongoingTxId, setOngoingTxId] = useState<string>()
  const [contractState, setContractState] = useState<GiftTypes.State>()
  const [secretDecoded, setSecretDecoded] = useState<Uint8Array>(new Uint8Array())
  const initialized = useRef(false)
  const [step, setStep] = useState<WithdrawState>(WithdrawState.Locking)
  const [isNotClaimed, setIsNotClaimed] = useState<boolean>(true)
  const [messageText, setMessage] = useState('')

  function useInterval(callback: () => void, delay: number) {
    const savedCallback = useRef<() => void>(() => {})

    // Remember the latest callback.
    useEffect(() => {
      savedCallback.current = callback
    }, [callback])

    // Set up the interval.
    useEffect(() => {
      function tick() {
        savedCallback.current()
      }
      if (delay !== null) {
        let id = setInterval(tick, delay)
        return () => clearInterval(id)
      }
    }, [delay])
  }

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (signer) {
      let result
      console.log(step)
      switch (step as WithdrawState) {
        case WithdrawState.Locking:
          result = await announce(signer, contractId)
          setOngoingTxId(result.txId)
          await waitForTxConfirmation(result.txId, 1, 10)
          setStep(WithdrawState.Locked)
          getContractState(contractId).then((data) => setContractState(data))
          setOngoingTxId('')
          break

        case WithdrawState.Locked:
          setStep(WithdrawState.Claiming)
          result = await claim(signer, secretDecoded, contractId)
          setOngoingTxId(result.txId)
          await waitForTxConfirmation(result.txId, 1, 10)
          break

        default:
          break
      }
    }
  }

  const txStatusCallback = useCallback(
    async (status: node.TxStatus, numberOfChecks: number): Promise<any> => {
      if ((status.type === 'Confirmed' && numberOfChecks > 2) || (status.type === 'TxNotFound' && numberOfChecks > 5)) {
        setOngoingTxId(undefined)
        setIsNotClaimed(false)
        getContractState(contractId).then((data) => setContractState(data))
      }

      return Promise.resolve()
    },
    [setOngoingTxId]
  )

  useCallback(() => {
    console.log('update')
    setStep(contractState?.fields.announcedAddress === ZERO_ADDRESS ? WithdrawState.Locking : WithdrawState.Locked)
  }, [contractState?.fields, account, isNotClaimed])

  useEffect(() => {
    //getState()
    if (!initialized.current && contractId !== '') {
      initialized.current = true
      contractExists(addressFromContractId(contractId)).then((exist) => setIsNotClaimed(exist))
      setSecretDecoded(new Uint8Array(Buffer.from(decodeURIComponent(secret), 'base64')))
      if (isNotClaimed) {
        getContractState(contractId).then((data) => {
          setContractState(data)
          setStep(
            data.fields.announcedAddress === ZERO_ADDRESS ? WithdrawState.Locking : WithdrawState.Locked
          )
        })
      }
    }
  })
  console.log(contractState?.fields, step)
  return (
    <div className={styles.mainContainer}>
      <Head>
        <title>Yodh - Alephium Gift Cards</title>
      </Head>

      <header className={styles.header}>
        <h1>
          Yodh <Icon icon="fa:gift" />
        </h1>
        <p>Create ALPH digital gift cards easily.</p>
      </header>

      <section id="yodhSection">
        <AlephiumConnectButton />

        <form className={styles.giftForm} id="gift-form" onSubmit={handleWithdrawSubmit}>
          <label htmlFor="gift-message">
            {contractState !== undefined && (
              <p>
                {' '}
                {shortAddress(contractState.fields.sender)} sent you{' '}
                {number256ToNumber(contractState.asset.alphAmount, 18)} ALPH
              </p>
            )}
          </label>

          <label htmlFor="gift-message">
            {contractState !== undefined && message !== undefined && 'Message: ' + message}
          </label>
          <label htmlFor="gift-message">
            {isNotClaimed && contractState !== undefined ? (
              <Hash secret={secretDecoded} secretContract={contractState?.fields.hashedSecret} />
            ) : (
              ''
            )}
          </label>

          <label htmlFor="gift-message">
            <Icon icon="material-symbols:info" /> You will need to sign 2 times for security purpose.
          </label>

          {contractState !== undefined && (
            <Locked
              announcedAddress={contractState?.fields.announcedAddress}
              connectedAddress={account?.address}
              announcementLockedUntil={contractState?.fields.announcementLockedUntil}
            />
          )}

          <button
            type="submit"
            disabled={
              !!ongoingTxId ||
              !checkHash(secretDecoded, contractState?.fields.hashedSecret) ||
              !isNotClaimed ||
              contractState?.fields.announcedAddress !== ZERO_ADDRESS ||
              connectionStatus !== 'connected' ||
              step != WithdrawState.Locking
            }
            className={styles.wrapButton}
          >
            <div>
              <Icon icon="fa:gift" /> &nbsp; 1 - Unwrap gift
            </div>
          </button>

          <button
            type="submit"
            disabled={
              !!ongoingTxId ||
              !checkHash(secretDecoded, contractState?.fields.hashedSecret) ||
              (contractState?.fields.announcedAddress !== account?.address &&
                contractState?.fields.announcedAddress !== ZERO_ADDRESS) ||
              !isNotClaimed ||
              step !== WithdrawState.Locked ||
              connectionStatus !== 'connected'
            }
            className={styles.wrapButton}
          >
            {isNotClaimed ? (
              <div>
                {' '}
                <Icon icon="fa:gift" /> &nbsp;{' '}
                {contractState?.fields.announcedAddress === account?.address
                  ? '2 - Open your gift'
                  : 'You cannot open the gift'}
              </div>
            ) : (
              'Already claimed'
            )}
          </button>
        </form>

        <p id="response-message"></p>
      </section>

      {ongoingTxId && <TxStatus txId={ongoingTxId} txStatusCallback={txStatusCallback} step={step} />}

      <Link href="/">Create a new Gift Card</Link>
      <Footer />
    </div>
  )
}
