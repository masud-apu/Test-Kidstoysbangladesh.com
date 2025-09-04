'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Markdown } from '@/components/markdown'
import { useCartStore } from '@/lib/store'
import { ShoppingCart, MessageCircle, Zap } from 'lucide-react'
import { Product } from '@/lib/schema'
import { ProductStructuredData } from './structured-data'

interface ProductPageClientProps {
  product: Product
}

export function ProductPageClient({ product }: ProductPageClientProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [activeTab, setActiveTab] = useState("description")
  const router = useRouter()
  const addToCart = useCartStore((state) => state.addToCart)
  const setDirectBuy = useCartStore((state) => state.setDirectBuy)

  const hasDiscount = product.comparePrice && parseFloat(product.comparePrice) > parseFloat(product.price)
  const discountPercentage = hasDiscount 
    ? Math.round(((parseFloat(product.comparePrice!) - parseFloat(product.price)) / parseFloat(product.comparePrice!)) * 100)
    : 0

  const handleAddToCart = () => {
    addToCart(product)
  }

  const handleBuyNow = () => {
    setDirectBuy(product)
    router.push('/checkout?type=direct')
  }

  const handleWhatsApp = () => {
    const productUrl = `https://kidstoysbangladesh.com/product/${product.handle}`
  const message = `Hi! I'm interested in this product: ${product.name} - ৳${product.price}\n\nProduct link: ${productUrl}`
    const whatsappUrl = `https://wa.me/8801718007639?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const images = product.images && product.images.length > 0 ? product.images : ['/placeholder.jpg']

  return (
    <>
      <ProductStructuredData product={product} />
      <div className="container mx-auto max-w-6xl py-8">
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
          {/* Product Name */}
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold leading-tight">
              {product.name}
            </h1>
          </div>

          {/* Price */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-3xl lg:text-4xl font-bold text-primary">
              ৳{product.price}
            </span>
            {hasDiscount && (
              <>
                <span className="text-xl text-muted-foreground line-through">
                  ৳{product.comparePrice}
                </span>
                <Badge variant="destructive" className="text-sm">
                  -{discountPercentage}% OFF
                </Badge>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleBuyNow}
                className="flex-1 h-12 text-base font-semibold bg-orange-600 hover:bg-orange-700"
                size="lg"
              >
                <Zap className="mr-2 h-5 w-5" />
                Buy Now
              </Button>
              
              <Button 
                onClick={handleAddToCart}
                variant="outline"
                className="flex-1 h-12 text-base font-semibold"
                size="lg"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={handleWhatsApp}
                variant="outline" 
                size="lg" 
                className="flex-1 h-12 text-green-600 border-green-600 hover:bg-green-50"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                WhatsApp
              </Button>
            </div>
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Tags:</h3>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Section */}
      <div className="mt-16">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="shipping">Delivery & Shipping</TabsTrigger>
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
    </>
  )
}