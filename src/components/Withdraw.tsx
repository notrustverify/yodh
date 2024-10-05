'use client'
import React, { useCallback, useEffect, useRef } from 'react'
import { useState } from 'react'
import styles from '../styles/Gift.module.css'
import { announce, cancel, checkHash, claim, getContractState } from '@/services/gift.service'
import { TxStatus } from './TxStatus'
import { AlephiumConnectButton, useWallet } from '@alephium/web3-react'
import {
  addressFromContractId,
  bs58,
  isBase58,
  isValidAddress,
  node,
  number256ToNumber,
  waitForTxConfirmation,
  ZERO_ADDRESS
} from '@alephium/web3'
import { GiftTypes } from 'artifacts/ts'
import Hash from './Hash'
import {
  contractExists,
  contractIdFromAddressString,
  findTokenFromId,
  getTokenList,
  isBase64,
  isEncodedFormat,
  shortAddress,
  Token,
  WithdrawState
} from '@/services/utils'
import Link from 'next/link'
import Head from 'next/head'
import { Icon } from '@iconify/react'
import { Footer } from './Footer'
import { Locked } from './Locked'
import TokenGifted from './TokensGifted'
import { Header } from './Header'

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
  const [tokenList, setTokenList] = useState<Token[]>()
  const [contract, setContract] = useState<string>('')

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (signer) {
      let result
      switch (step as WithdrawState) {
        case WithdrawState.Locking:
          result = await announce(signer, contract)
          setOngoingTxId(result.txId)
          await waitForTxConfirmation(result.txId, 1, 10)
          setStep(WithdrawState.Locked)
          getContractState(contract).then((data) => setContractState(data))
          setOngoingTxId('')
          break

        case WithdrawState.Locked:
          setStep(WithdrawState.Claiming)
          result = await claim(signer, secretDecoded, contract)
          setOngoingTxId(result.txId)
          await waitForTxConfirmation(result.txId, 1, 10)
          break

        default:
          break
      }
    }
  }

  const handleCancelGift = async (e: React.FormEvent) => {
    e.preventDefault()
    if (signer) {
      const result = await cancel(signer, contract)
      setOngoingTxId(result.txId)
      await waitForTxConfirmation(result.txId, 1, 10)
      setStep(WithdrawState.Cancel)
      getContractState(contract).then((data) => setContractState(data))
      setOngoingTxId('')
    }
  }

  const txStatusCallback = useCallback(
    async (status: node.TxStatus, numberOfChecks: number): Promise<any> => {
      if ((status.type === 'Confirmed' && numberOfChecks > 2) || (status.type === 'TxNotFound' && numberOfChecks > 5)) {
        setOngoingTxId(undefined)
        setIsNotClaimed(false)
        getContractState(contract).then((data) => setContractState(data))
      }

      return Promise.resolve()
    },
    [contract]
  )

  useCallback(() => {
    setStep(contractState?.fields.announcedAddress === ZERO_ADDRESS ? WithdrawState.Locking : WithdrawState.Locked)
  }, [contractState?.fields, account, isNotClaimed])

  useEffect(() => {
    //getState()

    if (!initialized.current && contractId !== '') {
      initialized.current = true

      if (secret == undefined || secret == '') {
        const secretPrompt = prompt('Secret missing, copy paste secret.', '')
        if (secretPrompt !== null) {
          if (isEncodedFormat(secretPrompt)) {
            setSecretDecoded(Buffer.from(decodeURIComponent(secretPrompt), 'base64'))
          } else {
            isBase64(secretPrompt)
              ? Buffer.from(secretPrompt, 'base64')
              : setSecretDecoded(new TextEncoder().encode(secretPrompt))
          }
        }
      } else {
        setSecretDecoded(Buffer.from(decodeURIComponent(secret), 'base64'))
      }

      let dataContractId = contractId
      // address can be passed
      if (isValidAddress(contractId)) dataContractId = contractIdFromAddressString(contractId)

      contractExists(addressFromContractId(dataContractId)).then((exist) => setIsNotClaimed(exist))

      if (isNotClaimed) {
        setContract(dataContractId)
        getContractState(dataContractId).then((data) => {
          setContractState(data)
          setStep(data.fields.announcedAddress === ZERO_ADDRESS ? WithdrawState.Locking : WithdrawState.Locked)
        })

        getTokenList().then((data) => {
          setTokenList(data)
        })
      }
    }
  }, [contractId, secret, isNotClaimed])
  console.log(new TextDecoder().decode(secretDecoded))

  return (
    <div className={styles.mainContainer}>
      
      <Header gifts={undefined} />

      <section id="yodhSection">
        <AlephiumConnectButton />

        <form className={styles.giftForm} id="gift-form" onSubmit={handleWithdrawSubmit}>
          {tokenList !== undefined && contractState !== undefined && (
            <TokenGifted tokenList={tokenList} contractState={contractState} />
          )}

          <label htmlFor="gift-message">
            <p>{contractState !== undefined && message !== undefined && 'Message: ' + message}</p>
          </label>
          <label htmlFor="gift-message">
            {isNotClaimed && contractState !== undefined ? (
              <Hash secret={secretDecoded} secretContract={contractState?.fields.hashedSecret} />
            ) : (
              ''
            )}
          </label>

          <label htmlFor="gift-message">
            <small>
              <Icon icon="material-symbols:info" /> You will need to sign 2 times for security purpose.
            </small>
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
              contractState !== undefined &&
              contractState?.fields.announcementLockedUntil >= BigInt(Date.now()) &&
              (!!ongoingTxId ||
                !checkHash(secretDecoded, contractState?.fields.hashedSecret) ||
                !isNotClaimed ||
                contractState?.fields.announcedAddress !== ZERO_ADDRESS ||
                connectionStatus !== 'connected' ||
                step != WithdrawState.Locking)
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
      </section>
      {}
      <label htmlFor="gift-message"></label>
      {connectionStatus === 'connected' && contractState?.fields.sender === account?.address && (
        <b>
          <Icon icon="twemoji:warning" /> If you lose the secret, you can cancel it to recover the tokens. Only you have
          access to this option.
        </b>
      )}
      {connectionStatus === 'connected' && contractState?.fields.sender === account?.address && (
        <button
          type="button"
          disabled={!!ongoingTxId || contractState?.fields.sender !== account?.address || !isNotClaimed}
          className={styles.wrapButton}
          onClick={handleCancelGift}
        >
          {isNotClaimed ? 'Cancel' : 'Already cancel'}
        </button>
      )}
      {ongoingTxId && <TxStatus txId={ongoingTxId} txStatusCallback={txStatusCallback} step={step} />}

      <Link href={'/'}>Create a new Gift Card</Link>
      <br />
      <Footer />
    </div>
  )
}
