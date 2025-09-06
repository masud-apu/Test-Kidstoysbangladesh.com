'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Markdown } from '@/components/markdown'
import { useCartStore } from '@/lib/store'
import { useOverlayStore } from '@/lib/ui-store'
import { ShoppingCart, MessageCircle, Zap } from 'lucide-react'
import { Product } from '@/lib/schema'
import { ProductStructuredData } from './structured-data'

interface ProductPageClientProps {
  product: Product
}

export function ProductPageClient({ product }: ProductPageClientProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [activeTab, setActiveTab] = useState("description")
  const addToCart = useCartStore((state) => state.addToCart)
  const setDirectBuy = useCartStore((state) => state.setDirectBuy)
  const openCart = useOverlayStore((s) => s.openCart)
  const openCheckout = useOverlayStore((s) => s.openCheckout)
  const [isAdding, setIsAdding] = useState(false)

  const hasDiscount = product.comparePrice && parseFloat(product.comparePrice) > parseFloat(product.price)
  const discountPercentage = hasDiscount 
    ? Math.round(((parseFloat(product.comparePrice!) - parseFloat(product.price)) / parseFloat(product.comparePrice!)) * 100)
    : 0

  // Helpers: currency formatting and title/subtitle derivation
  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (Number.isNaN(num)) return '৳0.00'
    return `৳${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const prettify = (s: string) => s
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())

  const { mainTitle, subTitle } = useMemo(() => {
    const name = product.name || ''
    let main = name.trim()
    let sub = ''
    const tagsArr = Array.isArray(product.tags) ? product.tags : []

    // Prefer parentheses content as subtitle if present
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
      // Derive a clean, human subtitle from tags (avoid raw system tags)
      const nice = Array.from(new Set(tagsArr
        .map((t) => prettify(t))
        .filter(Boolean)))
        .slice(0, 3)
      sub = nice.join(' | ')
    }

    return { mainTitle: main, subTitle: sub }
  }, [product.name, product.tags])

  const handleAddToCart = () => {
  setIsAdding(true)
  addToCart(product)
  setTimeout(() => setIsAdding(false), 800)
  openCart()
  }

  const handleBuyNow = () => {
    setDirectBuy(product)
    openCheckout('direct')
  }

  const handleWhatsApp = () => {
    const productUrl = `https://kidstoysbangladesh.com/product/${product.handle}`
    const message = `Hi! I'm interested in this product: ${product.name} - ৳${product.price}\n\nProduct link: ${productUrl}`
    // Corrected WhatsApp phone number (BD): 8801735547173
    const whatsappUrl = `https://wa.me/8801735547173?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const images = Array.isArray(product.images) && product.images.length > 0 ? product.images : ['/og-image.png']

  return (
    <>
      <ProductStructuredData product={product} />
  <div className="container mx-auto max-w-6xl py-8 pb-28 md:pb-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Column - Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="aspect-square overflow-hidden rounded-lg bg-muted">
            <Image
              src={images[selectedImage]}
              alt={product.name}
              width={600}
              height={600}
              className="h-full w-full object-cover"
            />
          </div>
          
          {/* Thumbnail Images */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`flex-shrink-0 aspect-square w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === index 
                      ? 'border-primary ring-2 ring-primary/20' 
                      : 'border-muted hover:border-primary/50'
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Product Details */}
        <div className="space-y-6">
          {/* Product Title + Subtitle */}
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

          {/* Price Block */}
          <div className="space-y-1">
            <div className="flex items-end gap-3 flex-wrap">
              {hasDiscount && (
                <span className="text-xl text-muted-foreground line-through">
                  {formatCurrency(product.comparePrice!)}
                </span>
              )}
              <span className="text-3xl lg:text-4xl font-extrabold text-green-600">
                {formatCurrency(product.price)}
              </span>
              {hasDiscount && (
                <span className="text-sm font-medium text-green-700">
                  (Save {discountPercentage}%)
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
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>
              
              <Button 
                onClick={handleBuyNow}
                className="flex-1 h-12 text-base font-semibold bg-black text-white hover:bg-black/90"
                size="lg"
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
                aria-label="Chat on WhatsApp (+880 1735-547173)"
                title="Chat on WhatsApp (+880 1735-547173)"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Chat on WhatsApp • +880 1735-547173
              </Button>
            </div>
          </div>

          {/* No raw tags shown to users */}
        </div>
      </div>

      {/* Tabs Section */}
      <div className="mt-16">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList
            className="grid w-full grid-cols-2 max-w-md mx-auto sticky top-16 md:top-20 z-30 bg-background/95 supports-[backdrop-filter]:bg-background/90 backdrop-blur rounded-full shadow-sm p-1.5 h-11"
          >
            <TabsTrigger
              value="description"
              className="rounded-full px-4 py-2 text-[15px]"
            >
              Description
            </TabsTrigger>
            <TabsTrigger
              value="shipping"
              className="rounded-full px-4 py-2 text-[15px]"
            >
              Delivery & Shipping
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
          
          <TabsContent value="shipping" className="mt-6">
            <div className="bg-muted/50 rounded-lg p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Delivery Information:</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Inside Dhaka: 2–3 business days</li>
                    <li>• Outside Dhaka: 3–5 business days</li>
                    <li>• Free delivery on orders over ৳1000</li>
                    <li>• Cash on delivery available</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-2">Return Policy:</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• 7-day return guarantee</li>
                    <li>• Free replacement for defective items</li>
                    <li>• Return must be in original packaging</li>
                  </ul>
                </div>
              </div>
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
              disabled={isAdding}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              {isAdding ? 'Added' : 'Add to Cart'}
            </Button>
            <Button 
              onClick={handleBuyNow}
              variant="default"
              className="h-12 text-base font-semibold bg-black hover:bg-black/90 text-white"
              size="lg"
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
              aria-label="Chat on WhatsApp (+880 1735-547173)"
              title="Chat on WhatsApp (+880 1735-547173)"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Chat on WhatsApp
            </Button>
          </div>
          {/* iOS safe area inset */}
          <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
      </div>
    </>
  )
}