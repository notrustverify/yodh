import React, { useEffect, useState } from 'react'
import store from 'store2'
import { Gift, getNetwork } from '@/services/utils'
import { useWallet, useBalance, useConnect } from '@alephium/web3-react'
import { Icon } from '@iconify/react'
import { AlephiumConnectButton } from '@alephium/web3-react'
import styles from './MobileProfile.module.css'

interface MobileProfileProps {
  onBack: () => void
  onNavigate: (tab: string) => void
}

export default function MobileProfile({ onBack, onNavigate }: MobileProfileProps) {
  const { connectionStatus, account } = useWallet()
  const { disconnect } = useConnect()
  const { balance } = useBalance()
  const [gifts, setGifts] = useState<Gift[]>([])
  const [notice, setNotice] = useState('')
  useEffect(() => {
    setGifts(store.get('gifts') || [])
  }, [])

  const formatBalance = (balance: string | undefined) => {
    if (!balance) return '0.00'
    const num = parseFloat(balance)
    return num.toFixed(2)
  }

  const formatAddress = (address: string) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const menuItems = [
    {
      icon: 'material-symbols:history',
      label: 'Transaction History',
      action: () =>
        window.open(
          `https://${getNetwork() === 'mainnet' ? '' : 'testnet.'}explorer.alephium.org/addresses/${account?.address}`,
          '_blank',
          'noopener,noreferrer'
        )
    },
    {
      icon: 'material-symbols:settings',
      label: 'Settings',
      action: () => setNotice(`Connected to ${getNetwork()}. Use the wallet connection menu to manage your connection.`)
    },
    {
      icon: 'material-symbols:help',
      label: 'Help & Support',
      action: () => window.open('https://github.com/notrustverify/yodh/issues', '_blank', 'noopener,noreferrer')
    },
    {
      icon: 'material-symbols:info',
      label: 'About',
      action: () =>
        setNotice(
          'Yodh lets you give ALPH and Alephium tokens with a link, QR code, or printable gift card. Built by No Trust Verify.'
        )
    },
    { icon: 'material-symbols:logout', label: 'Disconnect Wallet', action: disconnect, danger: true }
  ]

  if (connectionStatus !== 'connected') {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={onBack} aria-label="Back to home">
            <Icon icon="material-symbols:arrow-back" />
          </button>
          <h1 className={styles.title}>Profile</h1>
        </div>

        <div className={styles.connectSection}>
          <div className={styles.connectCard}>
            <Icon icon="material-symbols:person" className={styles.connectIcon} />
            <h3>Connect Your Wallet</h3>
            <p>Connect your Alephium wallet to access your profile</p>
            <AlephiumConnectButton />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={onBack} aria-label="Back to home">
          <Icon icon="material-symbols:arrow-back" />
        </button>
        <h1 className={styles.title}>Profile</h1>
      </div>

      {/* Profile Header */}
      <div className={styles.profileHeader}>
        <div className={styles.avatar}>
          <Icon icon="material-symbols:person" />
        </div>
        <div className={styles.profileInfo}>
          <h2 className={styles.profileName}>Wallet User</h2>
          <p className={styles.profileAddress}>{formatAddress(account?.address || '')}</p>
        </div>
      </div>

      {/* Balance Card */}
      <div className={styles.balanceCard}>
        <div className={styles.balanceHeader}>
          <h3 className={styles.balanceTitle}>Total Balance</h3>
          <Icon icon="material-symbols:visibility" className={styles.visibilityIcon} />
        </div>
        <div className={styles.balanceAmount}>{formatBalance(balance?.balanceHint)} ℵ</div>
        <div className={styles.balanceLabel}>ALPH</div>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{gifts.length}</div>
          <div className={styles.statLabel}>Saved gifts</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{gifts.filter((gift) => !gift.pot).length}</div>
          <div className={styles.statLabel}>Personal gifts</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{gifts.filter((gift) => gift.pot).length}</div>
          <div className={styles.statLabel}>Pooled gifts</div>
        </div>
      </div>

      {notice && <p role="status">{notice}</p>}
      <AlephiumConnectButton />
      <button onClick={() => onNavigate('gifts')}>View saved gifts</button>
      {/* Menu Items */}
      <div className={styles.menuSection}>
        <h3 className={styles.sectionTitle}>Account</h3>
        <div className={styles.menuList}>
          {menuItems.map((item, index) => (
            <button
              key={index}
              className={`${styles.menuItem} ${item.danger ? styles.menuItemDanger : ''}`}
              onClick={item.action}
            >
              <Icon icon={item.icon} className={styles.menuIcon} />
              <span className={styles.menuLabel}>{item.label}</span>
              <Icon icon="material-symbols:chevron-right" className={styles.menuArrow} />
            </button>
          ))}
        </div>
      </div>

      {/* App Info */}
      <div className={styles.appInfo}>
        <div className={styles.appVersion}>Yodh v2.0.0</div>
        <div className={styles.appDescription}>Digital gift cards powered by Alephium</div>
      </div>
    </div>
  )
}
