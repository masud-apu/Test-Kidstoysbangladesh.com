'use client'

import { Product } from '@/lib/schema'
import { ProductCard } from '@/components/product-card'

// Extend Product to ensure variants are included for ProductCard
type ProductWithVariants = Product & {
    variants?: unknown[]
}

interface RecommendedProductsProps {
    products: ProductWithVariants[]
}

export function RecommendedProducts({ products }: RecommendedProductsProps) {
    if (!products || products.length === 0) return null

    return (
        <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6 px-4 md:px-0">Recommended Products</h2>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 px-2 md:px-0">
                {products.filter((p) => p && p.id).map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    )
}
