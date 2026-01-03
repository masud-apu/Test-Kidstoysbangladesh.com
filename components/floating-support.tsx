'use client'

import { MessageCircle } from 'lucide-react'
import { useState } from 'react'

export function FloatingSupport() {
    const [isHovered, setIsHovered] = useState(false)

    // Replace with your actual Facebook page ID or Messenger link
    const messengerLink = "https://wa.me/message/G7UGWCS2LYNOD1" // Update this with your actual page ID

    const handleClick = () => {
        window.open(messengerLink, '_blank', 'noopener,noreferrer')
    }

    return (
        <div className="fixed bottom-24 md:bottom-6 right-6 z-50 flex items-center gap-3">
            {/* Tooltip text */}
            <div
                className={`
          bg-gradient-to-r from-teal-500 to-teal-600 text-white px-4 py-2 rounded-full
          shadow-lg font-medium whitespace-nowrap transition-all duration-300
          ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}
        `}
            >
                Need help? Chat with us!
            </div>

            {/* Support button */}
            <button
                onClick={handleClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="
          group relative w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600
          hover:from-teal-600 hover:to-teal-700
          rounded-full shadow-lg hover:shadow-xl
          flex items-center justify-center
          transition-all duration-300 ease-out
          hover:scale-110 active:scale-95
          before:absolute before:inset-0 before:rounded-full
          before:bg-white/20 before:opacity-0 
          hover:before:opacity-100 before:transition-opacity
          animate-bounce-subtle
        "
                aria-label="Contact support via Messenger"
            >
                {/* Pulse effect */}
                <span className="absolute inset-0 rounded-full bg-teal-400 opacity-75 animate-ping-slow" />

                {/* Icon */}
                <MessageCircle
                    className="w-6 h-6 text-white relative z-10 transition-transform group-hover:rotate-12"
                />

                {/* Notification badge (optional - remove if not needed) */}
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                </span>
            </button>
        </div>
    )
}
