import { ProductCard } from '@/components/product-card'
import { db } from '@/lib/db'
import { products } from '@/lib/schema'
import { desc } from 'drizzle-orm'

export default async function Home() {
  const allProducts = await db.select().from(products).orderBy(desc(products.createdAt))
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight font-bengali">
            আমাদের পণ্যসমূহ
          </h1>
          <p className="mt-2 text-muted-foreground">
            Discover amazing products at great prices
          </p>
        </div>
        
        {allProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {allProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold mb-4">No products found</h2>
            <p className="text-muted-foreground">Add some products to your database to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
}
