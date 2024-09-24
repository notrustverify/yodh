import Head from 'next/head'
import styles from '@/styles/Gift.module.css'
import { AlephiumConnectButton, useBalance, useWallet } from '@alephium/web3-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ALPH_TOKEN_ID, contractIdFromAddress, node, ONE_ALPH, waitForTxConfirmation, web3 } from '@alephium/web3'
import { createGift, getContractState, giftDeposit } from '@/services/gift.service'
import { Icon } from '@iconify/react'
import { TxStatus } from './TxStatus'
import { PDFDownloadLink } from '@react-pdf/renderer'
import PdfGiftCard from './Pdf'
import QrCode from './Qrcode'
import { Footer } from './Footer'
import store from 'store2'
import { Gifts } from './CreatedGifts'
import { getTokenList, getUrl, Gift, Token, WithdrawState } from '@/services/utils'
import Select from 'react-select'
import { GiftTypes } from 'artifacts/ts'
import TokenPot from './TokenPot'
import Link from 'next/link'
import { FaRegCopy } from 'react-icons/fa'

interface OptionSelect {
  value: string
  label: string
}

export default function Home({ pot, contractIdParam }: { pot: boolean; contractIdParam: string | undefined }) {
  const { signer, account, connectionStatus } = useWallet()
  const { balance } = useBalance()
  const [ongoingTxId, setOngoingTxId] = useState<string>()
  const [secret, setSecret] = useState<Uint8Array>(new Uint8Array())
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [contractId, setContractId] = useState<string>('')
  const [message, setMessage] = useState<string>('')
  const [giftWrapped, setGiftWrapped] = useState<boolean>(false)
  const [gifts, setGifts] = useState<Array<Gift>>([])
  const initialized = useRef(false)
  const [tokenList, setTokenList] = useState<Token[]>()
  const [tokenSelect, setTokenSelect] = useState<OptionSelect[]>()
  const [contractState, setContractState] = useState<GiftTypes.State>()
  const [isPot, setPot] = useState<boolean>(false)
  const [isCopied, setIsCopied] = useState(false)

  const [selectedToken, setSelectedToken] = useState<Token | undefined>()

  const txStatusCallback = useCallback(
    async (status: node.TxStatus, numberOfChecks: number): Promise<any> => {
      setGiftWrapped(false)
      if ((status.type === 'Confirmed' && numberOfChecks > 2) || (status.type === 'TxNotFound' && numberOfChecks > 5)) {
        setOngoingTxId(undefined)
        setGiftWrapped(true)
      }

      return Promise.resolve()
    },
    [setOngoingTxId]
  )
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (signer) {
      const array = new Uint8Array(128)
      crypto.getRandomValues(array)
      setSecret(array)

      const result = await createGift(
        BigInt(withdrawAmount),
        signer,
        account.address,
        array,
        1800n * 1000n,
        selectedToken?.id ?? ALPH_TOKEN_ID,
        selectedToken?.decimals ?? Number(ONE_ALPH)
      )
      setOngoingTxId(result.txId)

      store.add('gifts', [{ contractId: '', secret: array, message: message }])

      await waitForTxConfirmation(result.txId, 1, 5 * 1000)

      const details = await web3.getCurrentNodeProvider().transactions.getTransactionsDetailsTxid(result.txId)

      if (details?.unsigned.scriptOpt !== undefined && details.scriptExecutionOk) {
        const contractIdGenerated = contractIdFromAddress(details.generatedOutputs[0].address)
        setContractId(Buffer.from(contractIdGenerated).toString('hex'))

        let giftsStored = store.get('gifts')
        giftsStored.pop() // remove last entry to replace with the right one with contractid
        giftsStored = [
          ...giftsStored,
          { contractId: Buffer.from(contractIdGenerated).toString('hex'), secret: array, message: message }
        ]

        store.remove('gifts')
        store.add('gifts', giftsStored)
      }
    }
  }

  const handleAddPotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (signer) {
      const result = await giftDeposit(
        contractId,
        BigInt(withdrawAmount),
        signer,
        selectedToken?.id ?? ALPH_TOKEN_ID,
        selectedToken?.decimals ?? Number(ONE_ALPH)
      )
      setOngoingTxId(result.txId)
      await waitForTxConfirmation(result.txId, 1, 5 * 1000)
      getContractState(contractId).then((data) => {
        setContractState(data)
      })
    }
  }
  useEffect(() => {
    if (!initialized.current) {
      setSelectedToken({
        id: '0000000000000000000000000000000000000000000000000000000000000000',
        name: 'Alephium',
        symbol: 'ALPH',
        decimals: 18,
        description:
          'Alephium is a scalable, decentralized, and secure blockchain platform that enables the creation of fast and secure applications.',
        logoURI: 'https://raw.githubusercontent.com/alephium/token-list/master/logos/ALPH.png'
      })
      initialized.current = true
      getTokenList().then((data) => {
        setTokenList(data)
        setTokenSelect(
          data.map((token) => ({
            value: token.symbol,
            label: token.name
          }))
        )
      })

      setGifts(store.get('gifts'))
    }
    if (contractIdParam !== undefined) {
      getContractState(contractIdParam).then((data) => {
        setContractState(data)
      })
      setContractId(contractIdParam)
    }

    window.addEventListener('beforeunload', beforeUnload)
  return () => {
    window.removeEventListener('beforeunload', beforeUnload)
  }
  }, [contractIdParam])


  function beforeUnload(e: BeforeUnloadEvent) {
   e.preventDefault();
 }

  return (
    <div className={styles.mainContainer}>
      <Head>
        <title>Yodh - Alephium Gift Cards</title>
      </Head>

      <header className={styles.header}>
        <Gifts gifts={gifts} />

        <h1>
          Yodh <Icon icon="fa:gift" />
        </h1>
        <p>Create ALPH digital gift cards easily.</p>
      </header>

      <section id="yodhSection">
        <AlephiumConnectButton />

        {/* Add the local class to the form */}
        <form className={styles.giftForm} id="gift-form" onSubmit={!pot ? handleWithdrawSubmit : handleAddPotSubmit}>
          <label htmlFor="gift-message">{!pot ? 'Your Message' : 'Add tokens in the pot'}</label>
          {pot && contractState !== undefined && (
            <label htmlFor="gift-message">
              {contractState?.asset.tokens !== undefined &&
                tokenList !== undefined &&
                contractState?.asset.tokens.length > 0 && (
                  <TokenPot tokenList={tokenList} contractState={contractState} />
                )}
            </label>
          )}

          {!pot && (
            <textarea
              id="gift-message"
              placeholder="Write a personalized message..."
              required
              rows={4}
              cols={50}
              maxLength={100}
              onChange={(e) => setMessage(e.target.value)}
            ></textarea>
          )}
          <label htmlFor="gift-amount">
            <Select
              options={tokenSelect}
              isSearchable={true}
              isClearable={true}
              onChange={(option) => setSelectedToken(tokenList?.find((token) => token.name === option?.label))}
              value={tokenSelect?.find(function (option) {
                return option.value === selectedToken?.symbol
              })}
            />
          </label>

          <label htmlFor="gift-amount">Amount in {selectedToken?.symbol}</label>
          <label htmlFor="gift-amount">
            <small>
              {connectionStatus === 'connected' && selectedToken?.symbol == 'ALPH'
                ? 'ALPH balance: ' + balance?.balanceHint.split('.')[0] + ' ℵ'
                : ''}
            </small>
          </label>
          <input
            type="number"
            id="gift-amount"
            placeholder="Enter the amount"
            required
            min="1"
            value={withdrawAmount}
            onChange={(e) => {
              setWithdrawAmount(e.target.value)
            }}
          />

          <div className={styles.giftCardSection}>
            <label htmlFor="poolGiftCard">Pool gift card</label>
            <input
              disabled={pot}
              checked={pot}
              onChange={(e) => setPot(e.target.checked)}
              type="checkbox"
              id="poolGiftCard"
            />
          </div>

          <button type="submit" disabled={connectionStatus !== 'connected'} className={styles.wrapButton}>
            <Icon icon="fa:gift" /> &nbsp; Wrap & Send Gift
          </button>
        </form>
      </section>

      {ongoingTxId && (
        <TxStatus
          txId={ongoingTxId}
          txStatusCallback={txStatusCallback}
          step={pot ? WithdrawState.Deposit : WithdrawState.Wrapping}
        />
      )}

      <div>
        {!pot && contractId !== '' && giftWrapped ? (
          <PDFDownloadLink
            document={
              <PdfGiftCard sender={account?.address} contractId={contractId} message={message} secret={secret} />
            }
            title="Yodh Gift Card"
          >
            Click to download the gift card
          </PDFDownloadLink>
        ) : (
          ''
        )}
        <br />
        {isPot && contractId !== '' && (
          <Link href={`${getUrl()}/#contract=${contractId}&pot=${isPot}`} rel="noopener noreferrer" target="_blank">
            Share this to deposit tokens
          </Link>
        )}{' '}
        {isPot && contractId !== '' && isCopied
          ? 'URL Copied'
          : isPot &&
            contractId !== '' && (
              <FaRegCopy
                onClick={() => {
                  navigator.clipboard.writeText(`${getUrl()}/#contract=${contractId}&pot=${isPot}`)
                  setIsCopied(true)
                }}
              >
                Copy to Clipboard
              </FaRegCopy>
            )}
        {!pot && contractId !== '' && secret.length >= 0 && giftWrapped && (
          <details id="gitflink">
            <summary>Click to display QRCode</summary>
            <p>Share this to the person you want to send the gift card</p>
            <QrCode contractId={contractId} secret={secret} message={message} pot={isPot} />
          </details>
        )}
      </div>
      <Footer />
    </div>
  )
}
