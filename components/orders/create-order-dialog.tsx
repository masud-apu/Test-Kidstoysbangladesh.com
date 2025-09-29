"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Tag,
  Loader2,
  Package,
  User,
  MapPin,
  Phone,
  Mail,
  Truck,
  X,
  Check,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  ShoppingCart
} from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { checkoutSchema, type CheckoutType } from "@/lib/validations"
import { Product } from "@/lib/schema"
import { PromoCodeFormDialog } from "@/components/promo-codes/promo-code-form-dialog"

type DeliveryType = 'inside' | 'outside'

interface CartItem extends Product {
  quantity: number
}

interface CreateOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface PromoCode {
  id: number
  code: string
  name: string
  discountAmount: number
  discountType: 'percentage' | 'fixed'
  discountValue: string
  maxDiscountAmount?: string
  isStoreWide: boolean
}

interface PromoCodeItem {
  id: number
  code: string
  name: string
  discountType: 'percentage' | 'fixed'
  discountValue: string
  minOrderAmount: string | null
  maxDiscountAmount: string | null
  isActive: boolean
}

const STEPS = [
  { id: 1, name: "Products", icon: ShoppingCart },
  { id: 2, name: "Delivery & Promo", icon: Truck },
  { id: 3, name: "Customer Info", icon: User },
]

export function CreateOrderDialog({ open, onOpenChange, onSuccess }: CreateOrderDialogProps) {
  // Multi-step state
  const [currentStep, setCurrentStep] = useState(1)

  // Product search and selection
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchLoading, setSearchLoading] = useState(false)

  // Promo codes
  const [promoCodes, setPromoCodes] = useState<PromoCodeItem[]>([])
  const [promoSearchQuery, setPromoSearchQuery] = useState("")
  const [promoSearchOpen, setPromoSearchOpen] = useState(false)
  const [promoSearchLoading, setPromoSearchLoading] = useState(false)
  const [createPromoDialogOpen, setCreatePromoDialogOpen] = useState(false)

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('outside')

  // Applied promo code state
  const [appliedPromoCode, setAppliedPromoCode] = useState<PromoCode | null>(null)

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CheckoutType>({
    resolver: zodResolver(checkoutSchema),
  })

  // Calculate totals
  const itemsTotal = cartItems.reduce((total, item) => total + parseFloat(item.price) * item.quantity, 0)
  const shippingCost = cartItems.length > 0 ? (deliveryType === 'inside' ? 60 : 120) : 0
  const discountAmount = appliedPromoCode?.discountAmount || 0
  const totalPrice = Math.max(0, itemsTotal + shippingCost - discountAmount)

  // Load all products initially
  const loadAllProducts = React.useCallback(async () => {
    setSearchLoading(true)
    try {
      const params = new URLSearchParams({
        limit: '50',
        page: '1'
      })

      const response = await fetch(`/api/admin/products?${params}`)
      if (!response.ok) throw new Error('Failed to fetch products')

      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Error loading products:', error)
      toast.error('Failed to load products')
      setProducts([])
    } finally {
      setSearchLoading(false)
    }
  }, [])

  // Search products
  const searchProducts = React.useCallback(async (query: string) => {
    if (query.length < 2) {
      loadAllProducts()
      return
    }

    setSearchLoading(true)
    try {
      const params = new URLSearchParams({
        search: query,
        limit: '20',
        page: '1'
      })

      const response = await fetch(`/api/admin/products?${params}`)
      if (!response.ok) throw new Error('Failed to fetch products')

      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Error searching products:', error)
      toast.error('Failed to search products')
      setProducts([])
    } finally {
      setSearchLoading(false)
    }
  }, [loadAllProducts])

  // Search promo codes
  const searchPromoCodes = React.useCallback(async (query: string) => {
    setPromoSearchLoading(true)
    try {
      const params = new URLSearchParams({
        search: query,
        limit: '20',
        page: '1'
      })

      const response = await fetch(`/api/admin/promo-codes?${params}`)
      if (!response.ok) throw new Error('Failed to fetch promo codes')

      const data = await response.json()
      setPromoCodes(data.promoCodes || [])
    } catch (error) {
      console.error('Error searching promo codes:', error)
      toast.error('Failed to search promo codes')
      setPromoCodes([])
    } finally {
      setPromoSearchLoading(false)
    }
  }, [])

  // Load products when step 1 is active
  useEffect(() => {
    if (currentStep === 1 && products.length === 0) {
      loadAllProducts()
    }
  }, [currentStep, products.length, loadAllProducts])

  // Debounced product search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchProducts(searchQuery)
      } else if (currentStep === 1) {
        loadAllProducts()
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, searchProducts, currentStep, loadAllProducts])

  // Debounced promo search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchPromoCodes(promoSearchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [promoSearchQuery, searchPromoCodes])

  // Cart functions
  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === product.id)
      if (existingItem) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      } else {
        return [...prev, { ...product, quantity: 1 }]
      }
    })
    toast.success(`Added ${product.name}`)
  }

  const removeFromCart = (productId: number) => {
    setCartItems(prev => prev.filter(item => item.id !== productId))
    toast.success('Product removed')
  }

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(productId)
      return
    }
    setCartItems(prev =>
      prev.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    )
  }

  // Apply promo code
  const applyPromoCode = async (promoCode: PromoCodeItem) => {
    if (cartItems.length === 0) {
      toast.error('Add items to cart first')
      return
    }

    try {
      const response = await fetch('/api/promo-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promoCode.code,
          items: cartItems.map(item => ({
            id: item.id,
            price: item.price,
            quantity: item.quantity,
          })),
          itemsTotal,
        }),
      })

      const result = await response.json()

      if (result.valid) {
        setAppliedPromoCode({
          id: result.promoCode.id,
          code: result.promoCode.code,
          name: result.promoCode.name,
          discountAmount: result.discountAmount,
          discountType: result.promoCode.discountType,
          discountValue: result.promoCode.discountValue,
          maxDiscountAmount: result.promoCode.maxDiscountAmount,
          isStoreWide: result.isStoreWide,
        })
        toast.success(`Promo code applied! Saved ৳${result.discountAmount}`)
        setPromoSearchOpen(false)
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      console.error('Error applying promo code:', error)
      toast.error('Failed to validate promo code')
    }
  }

  const removePromoCode = () => {
    setAppliedPromoCode(null)
    toast.success('Promo code removed')
  }

  // Step navigation
  const handleNext = () => {
    if (currentStep === 1 && cartItems.length === 0) {
      toast.error('Please add at least one product')
      return
    }
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Form submission
  const onSubmit = async (data: CheckoutType) => {
    setIsSubmitting(true)

    try {
      const newOrderId = `KTB${Date.now()}`

      const orderData = {
        customerName: data.name,
        customerEmail: data.email ?? null,
        customerPhone: data.phone,
        customerAddress: data.address,
        specialNote: data.specialNote ?? undefined,
        items: cartItems,
        totalAmount: totalPrice,
        shippingCost,
        deliveryType,
        orderId: newOrderId,
        promoCodeId: appliedPromoCode?.id || null,
        promoCode: appliedPromoCode?.code || null,
        promoCodeDiscount: appliedPromoCode?.discountAmount || null,
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Order created successfully!', {
          description: `Order #${newOrderId} has been created`,
          duration: 3000,
        })

        // Reset form and state
        reset()
        setCartItems([])
        setAppliedPromoCode(null)
        setSearchQuery('')
        setProducts([])
        setCurrentStep(1)

        // Close dialog and call success callback
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast.error('Failed to create order', {
          description: result.message || 'There was a problem creating the order.',
        })
      }
    } catch (error) {
      console.error('Create order error:', error)
      toast.error('Failed to create order')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset()
      setCartItems([])
      setAppliedPromoCode(null)
      setSearchQuery('')
      setProducts([])
      setDeliveryType('outside')
      setCurrentStep(1)
      setPromoSearchQuery('')
    }
  }, [open, reset])

  // Handle promo code created
  const handlePromoSubmit = async (data: Record<string, unknown>) => {
    try {
      const response = await fetch('/api/admin/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to create promo code')

      const result = await response.json()
      toast.success('Promo code created successfully')
      setCreatePromoDialogOpen(false)
      searchPromoCodes(promoSearchQuery)

      // Auto-apply the newly created promo code
      if (result.promoCode && cartItems.length > 0) {
        const newPromo: PromoCodeItem = {
          id: result.promoCode.id,
          code: result.promoCode.code,
          name: result.promoCode.name,
          discountType: result.promoCode.discountType,
          discountValue: result.promoCode.discountValue,
          minOrderAmount: result.promoCode.minOrderAmount,
          maxDiscountAmount: result.promoCode.maxDiscountAmount,
          isActive: result.promoCode.isActive,
        }

        // Try to apply it
        await applyPromoCode(newPromo)
      }
    } catch (error) {
      console.error('Error creating promo code:', error)
      toast.error('Failed to create promo code')
      throw error
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl h-[90vh] p-0 gap-0 flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
            <DialogTitle className="text-2xl font-bold">Create New Order</DialogTitle>
          </DialogHeader>

          {/* Progress Steps */}
          <div className="px-6 pt-6 pb-4 flex-shrink-0">
            <div className="flex items-center justify-between relative">
              {/* Progress Line */}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted -z-10">
                <div
                  className="h-full bg-primary transition-all duration-500 ease-in-out"
                  style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                />
              </div>

              {STEPS.map((step, index) => {
                const isActive = currentStep === step.id
                const isCompleted = currentStep > step.id
                const StepIcon = step.icon

                return (
                  <div key={step.id} className="flex flex-col items-center flex-1">
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-300
                        ${isCompleted
                          ? 'bg-primary text-primary-foreground'
                          : isActive
                            ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                            : 'bg-muted text-muted-foreground'
                        }
                      `}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <StepIcon className="h-5 w-5" />
                      )}
                    </div>
                    <span className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                      {step.name}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Step Content */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="px-6 py-4">
            {/* Step 1: Product Selection */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Select Products</h3>
                  <p className="text-sm text-muted-foreground">Search and add products to the order</p>
                </div>

                {/* Product Search */}
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products by name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-12"
                    />
                  </div>

                  {/* Available Products List */}
                  <div className="border rounded-lg">
                    <div className="bg-muted/30 px-4 py-2 border-b">
                      <Label className="text-sm font-semibold">Available Products</Label>
                    </div>
                    <ScrollArea className="h-[280px]">
                      {searchLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                          <Package className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                          <p className="text-sm font-medium text-muted-foreground mb-1">No products found</p>
                          <p className="text-xs text-muted-foreground">Try a different search term</p>
                        </div>
                      ) : (
                        <div className="p-2 space-y-2">
                          {products.map((product) => (
                            <div
                              key={product.id}
                              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                              onClick={() => addToCart(product)}
                            >
                              <div className="relative h-14 w-14 overflow-hidden rounded border flex-shrink-0">
                                {product.images && product.images[0] ? (
                                  <Image
                                    src={product.images[0]}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center bg-muted">
                                    <Package className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm line-clamp-2 mb-1">{product.name}</p>
                                <p className="text-sm font-semibold text-green-600">৳{product.price}</p>
                              </div>
                              {cartItems.some(item => item.id === product.id) ? (
                                <Badge variant="secondary" className="flex-shrink-0">
                                  <Check className="h-3 w-3 mr-1" />
                                  Added
                                </Badge>
                              ) : (
                                <Button size="sm" variant="outline" className="flex-shrink-0">
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </div>

                {/* Product List */}
                {cartItems.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Products in Order</Label>
                      <Badge variant="secondary">{cartItems.length} items</Badge>
                    </div>

                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 rounded-lg border bg-card">
                        <div className="relative h-16 w-16 overflow-hidden rounded border flex-shrink-0">
                          {item.images && item.images[0] ? (
                            <Image
                              src={item.images[0]}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-muted">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm leading-tight mb-2">{item.name}</h4>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <span className="text-sm text-muted-foreground">×</span>
                            <span className="text-sm font-semibold">৳{item.price}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <p className="text-base font-bold">৳{(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                            className="text-destructive hover:text-destructive h-8"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                    <p className="text-base font-medium text-muted-foreground mb-1">No products added yet</p>
                    <p className="text-sm text-muted-foreground">Use the search bar above to find and add products</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Delivery & Promo */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Delivery & Promotions</h3>
                  <p className="text-sm text-muted-foreground">Select delivery location and apply promo codes</p>
                </div>

                {/* Delivery Options */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Delivery Location
                  </Label>
                  <RadioGroup
                    value={deliveryType}
                    onValueChange={(val) => setDeliveryType(val as DeliveryType)}
                    className="grid gap-3"
                  >
                    <label
                      htmlFor="outside"
                      className="flex items-center justify-between rounded-lg border-2 p-4 cursor-pointer transition-all hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="outside" id="outside" />
                        <div>
                          <p className="font-semibold">Outside Dhaka</p>
                          <p className="text-xs text-muted-foreground">Delivery in 3-5 business days</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold">৳120</span>
                    </label>
                    <label
                      htmlFor="inside"
                      className="flex items-center justify-between rounded-lg border-2 p-4 cursor-pointer transition-all hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="inside" id="inside" />
                        <div>
                          <p className="font-semibold">Inside Dhaka</p>
                          <p className="text-xs text-muted-foreground">Delivery in 1-2 business days</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold">৳60</span>
                    </label>
                  </RadioGroup>
                </div>

                <Separator />

                {/* Promo Code */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Promo Code
                    </Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCreatePromoDialogOpen(true)}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Create New
                    </Button>
                  </div>

                  {appliedPromoCode ? (
                    <div className="p-4 bg-green-50 dark:bg-green-950/20 border-2 border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                            <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <p className="font-bold text-green-900 dark:text-green-100">{appliedPromoCode.code}</p>
                            <p className="text-sm text-green-700 dark:text-green-300">{appliedPromoCode.name}</p>
                            <p className="text-sm font-semibold text-green-600 dark:text-green-400 mt-1">
                              Discount: ৳{appliedPromoCode.discountAmount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={removePromoCode}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Popover open={promoSearchOpen} onOpenChange={setPromoSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start h-12">
                          <Search className="mr-2 h-4 w-4" />
                          Search and apply promo code...
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="Search promo codes..."
                            value={promoSearchQuery}
                            onValueChange={setPromoSearchQuery}
                          />
                          <CommandList>
                            {promoSearchLoading && (
                              <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                              </div>
                            )}
                            {!promoSearchLoading && promoCodes.length === 0 && (
                              <CommandEmpty>No promo codes found.</CommandEmpty>
                            )}
                            {!promoSearchLoading && promoCodes.length > 0 && (
                              <CommandGroup>
                                {promoCodes.map((promo) => (
                                  <CommandItem
                                    key={promo.id}
                                    onSelect={() => applyPromoCode(promo)}
                                    className="flex items-start justify-between py-3 cursor-pointer"
                                    disabled={!promo.isActive}
                                  >
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <p className="font-semibold text-sm">{promo.code}</p>
                                        {!promo.isActive && (
                                          <Badge variant="secondary" className="text-xs">Inactive</Badge>
                                        )}
                                      </div>
                                      <p className="text-xs text-muted-foreground mb-1">{promo.name}</p>
                                      <p className="text-xs font-medium text-green-600">
                                        {promo.discountType === 'percentage'
                                          ? `${promo.discountValue}% off`
                                          : `৳${promo.discountValue} off`}
                                      </p>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>

                <Separator />

                {/* Order Summary */}
                <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                  <Label className="text-base font-semibold">Order Summary</Label>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Items Total ({cartItems.length} items)</span>
                      <span className="font-medium">৳{itemsTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping Cost</span>
                      <span className="font-medium">৳{shippingCost.toFixed(2)}</span>
                    </div>
                    {appliedPromoCode && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Promo Discount</span>
                        <span className="font-medium">-৳{discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>৳{totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Customer Information */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Customer Information</h3>
                  <p className="text-sm text-muted-foreground">Enter customer details for order delivery</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                      <User className="h-3 w-3" />
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="Enter customer's full name"
                      {...register('name')}
                      className={errors.name ? 'border-destructive' : ''}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      Phone Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phone"
                      placeholder="01XXXXXXXXX"
                      {...register('phone')}
                      className={errors.phone ? 'border-destructive' : ''}
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      Email (Optional)
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="customer@example.com"
                      {...register('email')}
                      className={errors.email ? 'border-destructive' : ''}
                    />
                    <p className="text-xs text-muted-foreground">For sending invoice receipt</p>
                    {errors.email && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      Delivery Address <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="address"
                      rows={3}
                      placeholder="House/Flat, Road, Area, City"
                      className={errors.address ? 'border-destructive' : ''}
                      {...register('address')}
                    />
                    <p className="text-xs text-muted-foreground">
                      Provide complete address for accurate delivery
                    </p>
                    {errors.address && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.address.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specialNote" className="text-sm font-medium">
                      Special Instructions (Optional)
                    </Label>
                    <Textarea
                      id="specialNote"
                      rows={2}
                      placeholder="Any delivery instructions or notes"
                      {...register('specialNote')}
                    />
                  </div>

                  {/* Order Summary for Final Step */}
                  <div className="p-4 bg-primary/5 border-2 border-primary/20 rounded-lg mt-6">
                    <Label className="text-base font-semibold mb-3 block">Order Summary</Label>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{cartItems.length} items</span>
                        <span className="font-medium">৳{itemsTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Delivery ({deliveryType === 'inside' ? 'Inside Dhaka' : 'Outside Dhaka'})</span>
                        <span className="font-medium">৳{shippingCost.toFixed(2)}</span>
                      </div>
                      {appliedPromoCode && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Discount ({appliedPromoCode.code})</span>
                          <span className="font-medium">-৳{discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total Amount</span>
                        <span className="text-primary">৳{totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            )}
            </div>
          </ScrollArea>

          {/* Footer Navigation */}
          <div className="border-t px-6 py-4 bg-muted/30 flex-shrink-0">
            <div className="flex items-center justify-between gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={currentStep === 1 ? () => onOpenChange(false) : handlePrevious}
                disabled={isSubmitting}
                className="gap-2"
              >
                {currentStep === 1 ? (
                  <>Cancel</>
                ) : (
                  <>
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </>
                )}
              </Button>

              {currentStep < 3 ? (
                <Button
                  onClick={handleNext}
                  disabled={currentStep === 1 && cartItems.length === 0}
                  className="gap-2"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating Order...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Create Order
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PromoCodeFormDialog
        open={createPromoDialogOpen}
        onOpenChange={setCreatePromoDialogOpen}
        promoCode={null}
        onSubmit={handlePromoSubmit}
      />
    </>
  )
}