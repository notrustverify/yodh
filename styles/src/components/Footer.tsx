import React, { useCallback, useRef } from 'react'
import styles from '../styles/Gift.module.css'
import Link from 'next/link'

export const Footer = () => {
  return (
    <footer className={styles.footerGift}>
      <p>
        Developed by{' '}
        <Link href="https://notrustverify.ch" rel="noopener noreferrer" target="_blank">
          No Trust Verify
        </Link>
      </p>
    </footer>
  )
}
