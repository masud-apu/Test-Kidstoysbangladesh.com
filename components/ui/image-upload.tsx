"use client"

import React, { useRef, useState } from 'react'
import { Upload, Loader2, X, Link, Plus } from 'lucide-react'
import { Button } from './button'
import { Input } from './input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

interface ImageUploadProps {
  value?: string[]
  onChange: (urls: string[]) => void
  onSingleUpload?: (url: string) => void
  multiple?: boolean
  className?: string
}

export function ImageUpload({
  value = [],
  onChange,
  onSingleUpload,
  multiple = true,
  className,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  // const [dragCounter, setDragCounter] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadImage = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/upload/image', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Upload failed')
    }

    const data = await response.json()
    return data.url
  }

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return

    setIsUploading(true)
    
    try {
      const uploadPromises = files.map(uploadImage)
      const urls = await Promise.all(uploadPromises)
      
      if (multiple) {
        onChange([...value, ...urls])
      } else {
        onChange([urls[0]])
        onSingleUpload?.(urls[0])
      }
      
      toast.success(`${urls.length} image(s) uploaded successfully`)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload image(s)')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    await processFiles(files)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Check if dragged items contain files
    if (e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Ensure we maintain the drag over state
    if (e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    )
    
    if (files.length === 0) {
      toast.error('Please drop image files only')
      return
    }
    
    await processFiles(files)
  }

  const addImageFromUrl = () => {
    if (urlInput.trim() && !value.includes(urlInput.trim())) {
      if (multiple) {
        onChange([...value, urlInput.trim()])
      } else {
        onChange([urlInput.trim()])
        onSingleUpload?.(urlInput.trim())
      }
      setUrlInput('')
      toast.success('Image URL added successfully')
    }
  }

  const removeImage = (urlToRemove: string) => {
    onChange(value.filter(url => url !== urlToRemove))
  }

  return (
    <div className={className}>
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">
            <Upload className="h-4 w-4 mr-2" />
            Upload Files
          </TabsTrigger>
          <TabsTrigger value="url">
            <Link className="h-4 w-4 mr-2" />
            Add URL
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Uploading images...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <Upload className="h-12 w-12 text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {isDragOver ? '🎯 Drop images here!' : 'Drag & drop images here'}
                  </p>
                  <p className="text-xs text-muted-foreground">or</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    Browse Files
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple={multiple}
            onChange={handleFileSelect}
            className="hidden"
          />
        </TabsContent>
        
        <TabsContent value="url" className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter image URL"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addImageFromUrl()
                }
              }}
            />
            <Button type="button" size="sm" onClick={addImageFromUrl}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {value.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium mb-2">Selected Images</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {value.map((url, index) => (
              <div
                key={index}
                className="relative group border rounded-lg overflow-hidden"
              >
                <img
                  src={url}
                  alt={`Upload ${index + 1}`}
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
                  onClick={() => removeImage(url)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}