"use client"

import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const breadcrumbMap: Record<string, { title: string; href?: string }[]> = {
  "/admin": [
    { title: "Admin", href: "/admin" },
    { title: "Dashboard" }
  ],
  "/admin/products": [
    { title: "Admin", href: "/admin" },
    { title: "Products" }
  ],
  "/admin/orders": [
    { title: "Admin", href: "/admin" },
    { title: "Orders" }
  ],
  "/admin/account": [
    { title: "Admin", href: "/admin" },
    { title: "Account" }
  ],
}

export function AdminBreadcrumbs() {
  const pathname = usePathname()
  const items = breadcrumbMap[pathname] || [
    { title: "Admin", href: "/admin" },
    { title: "Dashboard" }
  ]

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          
          return (
            <div key={index} className="flex items-center">
              {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
              <BreadcrumbItem className={index === 0 ? "hidden md:block" : ""}>
                {isLast ? (
                  <BreadcrumbPage>{item.title}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={item.href || "#"}>
                    {item.title}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}