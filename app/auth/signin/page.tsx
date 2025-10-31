'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { PhoneAuthDialog } from '@/components/auth/phone-auth-dialog'

export default function SignInPage() {
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(true)
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  return (
    <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
      <PhoneAuthDialog
        open={open}
        onOpenChange={setOpen}
        callbackUrl={callbackUrl}
        defaultTab="login"
      />
    </div>
  )
}
