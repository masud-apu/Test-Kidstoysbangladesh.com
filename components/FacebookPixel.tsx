"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

const PIXEL_ID = "754735414125478";

declare global {
  interface Window {
    fbq: (
      track: string,
      event?: string,
      data?: Record<string, unknown>
    ) => void;
    _fbq: unknown;
  }
}

export function FacebookPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isInitialized = useRef(false);
  const lastTrackedPath = useRef<string>("");

  useEffect(() => {
    // Create a unique path identifier including search params
    const currentPath = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    
    // Only track PageView if:
    // 1. The pixel is loaded (window.fbq exists)
    // 2. We haven't tracked this exact path yet
    // 3. The pixel has been initialized
    if (typeof window !== "undefined" && window.fbq && isInitialized.current) {
      if (lastTrackedPath.current !== currentPath) {
        window.fbq("track", "PageView");
        lastTrackedPath.current = currentPath;
      }
    }
  }, [pathname, searchParams]);

  return (
    <>
      <Script
        id="fb-pixel"
        strategy="afterInteractive"
        onLoad={() => {
          isInitialized.current = true;
          // Store the initial path as tracked
          const currentPath = window.location.pathname + window.location.search;
          lastTrackedPath.current = currentPath;
        }}
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${PIXEL_ID}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}

export function trackEvent(event: string, data?: Record<string, unknown>) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", event, data);
  }
}

export function trackCustomEvent(
  event: string,
  data?: Record<string, unknown>,
) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("trackCustom", event, data);
  }
}