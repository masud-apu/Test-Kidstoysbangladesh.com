'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { sendOTP } from '@/lib/api/auth-api'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Phone, Shield } from 'lucide-react'

interface PhoneAuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  callbackUrl?: string
  defaultTab?: 'login' | 'signup'
}

export function PhoneAuthDialog({ open, onOpenChange, callbackUrl = '/', defaultTab = 'login' }: PhoneAuthDialogProps) {
  const router = useRouter()
  const [currentTab, setCurrentTab] = useState<'login' | 'signup'>(defaultTab)
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)

  // Signup profile data
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    address: '',
  })

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setStep('phone')
      setPhone('')
      setOtp('')
      setError('')
      setOtpSent(false)
      setResendTimer(0)
      setSignupData({ name: '', email: '', address: '' })
    }
  }, [open])

  // Countdown timer for resend OTP
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  const handleSendOTP = async () => {
    setError('')
    setLoading(true)

    try {
      // Validate phone number
      if (!phone || phone.length < 10) {
        setError('Please enter a valid phone number')
        setLoading(false)
        return
      }

      // Validate signup data
      if (currentTab === 'signup') {
        if (!signupData.name.trim()) {
          setError('Please enter your name')
          setLoading(false)
          return
        }
      }

      const purpose = currentTab === 'login' ? 'login' : 'signup'
      const result = await sendOTP(phone, purpose)

      if (!result.success) {
        setError(result.message || 'Failed to send OTP')
        setLoading(false)
        return
      }

      setOtpSent(true)
      setStep('otp')
      setResendTimer(60) // 60 seconds countdown
      setLoading(false)
    } catch (err) {
      setError('Failed to send OTP. Please try again.')
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    setError('')
    setLoading(true)

    try {
      console.log('🔍 [Dialog] Starting OTP verification')
      console.log('🔍 [Dialog] Current tab:', currentTab)
      console.log('🔍 [Dialog] Phone:', phone)
      console.log('🔍 [Dialog] OTP length:', otp.length)

      if (otp.length !== 6) {
        console.error('❌ [Dialog] OTP length invalid:', otp.length)
        setError('Please enter the 6-digit code')
        setLoading(false)
        return
      }

      // Prepare credentials - include profile data for signup
      const credentials: Record<string, string> = {
        phone,
        code: otp,
      }

      // Add profile data for signup
      if (currentTab === 'signup') {
        credentials.name = signupData.name
        credentials.email = signupData.email
        credentials.defaultAddress = signupData.address
        console.log('📝 [Dialog] Signup credentials:', JSON.stringify({ ...credentials, code: '***' }, null, 2))
      } else {
        console.log('📝 [Dialog] Login credentials:', JSON.stringify({ ...credentials, code: '***' }, null, 2))
      }

      console.log('🔐 [Dialog] Calling signIn with provider: otp')
      // Use NextAuth signIn with OTP credentials
      const result = await signIn('otp', {
        ...credentials,
        redirect: false,
      })

      console.log('📥 [Dialog] SignIn result:', JSON.stringify(result, null, 2))

      if (!result?.ok) {
        console.error('❌ [Dialog] SignIn failed:', result?.error)

        // More specific error messages
        const errorMessage = result?.error === 'CredentialsSignin'
          ? 'Invalid or expired OTP code. Please try again.'
          : result?.error || 'Verification failed. Please try again.'

        setError(errorMessage)
        setLoading(false)
        return
      }

      // Check if there was an error even if result.ok is true
      if (result?.error) {
        console.error('⚠️ [Dialog] SignIn succeeded but has error:', result.error)
      }

      console.log('✅ [Dialog] SignIn successful! Redirecting to:', callbackUrl)
      // Success! Close dialog
      onOpenChange(false)

      // Small delay to allow NextAuth to set the session cookie
      await new Promise(resolve => setTimeout(resolve, 100))

      // Force full page reload with cache bypass for Firefox compatibility
      // This ensures the session cookie is properly read
      if (typeof window !== 'undefined') {
        // Use location.replace with timestamp to bypass cache
        window.location.replace(callbackUrl + (callbackUrl.includes('?') ? '&' : '?') + '_t=' + Date.now())
      }
    } catch (err) {
      console.error('❌ [Dialog] Verification error:', err)
      setError('Verification failed. Please try again.')
      setLoading(false)
    }
  }

  const handleResendOTP = () => {
    setOtp('')
    setError('')
    setStep('phone')
    setOtpSent(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {step === 'phone' ? 'Sign in or Sign up' : 'Enter verification code'}
          </DialogTitle>
          <DialogDescription>
            {step === 'phone'
              ? 'Enter your phone number to receive a verification code'
              : `We sent a 6-digit code to ${phone}`
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'phone' ? (
          <div className="space-y-4 py-4">
            <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v as 'login' | 'signup')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone-login">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone-login"
                      type="tel"
                      placeholder="01712345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10"
                      disabled={loading}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter your Bangladesh mobile number
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name-signup">Full Name *</Label>
                  <Input
                    id="name-signup"
                    type="text"
                    placeholder="Your full name"
                    value={signupData.name}
                    onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone-signup">Phone Number *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone-signup"
                      type="tel"
                      placeholder="01712345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10"
                      disabled={loading}
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We&apos;ll send you a verification code
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-signup">Email (Optional)</Label>
                  <Input
                    id="email-signup"
                    type="email"
                    placeholder="your.email@example.com"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    For order updates and notifications
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address-signup">Address (Optional)</Label>
                  <Input
                    id="address-signup"
                    type="text"
                    placeholder="Your address"
                    value={signupData.address}
                    onChange={(e) => setSignupData({ ...signupData, address: e.target.value })}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Save time during checkout
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleSendOTP}
              className="w-full"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {currentTab === 'login' ? 'Continue' : 'Create Account'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                  disabled={loading}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Code expires in 5 minutes
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleVerifyOTP}
              className="w-full"
              disabled={loading || otp.length !== 6}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify & Continue
            </Button>

            <div className="text-center">
              {resendTimer > 0 ? (
                <p className="text-sm text-muted-foreground">
                  Resend code in {resendTimer}s
                </p>
              ) : (
                <Button
                  variant="link"
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="text-sm"
                >
                  Didn&apos;t receive code? Try again
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
