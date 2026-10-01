import React from 'react'
import { useWallet, useBalance } from '@alephium/web3-react'
import { Icon } from '@iconify/react'
import { FiGift } from 'react-icons/fi'
import styles from './MobileLayout.module.css'

interface MobileLayoutProps {
  children: React.ReactNode
  activeTab: string
  onTabChange: (tab: string) => void
}

export default function MobileLayout({ children, activeTab, onTabChange }: MobileLayoutProps) {
  const { connectionStatus, account } = useWallet()
  const { balance } = useBalance()

  const tabs = [
    { id: 'home', label: 'Home', icon: 'material-symbols:home' },
    { id: 'create', label: 'Create', icon: 'material-symbols:add-circle' },
    { id: 'gifts', label: 'My Gifts', icon: 'material-symbols:card-giftcard' },
    { id: 'profile', label: 'Profile', icon: 'material-symbols:person' }
  ]

  const formatBalance = (balance: string | undefined) => {
    if (!balance) return '0.00'
    const num = parseFloat(balance)
    return num.toFixed(2)
  }

  return (
    <div className={styles.mobileContainer}>
      {/* Header with Wallet Balance */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <Icon icon="material-symbols:card-giftcard" className={styles.logoIcon} />
            <span className={styles.logoText}>Yodh</span>
          </div>

          {connectionStatus === 'connected' && (
            <div className={styles.walletBalance}>
              <div className={styles.balanceAmount}>{formatBalance(balance?.balanceHint)} ℵ</div>
              <div className={styles.balanceLabel}>ALPH Balance</div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.mainContent}>{children}</main>

      {/* Bottom Navigation */}
      <nav className={styles.bottomNav} aria-label="Main navigation">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            aria-current={activeTab === tab.id ? 'page' : undefined}
            className={`${styles.navItem} ${activeTab === tab.id ? styles.navItemActive : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.id === 'gifts' ? (
              <FiGift className={styles.navIcon} aria-hidden="true" />
            ) : (
              <Icon icon={tab.icon} className={styles.navIcon} />
            )}
            <span className={styles.navLabel}>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
