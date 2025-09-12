import posthog from 'posthog-js'

// E-commerce event types
export interface ProductViewEvent {
  product_id: string
  product_name: string
  price: number
  compare_price?: number
  tags?: string[]
  category?: string
}

export interface AddToCartEvent extends ProductViewEvent {
  quantity: number
}

export interface RemoveFromCartEvent {
  product_id: string
  product_name: string
  quantity: number
}

export interface CheckoutEvent {
  items: Array<{
    product_id: string
    product_name: string
    price: number
    quantity: number
  }>
  total_amount: number
  currency: string
  item_count: number
}

export interface SearchEvent {
  query: string
  results_count?: number
  category?: string
}

// Analytics utility class
export class Analytics {
  static isReady(): boolean {
    return typeof window !== 'undefined' && posthog && posthog.__loaded
  }

  // Page tracking
  static trackPageView(pageName: string, properties?: Record<string, unknown>) {
    if (!this.isReady()) return
    
    posthog.capture('$pageview', {
      page_name: pageName,
      page_url: window.location.href,
      page_path: window.location.pathname,
      timestamp: new Date().toISOString(),
      ...properties
    })
  }

  // Product events
  static trackProductView(product: ProductViewEvent) {
    if (!this.isReady()) return
    
    posthog.capture('product_viewed', {
      ...product,
      currency: 'BDT',
      timestamp: new Date().toISOString()
    })
  }

  static trackAddToCart(product: AddToCartEvent) {
    if (!this.isReady()) return
    
    posthog.capture('add_to_cart', {
      ...product,
      currency: 'BDT',
      value: product.price * product.quantity,
      timestamp: new Date().toISOString()
    })
  }

  static trackRemoveFromCart(product: RemoveFromCartEvent) {
    if (!this.isReady()) return
    
    posthog.capture('remove_from_cart', {
      ...product,
      timestamp: new Date().toISOString()
    })
  }

  static trackCartView(items: Array<{ id: number; name: string; quantity: number; price: string }>, totalAmount: number) {
    if (!this.isReady()) return
    
    posthog.capture('cart_viewed', {
      item_count: items.length,
      total_amount: totalAmount,
      currency: 'BDT',
      cart_items: items.map(item => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      timestamp: new Date().toISOString()
    })
  }

  // Checkout events
  static trackCheckoutStart(checkout: CheckoutEvent) {
    if (!this.isReady()) return
    
    posthog.capture('checkout_started', {
      ...checkout,
      timestamp: new Date().toISOString()
    })
  }

  static trackPurchase(checkout: CheckoutEvent, orderId?: string) {
    if (!this.isReady()) return
    
    posthog.capture('purchase_completed', {
      ...checkout,
      order_id: orderId,
      timestamp: new Date().toISOString()
    })
  }

  // Search and navigation
  static trackSearch(search: SearchEvent) {
    if (!this.isReady()) return
    
    posthog.capture('search_performed', {
      ...search,
      timestamp: new Date().toISOString()
    })
  }

  static trackCategoryView(category: string, productCount?: number) {
    if (!this.isReady()) return
    
    posthog.capture('category_viewed', {
      category,
      product_count: productCount,
      timestamp: new Date().toISOString()
    })
  }

  // User interactions
  static trackButtonClick(buttonName: string, location?: string, properties?: Record<string, unknown>) {
    if (!this.isReady()) return
    
    posthog.capture('button_clicked', {
      button_name: buttonName,
      location,
      timestamp: new Date().toISOString(),
      ...properties
    })
  }

  static trackLinkClick(linkText: string, linkUrl: string, location?: string) {
    if (!this.isReady()) return
    
    posthog.capture('link_clicked', {
      link_text: linkText,
      link_url: linkUrl,
      location,
      timestamp: new Date().toISOString()
    })
  }

  // User identification
  static identifyUser(userId: string, properties?: Record<string, unknown>) {
    if (!this.isReady()) return
    
    posthog.identify(userId, {
      user_type: 'customer',
      first_seen: new Date().toISOString(),
      ...properties
    })
  }

  static setUserProperties(properties: Record<string, unknown>) {
    if (!this.isReady()) return
    
    posthog.people.set(properties)
  }

  // Performance tracking
  static trackPageLoad(loadTime: number, pageName: string) {
    if (!this.isReady()) return
    
    posthog.capture('page_load_time', {
      page_name: pageName,
      load_time_ms: loadTime,
      timestamp: new Date().toISOString()
    })
  }

  static trackError(error: Error, context?: string) {
    if (!this.isReady()) return
    
    posthog.capture('error_occurred', {
      error_message: error.message,
      error_stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    })
  }

  // Feature flags (if you use them later)
  static isFeatureEnabled(flag: string): boolean {
    if (!this.isReady()) return false
    return posthog.isFeatureEnabled(flag) ?? false
  }
}