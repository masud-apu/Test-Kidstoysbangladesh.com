import { trackEvent, trackCustomEvent } from '@/components/FacebookPixel';

export const fbPixelEvents = {
  viewContent: (data?: {
    content_name?: string;
    content_category?: string;
    content_ids?: string[];
    content_type?: string;
    value?: number;
    currency?: string;
  }) => {
    trackEvent('ViewContent', data);
  },

  addToCart: (data?: {
    content_name?: string;
    content_category?: string;
    content_ids?: string[];
    content_type?: string;
    value?: number;
    currency?: string;
  }) => {
    trackEvent('AddToCart', data);
  },

  initiateCheckout: (data?: {
    content_category?: string;
    content_ids?: string[];
    contents?: Array<Record<string, unknown>>;
    currency?: string;
    num_items?: number;
    value?: number;
  }) => {
    trackEvent('InitiateCheckout', data);
  },

  purchase: (data?: {
    content_ids?: string[];
    content_name?: string;
    content_type?: string;
    contents?: Array<Record<string, unknown>>;
    currency?: string;
    num_items?: number;
    value?: number;
  }) => {
    trackEvent('Purchase', data);
  },

  search: (data?: {
    content_category?: string;
    content_ids?: string[];
    contents?: Array<Record<string, unknown>>;
    currency?: string;
    search_string?: string;
    value?: number;
  }) => {
    trackEvent('Search', data);
  },

  addToWishlist: (data?: {
    content_name?: string;
    content_category?: string;
    content_ids?: string[];
    contents?: Array<Record<string, unknown>>;
    currency?: string;
    value?: number;
  }) => {
    trackEvent('AddToWishlist', data);
  },

  completeRegistration: (data?: {
    content_name?: string;
    currency?: string;
    status?: string;
    value?: number;
  }) => {
    trackEvent('CompleteRegistration', data);
  },

  contact: (data?: Record<string, unknown>) => {
    trackEvent('Contact', data);
  },

  customEvent: (eventName: string, data?: Record<string, unknown>) => {
    trackCustomEvent(eventName, data);
  },
};