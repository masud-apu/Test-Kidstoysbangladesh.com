import posthog from "posthog-js";

// E-commerce event types
export interface ProductViewEvent {
  product_id: string;
  product_name: string;
  price: number;
  compare_price?: number;
  tags?: string[];
  category?: string;
}

export interface AddToCartEvent extends ProductViewEvent {
  quantity: number;
  variant_id?: string;
  variant_title?: string;
  variant_price?: number;
}

export interface RemoveFromCartEvent {
  product_id: string;
  product_name: string;
  quantity: number;
  variant_id?: string;
  variant_title?: string;
}

export type CartViewItem = {
  id: number;
  name: string;
  quantity: number;
  price: string;
};

export interface CheckoutEvent {
  items: Array<{
    product_id: string;
    product_name: string;
    price: number;
    quantity: number;
  }>;
  total_amount: number;
  currency: string;
  item_count: number;
}

export interface SearchEvent {
  query: string;
  results_count?: number;
  category?: string;
}

// Analytics utility class
export class Analytics {
  static isReady(): boolean {
    return typeof window !== "undefined" && posthog && posthog.__loaded;
  }

  // Page tracking
  static trackPageView(pageName: string, properties?: Record<string, unknown>) {
    if (!this.isReady()) return;

    posthog.capture("$pageview", {
      page_name: pageName,
      page_url: window.location.href,
      page_path: window.location.pathname,
      timestamp: new Date().toISOString(),
      ...properties,
    });
  }

  // Product events
  static trackProductView(product: ProductViewEvent) {
    if (!this.isReady()) return;

    posthog.capture("product_viewed", {
      ...product,
      currency: "BDT",
      timestamp: new Date().toISOString(),
    });
  }

  static trackAddToCart(product: AddToCartEvent) {
    if (!this.isReady()) return;

    posthog.capture("add_to_cart", {
      ...product,
      currency: "BDT",
      value: product.price * product.quantity,
      timestamp: new Date().toISOString(),
    });
  }

  static trackRemoveFromCart(product: RemoveFromCartEvent) {
    if (!this.isReady()) return;

    posthog.capture("remove_from_cart", {
      ...product,
      timestamp: new Date().toISOString(),
    });
  }

  static trackCartView(items: CartViewItem[], totalAmount: number) {
    if (!this.isReady()) return;

    posthog.capture("cart_viewed", {
      item_count: items.length,
      total_amount: totalAmount,
      currency: "BDT",
      cart_items: items.map((item) => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      timestamp: new Date().toISOString(),
    });
  }

  // Checkout events
  static trackCheckoutStart(checkout: CheckoutEvent) {
    if (!this.isReady()) return;

    posthog.capture("checkout_started", {
      ...checkout,
      timestamp: new Date().toISOString(),
    });
  }

  static trackPurchase(checkout: CheckoutEvent, orderId?: string) {
    if (!this.isReady()) return;

    posthog.capture("purchase_completed", {
      ...checkout,
      order_id: orderId,
      timestamp: new Date().toISOString(),
    });
  }

  // Search and navigation
  static trackSearch(search: SearchEvent) {
    if (!this.isReady()) return;

    posthog.capture("search_performed", {
      ...search,
      timestamp: new Date().toISOString(),
    });
  }

  static trackCategoryView(category: string, productCount?: number) {
    if (!this.isReady()) return;

    posthog.capture("category_viewed", {
      category,
      product_count: productCount,
      timestamp: new Date().toISOString(),
    });
  }

  // User interactions
  static trackButtonClick(
    buttonName: string,
    location?: string,
    properties?: Record<string, unknown>,
  ) {
    if (!this.isReady()) return;

    posthog.capture("button_clicked", {
      button_name: buttonName,
      location,
      timestamp: new Date().toISOString(),
      ...properties,
    });
  }

  static trackLinkClick(linkText: string, linkUrl: string, location?: string) {
    if (!this.isReady()) return;

    posthog.capture("link_clicked", {
      link_text: linkText,
      link_url: linkUrl,
      location,
      timestamp: new Date().toISOString(),
    });
  }

  // User identification with persistence
  static identifyUser(userId: string, properties?: Record<string, unknown>) {
    if (!this.isReady()) return;

    posthog.identify(userId, {
      user_type: "customer",
      first_seen: new Date().toISOString(),
      ...properties,
    });

    // Store user ID in localStorage for persistent identification
    try {
      localStorage.setItem("posthog_identified_user", userId);
      localStorage.setItem("posthog_user_properties", JSON.stringify(properties || {}));
    } catch (e) {
      console.error("Failed to store user identification:", e);
    }
  }

  static setUserProperties(properties: Record<string, unknown>) {
    if (!this.isReady()) return;

    posthog.people.set(properties);

    // Update stored properties
    try {
      const stored = localStorage.getItem("posthog_user_properties");
      const current = stored ? JSON.parse(stored) : {};
      localStorage.setItem("posthog_user_properties", JSON.stringify({ ...current, ...properties }));
    } catch (e) {
      console.error("Failed to update user properties:", e);
    }
  }

  // Re-identify user from localStorage on page load
  static reidentifyStoredUser() {
    if (!this.isReady()) return false;

    try {
      const userId = localStorage.getItem("posthog_identified_user");
      const properties = localStorage.getItem("posthog_user_properties");

      if (userId) {
        posthog.identify(userId, properties ? JSON.parse(properties) : {});
        return true;
      }
    } catch (e) {
      console.error("Failed to re-identify stored user:", e);
    }

    return false;
  }

  // Get or create persistent anonymous ID
  static getOrCreateAnonymousId(): string {
    try {
      let anonymousId = localStorage.getItem("posthog_anonymous_id");

      if (!anonymousId) {
        anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem("posthog_anonymous_id", anonymousId);
        localStorage.setItem("posthog_anonymous_created_at", new Date().toISOString());
      }

      return anonymousId;
    } catch (e) {
      console.error("Failed to get/create anonymous ID:", e);
      return `anon_${Date.now()}`;
    }
  }

  // Performance tracking
  static trackPageLoad(loadTime: number, pageName: string) {
    if (!this.isReady()) return;

    posthog.capture("page_load_time", {
      page_name: pageName,
      load_time_ms: loadTime,
      timestamp: new Date().toISOString(),
    });
  }

  static trackError(error: Error, context?: string) {
    if (!this.isReady()) return;

    posthog.capture("error_occurred", {
      error_message: error.message,
      error_stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  // Session tracking
  static initSession() {
    if (!this.isReady()) return;

    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const sessionStart = new Date().toISOString();

      localStorage.setItem("posthog_session_id", sessionId);
      localStorage.setItem("posthog_session_start", sessionStart);
      localStorage.setItem("posthog_session_page_count", "1");

      posthog.capture("session_started", {
        session_id: sessionId,
        session_start: sessionStart,
        referrer: document.referrer || "direct",
        landing_page: window.location.pathname,
        utm_source: new URLSearchParams(window.location.search).get("utm_source"),
        utm_medium: new URLSearchParams(window.location.search).get("utm_medium"),
        utm_campaign: new URLSearchParams(window.location.search).get("utm_campaign"),
      });
    } catch (e) {
      console.error("Failed to init session:", e);
    }
  }

  static getSessionInfo() {
    try {
      const sessionId = localStorage.getItem("posthog_session_id");
      const sessionStart = localStorage.getItem("posthog_session_start");
      const pageCount = parseInt(localStorage.getItem("posthog_session_page_count") || "0");

      return { sessionId, sessionStart, pageCount };
    } catch (e) {
      return { sessionId: null, sessionStart: null, pageCount: 0 };
    }
  }

  static incrementSessionPageCount() {
    try {
      const count = parseInt(localStorage.getItem("posthog_session_page_count") || "0");
      localStorage.setItem("posthog_session_page_count", String(count + 1));
    } catch (e) {
      console.error("Failed to increment session page count:", e);
    }
  }

  static trackSessionEnd() {
    if (!this.isReady()) return;

    try {
      const sessionId = localStorage.getItem("posthog_session_id");
      const sessionStart = localStorage.getItem("posthog_session_start");
      const pageCount = localStorage.getItem("posthog_session_page_count");

      if (sessionId && sessionStart) {
        const duration = Date.now() - new Date(sessionStart).getTime();

        posthog.capture("session_ended", {
          session_id: sessionId,
          session_duration_ms: duration,
          session_duration_minutes: Math.round(duration / 60000),
          pages_viewed: parseInt(pageCount || "0"),
          exit_page: window.location.pathname,
        });
      }
    } catch (e) {
      console.error("Failed to track session end:", e);
    }
  }

  // Device and browser information
  static getDeviceInfo() {
    if (typeof window === "undefined") return {};

    return {
      screen_width: window.screen.width,
      screen_height: window.screen.height,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      device_pixel_ratio: window.devicePixelRatio,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      user_agent: navigator.userAgent,
    };
  }

  // Track user engagement metrics
  static trackEngagement(action: string, properties?: Record<string, unknown>) {
    if (!this.isReady()) return;

    const sessionInfo = this.getSessionInfo();

    posthog.capture("user_engagement", {
      action,
      session_id: sessionInfo.sessionId,
      ...properties,
      timestamp: new Date().toISOString(),
    });
  }

  // Feature flags (if you use them later)
  static isFeatureEnabled(flag: string): boolean {
    if (!this.isReady()) return false;
    return posthog.isFeatureEnabled(flag) ?? false;
  }
}
