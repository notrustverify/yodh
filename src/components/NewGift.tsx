import Head from 'next/head'
import styles from '@/styles/Gift.module.css'
import { AlephiumConnectButton, useBalance, useWallet } from '@alephium/web3-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  addressFromContractId,
  ALPH_TOKEN_ID,
  node,
  number256ToNumber,
  ONE_ALPH,
  waitForTxConfirmation,
  web3
} from '@alephium/web3'
import { createGift, getContractState, giftDeposit } from '@/services/gift.service'
import { Icon } from '@iconify/react'
import { TxStatus } from './TxStatus'
import { PDFDownloadLink } from '@react-pdf/renderer'
import PdfGiftCard from './Pdf'
import QrCode from './Qrcode'
import { Footer } from './Footer'
import store from 'store2'
import {
  contractIdFromAddressString,
  convertToInt,
  getTokenList,
  getUrl,
  Gift,
  Token,
  WithdrawState
} from '@/services/utils'
import Select from 'react-select'
import { GiftTypes } from 'artifacts/ts'
import TokenPot from './TokenPot'
import Link from 'next/link'
import { FaRegCopy } from 'react-icons/fa'
import { Tooltip } from 'react-tooltip'
import { Header } from './Header'

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
  const [detailsLoaded, setDetailsLoaded] = useState(false)
  const [datetimeLock, setDatetimeLock] = useState<bigint>(0n)
  const [customPassword, setCustomPassword] = useState<string>('')
  const [passwordError, setPasswordError] = useState<string>('')

  const [selectedToken, setSelectedToken] = useState<Token | undefined>({
    id: '0000000000000000000000000000000000000000000000000000000000000000',
    name: 'Alephium',
    symbol: 'ALPH',
    decimals: 18,
    description:
      'Alephium is a scalable, decentralized, and secure blockchain platform that enables the creation of fast and secure applications.',
    logoURI: 'https://raw.githubusercontent.com/alephium/token-list/master/logos/ALPH.png'
  })
  const txStatusCallback = useCallback(
    async (status: node.TxStatus, numberOfChecks: number): Promise<any> => {
      setGiftWrapped(false)
      if (detailsLoaded || (status.type === 'TxNotFound' && numberOfChecks > 5)) {
        setOngoingTxId(undefined)
        setGiftWrapped(true)
      }

      return Promise.resolve()
    },
    [detailsLoaded]
  )
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (signer) {
      if (customPassword && customPassword.length < 6) {
        setPasswordError('Password must be at least 6 characters long')
        return
      }
      setPasswordError('')
      setDetailsLoaded(false)

      let array: Uint8Array
      if (customPassword) {
        // Pass custom password directly as string
        array = new TextEncoder().encode(customPassword)
      } else {
        // Generate random password if no custom password
        array = new Uint8Array(128)
        crypto.getRandomValues(array)
      }
      setSecret(array)

      // store it in case of connection lost
      store.add('gifts', [{ contractId: '', secret: array, message: message, pot: isPot }])
      const announcementLockedUntil = datetimeLock
      console.log(customPassword, array)
      try {
         const floatToDecimals = convertToInt(withdrawAmount)
         console.log(floatToDecimals)
        const result = await createGift(
          floatToDecimals[0],
          floatToDecimals[1],
          signer,
          account.address,
          array,
          1800n * 1000n,
          selectedToken?.id ?? ALPH_TOKEN_ID,
          selectedToken?.decimals ?? Number(ONE_ALPH),
          announcementLockedUntil
        )

        setOngoingTxId(result.txId)
        await waitForTxConfirmation(result.txId, 1, 5 * 1000)
        const details = await web3.getCurrentNodeProvider().transactions.getTransactionsDetailsTxid(result.txId)
        if (details?.unsigned.scriptOpt !== undefined && details.scriptExecutionOk) {
          const contractAddr = details.generatedOutputs[0].address

          setContractId(contractIdFromAddressString(contractAddr))
          setDetailsLoaded(true)

          let giftsStored = store.get('gifts')
          giftsStored.pop() // remove last entry to replace with the right one with contractid
          giftsStored = [
            ...giftsStored,
            {
              contractId: contractIdFromAddressString(contractAddr),
              secret: array,
              message: message,
              pot: isPot
            }
          ]

          store.remove('gifts')
          store.add('gifts', giftsStored)
          setGifts(store.get('gifts'))
        }
      } catch (error) {
        if ((error as Error).message.toLowerCase() == 'user rejected') {
          const giftsStored = store.get('gifts')
          giftsStored.pop()
          store.remove('gifts')
          store.add('gifts', giftsStored)
        }
      }
    }
  }

  const handleAddPotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (signer) {
      setDetailsLoaded(false)
      const floatToDecimals = convertToInt(withdrawAmount)

      const result = await giftDeposit(
        contractId,
        floatToDecimals[0],
        floatToDecimals[1],
        signer,
        selectedToken?.id ?? ALPH_TOKEN_ID,
        selectedToken?.decimals ?? Number(ONE_ALPH)
      )

      setOngoingTxId(result.txId)
      await waitForTxConfirmation(result.txId, 1, 5 * 1000)
      setDetailsLoaded(true)
      setGiftWrapped(true)

      getContractState(contractId).then((data) => {
        setContractState(data)
      })
    }
  }
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      getTokenList().then((data) => {
        setTokenList(data)
        setTokenSelect(
          data.map((token) => ({
            value: token.symbol,
            label: token.symbol
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

    !pot && window.addEventListener('beforeunload', beforeUnload)
    return () => {
      window.removeEventListener('beforeunload', beforeUnload)
    }
  }, [contractIdParam, pot])

  function beforeUnload(e: BeforeUnloadEvent) {
    e.preventDefault()
  }
  return (
    <div className={styles.mainContainer}>
      <Head>
        <title>Yodh - Alephium Gift Cards</title>
      </Head>

      <Header gifts={gifts} />

      <section id="yodhSection">
        <AlephiumConnectButton />

        {/* Add the local class to the form */}
        <form className={styles.giftForm} id="gift-form" onSubmit={!pot ? handleWithdrawSubmit : handleAddPotSubmit}>
          <label htmlFor="gift-message">{!pot ? 'Your Message' : 'Add tokens in the pot'}</label>
          {pot && (
            <Link href={`https://explorer.alephium.org/addresses/${addressFromContractId(contractId)}`}>
              Visit pot contract
            </Link>
          )}
          {pot && contractState !== undefined && (
            <label htmlFor="gift-message">
              {contractState?.asset.tokens !== undefined &&
                tokenList !== undefined &&
                number256ToNumber(contractState.asset.alphAmount, 18) > 0.1 && (
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
              autoFocus
            ></textarea>
          )}

          <Select
            options={tokenSelect}
            isSearchable={true}
            isClearable={true}
            onChange={(option) => setSelectedToken(tokenList?.find((token) => token.symbol === option?.label))}
            value={tokenSelect?.find(function (option) {
              return option.value === selectedToken?.symbol
            })}
          />
          <br />
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
            autoComplete="off"
            value={withdrawAmount}
            onChange={(e) => {
              setWithdrawAmount(e.target.value)
            }}
          />

          <div className={styles.giftCardSection}>
            <Tooltip id="my-tooltip" />
            <label
              htmlFor="poolGiftCard"
              data-tooltip-id="my-tooltip"
              data-tooltip-content="Want to do a common gift for a birthday? Building a community cagnotte? Use this!"
            >
              Pool gift card <Icon icon="material-symbols:info" />
            </label>

            <input
              disabled={pot}
              checked={pot}
              onChange={(e) => setPot(e.target.checked)}
              type="checkbox"
              id="poolGiftCard"
            />
          </div>
          <details id="">
            <summary>Advanced options</summary>
            <p>Lock gift until</p>
            <input
              aria-label="Date and time"
              type="datetime-local"
              onChange={(e) => {
                setDatetimeLock(BigInt(e.target.valueAsNumber))
              }}
            />
            <p>Custom password (optional)</p>
            <input
              type="text"
              placeholder="Enter custom password (min 6 characters)"
              value={customPassword}
              onChange={(e) => {
                setCustomPassword(e.target.value)
                if (e.target.value && e.target.value.length < 6) {
                  setPasswordError('Password must be at least 6 characters long')
                } else {
                  setPasswordError('')
                }
              }}
            />
            {passwordError && <p style={{ color: 'red' }}>{passwordError}</p>}
          </details>

          <button 
            type="submit" 
            disabled={connectionStatus !== 'connected' || Boolean(customPassword && customPassword.length < 6)} 
            className={styles.wrapButton}
          >
            <Icon icon="fa:gift" /> &nbsp; Wrap & Send Gift
          </button>
        </form>
      </section>

      {pot && giftWrapped && (
        <label htmlFor="gift-amount">
          <Icon icon="material-symbols:done" width="32" height="32" style={{ color: '#7e7eff' }} /> {withdrawAmount}{' '}
          {selectedToken?.symbol} has been added
        </label>
      )}
      {ongoingTxId && (
        <TxStatus
          txId={ongoingTxId}
          txStatusCallback={txStatusCallback}
          step={pot ? WithdrawState.Adding : WithdrawState.Wrapping}
        />
      )}

      <div>
        {!pot && contractId !== '' && giftWrapped ? (
          <PDFDownloadLink
            document={
              <PdfGiftCard
                sender={account?.address}
                contractId={contractId}
                message={message}
                secret={secret}
                amount={withdrawAmount}
                tokenSymbol={selectedToken?.symbol}
                customPassword={customPassword}
              />
            }
            title="Yodh Gift Card"
          >
            <Icon icon="material-symbols:download" fontSize="2.2em" /> Download gift card
          </PDFDownloadLink>
        ) : (
          ''
        )}
        <br />
        {isPot && contractId !== '' && (
          <Link href={`${getUrl()}/#contract=${contractId}&pot=${isPot}`} rel="noopener noreferrer" target="_blank">
            Share this to deposit more tokens
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
            <summary>Click to display Link and QRCode</summary>
            <p>Share this to the person you want to send the gift card</p>
            <QrCode 
              contractId={contractId} 
              secret={customPassword ? new Uint8Array() : secret} 
              message={message} 
              pot={isPot} 
            />
          </details>
        )}
        {/*!pot && contractId !== '' && secret.length >= 0 && giftWrapped && customPassword && (
          <details id="gitflink">
            <summary>Click to display gift link</summary>
            <p>Share this to the person you want to send the gift card</p>
            <p>
              <Link href={`${getUrl()}/#contract=${contractId}&msg=${encodeURIComponent(message)}`} rel="noopener noreferrer" target="_blank">
                Gift URL
              </Link>{' '}
              {isCopied ? (
                'URL Copied'
              ) : (
                <FaRegCopy
                  onClick={() => {
                    navigator.clipboard.writeText(`${getUrl()}/#contract=${contractId}&msg=${encodeURIComponent(message)}`)
                    setIsCopied(true)
                  }}
                >
                  Copy to Clipboard
                </FaRegCopy>
              )}
            </p>
          </details>
        )*/}
      </div>

      {pot && contractId !== '' && <Link href={'/'}>Create a new Gift Card</Link>}
      <Footer />
    </div>
  )
}
