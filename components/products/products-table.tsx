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
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, MoreHorizontal, Trash2, Edit } from "lucide-react"

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

export type Product = {
  id: number
  name: string
  handle: string
  price: string
  actualPrice: string | null
  comparePrice: string | null
  quantity: number
  completedOrders: number
  description: string | null
  tags: string[]
  images: string[]
  createdAt: string
  updatedAt: string
}

interface ProductsTableProps {
  data: Product[]
  onEdit: (product: Product) => void
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

export function ProductsTable({ 
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
  onSortingChange
}: ProductsTableProps) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = usePersistentState<VisibilityState>("admin-products-columns", {})
  const [rowSelection, setRowSelection] = useState({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<number | null>(null)

  // Convert server-side sorting to TanStack table format
  const tableSorting: SortingState = sorting
    ? [{ id: sorting.field, desc: sorting.order === "desc" }]
    : []

  const columns: ColumnDef<Product>[] = [
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
      accessorKey: "images",
      header: "Image",
      cell: ({ row }) => {
        const images = row.getValue("images") as string[]
        const firstImage = images?.[0]
        
        return (
          <div className="flex items-center justify-center w-12 h-12">
            {firstImage ? (
              <img // eslint-disable-line @next/next/no-img-element
                src={firstImage}
                alt={`${row.getValue("name")} product image`}
                className="w-10 h-10 object-cover rounded border"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg"
                }}
              />
            ) : (
              <div className="w-10 h-10 bg-muted rounded border flex items-center justify-center text-xs text-muted-foreground">
                No image
              </div>
            )}
          </div>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        const sorted = column.getIsSorted()
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            {sorted === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : sorted === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate" title={row.getValue("name") as string}>
          {row.getValue("name")}
        </div>
      ),
    },
    {
      accessorKey: "price",
      header: ({ column }) => {
        const sorted = column.getIsSorted()
        return (
          <Button
            variant="ghost"
            className="justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span className="mr-2">Price</span>
            {sorted === "asc" ? (
              <ArrowUp className="h-4 w-4" />
            ) : sorted === "desc" ? (
              <ArrowDown className="h-4 w-4" />
            ) : (
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        )
      },
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("price"))
        return <div className="text-right font-medium">TK {amount}</div>
      },
    },
    {
      accessorKey: "actualPrice",
      header: ({ column }) => {
        const sorted = column.getIsSorted()
        return (
          <Button
            variant="ghost"
            className="justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span className="mr-2">Actual Price</span>
            {sorted === "asc" ? (
              <ArrowUp className="h-4 w-4" />
            ) : sorted === "desc" ? (
              <ArrowDown className="h-4 w-4" />
            ) : (
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        )
      },
      cell: ({ row }) => {
        const amount = row.getValue("actualPrice") as string | null
        if (!amount) return <div className="text-right text-muted-foreground">-</div>
        return <div className="text-right font-medium">TK {parseFloat(amount)}</div>
      },
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => {
        const sorted = column.getIsSorted()
        return (
          <Button
            variant="ghost"
            className="justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span className="mr-2">Stock</span>
            {sorted === "asc" ? (
              <ArrowUp className="h-4 w-4" />
            ) : sorted === "desc" ? (
              <ArrowDown className="h-4 w-4" />
            ) : (
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        )
      },
      cell: ({ row }) => {
        const quantity = row.getValue("quantity") as number
        const isLowStock = quantity <= 5
        const isOutOfStock = quantity <= 0
        
        return (
          <div className={`text-right font-medium ${
            isOutOfStock 
              ? 'text-red-600' 
              : isLowStock 
                ? 'text-yellow-600' 
                : 'text-green-600'
          }`}>
            {quantity}
            {isOutOfStock && ' (Out of stock)'}
            {!isOutOfStock && isLowStock && ' (Low stock)'}
          </div>
        )
      },
    },
    {
      accessorKey: "completedOrders",
      header: ({ column }) => {
        const sorted = column.getIsSorted()
        return (
          <Button
            variant="ghost"
            className="justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span className="mr-2">Orders</span>
            {sorted === "asc" ? (
              <ArrowUp className="h-4 w-4" />
            ) : sorted === "desc" ? (
              <ArrowDown className="h-4 w-4" />
            ) : (
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="text-right">{row.getValue("completedOrders")}</div>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const product = row.original
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
              <DropdownMenuItem onClick={() => onEdit(product)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setProductToDelete(product.id)
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

  // Handle sorting changes and convert to server-side format
  const handleSortingChange = (updater: ((prev: SortingState) => SortingState) | SortingState) => {
    if (typeof updater === "function") {
      const newSorting = updater(tableSorting)
      if (newSorting.length > 0 && onSortingChange) {
        const { id, desc } = newSorting[0]
        onSortingChange(id, desc ? "desc" : "asc")
      } else if (newSorting.length === 0 && onSortingChange) {
        // Reset to default sorting
        onSortingChange("createdAt", "desc")
      }
    }
  }

  const table = useReactTable({
    data,
    columns,
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    // Remove client-side pagination, sorting, and filtering for server-side implementation
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    pageCount: pagination?.totalPages ?? -1,
    state: {
      sorting: tableSorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedIds = selectedRows.map(row => row.original.id)

  const handleBulkDelete = () => {
    if (selectedIds.length > 0) {
      onBulkDelete(selectedIds)
      setRowSelection({})
    }
  }

  const handleSingleDelete = () => {
    if (productToDelete) {
      onDelete(productToDelete)
      setProductToDelete(null)
      setDeleteDialogOpen(false)
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-center py-4 gap-4">
        <Input
          placeholder="Filter products..."
          value={search ?? ""}
          onChange={(event) => onSearchChange?.(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSearchSubmit?.(event.currentTarget.value)
            }
          }}
          className="max-w-sm"
        />
        {selectedIds.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete {selectedIds.length} products
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
                  // Align headers to match their column cells
                  const headerId = header.column.id
                  const headerClassName =
                    headerId === 'price' || headerId === 'actualPrice' || headerId === 'completedOrders'
                      ? 'text-right'
                      : headerId === 'images'
                        ? 'text-center w-[64px]'
                        : undefined
                  return (
                    <TableHead key={header.id} className={headerClassName}>
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
                  {row.getVisibleCells().map((cell) => {
                    const cellId = cell.column.id
                    const cellClassName =
                      cellId === 'price' || cellId === 'actualPrice' || cellId === 'completedOrders'
                        ? 'text-right'
                        : cellId === 'images'
                          ? 'text-center w-[64px]'
                          : undefined
                    return (
                      <TableCell key={cell.id} className={cellClassName}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {selectedIds.length} of {data.length} row(s) selected.
          </div>
          {pagination && (
            <div className="text-sm text-muted-foreground">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
              {pagination.total} products
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          {pagination && onPageSizeChange && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows per page:</span>
              <Select
                value={pagination.limit.toString()}
                onValueChange={(value) => onPageSizeChange(Number(value))}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {pagination && (
            <div className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </div>
          )}
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPaginationChange?.(Math.max(1, (pagination?.page ?? 1) - 1))}
              disabled={!pagination || pagination.page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPaginationChange?.((pagination?.page ?? 1) + 1)}
              disabled={!pagination || pagination.page >= pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSingleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
