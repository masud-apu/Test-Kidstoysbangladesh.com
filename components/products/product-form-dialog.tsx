"use client"

import * as React from "react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus, X } from "lucide-react"
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
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { productSchema, updateProductSchema } from "@/lib/validations/product"
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
  const [imageInput, setImageInput] = useState("")

  const isEdit = !!product

  const form = useForm<z.input<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || "",
      handle: product?.handle || "",
      price: product?.price || "",
      actualPrice: product?.actualPrice || "",
      comparePrice: product?.comparePrice || "",
      description: product?.description || "",
      tags: product?.tags || [],
      images: product?.images || [],
    },
  })

  const watchedTags = form.watch("tags") ?? []
  const watchedImages = form.watch("images") ?? []

  const handleSubmit = async (data: Record<string, unknown>) => {
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

  const addImage = () => {
    if (imageInput.trim() && !watchedImages.includes(imageInput.trim())) {
      form.setValue("images", [...watchedImages, imageInput.trim()])
      setImageInput("")
    }
  }

  const removeImage = (imageToRemove: string) => {
    form.setValue(
      "images",
      watchedImages.filter((image) => image !== imageToRemove)
    )
  }

  React.useEffect(() => {
    if (product && open) {
      form.reset({
        name: product.name,
        handle: product.handle,
        price: product.price.toString(),
        actualPrice: product.actualPrice?.toString() || "",
        comparePrice: product.comparePrice?.toString() || "",
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
                      <Input placeholder="product-handle" {...field} />
                    </FormControl>
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
              <div className="flex gap-2">
                <Input
                  placeholder="Image URL"
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addImage()
                    }
                  }}
                />
                <Button type="button" size="sm" onClick={addImage}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {watchedImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {watchedImages.map((image, index) => (
                    <div
                      key={index}
                      className="relative group border rounded-lg overflow-hidden"
                    >
                      <img // eslint-disable-line @next/next/no-img-element
                        src={image}
                        alt={`Product ${index + 1}`}
                        className="w-full h-24 object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg"
                        }}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(image)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
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
