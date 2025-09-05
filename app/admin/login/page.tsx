import { AdminLoginForm } from '@/components/admin-login-form'
import { getCurrentUser } from '@/lib/get-user'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
  // Redirect if user is already logged in
  const user = await getCurrentUser()
  if (user) {
    redirect('/admin')
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <AdminLoginForm />
      </div>
    </div>
  )
}