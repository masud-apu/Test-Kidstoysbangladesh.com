import { writeFileSync } from 'fs'
import path from 'path'
import { generatePDFBuffer } from '../lib/pdf-generator'

async function main() {
  const testOrderData = {
    customerName: 'Test Customer',
    customerPhone: '01700000000',
    customerAddress: 'Test Address, Dhaka, Bangladesh',
    items: [
      { id: '1', name: 'Toy Car', price: '1000', quantity: 2, images: [] },
      { id: '2', name: 'Doll House', price: '850', quantity: 1, images: [] },
    ],
    itemsTotal: 2850,
    shippingCost: 60,
    totalAmount: 2910,
    orderId: 'KTBTEST12345',
  } as any

  const buf = await generatePDFBuffer(testOrderData)
  const out = path.join(process.cwd(), 'invoice-test.pdf')
  writeFileSync(out, buf)
  console.log('Wrote', out)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

