import React from 'react'
import styles from '../styles/Gift.module.css'
import Link from 'next/link'
import { Gifts } from './CreatedGifts'
import Image from 'next/image'
import logo from '../../public/img/yodh.jpg'

export const Header = ({ gifts }: { gifts: any }) => {
  return (
    <header className={styles.header}>
     {gifts && <Gifts gifts={gifts} /> }

      <h1>
        <Image src={logo} alt="yodh logo" width={60} height={60} /> Yodh
      </h1>
      <p>
        <small>DigitALPH Gift Card</small>
      </p>
    </header>
  )
}
