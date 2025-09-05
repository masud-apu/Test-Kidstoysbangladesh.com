"use client"

import * as React from "react"
import { useState } from "react"
import { Upload, Download, AlertTriangle, CheckCircle, Loader2 } from "lucide-react"
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
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

interface CsvImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete: () => void
}

export function CsvImportDialog({
  open,
  onOpenChange,
  onImportComplete,
}: CsvImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [importResults, setImportResults] = useState<{
    success: number
    errors: string[]
  } | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith('.csv')) {
        toast.error("Please select a CSV file")
        return
      }
      setFile(selectedFile)
      setImportResults(null)
    }
  }

  const handleImport = async () => {
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/admin/products/import-csv", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Import failed")
      }

      const result = await response.json()
      setImportResults(result)
      
      if (result.success > 0) {
        toast.success(`Successfully imported ${result.success} products`)
        onImportComplete()
      }
    } catch (error) {
      console.error("Import error:", error)
      toast.error(error instanceof Error ? error.message : "Import failed")
    } finally {
      setIsUploading(false)
    }
  }

  const downloadTemplate = () => {
    const csvContent = `name,handle,price,actualPrice,comparePrice,description,tags,images
"Sample Product","sample-product","29.99","39.99","49.99","This is a sample product description","toy,kids,educational","https://example.com/image1.jpg,https://example.com/image2.jpg"
"Another Product","another-product","19.99","","24.99","Another product description","toy,outdoor","https://example.com/image3.jpg"`

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'product-import-template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handleClose = () => {
    setFile(null)
    setImportResults(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Products from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import products. Download the template below to see the required format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              Make sure your CSV follows the exact format. Products with duplicate handles will be skipped.
            </AlertDescription>
          </Alert>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
            <span className="text-sm text-muted-foreground">
              Use this template as a starting point
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Select CSV File
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100"
                />
              </div>
            </div>

            {file && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="text-sm text-muted-foreground">
                    ({Math.round(file.size / 1024)} KB)
                  </span>
                </div>
              </div>
            )}

            {importResults && (
              <Alert className={importResults.errors.length > 0 ? "border-yellow-200" : "border-green-200"}>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Import Results</AlertTitle>
                <AlertDescription>
                  <div className="space-y-2">
                    <p>Successfully imported: {importResults.success} products</p>
                    {importResults.errors.length > 0 && (
                      <div>
                        <p className="font-medium text-yellow-800">Errors:</p>
                        <ul className="list-disc pl-4 space-y-1">
                          {importResults.errors.map((error, index) => (
                            <li key={index} className="text-sm text-yellow-700">
                              {error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || isUploading}
          >
            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import Products
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}