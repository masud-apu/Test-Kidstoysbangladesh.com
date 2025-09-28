/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsx-a11y/alt-text */
import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import type { OrderData } from './email'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'NotoSans',
    fontSize: 10,
    padding: 24,
    color: '#111827',
    position: 'relative',
  },
  paidStampOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paidStampImage: { width: 380, opacity: 0.3 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  // Set only width to preserve intrinsic aspect ratio
  logo: { width: 140, objectFit: 'contain' },
  brandRight: { textAlign: 'right', color: '#374151' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginBottom: 12 },
  card: {
    backgroundColor: '#F8FAFC',
    borderRadius: 4,
    padding: 10,
    marginBottom: 14,
  },
  cardTitle: { fontSize: 12, fontWeight: 700, marginBottom: 6 },
  text: { fontSize: 10 },
  sectionRow: { flexDirection: 'row', gap: 16 },
  col: { flex: 1 },
  table: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  thRow: { flexDirection: 'row', backgroundColor: '#F1F5F9' },
  th: { flex: 1, padding: 8, fontWeight: 700, color: '#374151', borderRightWidth: 1, borderRightColor: '#E5E7EB' },
  thLast: { borderRightWidth: 0 },
  tr: { flexDirection: 'row' },
  td: { flex: 1, padding: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB', borderRightWidth: 1, borderRightColor: '#E5E7EB' },
  tdRight: { textAlign: 'right' },
  tdLast: { borderRightWidth: 0 },
  priceRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  taka: { fontFamily: 'NotoSans', fontWeight: 700, marginRight: 4, fontSize: 10 },
  priceDigits: { fontFamily: 'NotoSans', fontSize: 10, fontWeight: 600 },
  totals: { width: 240, alignSelf: 'flex-end', marginTop: 12, backgroundColor: '#F8FAFC', borderRadius: 4, padding: 10 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  totalsLabel: { fontWeight: 700 },
  grand: { fontSize: 12, fontWeight: 700, marginTop: 6 },
  footer: { backgroundColor: '#F9FAFB', borderRadius: 4, padding: 8, marginTop: 16, textAlign: 'center', color: '#374151' },
  link: { fontWeight: 700, color: '#6366F1' },
  bengaliText: { fontFamily: 'NotoSansBengali', fontSize: 10 },
})

function formatBDTParts(n: number) {
  // Use better number formatting with proper thousand separators
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true
  }).format(n)
  
  return { 
    symbol: 'Tk', // Use "Tk" instead of Bengali symbol for better compatibility
    digits: formatted
  }
}

// Helper function to detect Bengali characters and use appropriate font
function SmartText({ children, style = {} }: { children: React.ReactNode; style?: any }) {
  const text = Array.isArray(children) ? children.join('') : String(children)
  const hasBengali = /[\u0980-\u09FF]/.test(text)
  const fontFamily = hasBengali ? 'NotoSansBengali' : 'NotoSans'
  
  return <Text style={{ ...style, fontFamily }}>{children}</Text>
}

export function InvoiceDocument({ orderData, logoDataUrl, isPaidReceipt = false, paidStampDataUrl }: { orderData: OrderData; logoDataUrl?: string | null; isPaidReceipt?: boolean; paidStampDataUrl?: string | null }) {
  const { customerName, customerPhone, customerAddress, items, itemsTotal, shippingCost, totalAmount, orderId, promoCode, promoCodeDiscount } = orderData
  const currentDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          {logoDataUrl ? (
            <Image src={logoDataUrl} style={styles.logo} />
          ) : (
            <Text style={{ fontSize: 16, fontWeight: 700 }}>KidsToys Bangladesh</Text>
          )}
          <View style={styles.brandRight}>
            <Text>KidsToys Bangladesh</Text>
            <Text>Your Kids Toy Destination</Text>
            <Text>www.kidstoysbangladesh.com</Text>
          </View>
        </View>
        <View style={styles.divider} />

        {/* Invoice + Customer */}
        <View style={[styles.card, styles.sectionRow]}>
          <View style={styles.col}>
            <Text style={styles.cardTitle}>Invoice Details</Text>
            <Text>Invoice #: {orderId}</Text>
            <Text>Date: {currentDate}</Text>
            <Text>Status: Order Placed</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.cardTitle}>Customer Information</Text>
            <SmartText>Name: {customerName}</SmartText>
            <SmartText>Phone: {customerPhone}</SmartText>
            <SmartText>Address: {customerAddress}</SmartText>
          </View>
        </View>

        {/* Items Table */}
        <Text style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Order Items</Text>
        <View style={styles.table}>
          <View style={styles.thRow}>
            <Text style={[styles.th, { flex: 2 }]}>Product Name</Text>
            <Text style={[styles.th, { flex: 0.8, textAlign: 'right' }]}>Quantity</Text>
            <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Unit Price</Text>
            <Text style={[styles.th, { flex: 1, textAlign: 'right' }, styles.thLast]}>Total</Text>
          </View>
          {items.map((item, idx) => (
            <View key={idx} style={styles.tr}>
              <Text style={[styles.td, { flex: 2 }]}>{item.name}</Text>
              <Text style={[styles.td, { flex: 0.8 }, styles.tdRight]}>{String(item.quantity)}</Text>
              <View style={[styles.td, { flex: 1 }]}>
                {(() => { const p = formatBDTParts(parseFloat(item.price)); return (
                  <View style={styles.priceRow}>
                    <Text style={styles.taka}>{p.symbol}</Text>
                    <Text style={styles.priceDigits}>{p.digits}</Text>
                  </View>
                )})()}
              </View>
              <View style={[styles.td, { flex: 1 }, styles.tdLast]}>
                {(() => { const p = formatBDTParts(parseFloat(item.price) * item.quantity); return (
                  <View style={styles.priceRow}>
                    <Text style={styles.taka}>{p.symbol}</Text>
                    <Text style={styles.priceDigits}>{p.digits}</Text>
                  </View>
                )})()}
              </View>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Items Total:</Text>
            {(() => { const p = formatBDTParts(itemsTotal); return (
              <View style={{ flexDirection: 'row' }}>
                <Text style={styles.taka}>{p.symbol}</Text>
                <Text style={styles.priceDigits}>{p.digits}</Text>
              </View>
            )})()}
          </View>
          {promoCode && promoCodeDiscount && promoCodeDiscount > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Promo ({promoCode}):</Text>
              {(() => { const p = formatBDTParts(promoCodeDiscount); return (
                <View style={{ flexDirection: 'row' }}>
                  <Text style={[styles.taka, { color: '#16A34A' }]}>-{p.symbol}</Text>
                  <Text style={[styles.priceDigits, { color: '#16A34A' }]}>{p.digits}</Text>
                </View>
              )})()}
            </View>
          )}
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Shipping Cost:</Text>
            {(() => { const p = formatBDTParts(shippingCost); return (
              <View style={{ flexDirection: 'row' }}>
                <Text style={styles.taka}>{p.symbol}</Text>
                <Text style={styles.priceDigits}>{p.digits}</Text>
              </View>
            )})()}
          </View>
          <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 6 }} />
          <View style={styles.totalsRow}>
            <Text style={styles.grand}>Grand Total:</Text>
            {(() => { const p = formatBDTParts(totalAmount); return (
              <View style={{ flexDirection: 'row' }}>
                <Text style={[styles.taka, { fontSize: 12, fontWeight: 700 }]}>{p.symbol}</Text>
                <Text style={[styles.priceDigits, { fontSize: 12, fontWeight: 700 }]}>{p.digits}</Text>
              </View>
            )})()}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for choosing KidsToys Bangladesh!</Text>
          <Text style={styles.link}>www.kidstoysbangladesh.com</Text>
        </View>

        {/* PAID stamp image overlay - fixed and rendered last to ensure top layer */}
        {isPaidReceipt && paidStampDataUrl && (
          <View style={styles.paidStampOverlay} fixed>
            <Image src={paidStampDataUrl} style={styles.paidStampImage} />
          </View>
        )}
      </Page>
    </Document>
  )
}
