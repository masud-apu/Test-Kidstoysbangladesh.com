import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string
      phone: string
      sessionToken: string
      name?: string | null
      email?: string | null
    }
  }

  interface User {
    id: string
    phone: string
    email?: string | null
    name?: string | null
    sessionToken: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    phone: string
    sessionToken: string
    name: string | null
    email: string | null
  }
}
