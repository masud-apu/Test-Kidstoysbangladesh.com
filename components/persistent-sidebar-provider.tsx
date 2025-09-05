"use client"

import * as React from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { usePersistentState } from "@/hooks/use-persistent-state"

interface PersistentSidebarProviderProps {
  children: React.ReactNode
  defaultOpen?: boolean
}

export function PersistentSidebarProvider({ 
  children, 
  defaultOpen = true 
}: PersistentSidebarProviderProps) {
  const [isOpen, setIsOpen] = usePersistentState(
    "admin-sidebar-open", 
    defaultOpen
  )

  const handleOpenChange = React.useCallback((open: boolean) => {
    setIsOpen(open)
  }, [setIsOpen])

  return (
    <SidebarProvider 
      open={isOpen} 
      onOpenChange={handleOpenChange}
      defaultOpen={defaultOpen}
    >
      {children}
    </SidebarProvider>
  )
}