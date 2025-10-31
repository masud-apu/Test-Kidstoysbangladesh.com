import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { User, Package, Settings, Home } from 'lucide-react'

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/auth/signin')
  }

  const navigation = [
    {
      name: 'Dashboard',
      href: '/account',
      icon: Home,
    },
    {
      name: 'My Orders',
      href: '/account/orders',
      icon: Package,
    },
    {
      name: 'Profile',
      href: '/account/profile',
      icon: Settings,
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <aside className="md:col-span-1">
          <div className="bg-card rounded-lg border p-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                {session.user.name?.charAt(0) || session.user.phone.slice(-4)}
              </div>
              <div>
                <p className="font-semibold">{session.user.name || 'Customer'}</p>
                <p className="text-sm text-muted-foreground">{session.user.phone}</p>
              </div>
            </div>
            <nav className="space-y-1">
              {navigation.map((item) => (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="md:col-span-3">
          {children}
        </main>
      </div>
    </div>
  )
}
