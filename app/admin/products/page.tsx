"use client"

import * as React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { usePersistentState, usePersistentObject } from "@/hooks/use-persistent-state"
import { Plus, Upload, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { ProductsTable, Product } from "@/components/products/products-table"
import { ProductFormDialog } from "@/components/products/product-form-dialog"
import { CsvImportDialog } from "@/components/products/csv-import-dialog"

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Persistent pagination preferences
  const [paginationPrefs, setPaginationPrefs] = usePersistentObject("admin-products-pagination", {
    limit: 25,
  })
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: paginationPrefs.limit,
    total: 0,
    totalPages: 0,
  })
  
  const [search, setSearch] = usePersistentState("admin-products-search", "")
  const [sortBy, setSortBy] = usePersistentState("admin-products-sortBy", "createdAt")
  const [sortOrder, setSortOrder] = usePersistentState("admin-products-sortOrder", "desc")
  
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [csvImportOpen, setCsvImportOpen] = useState(false)
  
  // Prevent duplicate calls during React Strict Mode or rapid state changes
  const fetchingRef = useRef(false)

  const fetchProducts = async () => {
    // Prevent duplicate calls
    if (fetchingRef.current) {
      return
    }

    try {
      fetchingRef.current = true
      setIsLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search,
        sortBy,
        sortOrder,
      })

      const response = await fetch(`/api/admin/products?${params}`)
      if (!response.ok) throw new Error("Failed to fetch products")

      const data = await response.json()
      setProducts(data.products)
      setPagination(data.pagination)
    } catch (error) {
      console.error("Error fetching products:", error)
      toast.error("Failed to load products")
    } finally {
      setIsLoading(false)
      fetchingRef.current = false
    }
  }

  // Update pagination limit when preferences change
  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      limit: paginationPrefs.limit,
      page: 1 // Reset to first page when changing limit
    }))
  }, [paginationPrefs.limit])

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Reset to first page when search changes
      if (pagination.page !== 1) {
        setPagination(prev => ({ ...prev, page: 1 }))
      } else {
        fetchProducts()
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [search])

  // Fetch products when pagination, sortBy, or sortOrder changes
  useEffect(() => {
    fetchProducts()
  }, [pagination.page, pagination.limit, sortBy, sortOrder])

  const handleCreateProduct = async (data: Record<string, unknown>) => {
    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("Failed to create product")

      toast.success("Product created successfully", {
        description: `"${data.name}" has been added to your inventory`,
      })
      fetchProducts()
    } catch (error) {
      console.error("Error creating product:", error)
      toast.error("Failed to create product")
      throw error
    }
  }

  const handleUpdateProduct = async (data: Record<string, unknown>) => {
    if (!editingProduct) return

    try {
      const response = await fetch(`/api/admin/products/${editingProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("Failed to update product")

      toast.success("Product updated successfully", {
        description: `"${data.name}" has been updated`,
      })
      fetchProducts()
    } catch (error) {
      console.error("Error updating product:", error)
      toast.error("Failed to update product")
      throw error
    }
  }

  const handleDeleteProduct = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete product")

      toast.success("Product deleted successfully", {
        description: "The product has been removed from your inventory",
      })
      fetchProducts()
    } catch (error) {
      console.error("Error deleting product:", error)
      toast.error("Failed to delete product")
    }
  }

  const handleBulkDelete = async (ids: number[]) => {
    try {
      const response = await fetch("/api/admin/products/bulk-delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      })

      if (!response.ok) throw new Error("Failed to delete products")

      const result = await response.json()
      toast.success(result.message)
      fetchProducts()
    } catch (error) {
      console.error("Error deleting products:", error)
      toast.error("Failed to delete products")
    }
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setFormDialogOpen(true)
  }

  const handleAddProduct = () => {
    setEditingProduct(null)
    setFormDialogOpen(true)
  }

  const handlePaginationChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  const handlePageSizeChange = (pageSize: number) => {
    setPaginationPrefs({ limit: pageSize })
    setPagination(prev => ({ 
      ...prev, 
      limit: pageSize, 
      page: 1 // Reset to first page when changing page size
    }))
  }

  const handleSearchChange = (searchValue: string) => {
    setSearch(searchValue)
  }

  const handleSearchSubmit = (searchValue: string) => {
    // Immediately trigger search on Enter press (bypass debounce)
    setSearch(searchValue)
    if (pagination.page !== 1) {
      setPagination(prev => ({ ...prev, page: 1 }))
    } else {
      // Force immediate fetch by temporarily setting search to trigger useEffect
      fetchProducts()
    }
  }

  const handleSortingChange = (field: string, order: "asc" | "desc") => {
    setSortBy(field)
    setSortOrder(order)
  }

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    if (editingProduct) {
      await handleUpdateProduct(data)
    } else {
      await handleCreateProduct(data)
    }
    setEditingProduct(null)
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your product inventory and pricing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCsvImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button onClick={handleAddProduct}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <ProductsTable
          data={products}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
          onBulkDelete={handleBulkDelete}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
          onPageSizeChange={handlePageSizeChange}
          search={search}
          onSearchChange={handleSearchChange}
          onSearchSubmit={handleSearchSubmit}
          sorting={{ field: sortBy, order: sortOrder }}
          onSortingChange={handleSortingChange}
        />
      )}

      <ProductFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        product={editingProduct}
        onSubmit={handleFormSubmit}
      />

      <CsvImportDialog
        open={csvImportOpen}
        onOpenChange={setCsvImportOpen}
        onImportComplete={fetchProducts}
      />
    </div>
  )
}