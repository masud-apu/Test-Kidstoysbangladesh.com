'use client'

import { usePathname } from 'next/navigation'
import { Header } from '@/components/header'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Check if current path is admin-related
  const isAdminRoute = pathname.startsWith('/admin')
  
  // For admin routes, just return children without header/nav
  if (isAdminRoute) {
    return <>{children}</>
  }
  
  // For public routes, include header and mobile nav
  return (
    <>
      <Header />
      <main className="pt-16 pb-20 md:pb-0 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
      <MobileBottomNav />
    </>
  )
}