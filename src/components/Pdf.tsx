import React, { useState } from 'react'
import { Page, Text, Document, StyleSheet, Link, Image, Font } from '@react-pdf/renderer'
import { getUrl, shortAddress } from '@/services/utils'
import QRCode from 'qrcode'
import AlephiumDomain from './ANS'

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    backgroundColor: '#E4E4E4'
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1
  },
  body: {
    paddingTop: 35,
    paddingBottom: 65,
    paddingHorizontal: 35,
    fontFamily: 'Times-Roman'
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
  },
  author: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 40
  },
  subtitle: {
    fontSize: 18,
    margin: 12,
  },
  text: {
    margin: 12,
    fontSize: 14,
    textAlign: 'justify',
  },
  textWrap: {
   paddingTop: '-20px',
   fontSize: 14,
   margin: 12
  },
  image: {
    margin: 12,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '10%'
  },
  header: {
    fontSize: 12,
    marginBottom: 20,
    textAlign: 'center',
    color: 'grey'
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 12,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'grey'
  },
  qrcode: {
   marginLeft: 'auto',
   marginRight: 'auto',
   width: '50%',
   height: 'auto', 
   maxWidth: '40%'
 }
})

// Create Document Component
export default function PdfGiftCard({
  sender,
  contractId,
  secret,
  message
}: {
  sender: string | undefined
  contractId: string
  secret: Uint8Array
  message: string
}) {
  const [qrCode, setQrCode] = useState<string>()
  const encodedSecret = Buffer.from(secret).toString('base64')

  const urlToEncode = `${getUrl()}/#contract=${contractId}&secret=${encodeURIComponent(encodedSecret)}&msg=${encodeURIComponent(
    message
  )}`


  QRCode.toDataURL(urlToEncode, { type: 'image/png' }).then((img: string) => {
    setQrCode(img)

  })

  Font.registerHyphenationCallback(word => {
   const middle = Math.floor(word.length / 2);
   const parts = word.length === 1 ? [word] : [word.substr(0, middle), word.substr(middle)];

 
   return parts;
 });

  return (
    <Document>
      <Page size="A4" style={styles.body}>
        <Text style={styles.title}>Yodh Gift Card</Text>
        <Image  style={styles.image} src={'/img/yodh.jpg'} />
        <Text style={styles.text}>{sender && shortAddress(sender)} sent you some ALPH.</Text>
        <Text style={styles.text}>Message:</Text>
        <Text style={styles.textWrap}>{message}</Text>
        <Text style={styles.text}>
          To claim your ALPH visit this <Link href={urlToEncode}>link</Link> or scan the QR Code below.
        </Text>
        <Image src={qrCode} style={styles.qrcode} />
        
     
        <Text style={styles.text}>How to claim: </Text>
        <Text style={styles.text}>1. Start by downloading Alephium wallets on <Link href='https://alephium.org/#wallets'>https://alephium.org/#wallets</Link> </Text>
        <Text style={styles.text}>2. Scan the QR code above with any QR code app</Text>
        <Text style={styles.text}>3. Connect your Alephium wallet and claim your gift</Text>
        <br/>

        <Text style={styles.text}>Any questions, join Alephium Telegram <Link href='https://t.me/alephiumgroup'>@alephiumgroup</Link> or on Discord <Link href='https://alephium.org/discord'>alephium.org/discord</Link> </Text>
        </Page>
    </Document>
  )
}
