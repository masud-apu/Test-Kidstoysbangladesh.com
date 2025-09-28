"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  User,
  Tag,
} from "lucide-react"

import { AdminNavMain } from "@/components/admin-nav-main"
import { AdminNavUser } from "@/components/admin-nav-user"
import { AdminHeader } from "@/components/admin-header"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// Admin navigation data
const adminNavData = {
  navMain: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: LayoutDashboard,
    },
    {
      title: "Products",
      url: "/admin/products",
      icon: Package,
    },
    {
      title: "Orders",
      url: "/admin/orders",
      icon: ShoppingCart,
    },
    {
      title: "Promo Codes",
      url: "/admin/promo-codes",
      icon: Tag,
    },
    {
      title: "Account",
      url: "/admin/account",
      icon: User,
    },
  ],
}

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <AdminHeader />
      </SidebarHeader>
      <SidebarContent>
        <AdminNavMain items={adminNavData.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <AdminNavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}