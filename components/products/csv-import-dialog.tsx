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
    const csvContent = `"id","name","price","compare_price","tags","images","description","created_at","updated_at","handle","actual_price","completed_orders","quantity"
"1","Kids Digital ATM Piggy Bank – Password Protected Money Box","1550.00","2500.00","[""kids toys"",""educational toys"",""fun playtime"",""birthday gift"",""learning toys""]","[""https://res.cloudinary.com/dcuwepyuz/image/upload/v1757868295/products/ijfvloliay6esd6oh30c.webp"",""https://res.cloudinary.com/dcuwepyuz/image/upload/v1757868295/products/kznpa2v8upvxrtloupbp.webp"",""https://res.cloudinary.com/dcuwepyuz/image/upload/v1757868295/products/fo9tkdk2bp22ncnoxshh.webp"",""https://res.cloudinary.com/dcuwepyuz/image/upload/v1757868295/products/zeepxvaswzw6jrdnggjd.webp"",""https://res.cloudinary.com/dcuwepyuz/image/upload/v1757868296/products/coz7nul6u3u5cozaabnn.webp"",""https://res.cloudinary.com/dcuwepyuz/image/upload/v1757868296/products/ufvs1jyshcdnlu6otzzl.webp""]","<div style=""text-align:center;"">

  <h2>🏦 Your Child’s First ATM Bank!</h2>
  <p><b>Fun & Smart Saving Habit:</b> Teach your little one the value of money with this <span style=""color:blue;"">Digital Piggy Bank</span>. It’s not just a toy, it’s a fun way to build the habit of saving!</p>

  <img src=""https://res.cloudinary.com/dcuwepyuz/image/upload/v1757868295/products/ijfvloliay6esd6oh30c.webp"" alt=""Kids Digital Piggy Bank Front View"" width=""300"" />

  <h3>✨ Amazing Features</h3>
  <ul style=""list-style:none; padding:0;"">
    <li>✔️ <b>Automatic Cash Deposit:</b> Insert a note and the bank pulls it in by itself.</li>
    <li>✔️ <b>Password Protection:</b> Kids can set their own code to keep money safe.</li>
    <li>✔️ <b>Fun Music:</b> Plays cheerful tunes while saving or withdrawing money.</li>
    <li>✔️ <b>Save Coins & Notes:</b> Works with both coins and paper money.</li>
  </ul>

  <img src=""https://res.cloudinary.com/dcuwepyuz/image/upload/v1757868295/products/kznpa2v8upvxrtloupbp.webp"" alt=""Digital Piggy Bank with Notes"" width=""300"" />

  <h3>🎁 Why Kids Love It</h3>
  <p>This toy is not only <i>fun and interactive</i> but also teaches <b>real-life saving habits</b>. A perfect gift that is both entertaining and educational.</p>

  <img src=""https://res.cloudinary.com/dcuwepyuz/image/upload/v1757868295/products/zeepxvaswzw6jrdnggjd.webp"" alt=""Piggy Bank Open View"" width=""300"" />
  <img src=""https://res.cloudinary.com/dcuwepyuz/image/upload/v1757868296/products/coz7nul6u3u5cozaabnn.webp"" alt=""ATM Piggy Bank Close-up"" width=""300"" />
  <img src=""https://res.cloudinary.com/dcuwepyuz/image/upload/v1757868296/products/ufvs1jyshcdnlu6otzzl.webp"" alt=""Children Playing with Piggy Bank"" width=""300"" />

  <h3>📞 Order Now</h3>
  <p>To place your order, call or WhatsApp us at: <b>+880 1337-411948</b></p>

</div>
","2025-09-14 18:36:06.060994","2025-09-14 18:55:24.405","kids-digital-atm-piggy-bank-password-protected-money-box","1200.00","0","10""`

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