'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ProductVariant, ProductOption, ProductOptionValue } from '@/lib/schema'
import { SelectedOption } from '@/lib/store'

interface VariantWithOptions extends ProductVariant {
  selectedOptions: Array<{
    optionName: string
    valueName: string
  }>
}

interface VariantSelectorProps {
  options: Array<ProductOption & { values: ProductOptionValue[] }>
  variants: VariantWithOptions[]
  onVariantChange: (variant: VariantWithOptions, selectedOptions: SelectedOption[], variantImage?: string) => void
  defaultVariantId?: number
}

export function VariantSelector({
  options,
  variants,
  onVariantChange,
  defaultVariantId
}: VariantSelectorProps) {
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>({})
  const [currentVariant, setCurrentVariant] = useState<VariantWithOptions | null>(null)

  // Initialize with default variant or first available variant
  useEffect(() => {
    if (variants.length === 0) return
    if (Object.keys(selectedValues).length > 0) return // Already initialized

    const defaultVariant = defaultVariantId
      ? variants.find(v => v.id === defaultVariantId)
      : variants[0]

    if (defaultVariant) {
      const initialValues: Record<string, string> = {}
      defaultVariant.selectedOptions.forEach(opt => {
        initialValues[opt.optionName] = opt.valueName
      })
      setSelectedValues(initialValues)
      setCurrentVariant(defaultVariant)

      const selectedOpts: SelectedOption[] = defaultVariant.selectedOptions.map(opt => ({
        optionName: opt.optionName,
        valueName: opt.valueName
      }))
      onVariantChange(defaultVariant, selectedOpts)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variants.length, defaultVariantId])

  // Find matching variant based on selected options
  const findMatchingVariant = (selections: Record<string, string>) => {
    return variants.find(variant => {
      return variant.selectedOptions.every(opt =>
        selections[opt.optionName] === opt.valueName
      )
    })
  }

  const handleOptionChange = (optionName: string, valueName: string, optionValueImage?: string) => {
    const newSelections = { ...selectedValues, [optionName]: valueName }
    setSelectedValues(newSelections)

    const matchingVariant = findMatchingVariant(newSelections)
    if (matchingVariant) {
      setCurrentVariant(matchingVariant)
      const selectedOpts: SelectedOption[] = Object.entries(newSelections).map(([name, value]) => ({
        optionName: name,
        valueName: value
      }))
      // Pass the variant's image (full product image), not the option value image (swatch)
      onVariantChange(matchingVariant, selectedOpts, matchingVariant.image || undefined)
    }
  }

  // Check if a value is available (exists in at least one variant)
  const isValueAvailable = (optionName: string, valueName: string) => {
    const otherSelections = { ...selectedValues }
    otherSelections[optionName] = valueName

    return variants.some(variant => {
      return variant.selectedOptions.every(opt =>
        otherSelections[opt.optionName] === opt.valueName
      )
    })
  }

  if (options.length === 0 || variants.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {options.map((option) => (
        <div key={option.id} className="space-y-2">
          <Label className="text-sm font-medium">
            {option.name}
            {selectedValues[option.name] && (
              <span className="ml-2 text-muted-foreground">
                ({selectedValues[option.name]})
              </span>
            )}
          </Label>
          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => {
              const isSelected = selectedValues[option.name] === value.value
              const isAvailable = isValueAvailable(option.name, value.value)
              const optionValueImage = (value as any).image // Small icon/swatch for the button

              return optionValueImage ? (
                // Image-only button for options with images
                <button
                  key={value.id}
                  disabled={!isAvailable}
                  onClick={() => handleOptionChange(option.name, value.value, optionValueImage)}
                  className={`
                    relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all
                    ${isSelected ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-gray-400'}
                    ${!isAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                  title={value.value}
                >
                  <Image
                    src={optionValueImage}
                    alt={value.value}
                    fill
                    className="object-cover"
                  />
                </button>
              ) : (
                // Text button for options without images
                <Button
                  key={value.id}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  disabled={!isAvailable}
                  onClick={() => handleOptionChange(option.name, value.value, optionValueImage)}
                  className={`
                    relative
                    ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                    ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {value.value}
                </Button>
              )
            })}
          </div>
        </div>
      ))}

      {currentVariant && (
        <div className="text-sm text-muted-foreground space-y-1">
          {currentVariant.sku && (
            <div>SKU: {currentVariant.sku}</div>
          )}
          {currentVariant.inventoryQuantity <= 0 ? (
            <div className="text-red-600 font-medium">Out of stock</div>
          ) : currentVariant.inventoryQuantity <= 5 ? (
            <div className="text-orange-600 font-medium">
              Only {currentVariant.inventoryQuantity} left in stock
            </div>
          ) : (
            <div className="text-green-600 font-medium">In stock</div>
          )}
        </div>
      )}
    </div>
  )
}
