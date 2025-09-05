"use client"

import { useEffect } from "react"
import { useSidebar } from "@/components/ui/sidebar"

export function AdminSidebarCookieHandler() {
  const { open } = useSidebar()
  
  useEffect(() => {
    document.cookie = `admin-sidebar-open=${open}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
  }, [open])
  
  return null
}