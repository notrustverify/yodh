import React from 'react'
import Link from 'next/link'
import {
  FiArrowLeft,
  FiArrowUpRight,
  FiCheck,
  FiCheckCircle,
  FiGift,
  FiLock,
  FiShield,
  FiClock,
  FiAlertCircle
} from 'react-icons/fi'
import type { Giftv2Types } from '../../artifacts/ts'
import type { Token } from '../services/utils'
import { formatGiftAmount, normalizeGiftAddress } from '../services/claim'
import styles from './ClaimGift.module.css'

export interface ClaimGiftViewProps {
  gift?: Giftv2Types.State
  message: string
  tokenList: Token[]
  percentage?: number
  explorerHref?: string
  senderName?: React.ReactNode
  walletButton: React.ReactNode
  connected: boolean
  loading: boolean
  available: boolean
  completed?: 'claimed' | 'cancelled'
  error: string
  secretPhrase: string
  validSecret: boolean
  canUnwrap: boolean
  canClaim: boolean
  reservedForYou: boolean
  reservedForOther: boolean
  timeLocked: boolean
  busy?: 'unwrap' | 'claim' | 'cancel'
  canCancel: boolean
  recipient: string
  recipientError: boolean
  transactionStatus?: React.ReactNode
  onSecretChange: (secret: string) => void
  onRecipientChange: (address: string) => void
  onSubmit: (event: React.FormEvent) => void
  onCancel: () => void
  onRetry: () => void
}

export function ClaimGiftView(props: ClaimGiftViewProps) {
  const { gift, loading, available, reservedForYou, completed, busy } = props
  const finished = Boolean(completed || (!loading && !available && !props.error))
  const lockDate = gift ? new Date(Number(gift.fields.announcementLockedUntil)).toLocaleString() : ''
  const sender = normalizeGiftAddress(gift?.fields.sender)
  const alphAmount = gift ? formatGiftAmount(gift.asset.alphAmount, 18) : undefined
  const tokens = gift?.asset.tokens || []
  return (
    <main className={styles.claimShell}>
      <header className={styles.topBar}>
        <Link href="/" className={styles.brand} aria-label="Yodh home">
          <FiGift aria-hidden="true" /> Yodh
        </Link>
      </header>
      <div className={styles.claimGrid}>
        <section className={styles.giftSide} aria-label="Your gift">
          <span className={styles.eyebrow}>Someone thought of you</span>
          <h1>
            A little surprise.
            <br />
            Just for you.
          </h1>
          <article className={styles.giftCard} aria-label="Gift card">
            <div className={styles.cardTop}>
              <span>Yodh</span>
              <FiGift aria-hidden="true" />
            </div>
            <span className={styles.cardLabel}>A gift for you</span>
            <div className={styles.balances} aria-live="polite">
              {loading ? (
                <span className={styles.loadingAmount}>Checking your gift…</span>
              ) : alphAmount !== undefined ? (
                <strong className={styles.amount}>
                  {alphAmount} <span>ALPH</span>
                </strong>
              ) : (
                <strong className={styles.amount}>
                  {completed === 'claimed' ? 'Enjoy your gift!' : 'Digital gift card'}
                </strong>
              )}
              {tokens.map((token) => {
                const metadata = props.tokenList.find((item) => item.id === token.id)
                return (
                  <span key={token.id} className={styles.tokenAmount}>
                    {metadata
                      ? `${formatGiftAmount(token.amount, metadata.decimals)} ${metadata.symbol}`
                      : `${token.amount} base units · Token ${token.id.slice(0, 8)}…`}
                  </span>
                )
              })}
            </div>
            <p className={styles.message}>{props.message || 'A little something to make your day.'}</p>
            {sender && (
              <div className={styles.sender}>
                <span>FROM</span>
                <span title={sender}>{props.senderName || `${sender.slice(0, 8)}…${sender.slice(-6)}`}</span>
              </div>
            )}
            <span className={styles.cardFooter}>Digital gift card · Alephium</span>
          </article>
          {props.percentage !== undefined && (
            <p className={styles.priceChange}>
              ALPH price {props.percentage >= 0 ? '+' : ''}
              {props.percentage.toFixed(2)}% since this gift was created.
            </p>
          )}
          {props.explorerHref && (
            <a className={styles.explorerLink} href={props.explorerHref} target="_blank" rel="noreferrer">
              View gift on explorer <FiArrowUpRight aria-hidden="true" />
            </a>
          )}
        </section>
        <section className={styles.claimSide} aria-label="Claim your gift">
          {finished ? (
            <div className={styles.completed} role="status">
              <FiCheckCircle aria-hidden="true" />
              <h2>
                {completed === 'claimed'
                  ? 'Your gift is yours.'
                  : completed === 'cancelled'
                  ? 'Gift cancelled.'
                  : 'This gift has already been opened.'}
              </h2>
              <p>
                {completed === 'claimed'
                  ? 'The tokens have been sent to your recipient address. Enjoy your surprise!'
                  : completed === 'cancelled'
                  ? 'The remaining tokens have been returned to the sender.'
                  : 'It may have been claimed or cancelled by the sender.'}
              </p>
              <Link href="/" className={styles.primaryLink}>
                Create a gift of your own <FiArrowUpRight aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <>
              <span className={styles.eyebrow}>Open your gift</span>
              <h2>Two steps to a little joy.</h2>
              <p className={styles.intro}>
                Connect your wallet, then sign twice: once to reserve the gift, and once to receive it.
              </p>
              <div className={styles.walletRow}>{props.walletButton}</div>
              {props.error && (
                <div className={styles.error} role="alert">
                  <FiAlertCircle aria-hidden="true" />
                  <span>{props.error}</span>
                  {(!gift || props.transactionStatus) && (
                    <button onClick={props.onRetry} type="button" disabled={Boolean(busy)}>
                      Try again
                    </button>
                  )}
                </div>
              )}
              <form onSubmit={props.onSubmit} className={styles.claimForm} aria-busy={Boolean(busy || loading)}>
                {gift && available && !props.validSecret && (
                  <div className={styles.passwordBlock}>
                    <label htmlFor="claim-password">
                      <FiLock aria-hidden="true" /> Gift password or secret
                    </label>
                    <input
                      id="claim-password"
                      type="password"
                      autoComplete="off"
                      value={props.secretPhrase}
                      onChange={(event) => props.onSecretChange(event.target.value)}
                      placeholder="Enter the secret shared by the sender"
                      aria-describedby="password-help"
                      disabled={Boolean(busy)}
                    />
                    <p id="password-help">
                      {props.secretPhrase
                        ? 'That password does not match this gift. Check it with the sender.'
                        : 'This gift needs a password. Ask the sender for it.'}
                    </p>
                  </div>
                )}
                {gift && props.validSecret && (
                  <div className={styles.verified}>
                    <FiShield aria-hidden="true" /> Gift key verified
                  </div>
                )}
                {gift && props.timeLocked && !reservedForYou && (
                  <div className={styles.lockNotice} role="status">
                    <FiClock aria-hidden="true" />
                    <span>
                      {props.reservedForOther ? 'Reserved by another wallet' : 'A surprise worth waiting for'}
                      <small>
                        {props.reservedForOther ? 'The reservation ends' : 'You can unwrap it'} on {lockDate}.
                      </small>
                    </span>
                  </div>
                )}
                <ol className={styles.steps} aria-label="Claim progress">
                  <li
                    className={reservedForYou ? styles.stepDone : styles.stepActive}
                    aria-current={!reservedForYou ? 'step' : undefined}
                  >
                    <span className={styles.stepNumber}>{reservedForYou ? <FiCheck aria-hidden="true" /> : '1'}</span>
                    <div>
                      <h3>Unwrap your gift</h3>
                      <p>
                        {reservedForYou
                          ? 'Reserved for your connected wallet.'
                          : 'Sign to reserve this gift for your wallet.'}
                      </p>
                    </div>
                  </li>
                  <li
                    className={reservedForYou ? styles.stepActive : styles.stepWaiting}
                    aria-current={reservedForYou ? 'step' : undefined}
                  >
                    <span className={styles.stepNumber}>2</span>
                    <div>
                      <h3>Receive your tokens</h3>
                      <p>Sign again to send the gift to your address.</p>
                    </div>
                  </li>
                </ol>
                <button
                  type="submit"
                  className={styles.claimButton}
                  disabled={
                    loading ||
                    Boolean(busy) ||
                    (reservedForYou ? !props.canClaim || props.recipientError : !props.canUnwrap)
                  }
                >
                  <FiGift aria-hidden="true" />{' '}
                  {busy === 'unwrap'
                    ? 'Unwrapping your gift…'
                    : busy === 'claim'
                    ? 'Receiving your tokens…'
                    : loading
                    ? 'Checking your gift…'
                    : reservedForYou
                    ? '2 · Receive my gift'
                    : '1 · Unwrap my gift'}
                </button>
                {!props.connected && <p className={styles.actionHint}>Connect your wallet to get started.</p>}
                {props.transactionStatus && (
                  <div className={styles.transactionStatus} role="status">
                    {props.transactionStatus}
                  </div>
                )}
                <details className={styles.advanced}>
                  <summary>Recipient options</summary>
                  {gift && gift.fields.version >= 1n ? (
                    <>
                      <label htmlFor="claim-recipient">Send tokens to another address</label>
                      <input
                        id="claim-recipient"
                        type="text"
                        autoComplete="off"
                        spellCheck={false}
                        placeholder="Leave empty to use your connected wallet"
                        value={props.recipient}
                        onChange={(event) => props.onRecipientChange(event.target.value)}
                        aria-invalid={props.recipientError}
                        aria-describedby="recipient-help"
                        disabled={Boolean(busy)}
                      />
                      <p id="recipient-help">
                        {props.recipientError
                          ? 'Enter a valid Alephium address.'
                          : 'Your connected wallet receives the gift unless you enter another address.'}
                      </p>
                    </>
                  ) : (
                    <p>
                      {loading
                        ? 'Recipient options will appear after the gift loads.'
                        : 'This gift version sends tokens to the wallet that unwraps it.'}
                    </p>
                  )}
                </details>
              </form>
              {props.canCancel && (
                <details className={styles.senderOptions}>
                  <summary>Sender controls</summary>
                  <p>As the sender, you can cancel this gift and recover its remaining tokens.</p>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    disabled={Boolean(busy)}
                    onClick={props.onCancel}
                  >
                    {busy === 'cancel' ? 'Returning tokens…' : 'Cancel gift & recover tokens'}
                  </button>
                </details>
              )}
            </>
          )}
        </section>
      </div>
      <footer className={styles.footer}>
        <Link href="/">
          <FiArrowLeft aria-hidden="true" /> Create a gift
        </Link>
        <span>
          Built by{' '}
          <a href="https://notrustverify.ch" target="_blank" rel="noreferrer">
            No Trust Verify
          </a>
        </span>
      </footer>
    </main>
  )
}
