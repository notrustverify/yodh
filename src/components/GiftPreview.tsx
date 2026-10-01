import React, { useState } from 'react'
import GiftPdfDownload from './GiftPdfDownload'
import type { GiftPdfProps } from './Pdf'
import { FiGift } from 'react-icons/fi'
import styles from '@/styles/Gift.module.css'

export default function GiftPreview({
  amount,
  tokenSymbol,
  message,
  pot
}: {
  amount: string
  tokenSymbol: string
  message: string
  pot: boolean
}) {
  const [sample, setSample] = useState<GiftPdfProps>()
  return (
    <div className={styles.previewFrame}>
      <span className={styles.previewLabel}>Your gift preview</span>
      <article className={styles.previewCard} aria-label="Gift card preview">
        <div className={styles.previewTop}>
          <span>Yodh</span>
          <FiGift aria-hidden="true" />
        </div>
        <span className={styles.previewKind}>{pot ? 'A gift, together' : 'A little gift for you'}</span>
        <strong className={styles.previewAmount}>
          {amount || '10'} <small>{tokenSymbol}</small>
        </strong>
        <p className={styles.previewMessage}>{message || 'A little something to make your day.'}</p>
        <div className={styles.previewBottomRow}>
          <span className={styles.previewBottom}>Digital gift card · Alephium</span>
          <button
            type="button"
            className={styles.previewPdfButton}
            onClick={() =>
              setSample({
                contractId: '0'.repeat(64),
                secret: new Uint8Array(128),
                amount: amount || '10',
                tokenSymbol,
                message: message || 'A little something to make your day.',
                example: true
              })
            }
          >
            Preview PDF
          </button>
        </div>
      </article>
      {sample && (
        <div className={styles.sampleDownload}>
          <GiftPdfDownload {...sample} />
          <small>Example only; no redeemable funds.</small>
        </div>
      )}
    </div>
  )
}
