'use client'

import { useMemo, useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Markdown } from '@/components/markdown'
import { useCartStore } from '@/lib/store'
import { useOverlayStore } from '@/lib/ui-store'
import { ShoppingCart, MessageCircle, Zap, Truck, RotateCcw, Shield, Package, ChevronLeft, ChevronRight } from 'lucide-react'
import { Product, ProductVariant, ProductOption, ProductOptionValue } from '@/lib/schema'
import { ProductStructuredData } from './structured-data'
import { fbPixelEvents } from '@/lib/facebook-pixel-events'
import { Analytics } from '@/lib/analytics'
import { VariantSelector } from './variant-selector'
import { SelectedOption } from '@/lib/store'

interface VariantWithOptions extends ProductVariant {
  selectedOptions: Array<{
    optionName: string
    valueName: string
  }>
}

interface ProductPageClientProps {
  product: Product
  variants?: VariantWithOptions[]
  options?: Array<ProductOption & { values: ProductOptionValue[] }>
}

export function ProductPageClient({ product, variants = [], options = [] }: ProductPageClientProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [activeTab, setActiveTab] = useState("description")
  const [isAutoSliding, setIsAutoSliding] = useState(true)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  // Variant state
  const [selectedVariant, setSelectedVariant] = useState<VariantWithOptions | null>(null)
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([])
  const [variantImage, setVariantImage] = useState<string | null>(null)

  const addToCart = useCartStore((state) => state.addToCart)
  const setDirectBuy = useCartStore((state) => state.setDirectBuy)
  const openCart = useOverlayStore((s) => s.openCart)
  const openCheckout = useOverlayStore((s) => s.openCheckout)

  const hasVariants = !product.hasOnlyDefaultVariant && variants.length > 0
  const isOutOfStock = hasVariants
    ? selectedVariant?.inventoryQuantity === 0
    : product.totalInventory === 0

  // For products with only default variant, auto-select the first variant
  useEffect(() => {
    if (!hasVariants && variants.length > 0 && !selectedVariant) {
      setSelectedVariant(variants[0])
    }
  }, [hasVariants, variants, selectedVariant])

  // Collect all images: product images + all variant images
  const images = useMemo(() => {
    const productImages = Array.isArray(product.images) && product.images.length > 0 ? product.images : []
    const variantImages = variants.map(v => v.image).filter((img): img is string => !!img)
    const allImages = [...productImages, ...variantImages]
    return allImages.length > 0 ? allImages : ['/og-image.png']
  }, [product.images, variants])

  // Track product view on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      fbPixelEvents.viewContent({
        content_name: product.title,
        content_ids: [product.id.toString()],
        content_type: 'product',
        value: hasVariants && selectedVariant ? parseFloat(selectedVariant.price) : 0,
        currency: 'BDT',
        content_category: Array.isArray(product.tags) && product.tags.length > 0 ? product.tags[0] : undefined
      })

      Analytics.trackProductView({
        product_id: product.id.toString(),
        product_name: product.title,
        price: hasVariants && selectedVariant ? parseFloat(selectedVariant.price) : 0,
        tags: Array.isArray(product.tags) ? product.tags : []
      })
    }, 100)

    return () => clearTimeout(timer)
  }, [product.id])

  // Auto-slide functionality
  useEffect(() => {
    if (!isAutoSliding || images.length <= 1) return

    const interval = setInterval(() => {
      setSelectedImage((prev) => (prev + 1) % images.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [isAutoSliding, images])

  // Touch handling
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
    setIsAutoSliding(false)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe && images.length > 1) {
      setSelectedImage((prev) => (prev + 1) % images.length)
    }
    if (isRightSwipe && images.length > 1) {
      setSelectedImage((prev) => (prev - 1 + images.length) % images.length)
    }

    setTimeout(() => setIsAutoSliding(true), 2000)
  }

  const goToPrevious = () => {
    setSelectedImage((prev) => (prev - 1 + images.length) % images.length)
    setVariantImage(null) // Clear variant image when navigating
    setIsAutoSliding(false)
    setTimeout(() => setIsAutoSliding(true), 2000)
  }

  const goToNext = () => {
    setSelectedImage((prev) => (prev + 1) % images.length)
    setVariantImage(null) // Clear variant image when navigating
    setIsAutoSliding(false)
    setTimeout(() => setIsAutoSliding(true), 2000)
  }

  const handleMouseEnter = () => setIsAutoSliding(false)
  const handleMouseLeave = () => setIsAutoSliding(true)

  // Calculate price based on variant selection
  const priceInfo = useMemo(() => {
    // For products with only default variant, use the first variant's price
    if (!hasVariants && variants.length > 0) {
      const defaultVariant = variants[0]
      const price = parseFloat(defaultVariant.price)
      const comparePrice = defaultVariant.compareAtPrice ? parseFloat(defaultVariant.compareAtPrice) : null
      const hasDiscount = comparePrice && comparePrice > price
      const discountPercentage = hasDiscount ? Math.round(((comparePrice! - price) / comparePrice!) * 100) : 0
      const saving = hasDiscount ? comparePrice! - price : null

      return {
        displayPrice: `TK ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        comparePrice: comparePrice ? `TK ${comparePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null,
        hasDiscount,
        discountPercentage,
        maxSaving: saving ? `TK ${saving.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null
      }
    }

    if (!hasVariants) {
      return {
        displayPrice: 'TK 0.00',
        comparePrice: null,
        hasDiscount: false,
        discountPercentage: 0,
        maxSaving: null
      }
    }

    if (selectedVariant) {
      // Single variant selected
      const price = parseFloat(selectedVariant.price)
      const comparePrice = selectedVariant.compareAtPrice ? parseFloat(selectedVariant.compareAtPrice) : null
      const hasDiscount = comparePrice && comparePrice > price
      const discountPercentage = hasDiscount ? Math.round(((comparePrice! - price) / comparePrice!) * 100) : 0
      const saving = hasDiscount ? comparePrice! - price : null

      return {
        displayPrice: `TK ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        comparePrice: comparePrice ? `TK ${comparePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null,
        hasDiscount,
        discountPercentage,
        maxSaving: saving ? `TK ${saving.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null
      }
    } else {
      // No variant selected - show price range
      const prices = variants.map(v => parseFloat(v.price))
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)

      // Calculate max saving across all variants
      const savings = variants
        .map(v => {
          const price = parseFloat(v.price)
          const comparePrice = v.compareAtPrice ? parseFloat(v.compareAtPrice) : null
          return comparePrice && comparePrice > price ? comparePrice - price : 0
        })
        .filter(s => s > 0)

      const maxSavingAmount = savings.length > 0 ? Math.max(...savings) : null

      return {
        displayPrice: minPrice === maxPrice
          ? `TK ${minPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : `TK ${minPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} - TK ${maxPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        comparePrice: null,
        hasDiscount: false,
        discountPercentage: 0,
        maxSaving: maxSavingAmount ? `TK ${maxSavingAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null
      }
    }
  }, [hasVariants, selectedVariant, variants])

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (Number.isNaN(num)) return 'TK 0.00'
    return `TK ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const prettify = (s: string) => s
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())

  const { mainTitle, subTitle } = useMemo(() => {
    const name = product.title || ''
    let main = name.trim()
    let sub = ''
    const tagsArr = Array.isArray(product.tags) ? product.tags : []

    const parenMatch = name.match(/^(.*?)[\s]*\((.+)\)[\s]*$/)
    if (parenMatch) {
      main = parenMatch[1].trim()
      sub = parenMatch[2].replace(/[|,]/g, ' | ').replace(/\s+\|\s+/g, ' | ').trim()
    } else if (name.includes(' - ')) {
      const [m, ...rest] = name.split(' - ')
      main = m.trim()
      sub = rest.join(' - ').replace(/[|,]/g, ' | ').trim()
    } else if (name.includes(' | ')) {
      const [m, ...rest] = name.split(' | ')
      main = m.trim()
      sub = rest.join(' | ').trim()
    } else if (tagsArr.length) {
      const nice = Array.from(new Set(tagsArr
        .map((t) => prettify(t))
        .filter(Boolean)))
        .slice(0, 3)
      sub = nice.join(' | ')
    }

    return { mainTitle: main, subTitle: sub }
  }, [product.title, product.tags])

  const handleVariantChange = (variant: VariantWithOptions, selectedOpts: SelectedOption[], variantImg?: string) => {
    setSelectedVariant(variant)
    setSelectedOptions(selectedOpts)

    // If the variant has its own image, display it
    if (variantImg) {
      const imageIndex = images.findIndex(img => img === variantImg)
      if (imageIndex !== -1) {
        // Variant image is in the gallery, switch to it
        setSelectedImage(imageIndex)
        setVariantImage(null)
        setIsAutoSliding(false)
        setTimeout(() => setIsAutoSliding(true), 3000)
      } else {
        // Variant image not in gallery, show it as overlay
        setVariantImage(variantImg)
        setIsAutoSliding(false)
      }
    } else {
      // No variant image, clear overlay
      setVariantImage(null)
    }
  }

  const handleAddToCart = () => {
    if (hasVariants && !selectedVariant) return
    if (isOutOfStock) return
    if (!selectedVariant) return // Should always have variant (either selected or auto-selected default)

    setIsAdding(true)

    const price = parseFloat(selectedVariant.price)

    fbPixelEvents.addToCart({
      content_name: product.title,
      content_ids: [product.id.toString()],
      content_type: 'product',
      value: price,
      currency: 'BDT',
      content_category: Array.isArray(product.tags) && product.tags.length > 0 ? product.tags[0] : undefined
    })

    Analytics.trackAddToCart({
      product_id: product.id.toString(),
      product_name: product.title,
      price: price,
      compare_price: selectedVariant.compareAtPrice ? parseFloat(selectedVariant.compareAtPrice) : undefined,
      tags: Array.isArray(product.tags) ? product.tags : [],
      quantity: 1,
      variant_id: selectedVariant.id.toString(),
      variant_title: selectedVariant.title
    })

    addToCart(product, selectedVariant, selectedOptions)
    setTimeout(() => setIsAdding(false), 800)
    openCart()
  }

  const handleBuyNow = () => {
    if (hasVariants && !selectedVariant) return
    if (isOutOfStock) return
    if (!selectedVariant) return // Should always have variant (either selected or auto-selected default)

    const price = parseFloat(selectedVariant.price)

    fbPixelEvents.addToCart({
      content_name: product.title,
      content_ids: [product.id.toString()],
      content_type: 'product',
      value: price,
      currency: 'BDT',
      content_category: Array.isArray(product.tags) && product.tags.length > 0 ? product.tags[0] : undefined
    })

    Analytics.trackButtonClick('buy_now', 'product_page', {
      product_id: product.id,
      product_name: product.title,
      price: price,
      variant_id: selectedVariant.id,
      variant_title: selectedVariant.title
    })

    setDirectBuy(product, selectedVariant, selectedOptions)
    openCheckout('direct')
  }

  const handleWhatsApp = () => {
    const productUrl = `https://kidstoysbangladesh.com/product/${product.handle}`
    const variantText = selectedVariant ? ` (${selectedVariant.title})` : ''
    const priceText = selectedVariant ? selectedVariant.price : priceInfo.displayPrice
    const message = `Hi! I'm interested in this product: ${product.title}${variantText} - ${priceText}\n\nProduct link: ${productUrl}`
    const whatsappUrl = `https://wa.me/8801337411948?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <>
      <ProductStructuredData product={product} />
      <div className="container mx-auto max-w-6xl py-8 pb-28 md:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div
              className="aspect-square overflow-hidden rounded-lg bg-muted relative touch-pan-y group"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <Image
                src={variantImage || images[selectedImage]}
                alt={product.title}
                width={600}
                height={600}
                className="h-full w-full object-cover transition-opacity duration-300"
                key={variantImage || images[selectedImage]}
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={goToPrevious}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all md:opacity-0 md:group-hover:opacity-100 hover:scale-110 touch-manipulation"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={goToNext}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all md:opacity-0 md:group-hover:opacity-100 hover:scale-110 touch-manipulation"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="grid grid-cols-6 gap-2">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedImage(index)
                      setVariantImage(null)
                      setIsAutoSliding(false)
                      setTimeout(() => setIsAutoSliding(true), 3000)
                    }}
                    className={`aspect-square rounded-md overflow-hidden border-2 transition-all ${
                      selectedImage === index && !variantImage
                        ? 'border-primary ring-2 ring-primary ring-offset-1'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.title} thumbnail ${index + 1}`}
                      width={100}
                      height={100}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold leading-tight">
                {mainTitle}
              </h1>
              {subTitle && (
                <p className="mt-1 text-base lg:text-lg text-muted-foreground">
                  {subTitle}
                </p>
              )}
            </div>

            {/* Variant Selector */}
            {hasVariants && (
              <VariantSelector
                options={options}
                variants={variants}
                onVariantChange={handleVariantChange}
                defaultVariantId={variants[0]?.id}
              />
            )}

            {/* Price Block */}
            <div className="space-y-1">
              <div className="flex items-end gap-3 flex-wrap">
                {priceInfo.comparePrice && (
                  <span className="text-xl text-muted-foreground line-through">
                    {priceInfo.comparePrice}
                  </span>
                )}
                <span className="text-3xl lg:text-4xl font-extrabold text-green-600">
                  {priceInfo.displayPrice}
                </span>
                {priceInfo.hasDiscount && (
                  <span className="text-sm font-medium text-green-700">
                    (Save {priceInfo.discountPercentage}%)
                  </span>
                )}
                {priceInfo.maxSaving && !selectedVariant && (
                  <span className="text-sm font-medium text-green-700">
                    (Save up to {priceInfo.maxSaving})
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">VAT/Tax included</p>
            </div>

            {/* Action Buttons (desktop/tablet) */}
            <div className="hidden md:block space-y-3">
              <div className="flex gap-3">
                <Button
                  onClick={handleAddToCart}
                  variant="outline"
                  className="flex-1 h-12 text-base font-semibold"
                  size="lg"
                  disabled={isOutOfStock || (hasVariants && !selectedVariant)}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                </Button>

                <Button
                  onClick={handleBuyNow}
                  className="flex-1 h-12 text-base font-semibold bg-black text-white hover:bg-black/90"
                  size="lg"
                  disabled={isOutOfStock || (hasVariants && !selectedVariant)}
                >
                  <Zap className="mr-2 h-5 w-5" />
                  Buy Now
                </Button>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleWhatsApp}
                  variant="default"
                  size="lg"
                  className="flex-1 h-12 text-base font-semibold bg-[#25D366] hover:bg-[#1ebe57] text-white"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Chat on WhatsApp • +880 1337-411948
                </Button>
              </div>

              {/* Delivery & Return Information */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-4 mt-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Truck className="h-4 w-4 text-blue-600" />
                    <span>Delivery Options</span>
                  </div>
                  <div className="ml-6 space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Package className="h-3 w-3" />
                      <span>Inside Dhaka: Same day delivery, Max 1 day</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="h-3 w-3" />
                      <span>Outside Dhaka: 3–5 business days</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <RotateCcw className="h-4 w-4 text-green-600" />
                    <span>Return Policy</span>
                  </div>
                  <div className="ml-6 space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Shield className="h-3 w-3" />
                      <span>7-day return guarantee</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-16">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-1 max-w-md mx-auto rounded-full shadow-sm p-1.5 h-11">
              <TabsTrigger value="description" className="rounded-full px-4 py-2 text-[15px]">
                Description
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-6">
              <div className="bg-muted/50 rounded-lg p-6">
                {product.description ? (
                  <Markdown content={product.description} />
                ) : (
                  <p className="text-muted-foreground">
                    No description for this product.
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Sticky Mobile Action Bar */}
      <div className="fixed md:hidden bottom-0 inset-x-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
        <div className="container mx-auto max-w-6xl px-4 py-3">
          <div className="grid grid-cols-2 gap-3 items-stretch">
            <Button
              onClick={handleAddToCart}
              variant="outline"
              className="h-12 text-base font-semibold"
              size="lg"
              disabled={isAdding || isOutOfStock || (hasVariants && !selectedVariant)}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              {isOutOfStock ? 'Out of Stock' : isAdding ? 'Added' : 'Add to Cart'}
            </Button>
            <Button
              onClick={handleBuyNow}
              variant="default"
              className="h-12 text-base font-semibold bg-black hover:bg-black/90 text-white"
              size="lg"
              disabled={isOutOfStock || (hasVariants && !selectedVariant)}
            >
              <Zap className="mr-2 h-5 w-5" />
              Buy Now
            </Button>
          </div>
          <div className="mt-3">
            <Button
              onClick={handleWhatsApp}
              variant="default"
              size="lg"
              className="w-full h-11 text-base font-semibold bg-[#25D366] hover:bg-[#1ebe57] text-white"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Chat on WhatsApp
            </Button>
          </div>
          <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
      </div>
    </>
  )
}
