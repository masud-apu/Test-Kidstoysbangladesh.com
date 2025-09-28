"use client"

import * as React from "react"
import { useState } from "react"
import { usePersistentState } from "@/hooks/use-persistent-state"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, MoreHorizontal, Trash2, Edit, Copy } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

export type PromoCode = {
  id: number
  code: string
  name: string
  discountType: "percentage" | "fixed"
  discountValue: string
  maxDiscountAmount: string | null
  isOneTimeUse: boolean
  usageLimit: number | null
  usedCount: number
  isStoreWide: boolean
  applicableProducts: number[]
  isActive: boolean
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

interface PromoCodesTableProps {
  data: PromoCode[]
  onEdit: (promoCode: PromoCode) => void
  onDelete: (id: number) => void
  onBulkDelete: (ids: number[]) => void
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  onPaginationChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  search?: string
  onSearchChange?: (search: string) => void
  onSearchSubmit?: (search: string) => void
  sorting?: { field: string; order: "asc" | "desc" }
  onSortingChange?: (field: string, order: "asc" | "desc") => void
}

export function PromoCodesTable({
  data,
  onEdit,
  onDelete,
  onBulkDelete,
  pagination,
  onPaginationChange,
  onPageSizeChange,
  search,
  onSearchChange,
  onSearchSubmit,
  sorting,
  onSortingChange,
}: PromoCodesTableProps) {
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = usePersistentState("promo-codes-table-column-visibility", {})
  const [localSearch, setLocalSearch] = useState(search || "")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [promoCodeToDelete, setPromoCodeToDelete] = useState<number | null>(null)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Code copied to clipboard")
    } catch (err) {
      toast.error("Failed to copy code")
    }
  }

  const formatDiscount = (promoCode: PromoCode) => {
    if (promoCode.discountType === "percentage") {
      const discount = `${promoCode.discountValue}%`
      if (promoCode.maxDiscountAmount) {
        return `${discount} (max ৳${promoCode.maxDiscountAmount})`
      }
      return discount
    }
    return `৳${promoCode.discountValue}`
  }

  const formatScope = (promoCode: PromoCode) => {
    if (promoCode.isStoreWide) {
      return "Store-wide"
    }
    return `${promoCode.applicableProducts.length} products`
  }

  const formatUsage = (promoCode: PromoCode) => {
    if (promoCode.isOneTimeUse) {
      const isUsed = promoCode.usedCount > 0
      return (
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isUsed ? 'bg-red-500' : 'bg-green-500'}`}></span>
          <span className={`text-sm ${isUsed ? 'text-red-600' : 'text-green-600'}`}>
            {isUsed ? 'Used' : 'Available'}
          </span>
          <span className="text-xs text-gray-500">(One-time)</span>
        </div>
      )
    }
    if (promoCode.usageLimit) {
      const percentage = (promoCode.usedCount / promoCode.usageLimit) * 100
      const isNearLimit = percentage >= 80
      const isAtLimit = promoCode.usedCount >= promoCode.usageLimit

      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`text-sm ${isAtLimit ? 'text-red-600' : isNearLimit ? 'text-orange-600' : 'text-green-600'}`}>
              {promoCode.usedCount}/{promoCode.usageLimit}
            </span>
            <span className="text-xs text-gray-500">
              ({percentage.toFixed(0)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-orange-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            ></div>
          </div>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-blue-600">{promoCode.usedCount}</span>
        <span className="text-xs text-gray-500">times used</span>
      </div>
    )
  }

  const formatExpiryDate = (expiresAt: string | null) => {
    if (!expiresAt) return "No expiry"
    const date = new Date(expiresAt)
    return date.toLocaleDateString()
  }

  const columns: ColumnDef<PromoCode>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "code",
      header: ({ column }) => {
        const isSorted = sorting?.field === "code"
        const order = sorting?.order
        return (
          <Button
            variant="ghost"
            onClick={() => {
              const newOrder = isSorted && order === "asc" ? "desc" : "asc"
              onSortingChange?.("code", newOrder)
            }}
          >
            Code
            {isSorted ? (
              order === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        )
      },
      cell: ({ row }) => {
        const code = row.getValue("code") as string
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono font-medium">{code}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(code)}
              className="h-6 w-6 p-0"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        )
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        const isSorted = sorting?.field === "name"
        const order = sorting?.order
        return (
          <Button
            variant="ghost"
            onClick={() => {
              const newOrder = isSorted && order === "asc" ? "desc" : "asc"
              onSortingChange?.("name", newOrder)
            }}
          >
            Name
            {isSorted ? (
              order === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        )
      },
      cell: ({ row }) => <div className="max-w-[200px] truncate">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "discount",
      header: "Discount",
      cell: ({ row }) => {
        const promoCode = row.original
        return <div className="font-medium">{formatDiscount(promoCode)}</div>
      },
    },
    {
      accessorKey: "scope",
      header: "Scope",
      cell: ({ row }) => {
        const promoCode = row.original
        return <div>{formatScope(promoCode)}</div>
      },
    },
    {
      accessorKey: "usage",
      header: ({ column }) => {
        const isSorted = sorting?.field === "usedCount"
        const order = sorting?.order
        return (
          <Button
            variant="ghost"
            onClick={() => {
              const newOrder = isSorted && order === "asc" ? "desc" : "asc"
              onSortingChange?.("usedCount", newOrder)
            }}
          >
            Usage
            {isSorted ? (
              order === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        )
      },
      cell: ({ row }) => {
        const promoCode = row.original
        return <div className="py-1">{formatUsage(promoCode)}</div>
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean
        const promoCode = row.original
        const isExpired = promoCode.expiresAt && new Date(promoCode.expiresAt) < new Date()

        if (isExpired) {
          return <Badge variant="secondary">Expired</Badge>
        }
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        )
      },
    },
    {
      accessorKey: "expiresAt",
      header: "Expires",
      cell: ({ row }) => {
        const expiresAt = row.getValue("expiresAt") as string | null
        return <div className="text-sm">{formatExpiryDate(expiresAt)}</div>
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        const isSorted = sorting?.field === "createdAt"
        const order = sorting?.order
        return (
          <Button
            variant="ghost"
            onClick={() => {
              const newOrder = isSorted && order === "asc" ? "desc" : "asc"
              onSortingChange?.("createdAt", newOrder)
            }}
          >
            Created
            {isSorted ? (
              order === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        )
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt") as string)
        return <div className="text-sm">{date.toLocaleDateString()}</div>
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const promoCode = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => copyToClipboard(promoCode.code)}>
                <Copy className="mr-2 h-4 w-4" />
                Copy code
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit(promoCode)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setPromoCodeToDelete(promoCode.id)
                  setDeleteDialogOpen(true)
                }}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      rowSelection,
      columnVisibility,
    },
    enableRowSelection: true,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  })

  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedIds = selectedRows.map(row => row.original.id)

  const handleSearchChange = (value: string) => {
    setLocalSearch(value)
    onSearchChange?.(value)
  }

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSearchSubmit?.(localSearch)
    }
  }

  const handleDelete = () => {
    if (promoCodeToDelete) {
      onDelete(promoCodeToDelete)
      setDeleteDialogOpen(false)
      setPromoCodeToDelete(null)
    }
  }

  const handleBulkDelete = () => {
    onBulkDelete(selectedIds)
    setBulkDeleteDialogOpen(false)
    setRowSelection({})
  }

  return (
    <div className="w-full">
      <div className="flex items-center py-4 gap-4">
        <Input
          placeholder="Search promo codes..."
          value={localSearch}
          onChange={(event) => handleSearchChange(event.target.value)}
          onKeyPress={handleSearchKeyPress}
          className="max-w-sm"
        />
        {selectedRows.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setBulkDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete {selectedRows.length} selected
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No promo codes found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="flex items-center space-x-2">
            <p className="text-sm text-muted-foreground">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
              {pagination.total} promo codes
            </p>
            <Select
              value={pagination.limit.toString()}
              onValueChange={(value) => onPageSizeChange?.(parseInt(value))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 50, 100].map((pageSize) => (
                  <SelectItem key={pageSize} value={pageSize.toString()}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPaginationChange?.(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              Previous
            </Button>
            <div className="flex items-center space-x-1">
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPaginationChange?.(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the promo code
              and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {selectedRows.length} promo codes
              and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete}>Delete All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}