import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { renderToFile } from '@react-pdf/renderer'
import { createGiftPdfDocument, getPdfGiftUrl, GiftPdfProps } from '../src/components/Pdf'

async function main() {
  const output = resolve('output/pdf')
  await mkdir(output, { recursive: true })
  const base: GiftPdfProps = {
    sender: '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuv',
    contractId: 'a'.repeat(64),
    secret: new Uint8Array(Array.from({ length: 128 }, (_, index) => index)),
    amount: '10.5',
    tokenSymbol: 'ALPH',
    message: 'Happy birthday, Alex! Here is a little something to make your day. Enjoy your next adventure! 🎉',
    example: true
  }
  const fixtures: Array<{ filename: string; props: GiftPdfProps }> = [
    { filename: 'gift-card-example.pdf', props: base },
    {
      filename: 'gift-card-password-example.pdf',
      props: {
        ...base,
        amount: '25',
        customPassword: 'sample-password',
        message: 'Congratulations! A gift to celebrate your next chapter. Ask me for the password to open it.'
      }
    }
  ]
  const expected: Record<string, string> = {}
  for (const fixture of fixtures) {
    const document = await createGiftPdfDocument(fixture.props)
    await renderToFile(document, resolve(output, fixture.filename))
    expected[fixture.filename] = getPdfGiftUrl(fixture.props)
    console.log(`Generated ${fixture.filename}`)
  }
  await writeFile(resolve(output, 'expected-links.json'), JSON.stringify(expected, null, 2))
}
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
