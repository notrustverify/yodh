import React, { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import store from 'store2'
import { Gift } from '@/services/utils'
import QrCode from './Qrcode'
import styles from './MobileGiftsList.module.css'

export default function MobileGiftsList({ onBack, onCreateGift }: { onBack: () => void; onCreateGift: () => void }) {
  const [gifts, setGifts] = useState<Gift[]>([])
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'personal' | 'pool'>('all')
  useEffect(() => {
    setGifts(store.get('gifts') || [])
  }, [])
  const filteredGifts = gifts.filter(
    (gift) =>
      (filter === 'all' || (filter === 'pool' ? gift.pot : !gift.pot)) &&
      `${gift.message} ${gift.contractId}`.toLowerCase().includes(query.toLowerCase())
  )
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={onBack} aria-label="Back to home">
          <Icon icon="material-symbols:arrow-back" />
        </button>
        <h1 className={styles.title}>My gifts</h1>
      </div>
      <p>Gift links saved on this device. Open a gift link to check its current balance and redemption state.</p>
      <label htmlFor="gift-search">Search gifts</label>
      <input
        id="gift-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Message or contract ID"
      />
      <div className={styles.filterTabs}>
        {(['all', 'personal', 'pool'] as const).map((value) => (
          <button
            key={value}
            aria-pressed={filter === value}
            className={`${styles.filterTab} ${filter === value ? styles.filterTabActive : ''}`}
            onClick={() => setFilter(value)}
          >
            {value === 'all' ? 'All gifts' : value === 'pool' ? 'Pooled gifts' : 'Personal gifts'}
          </button>
        ))}
      </div>
      <div className={styles.giftsList}>
        {!filteredGifts.length ? (
          <div className={styles.emptyState}>
            <Icon icon="material-symbols:card-giftcard" className={styles.emptyIcon} />
            <h2 className={styles.emptyTitle}>{gifts.length ? 'No matching gifts' : 'Your first gift awaits'}</h2>
            <p className={styles.emptyMessage}>Create a personal gift and share a little joy.</p>
            <button className={styles.createFirstButton} onClick={onCreateGift}>
              Create a gift
            </button>
          </div>
        ) : (
          filteredGifts.map((gift, index) => (
            <article key={gift.contractId || index} className={styles.giftCard}>
              <h2 className={styles.giftAmount}>{gift.pot ? 'Pooled gift' : 'Gift card'}</h2>
              <p className={styles.giftMessage}>{gift.message || 'A gift for you'}</p>
              <details>
                <summary>Show gift link and QR code</summary>
                <QrCode
                  contractId={gift.contractId}
                  message={gift.message || ''}
                  secret={new Uint8Array(Object.values(gift.secret || {}))}
                  pot={gift.pot}
                />
              </details>
            </article>
          ))
        )}
      </div>
      <button className={styles.fab} onClick={onCreateGift} aria-label="Create a gift">
        <Icon icon="material-symbols:add" />
      </button>
    </div>
  )
}
