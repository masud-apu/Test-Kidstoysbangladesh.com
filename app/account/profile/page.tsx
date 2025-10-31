'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { updateProfile, getProfile } from '@/lib/api/auth-api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Save, Phone } from 'lucide-react'
import { toast } from 'sonner'

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    defaultAddress: '',
  })

  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: session.user.name || '',
        email: session.user.email || '',
        defaultAddress: '',
      })

      // Fetch complete profile including defaultAddress
      const fetchProfile = async () => {
        const result = await getProfile(session.user.sessionToken)
        if (result.success && result.customer) {
          setFormData({
            name: result.customer.name || '',
            email: result.customer.email || '',
            defaultAddress: result.customer.defaultAddress || '',
          })
        }
      }
      fetchProfile()
    }
  }, [session])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!session?.user.sessionToken) {
        toast.error('Session expired. Please log in again.')
        router.push('/auth/signin')
        return
      }

      const result = await updateProfile(session.user.sessionToken, {
        name: formData.name || undefined,
        email: formData.email || undefined,
        defaultAddress: formData.defaultAddress || undefined,
      })

      if (!result.success) {
        toast.error(result.error || 'Failed to update profile')
        setLoading(false)
        return
      }

      // Update session with new data
      await update({
        name: formData.name,
        email: formData.email,
      })

      toast.success('Profile updated successfully!')
      setLoading(false)
    } catch (error) {
      toast.error('Failed to update profile')
      setLoading(false)
    }
  }

  if (!session) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your personal information
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your profile details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={session.user.phone}
                  disabled
                  className="pl-10 bg-muted"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Phone number cannot be changed
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your.email@example.com"
              />
              <p className="text-xs text-muted-foreground">
                We&apos;ll send order updates to this email
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Default Shipping Address</Label>
              <Textarea
                id="address"
                value={formData.defaultAddress}
                onChange={(e) => setFormData({ ...formData, defaultAddress: e.target.value })}
                placeholder="Enter your complete address with area, city, and postal code"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                This address will be pre-filled during checkout
              </p>
            </div>

            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
