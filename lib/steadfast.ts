/**
 * Steadfast Courier API Integration
 * Documentation: https://docs.google.com/document/d/e/2PACX-1vTi0sTyR353xu1AK0nR8E_WKe5onCkUXGEf8ch8uoJy9qxGfgGnboSIkNosjQ0OOdXkJhgGuAsWxnIh/pub
 */

const STEADFAST_BASE_URL = 'https://portal.packzy.com/api/v1'
const STEADFAST_API_KEY = process.env.STEADFAST_API_KEY
const STEADFAST_SECRET_KEY = process.env.STEADFAST_SECRET_KEY

interface SteadfastOrderPayload {
  invoice: string // unique identifier (order ID)
  recipient_name: string
  recipient_phone: string
  recipient_address: string
  cod_amount: number // Cash on Delivery amount
}

interface SteadfastOrderResponse {
  status: number
  message?: string
  consignment?: {
    consignment_id: number
    tracking_code: string
    invoice: string
    recipient_name: string
    recipient_phone: string
    recipient_address: string
    cod_amount: number
    status: string
    created_at: string
    updated_at: string
  }
  errors?: Record<string, string[]>
}

export class SteadfastService {
  private static async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' = 'POST',
    body?: SteadfastOrderPayload | Record<string, unknown>
  ) {
    if (!STEADFAST_API_KEY || !STEADFAST_SECRET_KEY) {
      throw new Error('Steadfast API credentials not configured')
    }

    const url = `${STEADFAST_BASE_URL}${endpoint}`
    const headers = {
      'Api-Key': STEADFAST_API_KEY,
      'Secret-Key': STEADFAST_SECRET_KEY,
      'Content-Type': 'application/json',
    }

    const options: RequestInit = {
      method,
      headers,
    }

    if (body && method === 'POST') {
      options.body = JSON.stringify(body)
    }

    console.log('🚚 Steadfast API Request:', { url, method, body: body ? '***' : undefined })

    const response = await fetch(url, options)
    const data = await response.json()

    console.log('🚚 Steadfast API Response:', { status: response.status, data })

    if (!response.ok) {
      throw new Error(`Steadfast API error: ${JSON.stringify(data)}`)
    }

    return data as SteadfastOrderResponse
  }

  /**
   * Create a delivery order with Steadfast
   */
  static async createOrder(payload: SteadfastOrderPayload): Promise<SteadfastOrderResponse> {
    return this.makeRequest('/create_order', 'POST', payload)
  }

  /**
   * Check delivery status by invoice number
   */
  static async getStatusByInvoice(invoice: string): Promise<SteadfastOrderResponse> {
    return this.makeRequest(`/status_by_invoice/${invoice}`, 'GET')
  }

  /**
   * Check delivery status by tracking code
   */
  static async getStatusByTrackingCode(trackingCode: string): Promise<SteadfastOrderResponse> {
    return this.makeRequest(`/status_by_trackingcode/${trackingCode}`, 'GET')
  }

  /**
   * Check current balance
   */
  static async getBalance(): Promise<SteadfastOrderResponse> {
    return this.makeRequest('/get_balance', 'GET')
  }
}
