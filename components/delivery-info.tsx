"use client";

import { Truck, RotateCcw, Shield } from "lucide-react";

export function DeliveryInfo() {
  return (
    <div className="bg-muted/30 rounded-lg p-4 space-y-4 mt-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Truck className="h-4 w-4 text-blue-600" />
          <span>Delivery Options</span>
        </div>
        <div className="ml-6 space-y-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Inside Dhaka: TK 60</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Outside Dhaka: TK 120</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
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

