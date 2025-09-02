import { ProductCard } from '@/components/product-card'
import { db } from '@/lib/db'
import { products } from '@/lib/schema'
import { desc } from 'drizzle-orm'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Truck, 
  Shield, 
  Clock, 
  Star,
  Gift,
  Gamepad2,
  Baby,
  GraduationCap,
  Car,
  Puzzle
} from 'lucide-react'

export default async function Home() {
  const allProducts = await db.select().from(products).orderBy(desc(products.createdAt)).limit(8)
  
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-repeat" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        <div className="container mx-auto max-w-7xl px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <Badge className="mb-4 bg-orange-100 text-orange-800 hover:bg-orange-200">
                ✨ Welcome to KidsToys Bangladesh
              </Badge>
              <h1 className="text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                <span className="text-gray-900">Where</span>{' '}
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Dreams
                </span>{' '}
                <span className="text-gray-900">Come to</span>{' '}
                <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  Play
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Discover the finest collection of safe, educational, and fun toys 
                that spark imagination and create lasting memories for children of all ages.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3">
                  <Gift className="mr-2 h-5 w-5" />
                  Shop Now
                </Button>
                <Button variant="outline" size="lg" className="px-8 py-3">
                  View Categories
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-3xl blur-3xl opacity-20 animate-pulse"></div>
              <div className="relative bg-white rounded-3xl p-8 shadow-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center">
                      <Gamepad2 className="h-16 w-16 text-blue-600" />
                    </div>
                    <div className="h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center">
                      <Car className="h-12 w-12 text-green-600" />
                    </div>
                  </div>
                  <div className="space-y-4 pt-8">
                    <div className="h-24 bg-gradient-to-br from-pink-100 to-pink-200 rounded-2xl flex items-center justify-center">
                      <Baby className="h-12 w-12 text-pink-600" />
                    </div>
                    <div className="h-32 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center">
                      <Puzzle className="h-16 w-16 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Truck,
                title: "Free Delivery",
                description: "Free shipping on orders over ৳500",
                color: "blue"
              },
              {
                icon: Shield,
                title: "Safe & Secure",
                description: "100% safe and tested toys",
                color: "green"
              },
              {
                icon: Clock,
                title: "Quick Service",
                description: "24/7 customer support",
                color: "purple"
              },
              {
                icon: Star,
                title: "Quality Guaranteed",
                description: "Premium quality assured",
                color: "orange"
              }
            ].map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    feature.color === 'blue' ? 'bg-blue-100' :
                    feature.color === 'green' ? 'bg-green-100' :
                    feature.color === 'purple' ? 'bg-purple-100' :
                    'bg-orange-100'
                  }`}>
                    <feature.icon className={`h-8 w-8 ${
                      feature.color === 'blue' ? 'text-blue-600' :
                      feature.color === 'green' ? 'text-green-600' :
                      feature.color === 'purple' ? 'text-purple-600' :
                      'text-orange-600'
                    }`} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-800">🎯 Shop by Category</Badge>
            <h2 className="text-4xl font-bold tracking-tight mb-4">
              Find the Perfect Toy for Every Child
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From educational toys to outdoor adventures, we have everything to keep your little ones happy and engaged.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {[
              { icon: GraduationCap, name: "Educational", color: "blue", count: "150+ toys" },
              { icon: Baby, name: "Baby Toys", color: "pink", count: "80+ toys" },
              { icon: Car, name: "Vehicles", color: "red", count: "120+ toys" },
              { icon: Puzzle, name: "Puzzles", color: "green", count: "90+ toys" },
              { icon: Gamepad2, name: "Electronic", color: "purple", count: "60+ toys" },
              { icon: Gift, name: "Gift Sets", color: "orange", count: "40+ sets" }
            ].map((category, index) => (
              <Link key={index} href="#" className="group">
                <div className="text-center hover:transform hover:scale-105 transition-transform duration-300">
                  <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center transition-colors ${
                    category.color === 'blue' ? 'bg-blue-100 group-hover:bg-blue-200' :
                    category.color === 'pink' ? 'bg-pink-100 group-hover:bg-pink-200' :
                    category.color === 'red' ? 'bg-red-100 group-hover:bg-red-200' :
                    category.color === 'green' ? 'bg-green-100 group-hover:bg-green-200' :
                    category.color === 'purple' ? 'bg-purple-100 group-hover:bg-purple-200' :
                    'bg-orange-100 group-hover:bg-orange-200'
                  }`}>
                    <category.icon className={`h-10 w-10 ${
                      category.color === 'blue' ? 'text-blue-600' :
                      category.color === 'pink' ? 'text-pink-600' :
                      category.color === 'red' ? 'text-red-600' :
                      category.color === 'green' ? 'text-green-600' :
                      category.color === 'purple' ? 'text-purple-600' :
                      'text-orange-600'
                    }`} />
                  </div>
                  <h3 className="font-semibold text-lg mb-1 group-hover:text-gray-900">{category.name}</h3>
                  <p className="text-sm text-gray-500">{category.count}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Products Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex justify-between items-center mb-12">
            <div>
              <Badge className="mb-4 bg-green-100 text-green-800">🆕 New Arrivals</Badge>
              <h2 className="text-4xl font-bold tracking-tight">Latest Products</h2>
              <p className="text-gray-600 mt-2">Discover our newest collection of amazing toys</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/products">View All Products</Link>
            </Button>
          </div>
          
          {allProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {allProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                <Gift className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">No products found</h3>
              <p className="text-gray-600 mb-8">Add some products to your database to get started.</p>
              <Button>Add Products</Button>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <div className="text-white">
            <h2 className="text-4xl font-bold mb-4">Stay Updated with Latest Toys</h2>
            <p className="text-xl opacity-90 mb-8">
              Get exclusive deals, new arrivals, and parenting tips delivered to your inbox
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="flex-1 px-4 py-3 rounded-lg text-gray-900"
              />
              <Button className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-3">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
