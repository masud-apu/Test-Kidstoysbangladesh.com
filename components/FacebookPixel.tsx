"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const PIXEL_ID = "1214423220455445";

export function FacebookPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    import("react-facebook-pixel")
      .then((module) => module.default)
      .then((ReactPixel) => {
        const options = {
          autoConfig: true,
          debug: false,
        };
        
        ReactPixel.init(PIXEL_ID, undefined, options);
        ReactPixel.pageView();
      });
  }, [pathname, searchParams]);

  return null;
}

export function trackEvent(event: string, data?: Record<string, unknown>) {
  if (typeof window !== "undefined") {
    import("react-facebook-pixel")
      .then((module) => module.default)
      .then((ReactPixel) => {
        ReactPixel.track(event, data);
      });
  }
}

export function trackCustomEvent(event: string, data?: Record<string, unknown>) {
  if (typeof window !== "undefined") {
    import("react-facebook-pixel")
      .then((module) => module.default)
      .then((ReactPixel) => {
        ReactPixel.trackCustom(event, data);
      });
  }
}