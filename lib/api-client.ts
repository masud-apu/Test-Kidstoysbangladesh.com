/**
 * API Client for communicating with the Admin Backend
 *
 * This utility centralizes all API calls from the frontend to the admin backend,
 * handling base URL configuration, error handling, and logging.
 */

// Use environment variable for base URL
// In development: '' (empty, uses Next.js rewrites)
// In production/Capacitor: full domain URL
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ''

export interface ApiClientOptions extends RequestInit {
  /**
   * Whether to include credentials (cookies) in the request
   * Default: false for public APIs, true for admin APIs
   */
  includeCredentials?: boolean

  /**
   * Optional bearer token for future authentication
   */
  bearerToken?: string
}

/**
 * Make an API request to the admin backend
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const { includeCredentials = false, bearerToken, ...fetchOptions } = options

  // Construct full URL
  const url = `${BASE_URL}${endpoint}`

  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> || {}),
  }

  // Add bearer token if provided
  if (bearerToken) {
    headers['Authorization'] = `Bearer ${bearerToken}`
  }

  // Configure request
  const requestConfig: RequestInit = {
    ...fetchOptions,
    headers,
    // Using 'same-origin' is fine now since Next.js rewrites make these same-origin requests
    credentials: includeCredentials ? 'include' : 'same-origin',
  }

  try {
    console.log(`🌐 API Request: ${fetchOptions.method || 'GET'} ${endpoint}`)
    console.log(`📍 Full URL: ${url}`)
    console.log(`📦 Request config:`, {
      method: requestConfig.method,
      headers: requestConfig.headers,
      credentials: requestConfig.credentials,
      hasBody: !!requestConfig.body,
    })

    const response = await fetch(url, requestConfig)

    // Handle non-OK responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: response.statusText,
      }))

      console.error(`❌ API Error: ${response.status}`, errorData)

      throw new Error(
        errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`
      )
    }

    // Parse JSON response
    const data = await response.json()
    console.log(`✅ API Success: ${endpoint}`)

    return data as T
  } catch (error) {
    console.error(`❌ API Request Failed: ${endpoint}`, error)
    throw error
  }
}

/**
 * Convenience method for GET requests
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function apiGet<T = any>(
  endpoint: string,
  options?: Omit<ApiClientOptions, 'method' | 'body'>
): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: 'GET' })
}

/**
 * Convenience method for POST requests
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function apiPost<T = any>(
  endpoint: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any,
  options?: Omit<ApiClientOptions, 'method' | 'body'>
): Promise<T> {
  // Ensure data is at least an empty object if undefined
  const bodyData = data !== undefined ? data : {}

  return apiRequest<T>(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(bodyData),
  })
}

/**
 * Convenience method for PUT requests
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function apiPut<T = any>(
  endpoint: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any,
  options?: Omit<ApiClientOptions, 'method' | 'body'>
): Promise<T> {
  // Ensure data is at least an empty object if undefined
  const bodyData = data !== undefined ? data : {}

  return apiRequest<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(bodyData),
  })
}

/**
 * Convenience method for DELETE requests
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function apiDelete<T = any>(
  endpoint: string,
  options?: Omit<ApiClientOptions, 'method' | 'body'>
): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: 'DELETE' })
}

/**
 * Get the full admin API URL (for debugging/testing)
 */
export function getApiBaseUrl(): string {
  return BASE_URL
}
