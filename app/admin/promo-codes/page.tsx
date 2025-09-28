"use client"

import * as React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { usePersistentState, usePersistentObject } from "@/hooks/use-persistent-state"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { PromoCodesTable, PromoCode } from "@/components/promo-codes/promo-codes-table"
import { PromoCodeFormDialog } from "@/components/promo-codes/promo-code-form-dialog"

export default function PromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Persistent pagination preferences
  const [paginationPrefs, setPaginationPrefs] = usePersistentObject("admin-promo-codes-pagination", {
    limit: 25,
  })

  const [pagination, setPagination] = useState({
    page: 1,
    limit: paginationPrefs.limit,
    total: 0,
    totalPages: 0,
  })

  const [search, setSearch] = usePersistentState("admin-promo-codes-search", "")
  const [sortBy, setSortBy] = usePersistentState("admin-promo-codes-sortBy", "createdAt")
  const [sortOrder, setSortOrder] = usePersistentState("admin-promo-codes-sortOrder", "desc")

  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [editingPromoCode, setEditingPromoCode] = useState<PromoCode | null>(null)

  // Prevent duplicate calls during React Strict Mode or rapid state changes
  const fetchingRef = useRef(false)

  const fetchPromoCodes = useCallback(async () => {
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

      const response = await fetch(`/api/admin/promo-codes?${params}`)
      if (!response.ok) throw new Error("Failed to fetch promo codes")

      const data = await response.json()
      setPromoCodes(data.promoCodes)
      setPagination(data.pagination)
    } catch (error) {
      console.error("Error fetching promo codes:", error)
      toast.error("Failed to load promo codes")
    } finally {
      setIsLoading(false)
      fetchingRef.current = false
    }
  }, [pagination.page, pagination.limit, search, sortBy, sortOrder])

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
        fetchPromoCodes()
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [search, fetchPromoCodes, pagination.page])

  // Fetch promo codes when pagination, sortBy, or sortOrder changes
  useEffect(() => {
    fetchPromoCodes()
  }, [fetchPromoCodes])

  const handleCreatePromoCode = async (data: Record<string, unknown>) => {
    try {
      const response = await fetch("/api/admin/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("Failed to create promo code")

      const newPromoCode = await response.json()

      // Copy the promo code to clipboard
      try {
        await navigator.clipboard.writeText(newPromoCode.code)
        toast.success("Promo code created and copied to clipboard", {
          description: `"${data.name}" - Code: ${newPromoCode.code}`,
        })
      } catch (clipboardError) {
        console.error("Failed to copy to clipboard:", clipboardError)
        toast.success("Promo code created successfully", {
          description: `"${data.name}" - Code: ${newPromoCode.code}`,
        })
      }

      fetchPromoCodes()
    } catch (error) {
      console.error("Error creating promo code:", error)
      toast.error("Failed to create promo code")
      throw error
    }
  }

  const handleUpdatePromoCode = async (data: Record<string, unknown>) => {
    if (!editingPromoCode) return

    try {
      const response = await fetch(`/api/admin/promo-codes/${editingPromoCode.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("Failed to update promo code")

      toast.success("Promo code updated successfully", {
        description: `"${data.name}" has been updated`,
      })
      fetchPromoCodes()
    } catch (error) {
      console.error("Error updating promo code:", error)
      toast.error("Failed to update promo code")
      throw error
    }
  }

  const handleDeletePromoCode = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/promo-codes/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete promo code")

      toast.success("Promo code deleted successfully", {
        description: "The promo code has been removed",
      })
      fetchPromoCodes()
    } catch (error) {
      console.error("Error deleting promo code:", error)
      toast.error("Failed to delete promo code")
    }
  }

  const handleBulkDelete = async (ids: number[]) => {
    try {
      const response = await fetch("/api/admin/promo-codes/bulk-delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      })

      if (!response.ok) throw new Error("Failed to delete promo codes")

      const result = await response.json()
      toast.success(result.message)
      fetchPromoCodes()
    } catch (error) {
      console.error("Error deleting promo codes:", error)
      toast.error("Failed to delete promo codes")
    }
  }

  const handleEditPromoCode = (promoCode: PromoCode) => {
    setEditingPromoCode(promoCode)
    setFormDialogOpen(true)
  }

  const handleAddPromoCode = () => {
    setEditingPromoCode(null)
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
      fetchPromoCodes()
    }
  }

  const handleSortingChange = (field: string, order: "asc" | "desc") => {
    setSortBy(field)
    setSortOrder(order)
  }

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    if (editingPromoCode) {
      await handleUpdatePromoCode(data)
    } else {
      await handleCreatePromoCode(data)
    }
    setEditingPromoCode(null)
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Promo Codes</h1>
          <p className="text-muted-foreground">
            Manage discount codes and promotional offers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleAddPromoCode}>
            <Plus className="mr-2 h-4 w-4" />
            Add Promo Code
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <PromoCodesTable
          data={promoCodes}
          onEdit={handleEditPromoCode}
          onDelete={handleDeletePromoCode}
          onBulkDelete={handleBulkDelete}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
          onPageSizeChange={handlePageSizeChange}
          search={search}
          onSearchChange={handleSearchChange}
          onSearchSubmit={handleSearchSubmit}
          sorting={{ field: sortBy, order: sortOrder as "asc" | "desc" }}
          onSortingChange={handleSortingChange}
        />
      )}

      <PromoCodeFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        promoCode={editingPromoCode}
        onSubmit={handleFormSubmit}
      />
    </div>
  )
}