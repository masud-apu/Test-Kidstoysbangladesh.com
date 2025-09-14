'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ProductFormDialog } from '@/components/products/product-form-dialog'
import { CsvImportDialog } from '@/components/products/csv-import-dialog'
import { Plus, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Product } from '@/components/products/products-table'

export function DashboardActions() {
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [csvImportOpen, setCsvImportOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const handleAddProduct = () => {
    setEditingProduct(null)
    setFormDialogOpen(true)
  }

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    try {
      const url = editingProduct 
        ? `/api/admin/products/${editingProduct.id}` 
        : '/api/admin/products'
      const method = editingProduct ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to ${editingProduct ? 'update' : 'create'} product`)
      }

      toast.success(editingProduct ? 'Product updated successfully!' : 'Product created successfully!')
      setFormDialogOpen(false)
      setEditingProduct(null)
      
      // Refresh the page to update dashboard data
      window.location.reload()
    } catch (error) {
      console.error('Error saving product:', error)
      toast.error(error instanceof Error ? error.message : 'An error occurred')
      throw error
    }
  }

  const handleImportComplete = () => {
    toast.success('Products imported successfully!')
    setCsvImportOpen(false)
    // Refresh the page to update dashboard data
    window.location.reload()
  }

  return (
    <>
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

      <ProductFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        product={editingProduct}
        onSubmit={handleFormSubmit}
      />

      <CsvImportDialog
        open={csvImportOpen}
        onOpenChange={setCsvImportOpen}
        onImportComplete={handleImportComplete}
      />
    </>
  )
}
