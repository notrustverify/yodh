import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import styles from '@/styles/Home.module.css'
import { WithdrawDapp } from '@/components/Withdraw'
import NewGift from '@/components/NewGift'
import MobileLayout from '@/components/MobileLayout'
import MobileHome from '@/components/MobileHome'
import MobileGiftsList from '@/components/MobileGiftsList'
import MobileProfile from '@/components/MobileProfile'
import { useRouter } from 'next/router'

export default function Home({
  contractIdUrl,
  secret,
  msg,
  pot
}: {
  contractIdUrl: string
  secret: string
  msg: string
  pot: boolean
}) {
  const router = useRouter()
  const [contractId, setContractId] = useState<string | undefined>(undefined)
  const [activeTab, setActiveTab] = useState('home')
  const [isMobile, setIsMobile] = useState(false)

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // when navigating back to the main page reset contractid
  useEffect(() => {
    // This ensures the code runs on the client-side only
    if (!router.isReady) return
    // Parse the URL fragment (hash) from the router's `asPath`
    const hashIndex = router.asPath.indexOf('#')
    hashIndex > -1 ? setContractId(contractIdUrl) : setContractId(undefined)
  }, [router.isReady, router.asPath, contractIdUrl])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    if (contractId) void router.replace('/', undefined, { scroll: false })
  }

  const handleCreateGift = () => {
    handleTabChange('create')
  }

  const handleBackToHome = () => {
    setActiveTab('home')
  }

  const renderMobileContent = () => {
    switch (activeTab) {
      case 'home':
        return <MobileHome onCreateGift={handleCreateGift} onNavigate={handleTabChange} />
      case 'create':
        return <NewGift pot={false} contractIdParam={undefined} />
      case 'gifts':
        return <MobileGiftsList onBack={handleBackToHome} onCreateGift={handleCreateGift} />
      case 'profile':
        return <MobileProfile onBack={handleBackToHome} onNavigate={handleTabChange} />
      default:
        return <MobileHome onCreateGift={handleCreateGift} onNavigate={handleTabChange} />
    }
  }

  // Use mobile layout for mobile devices, desktop layout for larger screens
  if (isMobile) {
    return (
      <>
        <Head>
          <title>Yodh - Digital Gift Cards</title>
          <meta name="description" content="Create ALPH digital gift cards easily with Yodh mobile app." />
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
          <link rel="icon" href="/favicon.ico" />
          <meta name="theme-color" content="#667eea" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        </Head>

        <MobileLayout activeTab={activeTab} onTabChange={handleTabChange}>
          {contractId ? (
            pot ? (
              <NewGift pot={pot} contractIdParam={contractId} />
            ) : (
              <WithdrawDapp key={contractId} contractId={contractId} secret={secret} message={msg} />
            )
          ) : (
            renderMobileContent()
          )}
        </MobileLayout>
      </>
    )
  }

  // Desktop layout (existing)
  return (
    <>
      <div className={styles.container}>
        <Head>
          <title>Yodh</title>
          <meta name="description" content="Create ALPH digital gift cards easily." />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        {pot || contractId === undefined ? (
          <NewGift pot={pot} contractIdParam={contractId} />
        ) : (
          <WithdrawDapp contractId={contractId} secret={secret} message={msg} />
        )}
      </div>
    </>
  )
}
