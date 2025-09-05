"use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus, X, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { generateHandle } from "@/lib/utils/handle-generator"

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
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ImageUpload } from "@/components/ui/image-upload"
import { productSchema } from "@/lib/validations/product"
import { z } from "zod"
import { Product } from "./products-table"

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
  onSubmit: (data: Record<string, unknown>) => Promise<void>
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  onSubmit,
}: ProductFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [tagInput, setTagInput] = useState("")
  const [isCheckingHandle, setIsCheckingHandle] = useState(false)
  const [handleError, setHandleError] = useState<string | null>(null)

  const isEdit = !!product

  const form = useForm<z.input<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || "",
      handle: product?.handle || "",
      price: product?.price || "",
      actualPrice: product?.actualPrice || "",
      comparePrice: product?.comparePrice || "",
      quantity: product?.quantity?.toString() || "1",
      description: product?.description || "",
      tags: product?.tags || [],
      images: product?.images || [],
    },
  })

  const watchedTags = form.watch("tags") ?? []
  const watchedImages = form.watch("images") ?? []

  const handleSubmit = async (data: Record<string, unknown>) => {
    // Check for handle error before submitting
    if (handleError) {
      toast.error('Cannot save product', {
        description: 'Please resolve the handle conflict first.',
      })
      return
    }
    
    setIsLoading(true)
    try {
      // Include product ID for updates
      const submitData = isEdit && product ? { ...data, id: product.id } : data
      await onSubmit(submitData)
      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error("Error submitting form:", error)
      toast.error(isEdit ? "Failed to update product" : "Failed to create product", {
        description: error instanceof Error ? error.message : "Please check your input and try again",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !watchedTags.includes(tagInput.trim())) {
      form.setValue("tags", [...watchedTags, tagInput.trim()])
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    form.setValue(
      "tags",
      watchedTags.filter((tag) => tag !== tagToRemove)
    )
  }

  const handleImageChange = (urls: string[]) => {
    form.setValue("images", urls)
  }

  const checkHandleUniqueness = useCallback(async (handle: string) => {
    if (!handle || handle.length < 1) return
    
    setIsCheckingHandle(true)
    setHandleError(null)
    
    try {
      const response = await fetch('/api/admin/products/check-handle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          handle, 
          excludeId: isEdit ? product?.id : null 
        }),
      })
      
      const data = await response.json()
      
      if (!data.isUnique) {
        setHandleError('This handle already exists. Please choose a different one.')
        form.setError('handle', { 
          type: 'manual', 
          message: 'This handle already exists. Please choose a different one.' 
        })
      } else {
        setHandleError(null)
        form.clearErrors('handle')
      }
    } catch (error) {
      console.error('Error checking handle:', error)
      setHandleError('Error checking handle availability')
    } finally {
      setIsCheckingHandle(false)
    }
  }, [form, isEdit, product?.id])

  const generateHandleFromName = useCallback((name: string) => {
    const generatedHandle = generateHandle(name)
    form.setValue('handle', generatedHandle)
    
    if (generatedHandle) {
      checkHandleUniqueness(generatedHandle)
    }
  }, [form, checkHandleUniqueness])

  // Watch name field to auto-generate handle for new products
  const watchedName = form.watch('name')
  const watchedHandle = form.watch('handle')
  
  useEffect(() => {
    if (!isEdit && watchedName && (!watchedHandle || watchedHandle === generateHandle(watchedName))) {
      const timeoutId = setTimeout(() => {
        generateHandleFromName(watchedName)
      }, 300) // Debounce
      
      return () => clearTimeout(timeoutId)
    }
  }, [watchedName, watchedHandle, isEdit, generateHandleFromName])
  
  // Check handle uniqueness when manually typed
  useEffect(() => {
    if (watchedHandle && watchedHandle.length >= 1) {
      const timeoutId = setTimeout(() => {
        checkHandleUniqueness(watchedHandle)
      }, 500) // Debounce
      
      return () => clearTimeout(timeoutId)
    } else {
      setHandleError(null)
      form.clearErrors('handle')
    }
  }, [watchedHandle, checkHandleUniqueness, form])

  React.useEffect(() => {
    if (product && open) {
      form.reset({
        name: product.name,
        handle: product.handle,
        price: product.price.toString(),
        actualPrice: product.actualPrice?.toString() || "",
        comparePrice: product.comparePrice?.toString() || "",
        quantity: product.quantity?.toString() || "1",
        description: product.description || "",
        tags: product.tags,
        images: product.images,
      })
    } else if (!product && open) {
      form.reset({
        name: "",
        handle: "",
        price: "",
        actualPrice: "",
        comparePrice: "",
        quantity: "1",
        description: "",
        tags: [],
        images: [],
      })
    }
  }, [product, open, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Product" : "Add New Product"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Make changes to the product. Click save when you're done."
              : "Add a new product to your store. Fill in the details below."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Product name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="handle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Handle</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="product-handle" 
                          {...field} 
                          className={handleError ? 'border-red-500' : ''}
                        />
                        {!isEdit && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => generateHandleFromName(watchedName || '')}
                            disabled={!watchedName || isCheckingHandle}
                          >
                            {isCheckingHandle ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </FormControl>
                    {handleError && (
                      <p className="text-sm text-red-600 mt-1">{handleError}</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (BDT)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="actualPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actual Price (BDT)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="comparePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Compare Price (BDT)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity (Inventory Stock)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="1"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Product description..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Tags</FormLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                />
                <Button type="button" size="sm" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {watchedTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {watchedTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => removeTag(tag)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <FormLabel>Images</FormLabel>
              <ImageUpload
                value={watchedImages}
                onChange={handleImageChange}
                multiple={true}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? "Update Product" : "Create Product"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
