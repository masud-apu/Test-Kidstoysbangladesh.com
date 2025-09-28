"use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, RefreshCw, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import { promoCodeSchema } from "@/lib/validations/promo-code"
import { z } from "zod"
import { PromoCode } from "./promo-codes-table"

interface Product {
  id: number
  name: string
  handle: string
  price: string
}

interface PromoCodeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  promoCode?: PromoCode | null
  onSubmit: (data: Record<string, unknown>) => Promise<void>
}

export function PromoCodeFormDialog({
  open,
  onOpenChange,
  promoCode,
  onSubmit,
}: PromoCodeFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [codeError, setCodeError] = useState<string | null>(null)
  const [productSearch, setProductSearch] = useState("")

  const isEdit = !!promoCode

  const form = useForm<z.input<typeof promoCodeSchema>>({
    resolver: zodResolver(promoCodeSchema),
    defaultValues: {
      name: promoCode?.name || "",
      code: promoCode?.code || "",
      discountType: promoCode?.discountType || "percentage",
      discountValue: promoCode?.discountValue || "",
      maxDiscountAmount: promoCode?.maxDiscountAmount || "",
      isOneTimeUse: promoCode?.isOneTimeUse || false,
      usageLimit: promoCode?.usageLimit?.toString() || "",
      isStoreWide: promoCode?.isStoreWide ?? true,
      applicableProducts: promoCode?.applicableProducts || [],
      isActive: promoCode?.isActive ?? true,
      expiresAt: promoCode?.expiresAt || "",
    },
  })

  const watchedDiscountType = form.watch("discountType")
  const watchedIsStoreWide = form.watch("isStoreWide")
  const watchedIsOneTimeUse = form.watch("isOneTimeUse")
  const watchedApplicableProducts = form.watch("applicableProducts") || []

  // Filter products based on search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.handle.toLowerCase().includes(productSearch.toLowerCase())
  )

  // Generate random code for one-time use
  const generateRandomCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result
  }

  // Check if code is available
  const checkCodeAvailability = useCallback(async (code: string) => {
    if (!code || code === promoCode?.code) {
      setCodeError(null)
      return
    }

    try {
      const response = await fetch(`/api/admin/promo-codes/check-code?code=${encodeURIComponent(code)}`)
      const data = await response.json()

      if (!data.available) {
        setCodeError("This code is already in use")
      } else {
        setCodeError(null)
      }
    } catch (error) {
      console.error("Error checking code availability:", error)
    }
  }, [promoCode?.code])

  // Fetch products for selection
  const fetchProducts = useCallback(async () => {
    if (watchedIsStoreWide) return

    setIsLoadingProducts(true)
    try {
      const response = await fetch('/api/admin/products?limit=1000&sortBy=name&sortOrder=asc')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products)
      }
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setIsLoadingProducts(false)
    }
  }, [watchedIsStoreWide])

  useEffect(() => {
    if (open && !watchedIsStoreWide) {
      fetchProducts()
    }
  }, [open, watchedIsStoreWide, fetchProducts])

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      form.reset({
        name: promoCode?.name || "",
        code: promoCode?.code || "",
        discountType: promoCode?.discountType || "percentage",
        discountValue: promoCode?.discountValue || "",
        maxDiscountAmount: promoCode?.maxDiscountAmount || "",
        isOneTimeUse: promoCode?.isOneTimeUse || false,
        usageLimit: promoCode?.usageLimit?.toString() || "",
        isStoreWide: promoCode?.isStoreWide ?? true,
        applicableProducts: promoCode?.applicableProducts || [],
        isActive: promoCode?.isActive ?? true,
        expiresAt: promoCode?.expiresAt || "",
      })
      setCodeError(null)
      setProductSearch("")
    }
  }, [open, promoCode, form])

  // Auto-generate code for one-time use
  useEffect(() => {
    if (watchedIsOneTimeUse && !isEdit && form.getValues("code") === "") {
      const randomCode = generateRandomCode()
      form.setValue("code", randomCode)
      checkCodeAvailability(randomCode)
    } else if (!watchedIsOneTimeUse && !isEdit && form.getValues("code") && form.getValues("code").length === 8) {
      // Clear auto-generated code when switching to persistent
      form.setValue("code", "")
      setCodeError(null)
    }
  }, [watchedIsOneTimeUse, isEdit, form, checkCodeAvailability])

  const handleSubmit = async (data: Record<string, unknown>) => {
    if (codeError) {
      toast.error('Cannot save promo code', {
        description: 'Please resolve the code conflict first.',
      })
      return
    }

    setIsLoading(true)
    try {
      // Clean up data
      const submitData = { ...data }

      // Ensure numeric fields are strings for validation
      if (submitData.discountValue) {
        submitData.discountValue = String(submitData.discountValue)
      }
      if (submitData.maxDiscountAmount) {
        submitData.maxDiscountAmount = String(submitData.maxDiscountAmount)
      }
      if (submitData.usageLimit) {
        submitData.usageLimit = String(submitData.usageLimit)
      }

      // Handle expiry date
      if (submitData.expiresAt) {
        submitData.expiresAt = new Date(submitData.expiresAt as string).toISOString()
      } else {
        submitData.expiresAt = null
      }

      // Include promo code ID for updates
      const finalData = isEdit && promoCode ? { ...submitData, id: promoCode.id } : submitData

      await onSubmit(finalData)
      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error("Error submitting form:", error)
      toast.error(isEdit ? "Failed to update promo code" : "Failed to create promo code", {
        description: error instanceof Error ? error.message : "Please check your input and try again",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleProductSelection = (productId: number) => {
    const currentProducts = watchedApplicableProducts
    const updatedProducts = currentProducts.includes(productId)
      ? currentProducts.filter(id => id !== productId)
      : [...currentProducts, productId]

    form.setValue("applicableProducts", updatedProducts)
  }

  const removeProduct = (productId: number) => {
    const updatedProducts = watchedApplicableProducts.filter(id => id !== productId)
    form.setValue("applicableProducts", updatedProducts)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Promo Code" : "Create New Promo Code"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the promo code details below."
              : "Fill in the details below to create a new promo code."
            }
          </DialogDescription>
        </DialogHeader>

        {/* Usage Information for Existing Promo Codes */}
        {isEdit && promoCode && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              📊 Usage Statistics
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Uses:</span>
                <span className="ml-2 font-semibold text-gray-900">{promoCode.usedCount}</span>
              </div>
              {promoCode.usageLimit && (
                <div>
                  <span className="text-gray-600">Usage Limit:</span>
                  <span className="ml-2 font-semibold text-gray-900">{promoCode.usageLimit}</span>
                </div>
              )}
              {promoCode.isOneTimeUse && (
                <div className="col-span-2">
                  <span className="text-gray-600">Type:</span>
                  <span className="ml-2">
                    <Badge variant={promoCode.usedCount > 0 ? "destructive" : "default"}>
                      {promoCode.usedCount > 0 ? "Used (One-time)" : "Available (One-time)"}
                    </Badge>
                  </span>
                </div>
              )}
              {promoCode.usageLimit && (
                <div className="col-span-2 space-y-1">
                  <span className="text-gray-600">Usage Progress:</span>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        promoCode.usedCount >= promoCode.usageLimit
                          ? 'bg-red-500'
                          : (promoCode.usedCount / promoCode.usageLimit) >= 0.8
                          ? 'bg-orange-500'
                          : 'bg-green-500'
                      }`}
                      style={{
                        width: `${Math.min((promoCode.usedCount / promoCode.usageLimit) * 100, 100)}%`
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {((promoCode.usedCount / promoCode.usageLimit) * 100).toFixed(1)}% used
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Summer Sale 2024" {...field} />
                    </FormControl>
                    <FormDescription>
                      A descriptive name for this promo code
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isOneTimeUse"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">One-time use</FormLabel>
                      <FormDescription>
                        Generate a random code that can only be used once
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isEdit}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Promo Code</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          placeholder="SUMMER2024"
                          {...field}
                          disabled={watchedIsOneTimeUse && !isEdit}
                          onBlur={(e) => {
                            field.onBlur()
                            if (!watchedIsOneTimeUse) {
                              checkCodeAvailability(e.target.value)
                            }
                          }}
                          className={codeError ? "border-red-500" : ""}
                        />
                      </FormControl>
                      {watchedIsOneTimeUse && !isEdit && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const newCode = generateRandomCode()
                            form.setValue("code", newCode)
                            checkCodeAvailability(newCode)
                          }}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <FormDescription>
                      {watchedIsOneTimeUse
                        ? "Auto-generated random code for one-time use"
                        : "Enter a unique code that customers will use"
                      }
                    </FormDescription>
                    {codeError && <p className="text-sm text-red-500">{codeError}</p>}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="discountType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select discount type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discountValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Discount Value {watchedDiscountType === "percentage" ? "(%)" : "(৳)"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step={watchedDiscountType === "percentage" ? "1" : "0.01"}
                          max={watchedDiscountType === "percentage" ? "100" : undefined}
                          min="0"
                          placeholder={watchedDiscountType === "percentage" ? "20" : "100"}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {watchedDiscountType === "percentage" && (
                <FormField
                  control={form.control}
                  name="maxDiscountAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Discount Amount (৳)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="50.00"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional ceiling for percentage discounts
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {!watchedIsOneTimeUse && (
                <FormField
                  control={form.control}
                  name="usageLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usage Limit</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="Leave empty for unlimited"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum number of times this code can be used
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="isStoreWide"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Store-wide discount</FormLabel>
                      <FormDescription>
                        Apply to all products or select specific products
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {!watchedIsStoreWide && (
                <FormField
                  control={form.control}
                  name="applicableProducts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Applicable Products</FormLabel>
                      <FormDescription>
                        Select products this promo code applies to
                      </FormDescription>

                      {watchedApplicableProducts.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/50">
                          {products
                            .filter(product => watchedApplicableProducts.includes(product.id))
                            .map(product => (
                              <Badge key={product.id} variant="secondary" className="gap-1">
                                {product.name}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-auto p-0 hover:bg-transparent"
                                  onClick={() => removeProduct(product.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </Badge>
                            ))}
                        </div>
                      )}

                      {isLoadingProducts ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="ml-2">Loading products...</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Input
                            placeholder="Search products..."
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            className="w-full"
                          />
                          <div className="max-h-48 overflow-y-auto border rounded-md">
                            {filteredProducts.length > 0 ? (
                              filteredProducts.map(product => (
                                <div key={product.id} className="flex items-center space-x-2 p-2 border-b last:border-b-0">
                                  <Checkbox
                                    id={`product-${product.id}`}
                                    checked={watchedApplicableProducts.includes(product.id)}
                                    onCheckedChange={() => toggleProductSelection(product.id)}
                                  />
                                  <Label htmlFor={`product-${product.id}`} className="flex-1 cursor-pointer">
                                    <div>
                                      <div className="font-medium">{product.name}</div>
                                      <div className="text-sm text-muted-foreground">৳{product.price}</div>
                                    </div>
                                  </Label>
                                </div>
                              ))
                            ) : (
                              <div className="p-4 text-center text-muted-foreground">
                                {productSearch ? "No products match your search" : "No products found"}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="expiresAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value ? new Date(field.value) : undefined}
                        onDateChange={(date) => {
                          field.onChange(date ? date.toISOString() : "")
                        }}
                        placeholder="Select expiry date"
                        minDate={new Date()}
                        className="w-full"
                      />
                    </FormControl>
                    <FormDescription>
                      Leave empty for no expiry date
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription>
                        Make this promo code available for use
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !!codeError}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? "Update" : "Create"} Promo Code
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}