import Head from 'next/head'
import styles from '@/styles/Gift.module.css'
import { AlephiumConnectButton, useBalance, useWallet } from '@alephium/web3-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { node } from '@alephium/web3'
import { createGift } from '@/services/gift.service'
import { Icon } from '@iconify/react'
import { TxStatus } from './TxStatus'
import { PDFDownloadLink } from '@react-pdf/renderer'
import PdfGiftCard from './Pdf'
import QrCode from './Qrcode'
import { Footer } from './Footer'
import store, { StoreBase, StoreType } from 'store2'
import { Gifts } from './CreatedGifts'
import { Gift, WithdrawState } from '@/services/utils'

export default function Home() {
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

      const result = await createGift(BigInt(withdrawAmount), signer, account.address, array, 1800n * 1000n, [])
      setOngoingTxId(result.txId)
      setContractId(result.contractInstance.contractId)

     store.add('gifts', [{contractId: result.contractInstance.contractId, secret: array, message: message }])
    }
  }

  useEffect(() => {
   if (!initialized.current) {
      initialized.current = true
      setGifts(store.get('gifts'))
   }
  })

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
        <form className={styles.giftForm} id="gift-form" onSubmit={handleWithdrawSubmit}>
          <label htmlFor="gift-message">Your Message</label>
          <textarea
            id="gift-message"
            placeholder="Write a personalized message..."
            required
            rows={4}
            cols={50}
            maxLength={100}
            onChange={(e) => setMessage(e.target.value)}
          ></textarea>

          <label htmlFor="gift-amount">Amount in $ALPH</label>
          <label htmlFor="gift-amount">
            <small>
              {connectionStatus === 'connected' ? 'ALPH balance: ' + balance?.balanceHint.split('.')[0] + ' ℵ' : ''}
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

          <button type="submit" disabled={connectionStatus !== 'connected'} className={styles.wrapButton}>
            <Icon icon="fa:gift" /> &nbsp; Wrap & Send Gift
          </button>
        </form>

      </section>
 
      {ongoingTxId && <TxStatus txId={ongoingTxId} txStatusCallback={txStatusCallback} step={WithdrawState.Wrapping} />}
      <div>
        {contractId !== '' && giftWrapped ? (
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
        {(contractId !== '' && secret.length >= 0 && giftWrapped) &&  
          <details id="gitflink">
            <summary>Click to display QRCode</summary>
            <p>Share this to the person you want to send the gift card</p>
            <QrCode contractId={contractId} secret={secret} message={message} />
          </details>
        }
      </div>
      <br/>
      <Footer />
    </div>
  )
}
