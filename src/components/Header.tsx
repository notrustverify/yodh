import React from 'react'
import styles from '../styles/Gift.module.css'
import { getNetwork } from '@/services/utils'
import { Gifts } from './CreatedGifts'
import Image from 'next/image'
import logo from '../../public/img/yodh.jpg'

export const Header = ({ gifts, preview }: { gifts: any; preview?: React.ReactNode }) => {
  return (
    <header className={styles.header}>
      <h1>
        <Image src={logo} alt="yodh logo" width={60} height={60} /> Yodh
      </h1>
      <p>
        <small>Digital gifts, powered by Alephium</small>
      </p>
      {!preview && (
        <h2>
          A thoughtful gift.
          <br />A new way to give.
        </h2>
      )}
      <p>Send ALPH or tokens with a personal message, a link, and a little joy.</p>
      <span>{getNetwork()} network</span>
      {preview}
      {gifts && <Gifts gifts={gifts} />}
    </header>
  )
}
