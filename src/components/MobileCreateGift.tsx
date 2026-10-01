import React, { useState, useEffect } from 'react'
import { useWallet, useBalance } from '@alephium/web3-react'
import { Icon } from '@iconify/react'
import { AlephiumConnectButton } from '@alephium/web3-react'
import styles from './MobileCreateGift.module.css'
import { createGift, getContractState } from '@/services/gift.service'
import { convertToInt, getTokenList, Token } from '@/services/utils'
import { ALPH_TOKEN_ID, ONE_ALPH, waitForTxConfirmation, web3 } from '@alephium/web3'
import { contractIdFromAddressString } from '@/services/utils'
import store from 'store2'

interface MobileCreateGiftProps {
  onBack: () => void
  onGiftCreated: (contractId: string) => void
}

export default function MobileCreateGift({ onBack, onGiftCreated }: MobileCreateGiftProps) {
  const { signer, account, connectionStatus } = useWallet()
  const { balance } = useBalance()
  
  const [step, setStep] = useState<'form' | 'preview' | 'success'>('form')
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [selectedToken, setSelectedToken] = useState<Token | undefined>({
    id: '0000000000000000000000000000000000000000000000000000000000000000',
    name: 'Alephium',
    symbol: 'ALPH',
    decimals: 18,
    description: 'Alephium is a scalable, decentralized, and secure blockchain platform.',
    logoURI: 'https://raw.githubusercontent.com/alephium/token-list/master/logos/ALPH.png'
  })
  const [tokenList, setTokenList] = useState<Token[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [contractId, setContractId] = useState('')
  const [secret, setSecret] = useState<Uint8Array>(new Uint8Array())

  useEffect(() => {
    getTokenList().then((data) => {
      setTokenList(data)
    })
  }, [])

  const handleAmountChange = (value: string) => {
    // Allow only numbers and decimal point
    const numericValue = value.replace(/[^0-9.]/g, '')
    setAmount(numericValue)
  }

  const handleCreateGift = async () => {
    if (!signer || !account) {
      setError('Please connect your wallet')
      return
    }

    if (!amount || !message) {
      setError('Please fill in all fields')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Generate random secret
      const array = new Uint8Array(128)
      crypto.getRandomValues(array)
      setSecret(array)

      const floatToDecimals = convertToInt(amount)
      
      const result = await createGift(
        floatToDecimals[0],
        floatToDecimals[1],
        signer,
        account.address,
        array,
        1800n * 1000n,
        selectedToken?.id ?? ALPH_TOKEN_ID,
        selectedToken?.decimals ?? Number(ONE_ALPH),
        0n
      )

      await waitForTxConfirmation(result.txId, 1, 5 * 1000)
      const details = await web3.getCurrentNodeProvider().transactions.getTransactionsDetailsTxid(result.txId)
      
      if (details?.unsigned.scriptOpt !== undefined && details.scriptExecutionOk) {
        const contractAddr = details.generatedOutputs[0].address
        const newContractId = contractIdFromAddressString(contractAddr)
        setContractId(newContractId)

        // Store gift in local storage
        const gifts = store.get('gifts') || []
        gifts.push({
          contractId: newContractId,
          secret: array,
          message: message,
          pot: false
        })
        store.set('gifts', gifts)

        setStep('success')
        onGiftCreated(newContractId)
      }
    } catch (error) {
      console.error('Error creating gift:', error)
      setError('Failed to create gift. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const formatBalance = (balance: string | undefined) => {
    if (!balance) return '0.00'
    const num = parseFloat(balance)
    return num.toFixed(2)
  }

  if (connectionStatus !== 'connected') {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={onBack}>
            <Icon icon="material-symbols:arrow-back" />
          </button>
          <h1 className={styles.title}>Create Gift Card</h1>
        </div>
        
        <div className={styles.connectSection}>
          <div className={styles.connectCard}>
            <Icon icon="material-symbols:wallet" className={styles.connectIcon} />
            <h3>Connect Your Wallet</h3>
            <p>Connect your Alephium wallet to create gift cards</p>
            <AlephiumConnectButton />
          </div>
        </div>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className={styles.container}>
        <div className={styles.successSection}>
          <div className={styles.successIcon}>
            <Icon icon="material-symbols:check-circle" />
          </div>
          <h2 className={styles.successTitle}>Gift Card Created!</h2>
          <p className={styles.successMessage}>
            Your gift card has been successfully created and is ready to share.
          </p>
          <div className={styles.successActions}>
            <button className={styles.primaryButton} onClick={onBack}>
              View My Gifts
            </button>
            <button className={styles.secondaryButton} onClick={() => setStep('form')}>
              Create Another
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={onBack}>
          <Icon icon="material-symbols:arrow-back" />
        </button>
        <h1 className={styles.title}>Create Gift Card</h1>
      </div>

      <div className={styles.form}>
        {/* Message Input */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Personal Message</label>
          <textarea
            className={styles.textarea}
            placeholder="Write a personalized message for the recipient..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={100}
            rows={3}
          />
          <div className={styles.charCount}>{message.length}/100</div>
        </div>

        {/* Token Selection */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Token</label>
          <div className={styles.tokenSelector}>
            <div className={styles.selectedToken}>
              <img 
                src={selectedToken?.logoURI} 
                alt={selectedToken?.symbol}
                className={styles.tokenLogo}
              />
              <span className={styles.tokenSymbol}>{selectedToken?.symbol}</span>
              <span className={styles.tokenName}>{selectedToken?.name}</span>
            </div>
            <button className={styles.changeTokenButton}>
              <Icon icon="material-symbols:expand-more" />
            </button>
          </div>
        </div>

        {/* Amount Input */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Amount</label>
          <div className={styles.amountInput}>
            <input
              type="text"
              className={styles.amountField}
              placeholder="0.00"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
            />
            <span className={styles.tokenSymbol}>{selectedToken?.symbol}</span>
          </div>
          <div className={styles.balanceInfo}>
            Balance: {formatBalance(balance?.balanceHint)} {selectedToken?.symbol}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className={styles.errorMessage}>
            <Icon icon="material-symbols:error" />
            {error}
          </div>
        )}

        {/* Create Button */}
        <button
          className={styles.createButton}
          onClick={handleCreateGift}
          disabled={isLoading || !amount || !message}
        >
          {isLoading ? (
            <>
              <Icon icon="material-symbols:progress-activity" className={styles.loadingIcon} />
              Creating Gift Card...
            </>
          ) : (
            <>
              <Icon icon="material-symbols:card-giftcard" />
              Create Gift Card
            </>
          )}
        </button>
      </div>
    </div>
  )
}
