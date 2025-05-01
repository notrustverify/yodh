import React, { useState, useEffect } from 'react'
import { Page, Text, Document, StyleSheet, View, Image, Link } from '@react-pdf/renderer'
import QRCode from 'qrcode'
import { getUrl } from '@/services/utils'

// Styles for the PDF based on the image provided
const styles = StyleSheet.create({
  body: {
    padding: 20,
    fontFamily: 'Helvetica',
    color: '#333',
    borderWidth: 1,
    borderColor: '#ccc',
    height: '100%',
    width: '100%',
    backgroundColor: '#fff'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderBottom: '1 solid #eee',
    paddingBottom: 10
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 10
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15
  },
  leftSection: {
    width: '45%'
  },
  rightSection: {
    width: '45%'
  },
  section: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 5
  },
  inputLabel: {
    fontSize: 12,
    marginBottom: 3,
    color: '#555',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  inputField: {
    fontSize: 12,
    marginBottom: 5,
    color: '#333',
    paddingBottom: 2,
    borderBottom: '1 solid #ddd'
  },
  instructions: {
    fontSize: 11,
    color: '#555',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 1.4
  },
  link: {
    fontSize: 11,
    color: '#2980B9',
    textDecoration: 'underline',
    marginVertical: 5,
    textAlign: 'center'
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    border: '1 solid #eee'
  },
  qrCode: {
    width: 180,
    height: 180
  },
  footer: {
    position: 'absolute',
    bottom: 15,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 9,
    color: '#555',
    borderTop: '1 solid #eee',
    paddingTop: 5
  },
  footerText: {
    fontSize: 9,
    color: '#777'
  },
  warning: {
    color: '#e74c3c',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 5,
    fontStyle: 'italic'
  }
})

export default function PdfGiftCard({
  sender,
  contractId,
  message,
  secret,
  amount,
  tokenSymbol,
  customPassword
}: {
  sender: string | undefined
  contractId: string
  message: string
  secret: Uint8Array
  amount: string
  tokenSymbol: string | undefined
  customPassword?: string
}) {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const urlToEncode = customPassword 
    ? `${getUrl()}/#contract=${contractId}&msg=${encodeURIComponent(message)}`
    : `${getUrl()}/#contract=${contractId}&secret=${encodeURIComponent(Buffer.from(secret).toString('base64'))}&msg=${encodeURIComponent(message)}`

  // Generate QR code
  useEffect(() => {
    const generateQR = async () => {
      try {
        const qrDataUrl = await QRCode.toDataURL(urlToEncode, {
          type: 'image/png',
          width: 200,
          margin: 2,
          errorCorrectionLevel: 'H',
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        })
        setQrCode(qrDataUrl)
      } catch (err) {
        console.error('QR Code generation failed', err)
      }
    }
    generateQR()
  }, [urlToEncode])

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.body}>
        {/* Header Section */}
        <View style={styles.header}>
          <Image style={styles.logo} src="/img/yodh.jpg" />
          <Text style={styles.title}>Digital Gift Certificate</Text>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Left Section */}
          <View style={styles.leftSection}>
            {/* From Field */}
            <View style={styles.section}>
              <Text style={styles.inputLabel}>From:</Text>
              <Text style={styles.inputField}>{sender}</Text>
            </View>

            {/* Amount Field */}
            <View style={styles.section}>
              <Text style={styles.inputLabel}>Amount:</Text>
              <Text style={styles.inputField}>
                {amount} {tokenSymbol}
              </Text>
            </View>

            {/* Message Field */}
            <View style={styles.section}>
              <Text style={styles.inputLabel}>Message:</Text>
              <Text style={styles.inputField}>{message}</Text>
            </View>
          </View>

          {/* Right Section */}
          <View style={styles.rightSection}>
            {/* Claim Instructions */}
            <Text style={styles.instructions}>
              To claim your gift, follow these steps:
            </Text>
            <Text style={styles.instructions}>
              1. Download an Alephium wallet from{' '}
              <Link style={styles.link} src={'https://alephium.org/#wallets'}>
                alephium.org/#wallets
              </Link>
            </Text>
            <Text style={styles.instructions}>
              2. Scan the QR code below or visit the gift link
            </Text>
            {customPassword && (
              <Text style={styles.instructions}>
                3. Enter the password you were given to claim your gift
              </Text>
            )}

            {/* Centered Link */}
            <Link style={styles.link} src={urlToEncode}>
              Gift Link
            </Link>

            {/* QR Code */}
            <View style={styles.qrCodeContainer}>
              {qrCode ? (
                <Image style={styles.qrCode} src={qrCode} />
              ) : (
                <Text style={styles.instructions}>Generating QR code...</Text>
              )}
            </View>

            {customPassword && (
              <Text style={styles.warning}>
                Important: Keep this password secure. You will need it to claim your gift.
              </Text>
            )}
          </View>
        </View>

        {/* Footer Section */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Yodh | DigitALPH Gift Card</Text>
          <Text style={styles.footerText}>yodh.app</Text>
        </View>
      </Page>
    </Document>
  )
}
