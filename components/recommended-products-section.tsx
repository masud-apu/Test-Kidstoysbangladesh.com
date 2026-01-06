import { RecommendedProducts } from "@/components/recommended-products"

export async function RecommendedProductsSection() {
    // Fetch recommended products
    type RecommendedProduct = { id: number; title: string; handle: string; images: unknown[]; variants: unknown[] }
    let recommendedProducts: RecommendedProduct[] = []

    try {
        const recommendedResponse = await fetch(`${process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3001'}/api/products?limit=20`, {
            next: { revalidate: 60 } // Revalidate more frequently for randomness
        })

        if (recommendedResponse.ok) {
            const recommendedData = await recommendedResponse.json()
            // Randomly shuffle and take 6
            recommendedProducts = (recommendedData.products || [])
                .sort(() => 0.5 - Math.random())
                .slice(0, 6)
        }
    } catch (error) {
        console.error('Failed to fetch recommended products:', error)
        // Return null or empty list on error
        return null
    }

    return <RecommendedProducts products={recommendedProducts} />
}
