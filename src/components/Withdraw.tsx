'use client'
import React, { useCallback, useEffect, useState } from 'react'
import Head from 'next/head'
import { AlephiumConnectButton, useWallet } from '@alephium/web3-react'
import {
  addressFromContractId,
  isValidAddress,
  number256ToNumber,
  waitForTxConfirmation,
  ZERO_ADDRESS
} from '@alephium/web3'
import type { Giftv2Types } from '../../artifacts/ts'
import { CoinGeckoClient } from 'coingecko-api-v3'
import { announce, cancel, checkHash, claim, claimv2, getContractState } from '@/services/gift.service'
import { contractExists, contractIdFromAddressString, getNetwork, getTokenList, Token } from '@/services/utils'
import { claimPermissions, decodeGiftSecret, normalizeGiftAddress } from '@/services/claim'
import { ClaimGiftView } from './ClaimGiftView'
import AlephiumDomain from './ANS'

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
  const [gift, setGift] = useState<Giftv2Types.State>()
  const [contract, setContract] = useState('')
  const [loading, setLoading] = useState(true)
  const [available, setAvailable] = useState(true)
  const [completed, setCompleted] = useState<'claimed' | 'cancelled'>()
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [secretPhrase, setSecretPhrase] = useState('')
  const [tokenList, setTokenList] = useState<Token[]>([])
  const [percentage, setPercentage] = useState<number>()
  const [recipient, setRecipient] = useState('')
  const [now, setNow] = useState(Date.now())
  const [busy, setBusy] = useState<'unwrap' | 'claim' | 'cancel'>()
  const [txId, setTxId] = useState<string>()
  const [confirmationPending, setConfirmationPending] = useState(false)
  const [pendingAction, setPendingAction] = useState<'unwrap' | 'claim' | 'cancel'>()
  const secretDecoded = React.useMemo(() => {
    if (secretPhrase) return new TextEncoder().encode(secretPhrase)
    try {
      return decodeGiftSecret(secret || '')
    } catch {
      return new Uint8Array()
    }
  }, [secret, secretPhrase])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setGift(undefined)
    setContract('')
    setCompleted(undefined)
    setAvailable(true)
    const load = async () => {
      try {
        const id = isValidAddress(contractId) ? contractIdFromAddressString(contractId) : contractId
        if (!/^[a-fA-F0-9]{64}$/.test(id)) throw new Error('Invalid gift link')
        const address = addressFromContractId(id)
        if (active) setContract(id)
        const exists = await contractExists(address)
        const state = exists ? await getContractState(id) : undefined
        if (active) {
          setAvailable(exists)
          setGift(state)
        }
      } catch {
        if (active) setError('We couldn’t load this gift. Check your connection and try again.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [contractId, retry])

  useEffect(() => {
    setSecretPhrase('')
    setRecipient('')
  }, [contractId, secret])

  useEffect(() => {
    let active = true
    getTokenList()
      .then((list) => {
        if (active) setTokenList(list)
      })
      .catch(() => {})
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    let active = true
    setPercentage(undefined)
    if (!gift || gift.fields.initialUsdPrice <= 0n) return
    const initial = number256ToNumber(gift.fields.initialUsdPrice, 8)
    const client = new CoinGeckoClient({ timeout: 10000, autoRetry: false })
    client
      .simplePrice({ vs_currencies: 'usd', ids: 'alephium' })
      .then((prices) => {
        const current = prices.alephium?.usd
        if (active && current > 0 && initial > 0) setPercentage(((current - initial) / initial) * 100)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [gift])

  const connected = connectionStatus === 'connected'
  const validSecret = secretDecoded.length > 0 && checkHash(secretDecoded, gift?.fields.hashedSecret)
  const permissions = claimPermissions({
    connected,
    busy: Boolean(busy || confirmationPending || loading),
    available,
    validSecret,
    announcedAddress: gift?.fields.announcedAddress,
    connectedAddress: account?.address,
    zeroAddress: ZERO_ADDRESS,
    lockedUntil: gift?.fields.announcementLockedUntil || 0n,
    now
  })
  const recipientError = Boolean(recipient && !isValidAddress(recipient))
  const canCancel = Boolean(
    connected &&
      available &&
      gift?.fields.isCancellable &&
      normalizeGiftAddress(gift.fields.sender) === account?.address
  )

  // A submitted transaction stays pending until confirmed, even if polling fails.
  const settleTransaction = useCallback(
    async (id: string, action: 'unwrap' | 'claim' | 'cancel') => {
      setConfirmationPending(true)
      await waitForTxConfirmation(id, 1, 5000)
      if (action === 'unwrap') setGift(await getContractState(contract))
      else {
        setCompleted(action === 'claim' ? 'claimed' : 'cancelled')
        setAvailable(false)
      }
      setTxId(undefined)
      setPendingAction(undefined)
      setConfirmationPending(false)
    },
    [contract]
  )

  const execute = async (action: 'unwrap' | 'claim' | 'cancel') => {
    if (!signer || !gift || !account || busy || confirmationPending) return
    if (action === 'unwrap' && !permissions.canUnwrap) return
    if (action === 'claim' && (!permissions.canClaim || recipientError)) return
    if (action === 'cancel' && !canCancel) return
    setBusy(action)
    setError('')
    let submitted = false
    try {
      const result =
        action === 'unwrap'
          ? await announce(signer, contract)
          : action === 'cancel'
          ? await cancel(signer, contract)
          : gift.fields.version === 0n
          ? await claim(signer, secretDecoded, contract)
          : await claimv2(signer, secretDecoded, contract, recipient || account.address)
      submitted = true
      setTxId(result.txId)
      setPendingAction(action)
      await settleTransaction(result.txId, action)
    } catch (cause) {
      if (submitted)
        setError(
          'Your transaction was submitted, but confirmation could not be checked. Check its status on the explorer before continuing.'
        )
      else
        setError(cause instanceof Error ? cause.message : 'The transaction could not be completed. Please try again.')
    } finally {
      setBusy(undefined)
    }
  }
  const network = getNetwork()
  const explorer =
    network === 'mainnet'
      ? 'https://explorer.alephium.org'
      : network === 'testnet'
      ? 'https://testnet.alephium.org'
      : undefined
  return (
    <>
      <Head>
        <title>Open your gift · Yodh</title>
      </Head>
      <ClaimGiftView
        gift={gift}
        message={message}
        tokenList={tokenList}
        percentage={percentage}
        explorerHref={explorer && contract ? `${explorer}/addresses/${addressFromContractId(contract)}` : undefined}
        senderName={gift && <AlephiumDomain addressParams={normalizeGiftAddress(gift.fields.sender)} />}
        walletButton={<AlephiumConnectButton />}
        connected={connected}
        loading={loading}
        available={available}
        completed={completed}
        error={error}
        secretPhrase={secretPhrase}
        validSecret={validSecret}
        {...permissions}
        busy={busy}
        canCancel={canCancel && !confirmationPending}
        recipient={recipient}
        recipientError={recipientError}
        transactionStatus={
          txId && (
            <span>
              Waiting for transaction confirmation…{' '}
              {explorer && (
                <a href={`${explorer}/transactions/${txId}`} target="_blank" rel="noreferrer">
                  View transaction ↗
                </a>
              )}
            </span>
          )
        }
        onSecretChange={setSecretPhrase}
        onRecipientChange={(value) => setRecipient(value.trim())}
        onSubmit={(event) => {
          event.preventDefault()
          void execute(permissions.reservedForYou ? 'claim' : 'unwrap')
        }}
        onCancel={() => void execute('cancel')}
        onRetry={() => {
          if (txId && pendingAction) {
            setError('')
            setBusy(pendingAction)
            void settleTransaction(txId, pendingAction)
              .catch(() =>
                setError('Confirmation is still unavailable. Check the transaction on the explorer or try again.')
              )
              .finally(() => setBusy(undefined))
          } else setRetry((value) => value + 1)
        }}
      />
    </>
  )
}
