"use client";

import { Sparkles, Truck, RotateCcw, Shield } from "lucide-react";
import { isFreeDeliveryActive, FREE_DELIVERY_MESSAGE, FREE_DELIVERY_SUBTITLE } from "@/lib/free-delivery";

export function DeliveryInfo() {
  return (
    <div className="bg-muted/30 rounded-lg p-4 space-y-4 mt-4">
      {isFreeDeliveryActive() && (
        <div className="relative bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600 rounded-lg p-4 -mt-2 mb-3 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-2xl"></div>
          </div>

          <div className="relative z-10 space-y-1">
            <div className="flex items-center gap-2 text-white">
              <Sparkles className="h-5 w-5 animate-pulse" />
              <span className="text-base font-bold">{FREE_DELIVERY_MESSAGE}</span>
            </div>
            <p className="text-xs text-white/90 ml-7">{FREE_DELIVERY_SUBTITLE}</p>
          </div>
        </div>
      )}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Truck className="h-4 w-4 text-blue-600" />
          <span>Delivery Options</span>
        </div>
        <div className="ml-6 space-y-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Free delivery within Dhaka (orders over TK 1000)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>24-48 hour delivery</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span>Cash on delivery available</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <RotateCcw className="h-4 w-4 text-green-600" />
          <span>Easy Returns</span>
        </div>
        <div className="ml-6 space-y-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>7-day return policy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
            <span>Items must be unused and in original packaging</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Shield className="h-4 w-4 text-red-600" />
          <span>Quality Guarantee</span>
        </div>
        <div className="ml-6 space-y-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
            <span>All products are quality checked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
            <span>Safe for children of all ages</span>
          </div>
        </div>
      </div>
    </div>
  );
}

