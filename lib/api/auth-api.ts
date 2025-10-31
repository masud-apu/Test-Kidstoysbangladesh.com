/**
 * Client-side API helper for customer authentication
 * Calls the admin backend APIs
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3001'

export interface SendOTPResponse {
  success: boolean
  message: string
  error?: string
  rateLimited?: boolean
}

export interface VerifyOTPResponse {
  success: boolean
  message: string
  customer?: {
    id: number
    phone: string
    email: string | null
    name: string | null
    defaultAddress: string | null
  }
  sessionToken?: string
  error?: string
}

export interface ProfileResponse {
  success: boolean
  customer?: {
    id: number
    phone: string
    email: string | null
    name: string | null
    defaultAddress: string | null
    createdAt: string
    updatedAt: string
  }
  error?: string
}

export interface OrdersResponse {
  success: boolean
  orders?: Array<{
    id: number
    orderId: string
    status: string
    customerName: string
    customerEmail: string | null
    customerPhone: string
    customerAddress: string
    itemsTotal: string
    shippingCost: string
    totalAmount: string
    createdAt: string
    items: Array<{
      productName: string
      variantTitle?: string
      quantity: number
      itemTotal: string
    }>
  }>
  error?: string
}

/**
 * Send OTP code to phone number
 */
export async function sendOTP(phone: string, purpose: 'login' | 'signup' | 'verify'): Promise<SendOTPResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/customer/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone, purpose }),
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Send OTP error:', error)
    return {
      success: false,
      message: 'Failed to send OTP',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get customer profile (requires session token)
 */
export async function getProfile(sessionToken: string): Promise<ProfileResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/customer/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Get profile error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Update customer profile (requires session token)
 */
export async function updateProfile(
  sessionToken: string,
  updates: {
    name?: string
    email?: string | null
    defaultAddress?: string | null
  }
): Promise<ProfileResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/customer/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Update profile error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get customer orders (requires session token)
 */
export async function getOrders(sessionToken: string): Promise<OrdersResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/customer/orders`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Get orders error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
