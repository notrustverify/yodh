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
    backgroundColor: '#f9f9f9'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20 // Adjusted margin
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 10 // Space between logo and title
  },
  title: {
    fontSize: 24, 
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  section: {
    marginBottom: 12
  },
  inputLabel: {
    fontSize: 12,
    marginBottom: 3,
    color: '#555',
    fontWeight: 'bold'
  },
  inputField: {
    fontSize: 12,
    marginBottom: 10,
    color: '#333',
    paddingBottom: 4,
    borderBottom: '1 solid #ccc'
  },
  instructions: {
    marginTop: 15,
    fontSize: 11,
    color: '#555',
    textAlign: 'center',
    marginBottom: 10
  },
  link: {
    fontSize: 11,
    color: '#2980B9',
    textDecoration: 'underline',
    marginVertical: 8,
    textAlign: 'center'
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginTop: 5
  },
  qrCode: {
    width: 100,
    height: 100
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 10,
    color: '#555',
    borderTop: '1 solid #ccc',
    paddingTop: 5
  },
  footerText: {
    fontSize: 9,
    color: '#777'
  }
})

export default function PdfGiftCard({
  sender,
  contractId,
  message,
  secret,
  amount,
  tokenSymbol
}: {
  sender: string | undefined
  contractId: string
  message: string
  secret: Uint8Array
  amount: string
  tokenSymbol: string | undefined
}) {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const encodedSecret = Buffer.from(secret).toString('base64')
  const urlToEncode = `${getUrl()}/#contract=${contractId}&secret=${encodeURIComponent(
    encodedSecret
  )}&msg=${encodeURIComponent(message)}`

  // Generate QR code
  useEffect(() => {
    QRCode.toDataURL(urlToEncode, { type: 'image/png' })
      .then((img: string) => setQrCode(img))
      .catch((err) => console.error('QR Code generation failed', err))
  }, [urlToEncode])

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.body}>
        {/* Header Section */}
        <View style={styles.header}>
          <Image style={styles.logo} src="/img/yodh.jpg" />
          <Text style={styles.title}>Gift certificate</Text>
        </View>

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

        {/* Claim Instructions */}
        <Text style={styles.instructions}>Download Alephium wallet</Text>
        <Link style={styles.link} src={'https://alephium.org/#wallets'}>
          alephium.org/#wallets
        </Link>
        <Text style={styles.instructions}>To claim your gift, visit the link below or scan the QR code:</Text>

        {/* Centered Link */}
        <Link style={styles.link} src={urlToEncode}>
          Gift Link
        </Link>

        {/* QR Code */}
        {qrCode && (
          <View style={styles.qrCodeContainer}>
            <Image style={styles.qrCode} src={qrCode} />
          </View>
        )}

        {/* Footer Section */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Yodh | DigitALPH Gift Card</Text>
          <Text style={styles.footerText}>yodh.app</Text>
        </View>
      </Page>
    </Document>
  )
}
