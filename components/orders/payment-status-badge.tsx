import { Badge } from "@/components/ui/badge"
import { PaymentStatus } from "@/lib/validations/order"

interface PaymentStatusBadgeProps {
  status: PaymentStatus
}

type StatusConfig = {
  label: string
  variant: "secondary" | "default" | "outline" | "destructive"
  className?: string
}

const statusConfig: Record<PaymentStatus, StatusConfig> = {
  pending: {
    label: "Pending",
    variant: "secondary" as const,
    className: "bg-gray-100 text-gray-800 hover:bg-gray-100/80",
  },
  paid: {
    label: "Paid",
    variant: "default" as const,
    className: "bg-green-100 text-green-800 hover:bg-green-100/80",
  },
  failed: {
    label: "Failed",
    variant: "destructive" as const,
    className: "bg-red-100 text-red-800 hover:bg-red-100/80",
  },
  refunded: {
    label: "Refunded",
    variant: "outline" as const,
    className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80",
  },
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending
  
  return (
    <Badge 
      variant={config.variant} 
      className={config.className}
    >
      {config.label}
    </Badge>
  )
}