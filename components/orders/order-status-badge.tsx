import { Badge } from "@/components/ui/badge"
import { OrderStatus } from "@/lib/validations/order"

interface OrderStatusBadgeProps {
  status: OrderStatus
}

const statusConfig = {
  order_placed: {
    label: "Order Placed",
    variant: "secondary" as const,
  },
  confirmed: {
    label: "Confirmed",
    variant: "default" as const,
  },
  shipped: {
    label: "Shipped",
    variant: "outline" as const,
  },
  delivered: {
    label: "Delivered",
    variant: "default" as const,
    className: "bg-green-100 text-green-800 hover:bg-green-100/80"
  },
  returned: {
    label: "Returned",
    variant: "destructive" as const,
  },
  canceled: {
    label: "Canceled",
    variant: "destructive" as const,
    className: "bg-gray-100 text-gray-800 hover:bg-gray-100/80"
  },
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.order_placed
  
  return (
    <Badge 
      variant={config.variant} 
      className={config.className}
    >
      {config.label}
    </Badge>
  )
}