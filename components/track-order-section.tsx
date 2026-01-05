'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, Phone, PackageSearch } from 'lucide-react'
import { toast } from 'sonner'
import { apiGet } from '@/lib/api-client'

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'

const statusDescriptions: Record<string, string> = {
    order_placed: 'We have received your order.',
    confirmed: 'Your order has been verified by our team.',
    processing: 'We are packing your order.',
    shipped: 'Your order is on its way with the courier.',
    out_for_delivery: 'The rider is near your address.',
    delivered: 'You have received the product.',
    cancelled: 'The order was cancelled.',
    returned: 'The product was returned.',
}

const paymentStatusDescriptions: Record<string, string> = {
    pending: 'Payment has not been received (Cash on Delivery).',
    paid: 'Payment successfully received.',
    failed: 'Payment transaction failed.',
    refunded: 'Payment has been refunded.',
}

interface TrackingEvent {
    id?: string | number
    text: string
    created_at?: string
    deliveryman?: {
        name?: string
    }
}


interface OrderItem {
    id: number
    productName: string
    productPrice: string
    productImage: string | null
    variantTitle: string | null
    variantSku: string | null
    selectedOptions: Array<{ optionName: string; valueName: string }> | null
    quantity: number
    itemTotal: string
}

interface OrderTrackingData {
    order: {
        orderId: string
        status: string
        paymentStatus: string
        customerName: string
        customerPhone: string
        customerAddress: string
        itemsTotal: string
        shippingCost: string
        totalAmount: string
        deliveryType: string
        promoCode: string | null
        promoCodeDiscount: string | null
        steadfastConsignmentId: string | null
        steadfastTrackingCode: string | null
        createdAt: string
        updatedAt: string
    }
    items: OrderItem[]
    steadfastStatus: {
        result?: {
            rider?: {
                name?: string
                phone?: string
            }
        }
        trackings?: TrackingEvent[]
    } | null
}

const statusLabels: Record<string, string> = {
    order_placed: 'Order Placed',
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    returned: 'Returned',
}

const paymentStatusLabels: Record<string, string> = {
    pending: 'Pending',
    paid: 'Paid',
    failed: 'Failed',
    refunded: 'Refunded',
}

const paymentStatusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    paid: 'bg-green-100 text-green-800 border-green-200',
    failed: 'bg-red-100 text-red-800 border-red-200',
    refunded: 'bg-blue-100 text-blue-800 border-blue-200',
}

export function TrackOrderSection() {
    const searchParams = useSearchParams()
    const [orderId, setOrderId] = useState('')
    const [loading, setLoading] = useState(false)
    const [trackingData, setTrackingData] = useState<OrderTrackingData | null>(null)

    const handleTrackOrder = async (orderIdToTrack?: string) => {
        const targetOrderId = orderIdToTrack || orderId

        if (!targetOrderId.trim()) {
            toast.error('Please enter an order ID')
            return
        }

        setLoading(true)
        try {
            const data = await apiGet(`/api/orders/track?orderId=${encodeURIComponent(targetOrderId.trim())}`)

            if (data.success) {
                setTrackingData(data)
                toast.success('Order found!')
            } else {
                toast.error(data.message || 'Order not found')
                setTrackingData(null)
            }
        } catch (error) {
            console.error('Error tracking order:', error)
            toast.error('Failed to track order')
            setTrackingData(null)
        } finally {
            setLoading(false)
        }
    }

    // Check for orderId in URL params on mount
    useEffect(() => {
        const orderIdParam = searchParams.get('orderId')
        if (orderIdParam) {
            setOrderId(orderIdParam)
            handleTrackOrder(orderIdParam)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const formatCurrency = (value: string) => {
        const amount = Number.parseFloat(value)
        return Number.isNaN(amount) ? value : amount.toFixed(2)
    }

    const formatDateTime = (value?: string, options?: Intl.DateTimeFormatOptions) => {
        if (!value) {
            return ''
        }

        return new Date(value).toLocaleString(
            'en-US',
            options ?? { dateStyle: 'medium', timeStyle: 'short' }
        )
    }

    const trackings = trackingData?.steadfastStatus?.trackings ?? []
    const rider = trackingData?.steadfastStatus?.result?.rider

    return (
        <section id="track-order" className="py-12 bg-slate-50 border-t scroll-mt-24">
            <div className="container mx-auto max-w-4xl px-4">
                <div className="mb-10 text-center space-y-3">
                    <Badge className="mb-4 bg-brand-navy/10 text-brand-navy border-brand-navy/20">
                        <PackageSearch className="w-3 h-3 mr-1" /> Track Order
                    </Badge>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">Track Your Order</h2>
                    <p className="text-gray-600 max-w-lg mx-auto">
                        Enter your order ID below to check the latest delivery updates and status of your package.
                    </p>
                </div>

                <div className="rounded-2xl border bg-white shadow-sm p-8">
                    <div className="max-w-xl mx-auto space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="orderId" className="text-base font-semibold text-gray-900">
                                Order ID
                            </Label>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Input
                                    id="orderId"
                                    placeholder="e.g., KTB1234567890"
                                    value={orderId}
                                    onChange={(e) => setOrderId(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleTrackOrder()
                                        }
                                    }}
                                    disabled={loading}
                                    className="w-full h-12 text-base"
                                />
                                <Button
                                    onClick={() => {
                                        void handleTrackOrder()
                                    }}
                                    disabled={loading}
                                    className="w-full sm:w-auto h-12 px-8 font-medium shrink-0"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Tracking...
                                        </>
                                    ) : (
                                        'Track Order'
                                    )}
                                </Button>
                            </div>
                            <p className="text-sm text-gray-500">
                                Found in your confirmation email or SMS (e.g., KTB...)
                            </p>
                        </div>
                    </div>
                </div>

                {trackingData && (
                    <div className="mt-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="rounded-2xl border bg-white shadow-sm p-6 md:p-8">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
                                <div className="space-y-2">
                                    <p className="text-xs uppercase tracking-wider font-bold text-gray-500">Order Information</p>
                                    <div className="space-y-1">
                                        <h2 className="text-2xl font-bold leading-tight text-gray-900">
                                            Order #{trackingData.order.orderId}
                                        </h2>
                                        <p className="text-sm text-gray-500">
                                            {`Placed ${formatDateTime(trackingData.order.createdAt, { dateStyle: 'medium' })}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <TooltipProvider>
                                        <Tooltip delayDuration={0}>
                                            <TooltipTrigger className="cursor-help">
                                                <Badge variant="secondary" className="rounded-full px-4 py-1.5 text-sm font-medium capitalize bg-gray-100 text-gray-800 hover:bg-gray-200">
                                                    {statusLabels[trackingData.order.status] || trackingData.order.status}
                                                </Badge>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{statusDescriptions[trackingData.order.status] || 'Current order status'}</p>
                                            </TooltipContent>
                                        </Tooltip>

                                        <Tooltip delayDuration={0}>
                                            <TooltipTrigger className="cursor-help">
                                                <Badge
                                                    variant="outline"
                                                    className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize border ${paymentStatusColors[trackingData.order.paymentStatus] || 'bg-gray-100 text-gray-800 border-gray-200'
                                                        }`}
                                                >
                                                    {paymentStatusLabels[trackingData.order.paymentStatus] || trackingData.order.paymentStatus}
                                                </Badge>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{paymentStatusDescriptions[trackingData.order.paymentStatus] || 'Current payment status'}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-5 text-center sm:text-left">
                                    <p className="text-xs uppercase tracking-wider font-bold text-gray-500">Items Total</p>
                                    <p className="mt-2 text-xl font-bold text-gray-900">
                                        TK {formatCurrency(trackingData.order.itemsTotal)}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-5 text-center sm:text-left">
                                    <p className="text-xs uppercase tracking-wider font-bold text-gray-500">Shipping</p>
                                    <p className="mt-2 text-xl font-bold text-gray-900">
                                        TK {formatCurrency(trackingData.order.shippingCost)}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-dashed border-gray-200 bg-brand-yellow/5 p-5 text-center sm:text-left">
                                    <p className="text-xs uppercase tracking-wider font-bold text-gray-600">
                                        {trackingData.order.paymentStatus === 'paid' ? 'Total Paid' : 'Total Payable'}
                                    </p>
                                    <p className="mt-2 text-xl font-bold text-brand-navy">
                                        TK {formatCurrency(trackingData.order.totalAmount)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-8 lg:grid-cols-2">
                            <div className="space-y-8">
                                <div className="rounded-2xl border bg-white shadow-sm p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-bold leading-tight">Products</h3>
                                        <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{trackingData.items.length} items</span>
                                    </div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-gray-100 hover:bg-transparent">
                                                <TableHead className="w-[50%]">Product</TableHead>
                                                <TableHead className="text-right">Qty</TableHead>
                                                <TableHead className="text-right">Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {trackingData.items.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="py-8 text-center text-sm text-gray-500">
                                                        No products found for this order.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                trackingData.items.map((item) => {
                                                    const optionSummary = item.selectedOptions
                                                        ?.map((option) => `${option.optionName}: ${option.valueName}`)
                                                        .join(' / ')
                                                    const variantLabel =
                                                        item.variantTitle && item.variantTitle !== 'Default Title' ? item.variantTitle : null
                                                    const descriptor = [variantLabel, optionSummary].filter(Boolean).join(' • ')
                                                    const displayName = descriptor ? `${item.productName} — ${descriptor}` : item.productName

                                                    return (
                                                        <TableRow key={item.id} className="border-gray-100 hover:bg-gray-50/50">
                                                            <TableCell className="max-w-xs">
                                                                <span className="block text-sm font-medium text-gray-900 line-clamp-2">{displayName}</span>
                                                            </TableCell>
                                                            <TableCell className="text-right text-sm text-gray-600">{item.quantity}</TableCell>
                                                            <TableCell className="text-right text-sm font-semibold text-gray-900">
                                                                TK {formatCurrency(item.itemTotal)}
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                })
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                <div className="rounded-2xl border bg-white shadow-sm p-6">
                                    <h3 className="text-lg font-bold leading-tight mb-6">Payment Summary</h3>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex items-center justify-between text-gray-500">
                                            <span>Items subtotal</span>
                                            <span className="text-gray-900 font-medium">TK {formatCurrency(trackingData.order.itemsTotal)}</span>
                                        </div>
                                        {trackingData.order.promoCode &&
                                            trackingData.order.promoCodeDiscount &&
                                            Number.parseFloat(trackingData.order.promoCodeDiscount) > 0 && (
                                                <div className="flex items-center justify-between text-emerald-600 bg-emerald-50 p-2 rounded-lg">
                                                    <span className="font-medium">Promo ({trackingData.order.promoCode})</span>
                                                    <span className="font-bold">-TK {formatCurrency(trackingData.order.promoCodeDiscount)}</span>
                                                </div>
                                            )}
                                        <div className="flex items-center justify-between text-gray-500">
                                            <span>Shipping</span>
                                            <span className="text-gray-900 font-medium">TK {formatCurrency(trackingData.order.shippingCost)}</span>
                                        </div>
                                        <div className="h-px bg-gray-100 my-2" />
                                        <div className="flex items-center justify-between text-base font-bold">
                                            <span>{trackingData.order.paymentStatus === 'paid' ? 'Total paid' : 'Total payable'}</span>
                                            <span className="text-brand-navy">TK {formatCurrency(trackingData.order.totalAmount)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="rounded-2xl border bg-white shadow-sm p-6 h-full">
                                    <div className="flex flex-col h-full">
                                        <div className="mb-8">
                                            <div className="flex items-start justify-between gap-4 mb-6">
                                                <div>
                                                    <h3 className="text-lg font-bold leading-tight">Delivery Status</h3>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        {trackings.length > 0
                                                            ? 'Latest activity shown first'
                                                            : 'Updates appear when parcel moves'}
                                                    </p>
                                                </div>
                                                {trackingData.order.steadfastTrackingCode && (
                                                    <Badge variant="outline" className="font-mono text-xs">
                                                        {trackingData.order.steadfastTrackingCode}
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="pl-2">
                                                {trackings.length > 0 ? (
                                                    <ol className="relative border-l-2 border-gray-100 space-y-8">
                                                        {trackings.map((event: TrackingEvent, index: number) => (
                                                            <li key={event.id || index} className="relative pl-8">
                                                                <span
                                                                    className={`absolute -left-[9px] top-1.5 h-4 w-4 rounded-full border-2 border-white ring-1 ring-gray-100 ${index === 0 ? 'bg-brand-navy ring-brand-navy/30 scale-110' : 'bg-gray-200'
                                                                        }`}
                                                                />
                                                                <div className="space-y-1.5">
                                                                    <p className={`text-sm leading-custom ${index === 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`}>
                                                                        {event.text}
                                                                    </p>
                                                                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                                                                        {event.created_at && <span>{formatDateTime(event.created_at)}</span>}
                                                                        {event.deliveryman?.name && <span>• by {event.deliveryman.name}</span>}
                                                                    </div>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ol>
                                                ) : (
                                                    <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                                        <PackageSearch className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                                                        <p className="text-sm text-gray-500">No tracking updates available yet.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="border-t border-gray-100 pt-8 mt-auto">
                                            <h3 className="text-lg font-bold leading-tight mb-4">Customer Details</h3>
                                            <div className="space-y-4 text-sm">
                                                <div className="grid grid-cols-[100px_1fr] gap-2">
                                                    <span className="text-xs uppercase tracking-wider font-bold text-gray-400 self-center">Customer</span>
                                                    <span className="font-medium text-gray-900">{trackingData.order.customerName}</span>
                                                </div>
                                                <div className="grid grid-cols-[100px_1fr] gap-2">
                                                    <span className="text-xs uppercase tracking-wider font-bold text-gray-400 self-center">Phone</span>
                                                    <span className="font-medium text-gray-900">{trackingData.order.customerPhone}</span>
                                                </div>
                                                <div className="grid grid-cols-[100px_1fr] gap-2">
                                                    <span className="text-xs uppercase tracking-wider font-bold text-gray-400 mt-1">Address</span>
                                                    <span className="font-medium text-gray-900 leading-relaxed">{trackingData.order.customerAddress}</span>
                                                </div>
                                                <div className="grid grid-cols-[100px_1fr] gap-2">
                                                    <span className="text-xs uppercase tracking-wider font-bold text-gray-400 self-center">Type</span>
                                                    <span className="font-medium text-gray-900 capitalize">{trackingData.order.deliveryType}</span>
                                                </div>

                                                {rider?.name && (
                                                    <div className="mt-4 p-4 bg-brand-yellow/5 border border-brand-yellow/20 rounded-xl">
                                                        <p className="text-xs uppercase tracking-wider font-bold text-brand-navy/60 mb-2">Delivery Rider</p>
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-bold text-brand-navy">{rider.name}</span>
                                                            {rider?.phone && (
                                                                <Button asChild size="sm" className="h-8 gap-2 bg-brand-navy hover:bg-brand-navy/90 text-white shadow-none">
                                                                    <a href={`tel:${rider.phone}`}>
                                                                        <Phone className="h-3 w-3" />
                                                                        Call
                                                                    </a>
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    )
}
