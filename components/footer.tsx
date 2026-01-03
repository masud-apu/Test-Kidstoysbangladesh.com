'use client'

import Link from 'next/link'
import { Facebook, Instagram, Phone, Mail, MapPin } from 'lucide-react'
import { FaWhatsapp } from 'react-icons/fa'
import { useOverlayStore } from '@/lib/ui-store'
import { Analytics } from '@/lib/analytics'

export function Footer() {
  const openCart = useOverlayStore((s) => s.openCart)

  return (
    <footer className="bg-white border-t border-gray-200 mt-0">
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2">
              <img src="/main-logo.png" alt="Kids Toys Bangladesh" className="h-16" />
              <span className="sr-only">Kids Toys Bangladesh</span>
            </Link>
            <p className="text-sm text-gray-600 mt-4">
              Safe, educational, and fun toys for children of all ages. Fast delivery across Bangladesh with cash on delivery.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <Link href="https://www.facebook.com/profile.php?id=61580061975501" target="_blank" aria-label="Facebook" className="text-gray-500 hover:text-gray-900">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="https://www.instagram.com/kidstoysbangladesh/" target="_blank" aria-label="Instagram" className="text-gray-500 hover:text-gray-900">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="https://whatsapp.com/channel/0029VbBHGmA2ER6ZXGAy4R3F" target="_blank" aria-label="WhatsApp" className="text-gray-500 hover:text-gray-900">
                <FaWhatsapp className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Shop</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="#educational-toys" className="text-gray-600 hover:text-gray-900">Educational Toys</Link></li>
              <li><Link href="#vehicles" className="text-gray-600 hover:text-gray-900">Vehicles</Link></li>
              <li><Link href="#building-blocks" className="text-gray-600 hover:text-gray-900">Building Blocks</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Support</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    Analytics.trackButtonClick('footer_cart_link', 'footer')
                    openCart()
                  }}
                  className="text-gray-600 hover:text-gray-900 text-left cursor-pointer"
                >
                  Cart
                </button>
              </li>
              <li><Link href="/policies#returns" className="text-gray-600 hover:text-gray-900">Returns &amp; Refunds</Link></li>
              <li><Link href="/policies#privacy" className="text-gray-600 hover:text-gray-900">Privacy Policy</Link></li>
              <li><Link href="/policies#terms" className="text-gray-600 hover:text-gray-900">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Contact</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-gray-500" /> <a href="tel:01337411948" className="hover:text-gray-900">01337411948</a></li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gray-500" />Mostul, PurbachalDhaka, Bangladesh</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-10 pt-6">
          <div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-2 text-xs text-gray-500">
            <p className="text-center md:text-left">© 2026 Kids Toys Bangladesh. All rights reserved.</p>
            <p className="text-center md:text-right">Developed by <Link href="https://xylo.services" target="_blank" className="hover:text-gray-900">xylo</Link></p>
          </div>
        </div>
      </div>
    </footer>
  )
}
