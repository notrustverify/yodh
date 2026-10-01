import React, { useEffect, useState } from 'react'
import { AlephiumConnectButton, useWallet } from '@alephium/web3-react'
import { Icon } from '@iconify/react'
import store from 'store2'
import { Gift, getNetwork } from '@/services/utils'
import styles from './MobileHome.module.css'

interface MobileHomeProps {
  onCreateGift: () => void
  onNavigate: (tab: string) => void
}

export default function MobileHome({ onCreateGift, onNavigate }: MobileHomeProps) {
  const { connectionStatus } = useWallet()
  const [gifts, setGifts] = useState<Gift[]>([])
  useEffect(() => {
    setGifts(store.get('gifts') || [])
  }, [])
  return (
    <div className={styles.homeContainer}>
      <section className={styles.welcomeSection}>
        <span className={styles.eyebrow}>A little ALPH. A lot of thought.</span>
        <h1 className={styles.welcomeTitle}>
          Make someone’s
          <br />
          day digital.
        </h1>
        <p className={styles.welcomeSubtitle}>Give ALPH or tokens with a personal message and a QR code.</p>
        <span className={styles.networkBadge}>{getNetwork()} network</span>
      </section>
      <section className={styles.connectSection}>
        <div className={styles.connectCard}>
          <Icon icon="material-symbols:card-giftcard" className={styles.connectIcon} />
          {connectionStatus !== 'connected' ? (
            <AlephiumConnectButton />
          ) : (
            <button className={styles.createButton} onClick={onCreateGift}>
              Create a gift <span aria-hidden="true">↗</span>
            </button>
          )}
        </div>
      </section>
      <section className={styles.gallerySection}>
        <details className={styles.savedGifts}>
          <summary className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Saved on this device</span>
            <span className={styles.giftCount}>{gifts.length} cards</span>
          </summary>
          {gifts.length ? (
            <div className={styles.giftGrid}>
              {gifts
                .slice(-2)
                .reverse()
                .map((gift, index) => (
                  <button
                    key={gift.contractId || index}
                    className={`${styles.giftCard} ${styles[`gradient${index + 1}`]}`}
                    onClick={() => onNavigate('gifts')}
                  >
                    <span className={styles.giftAmount}>{gift.pot ? 'Pooled gift' : 'Gift card'}</span>
                    <span className={styles.giftMessage}>{gift.message || 'A gift for you'}</span>
                    <span className={styles.giftDate}>View link and QR code →</span>
                  </button>
                ))}
            </div>
          ) : (
            <p className={styles.emptyState}>Create your first gift to save its link and QR code here.</p>
          )}
        </details>
      </section>
      <section className={styles.quickActions}>
        <details className={styles.howItWorks}>
          <summary>How gifting works</summary>
          <ol className={styles.steps}>
            <li>
              <strong>Choose your gift</strong>
              <span>Select ALPH or a token and add a personal message.</span>
            </li>
            <li>
              <strong>Make it yours</strong>
              <span>Set a password, a date to open it, or invite others to contribute.</span>
            </li>
            <li>
              <strong>Share the moment</strong>
              <span>Send the gift link or print a gift card with its QR code.</span>
            </li>
          </ol>
        </details>
        <div className={styles.actionGrid}>
          <button className={styles.actionCard} onClick={onCreateGift}>
            <Icon icon="material-symbols:send" className={styles.actionIcon} />
            <span>Send gift</span>
          </button>
          <button className={styles.actionCard} onClick={() => onNavigate('gifts')}>
            <Icon icon="material-symbols:history" className={styles.actionIcon} />
            <span>My gifts</span>
          </button>
          <button className={styles.actionCard} onClick={() => onNavigate('profile')}>
            <Icon icon="material-symbols:settings" className={styles.actionIcon} />
            <span>Account</span>
          </button>
          <a
            className={styles.actionCard}
            href="https://github.com/notrustverify/yodh"
            target="_blank"
            rel="noreferrer"
          >
            <Icon icon="material-symbols:help" className={styles.actionIcon} />
            <span>Help</span>
          </a>
        </div>
      </section>
    </div>
  )
}
