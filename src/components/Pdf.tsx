import React from 'react'
import { Page, Text, Document, StyleSheet, View, Image, Link, Font } from '@react-pdf/renderer'
import QRCode from 'qrcode'
import { getGiftUrl, getUrl } from '../services/utils'

Font.registerHyphenationCallback((word) => [word])
Font.registerEmojiSource({ format: 'png', url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/' })

export interface GiftPdfProps {
  sender?: string
  contractId: string
  message: string
  secret: Uint8Array
  amount: string
  tokenSymbol?: string
  customPassword?: string
  example?: boolean
}

export function getPdfGiftUrl(props: GiftPdfProps) {
  return getGiftUrl(props.contractId, props.secret, props.message, Boolean(props.customPassword))
}

// Prepare the image before mounting the document so an early download cannot omit the QR code.
export async function createGiftPdfDocument(props: GiftPdfProps) {
  const qrCode = await QRCode.toDataURL(getPdfGiftUrl(props), {
    type: 'image/png',
    width: 1024,
    margin: 4,
    errorCorrectionLevel: 'M'
  })
  return <PdfGiftCard {...props} qrCode={qrCode} />
}

const styles = StyleSheet.create({
  page: { padding: 24, fontFamily: 'Helvetica', backgroundColor: '#f5f6fb', color: '#20243b' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  brand: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#4e54c8' },
  caption: { fontSize: 10, color: '#67718a', marginTop: 6 },
  content: { flexDirection: 'row', flexGrow: 1 },
  gift: { width: '54%', backgroundColor: '#4e54c8', borderRadius: 16, padding: 22, color: '#fff', marginRight: 18 },
  eyebrow: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  amount: { fontSize: 30, fontFamily: 'Helvetica-Bold', marginBottom: 14 },
  message: { fontSize: 15, lineHeight: 1.5, marginBottom: 18 },
  fromLabel: { fontSize: 9, marginBottom: 5, color: '#e2dfff' },
  sender: { fontSize: 8, lineHeight: 1.4 },
  scan: { width: '43%', alignItems: 'center', padding: 8 },
  scanTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 6 },
  qr: { width: 154, height: 154 },
  link: { fontSize: 10, color: '#4e54c8', marginVertical: 6 },
  instructions: { fontSize: 9, lineHeight: 1.5, textAlign: 'center', color: '#67718a' },
  password: { fontSize: 9, lineHeight: 1.4, textAlign: 'center', color: '#4e54c8', marginTop: 8 },
  footer: { fontSize: 8, color: '#67718a', marginTop: 14, flexDirection: 'row', justifyContent: 'space-between' }
})

export default function PdfGiftCard(props: GiftPdfProps & { qrCode: string }) {
  const url = getPdfGiftUrl(props)
  return (
    <Document title="Yodh digital gift card" author="Yodh" subject="Alephium gift card">
      <Page size="A5" orientation="landscape" style={styles.page} wrap={false}>
        <View style={styles.header}>
          <Text style={styles.brand}>Yodh</Text>
          <Text style={styles.caption}>A thoughtful gift. A new way to give.</Text>
        </View>
        <View style={styles.content}>
          <View style={styles.gift}>
            <Text style={styles.eyebrow}>A little gift for you</Text>
            <Text style={styles.amount}>
              {props.amount} {props.tokenSymbol || 'ALPH'}
            </Text>
            <Text style={styles.message}>{props.message}</Text>
            <Text style={styles.fromLabel}>FROM</Text>
            <Text style={styles.sender}>
              {props.sender ? props.sender.match(/.{1,28}/g)?.join('\n') : 'Someone thinking of you'}
            </Text>
          </View>
          <View style={styles.scan}>
            <Text style={styles.scanTitle}>Open your gift</Text>
            {/* This image is ready before the document is rendered. */}
            <Image style={styles.qr} src={props.qrCode} />
            <Link style={styles.link} src={url}>
              Open gift link
            </Link>
            <Text style={styles.instructions}>Scan the QR code or open the link.</Text>
            <Text style={styles.instructions}>
              Connect an Alephium wallet and follow the steps to unwrap your gift.
            </Text>
            <Link style={styles.link} src="https://alephium.org/wallets">
              Get an Alephium wallet
            </Link>
            {props.customPassword && (
              <Text style={styles.password}>
                Password protected. Ask the sender for your password; it is not printed on this card.
              </Text>
            )}
          </View>
        </View>
        <View style={styles.footer}>
          <Text>{props.example ? 'EXAMPLE ONLY - no redeemable funds' : 'Digital gift card - Alephium'}</Text>
          <Text>{new URL(getUrl()).hostname}</Text>
        </View>
      </Page>
    </Document>
  )
}
