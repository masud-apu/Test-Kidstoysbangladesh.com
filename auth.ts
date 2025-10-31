import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { authConfig } from './auth.config'
import { z } from 'zod'

const ADMIN_API_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3001'

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  // Explicitly set trustHost for development
  trustHost: true,
  providers: [
    Credentials({
      id: 'otp',
      name: 'OTP',
      credentials: {
        phone: { label: 'Phone', type: 'text' },
        code: { label: 'Code', type: 'text' },
        name: { label: 'Name', type: 'text' },
        email: { label: 'Email', type: 'text' },
        defaultAddress: { label: 'Address', type: 'text' },
      },
      async authorize(credentials) {
        console.log('🔍 [NextAuth] Starting authorize with credentials:', JSON.stringify(credentials, null, 2))

        // Validate credentials with more lenient schema first
        const parsedCredentials = z
          .object({
            phone: z.string().min(1, 'Phone number required'),
            code: z.string().min(1, 'OTP code required'),
            name: z.string().optional(),
            email: z.string().optional(),
            defaultAddress: z.string().optional(),
          })
          .safeParse(credentials)

        if (!parsedCredentials.success) {
          console.error('❌ [NextAuth] Credentials validation failed:', parsedCredentials.error)
          return null
        }

        // Additional validation for OTP code length
        if (parsedCredentials.data.code.length !== 6) {
          console.error('❌ [NextAuth] OTP code must be 6 digits, got:', parsedCredentials.data.code.length)
          return null
        }

        const { phone, code, name, email, defaultAddress } = parsedCredentials.data
        console.log('✅ [NextAuth] Credentials parsed successfully:', { phone, code: '***', name, email, defaultAddress })

        try {
          // Prepare request body with optional profile data
          const requestBody: any = { phone, code }
          if (name) requestBody.name = name
          if (email) requestBody.email = email
          if (defaultAddress) requestBody.defaultAddress = defaultAddress

          console.log('📤 [NextAuth] Sending request to:', `${ADMIN_API_URL}/api/auth/customer/verify-otp`)
          console.log('📤 [NextAuth] Request body:', JSON.stringify({ ...requestBody, code: '***' }, null, 2))

          // Call admin backend to verify OTP
          const response = await fetch(`${ADMIN_API_URL}/api/auth/customer/verify-otp`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          })

          console.log('📥 [NextAuth] Response status:', response.status, response.statusText)

          if (!response.ok) {
            const errorText = await response.text()
            console.error('❌ [NextAuth] OTP verification failed:', errorText)
            return null
          }

          const data = await response.json()
          console.log('📥 [NextAuth] Response data:', JSON.stringify(data, null, 2))

          if (!data.success) {
            console.error('❌ [NextAuth] API returned success=false:', data.message)
            return null
          }

          // Return user object with session token
          const user = {
            id: data.customer.id.toString(),
            phone: data.customer.phone,
            email: data.customer.email,
            name: data.customer.name,
            sessionToken: data.sessionToken,
          }
          console.log('✅ [NextAuth] Returning user object:', JSON.stringify(user, null, 2))
          return user
        } catch (error) {
          console.error('❌ [NextAuth] OTP authorization error:', error)
          return null
        }
      },
    }),
  ],
})
