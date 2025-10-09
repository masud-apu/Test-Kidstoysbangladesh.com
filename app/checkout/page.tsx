"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCartStore, type DeliveryType } from "@/lib/store";
import { useOverlayStore } from "@/lib/ui-store";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { checkoutSchema, type CheckoutType } from "@/lib/validations";
import { Minus, Plus, Trash2, ShoppingBag, Tag, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Analytics } from "@/lib/analytics";
import { fbPixelEvents } from "@/lib/facebook-pixel-events";
import { Product, ProductVariant, MediaItem } from "@/lib/schema";
import { CartItem } from "@/lib/store";
import { isFreeDeliveryActive, FREE_DELIVERY_MESSAGE, FREE_DELIVERY_SUBTITLE } from "@/lib/free-delivery";

// Helper function to get URL from media item
function getMediaUrl(item: string | MediaItem): string {
  return typeof item === 'string' ? item : item.url
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const overlayCheckoutOpen = useOverlayStore((s) => s.checkoutOpen);
  const overlayCheckoutMode = useOverlayStore((s) => s.checkoutMode);
  const closeCheckout = useOverlayStore((s) => s.closeCheckout);
  const showSuccessDialog = useOverlayStore((s) => s.showSuccessDialog);
  // Determine checkout type based on different modes
  const hasUrlProducts = searchParams.get("productIds");
  const checkoutType = overlayCheckoutOpen
    ? overlayCheckoutMode
    : hasUrlProducts
      ? "url"
      : searchParams.get("type") || "cart";

  const {
    directBuyItem,
    getSelectedItems,
    getSelectedTotal,
    updateQuantity,
    updateDirectBuyQuantity,
    removeFromCart,
    clearCart,
    clearDirectBuy,
    deliveryType,
    setDeliveryType,
    getShippingCost,
    getItemKey,
  } = useCartStore();

  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [urlProducts, setUrlProducts] = useState<CartItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(
    // Set initial loading state if we have URL products to load
    !overlayCheckoutOpen && !!hasUrlProducts,
  );

  // Promo code state
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState<{
    id: number;
    code: string;
    name: string;
    discountAmount: number;
    discountType: "percentage" | "fixed";
    discountValue: string;
    maxDiscountAmount?: string;
    isStoreWide: boolean;
  } | null>(null);
  const [promoCodeLoading, setPromoCodeLoading] = useState(false);
  const [promoCodeError, setPromoCodeError] = useState("");

  // Load products from URL if productIds parameter exists
  useEffect(() => {
    const productIdsParam = searchParams.get("productIds");

    if (mounted && productIdsParam && !overlayCheckoutOpen) {
      setLoadingProducts(true);

      // Parse and count duplicate IDs
      const allIds = productIdsParam
        .split(",")
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id));
      const quantityMap = new Map<number, number>();

      // Count occurrences of each ID
      allIds.forEach((id) => {
        quantityMap.set(id, (quantityMap.get(id) || 0) + 1);
      });

      // Get unique IDs for API call
      const uniqueIds = Array.from(quantityMap.keys());

      if (uniqueIds.length === 0) {
        setLoadingProducts(false);
        return;
      }

      fetch(`/api/products/bulk?ids=${uniqueIds.join(",")}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.products) {
            const cartItems = data.products.map(
              (product: Product & { variants?: ProductVariant[] }): CartItem => {
                // Find the minimum price variant (default to first variant)
                const variants = product.variants || [];
                const minPriceVariant = variants.reduce((min, v) => {
                  const price = parseFloat(v.price);
                  const minPrice = parseFloat(min.price);
                  return price < minPrice ? v : min;
                }, variants[0]);

                return {
                  ...product,
                  quantity: quantityMap.get(product.id) || 1,
                  ...(minPriceVariant && {
                    variantId: minPriceVariant.id,
                    variantTitle: minPriceVariant.title,
                    variantSku: minPriceVariant.sku,
                    variantPrice: minPriceVariant.price,
                    variantCompareAtPrice: minPriceVariant.compareAtPrice,
                  }),
                };
              },
            );
            setUrlProducts(cartItems);
          }
        })
        .catch((error) => {
          console.error("Error loading products:", error);
          toast.error("Failed to load products");
        })
        .finally(() => {
          setLoadingProducts(false);
        });
    }
  }, [mounted, searchParams, overlayCheckoutOpen]);

  // Determine which items to show based on checkout type
  const checkoutItems = useMemo(() => {
    if (checkoutType === "direct" && directBuyItem) {
      return [directBuyItem];
    }
    if (checkoutType === "url") {
      return urlProducts;
    }
    if (checkoutType === "cart") {
      return getSelectedItems();
    }
    return [];
  }, [checkoutType, directBuyItem, getSelectedItems, urlProducts]);

  const itemsTotal =
    checkoutType === "direct" && directBuyItem
      ? parseFloat(directBuyItem.variantPrice || "0") * directBuyItem.quantity
      : checkoutType === "url"
        ? urlProducts.reduce(
            (total, item) =>
              total + parseFloat(item.variantPrice || "0") * item.quantity,
            0,
          )
        : getSelectedTotal();
  const shippingCost = checkoutItems.length > 0 ? getShippingCost() : 0;
  const discountAmount = appliedPromoCode?.discountAmount || 0;
  const totalPrice = Math.max(0, itemsTotal + shippingCost - discountAmount);

  // Promo code functions
  const applyPromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoCodeError("Please enter a promo code");
      return;
    }

    setPromoCodeLoading(true);
    setPromoCodeError("");

    try {
      const response = await fetch("/api/promo-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promoCode.trim(),
          items: checkoutItems.map((item) => ({
            id: item.id,
            price: item.variantPrice || "0",
            quantity: item.quantity,
          })),
          itemsTotal,
        }),
      });

      const result = await response.json();

      if (result.valid) {
        setAppliedPromoCode({
          id: result.promoCode.id,
          code: result.promoCode.code,
          name: result.promoCode.name,
          discountAmount: result.discountAmount,
          discountType: result.promoCode.discountType,
          discountValue: result.promoCode.discountValue,
          maxDiscountAmount: result.promoCode.maxDiscountAmount,
          isStoreWide: result.isStoreWide,
        });
        setPromoCode("");
        toast.success(
          `Promo code "${result.promoCode.code}" applied successfully! You saved ৳${result.discountAmount}`,
        );
      } else {
        setPromoCodeError(result.error);
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Error applying promo code:", error);
      setPromoCodeError("Failed to validate promo code");
      toast.error("Failed to validate promo code");
    } finally {
      setPromoCodeLoading(false);
    }
  };

  const removePromoCode = () => {
    setAppliedPromoCode(null);
    setPromoCode("");
    setPromoCodeError("");
    toast.success("Promo code removed");
  };

  // Helper functions for URL products quantity management
  const updateUrlProductQuantity = (productId: number, newQuantity: number) => {
    setUrlProducts((prev) =>
      prev.map((item) =>
        item.id === productId
          ? { ...item, quantity: Math.max(1, newQuantity) }
          : item,
      ),
    );
  };

  const removeUrlProduct = (productId: number) => {
    setUrlProducts((prev) => prev.filter((item) => item.id !== productId));
  };

  // Initialize form hook first
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CheckoutType>({
    resolver: zodResolver(checkoutSchema),
  });

  // Watch required fields to show optional fields when validators pass
  const name = watch("name");
  const phone = watch("phone");
  const address = watch("address");
  const email = watch("email");
  const specialNote = watch("specialNote");

  useEffect(() => {
    setMounted(true);

    // Load saved personal information from localStorage
    try {
      const savedData = localStorage.getItem("checkout_personal_info");
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.name) setValue("name", parsed.name);
        if (parsed.phone) setValue("phone", parsed.phone);
        if (parsed.address) setValue("address", parsed.address);
        if (parsed.email) setValue("email", parsed.email);
        if (parsed.specialNote) setValue("specialNote", parsed.specialNote);
      }
    } catch (error) {
      console.error("Error loading saved checkout data:", error);
    }

    // Track checkout started
    if (checkoutItems.length > 0) {
      // Track Facebook Pixel InitiateCheckout event
      fbPixelEvents.initiateCheckout({
        content_ids: checkoutItems.map((item) => item.id.toString()),
        contents: checkoutItems.map((item) => ({
          id: item.id.toString(),
          quantity: item.quantity,
          price: parseFloat(item.variantPrice || "0"),
        })),
        currency: "BDT",
        num_items: checkoutItems.reduce((sum, item) => sum + item.quantity, 0),
        value: totalPrice,
        content_category:
          checkoutItems.length > 0 &&
          Array.isArray(checkoutItems[0].tags) &&
          checkoutItems[0].tags.length > 0
            ? checkoutItems[0].tags[0]
            : undefined,
      });

      // Track PostHog Analytics
      Analytics.trackCheckoutStart({
        items: checkoutItems.map((item) => ({
          product_id: item.id.toString(),
          product_name: item.title,
          price: parseFloat(item.variantPrice || "0"),
          quantity: item.quantity,
        })),
        total_amount: totalPrice,
        currency: "BDT",
        item_count: checkoutItems.reduce((sum, item) => sum + item.quantity, 0),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutItems, totalPrice]);

  // Save personal information to localStorage whenever form fields change
  useEffect(() => {
    if (mounted) {
      try {
        const dataToSave = {
          name: name || "",
          phone: phone || "",
          address: address || "",
          email: email || "",
          specialNote: specialNote || "",
        };
        localStorage.setItem("checkout_personal_info", JSON.stringify(dataToSave));
      } catch (error) {
        console.error("Error saving checkout data:", error);
      }
    }
  }, [mounted, name, phone, address, email, specialNote]);

  // Only show optional fields when all required fields are valid (no errors)
  const showOptionalFields = Boolean(
    name &&
    name.length >= 2 &&
    phone &&
    phone.length === 11 &&
    /^[0-9]{11}$/.test(phone) &&
    address &&
    address.length >= 10 &&
    !errors.name &&
    !errors.phone &&
    !errors.address
  );

  const onSubmit = async (data: CheckoutType) => {
    setIsLoading(true);

    try {
      const newOrderId = `KTB${Date.now()}`;

      const orderData = {
        customerName: data.name,
        customerEmail: data.email ?? null,
        customerPhone: data.phone,
        customerAddress: data.address,
        specialNote: data.specialNote ?? undefined,
        // city and postalCode removed
        items: checkoutItems,
        totalAmount: totalPrice,
        shippingCost,
        deliveryType,
        orderId: newOrderId,
        // Promo code data
        promoCodeId: appliedPromoCode?.id || null,
        promoCode: appliedPromoCode?.code || null,
        promoCodeDiscount: appliedPromoCode?.discountAmount || null,
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (result.success) {
        // Close the checkout overlay immediately
        if (overlayCheckoutOpen) {
          closeCheckout();
        }

        // Track Facebook Pixel Purchase event
        fbPixelEvents.purchase({
          content_ids: checkoutItems.map((item) => item.id.toString()),
          content_name: checkoutItems.map((item) => item.title).join(", "),
          content_type: "product",
          contents: checkoutItems.map((item) => ({
            id: item.id.toString(),
            quantity: item.quantity,
            price: parseFloat(item.variantPrice || "0"),
          })),
          currency: "BDT",
          num_items: checkoutItems.reduce(
            (sum, item) => sum + item.quantity,
            0,
          ),
          value: totalPrice,
        });

        // Track PostHog Analytics
        Analytics.trackPurchase(
          {
            items: checkoutItems.map((item) => ({
              product_id: item.id.toString(),
              product_name: item.title,
              price: parseFloat(item.variantPrice || "0"),
              quantity: item.quantity,
            })),
            total_amount: totalPrice,
            currency: "BDT",
            item_count: checkoutItems.reduce(
              (sum, item) => sum + item.quantity,
              0,
            ),
          },
          newOrderId,
        );

        // Track user identification
        Analytics.identifyUser(`customer_${data.phone}`, {
          name: data.name,
          phone: data.phone,
          email: data.email || undefined,
          address: data.address,
          total_orders: 1,
          last_order_id: newOrderId,
          delivery_type: deliveryType,
        });

        // Clear cart, direct buy item, or URL products
        if (checkoutType === "direct") {
          clearDirectBuy();
        } else if (checkoutType === "url") {
          setUrlProducts([]);
        } else {
          clearCart();
        }

        // Show simple success toast
        toast.success("Order placed successfully!", {
          description: `Order #${newOrderId} confirmed`,
          duration: 3000,
        });

        // Show success dialog after a brief delay to ensure overlay is closed
        setTimeout(() => {
          showSuccessDialog(newOrderId);
        }, 300);
      } else {
        toast.error("Order failed", {
          description:
            result.message ||
            "There was a problem processing your order. Please try again.",
        });
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Order failed", {
        description:
          "There was a problem processing your order. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted || (checkoutType === "url" && loadingProducts)) {
    return (
      <div className="container mx-auto max-w-6xl py-16 text-center">
        Loading...
      </div>
    );
  }

  if (checkoutItems.length === 0) {
    return (
      <div className="container py-16 text-center">
        <ShoppingBag className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold mb-2">No items to checkout</h2>
        <p className="text-muted-foreground mb-4">
          {checkoutType === "direct"
            ? "No product selected for direct purchase"
            : checkoutType === "url"
              ? "No valid products found"
              : "No items selected from cart"}
        </p>
        <Button asChild>
          <Link href="/">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto max-w-6xl py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Checkout</h1>
          <div className="text-sm text-muted-foreground">
            {checkoutType === "direct"
              ? "Direct Purchase"
              : checkoutType === "url"
                ? "From URL"
                : "From Cart"}
          </div>
        </div>

        {/* Free Delivery Campaign Banner */}
        {isFreeDeliveryActive() && (
          <div className="relative bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600 rounded-xl p-6 mb-8 overflow-hidden shadow-lg">
            {/* Animated background decoration */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-1/4 w-48 h-48 bg-white rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="relative z-10">
              <div className="flex flex-col items-center justify-center gap-3 text-white">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6 animate-bounce" />
                  <p className="text-xl md:text-2xl font-bold text-center tracking-wide">
                    {FREE_DELIVERY_MESSAGE}
                  </p>
                  <Sparkles className="h-6 w-6 animate-bounce" />
                </div>
                <p className="text-sm md:text-base font-medium opacity-95 text-center">
                  {FREE_DELIVERY_SUBTITLE}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Order Summary */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Delivery Location</p>
                  <RadioGroup
                    value={deliveryType}
                    onValueChange={(val) =>
                      setDeliveryType(val as DeliveryType)
                    }
                    className="grid gap-2"
                  >
                    <label
                      htmlFor="checkout-outside"
                      className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:border-green-500 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="outside" id="checkout-outside" />
                        <span className="text-sm">Outside Dhaka</span>
                      </div>
                      {isFreeDeliveryActive() ? (
                        <div className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold text-sm">
                          <Sparkles className="h-3 w-3" />
                          FREE
                        </div>
                      ) : (
                        <span className="text-sm font-medium">TK 120</span>
                      )}
                    </label>
                    <label
                      htmlFor="checkout-inside"
                      className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:border-green-500 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="inside" id="checkout-inside" />
                        <span className="text-sm">Inside Dhaka</span>
                      </div>
                      {isFreeDeliveryActive() ? (
                        <div className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold text-sm">
                          <Sparkles className="h-3 w-3" />
                          FREE
                        </div>
                      ) : (
                        <span className="text-sm font-medium">TK 60</span>
                      )}
                    </label>
                  </RadioGroup>
                </div>

                {checkoutItems.map((item) => {
                  const itemKey = getItemKey(item);
                  const displayPrice = item.variantPrice || "0";

                  return (
                    <div key={itemKey} className="flex gap-4">
                      <div className="relative h-20 w-20 overflow-hidden rounded">
                        {item.images && item.images[0] ? (
                          <Image
                            src={getMediaUrl(item.images[0])}
                            alt={item.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-muted text-muted-foreground">
                            No image
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-2">
                        <h3 className="font-medium line-clamp-2">
                          {item.title}
                        </h3>

                        {/* Display variant information - only if NOT a default variant product */}
                        {!item.hasOnlyDefaultVariant &&
                          item.variantTitle &&
                          item.variantTitle !== "Default Title" && (
                            <div className="text-sm text-muted-foreground">
                              {item.selectedOptions &&
                              item.selectedOptions.length > 0 ? (
                                <span>
                                  {item.selectedOptions
                                    .map((opt) => opt.valueName)
                                    .join(" / ")}
                                </span>
                              ) : (
                                <span>{item.variantTitle}</span>
                              )}
                            </div>
                          )}

                        <p className="font-bold">TK {displayPrice}</p>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              checkoutType === "direct"
                                ? updateDirectBuyQuantity(item.quantity - 1)
                                : checkoutType === "url"
                                  ? updateUrlProductQuantity(
                                      item.id,
                                      item.quantity - 1,
                                    )
                                  : updateQuantity(itemKey, item.quantity - 1)
                            }
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              checkoutType === "direct"
                                ? updateDirectBuyQuantity(item.quantity + 1)
                                : checkoutType === "url"
                                  ? updateUrlProductQuantity(
                                      item.id,
                                      item.quantity + 1,
                                    )
                                  : updateQuantity(itemKey, item.quantity + 1)
                            }
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          {checkoutType !== "direct" && (
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 ml-auto"
                              onClick={() =>
                                checkoutType === "url"
                                  ? removeUrlProduct(item.id)
                                  : removeFromCart(itemKey)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-bold">
                          TK{" "}
                          {(parseFloat(displayPrice) * item.quantity).toFixed(
                            2,
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}

                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Items Total:</span>
                    <span>TK {itemsTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span>Shipping:</span>
                    {isFreeDeliveryActive() && shippingCost === 0 ? (
                      <div className="flex items-center gap-1 text-green-600 font-bold">
                        <Sparkles className="h-3 w-3" />
                        <span>FREE</span>
                      </div>
                    ) : (
                      <span>TK {shippingCost.toFixed(2)}</span>
                    )}
                  </div>
                  {appliedPromoCode && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Promo Discount ({appliedPromoCode.code}):</span>
                      <span>-TK {discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold">
                    <span>Grand Total:</span>
                    <span>TK {totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Promo Code Section */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Promo Code
                </CardTitle>
              </CardHeader>
              <CardContent>
                {appliedPromoCode ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div>
                        <p className="font-medium text-green-800">
                          {appliedPromoCode.code}
                        </p>
                        <p className="text-sm text-green-600">
                          {appliedPromoCode.name}
                        </p>
                        <p className="text-sm text-green-600">
                          You saved ৳
                          {appliedPromoCode.discountAmount.toFixed(2)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={removePromoCode}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter promo code"
                        value={promoCode}
                        onChange={(e) => {
                          setPromoCode(e.target.value.toUpperCase());
                          setPromoCodeError("");
                        }}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            applyPromoCode();
                          }
                        }}
                        className={promoCodeError ? "border-red-500" : ""}
                        disabled={promoCodeLoading}
                      />
                      <Button
                        onClick={applyPromoCode}
                        disabled={promoCodeLoading || !promoCode.trim()}
                        className="whitespace-nowrap"
                      >
                        {promoCodeLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Applying...
                          </>
                        ) : (
                          "Apply"
                        )}
                      </Button>
                    </div>
                    {promoCodeError && (
                      <p className="text-sm text-red-600">{promoCodeError}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Checkout Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" {...register("name")} />
                    {errors.name && (
                      <p className="text-sm text-destructive">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="01XXXXXXXXX (11 digits)"
                      maxLength={11}
                      {...register("phone")}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter your 11-digit mobile number
                    </p>
                    {errors.phone && (
                      <p className="text-sm text-destructive">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      rows={3}
                      placeholder="House/Flat, Road, Area, City (e.g., House 12, Road 5, Dhanmondi, Dhaka)"
                      className="resize-y min-h-[96px]"
                      onFocus={(e) => (e.target.placeholder = "")}
                      {...register("address")}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Provide full delivery address so the courier can find you.
                    </p>
                    {errors.address && (
                      <p className="text-sm text-destructive">
                        {errors.address.message}
                      </p>
                    )}
                  </div>

                  {/* Optional Fields Section - only shown when required fields are filled */}
                  <Collapsible open={showOptionalFields}>
                    <CollapsibleContent className="space-y-4">
                      <Separator className="my-6" />

                      <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground">
                          Optional Information
                        </h3>

                        <div>
                          <Label htmlFor="specialNote">Special Note</Label>
                          <Textarea
                            id="specialNote"
                            rows={2}
                            placeholder="Any delivery instruction (e.g., call before delivery, landmark, preferred time)"
                            className="resize-y min-h-[72px]"
                            onFocus={(e) => (e.target.placeholder = "")}
                            {...register("specialNote")}
                          />
                          {errors.specialNote && (
                            <p className="text-sm text-destructive">
                              {errors.specialNote.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="example@email.com"
                            onFocus={(e) => (e.target.placeholder = "")}
                            {...register("email")}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            You can get invoice on your email
                          </p>
                          {errors.email && (
                            <p className="text-sm text-destructive">
                              {errors.email.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Processing..." : "Place Order"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={<div className="container py-16 text-center">Loading...</div>}
    >
      <CheckoutContent />
    </Suspense>
  );
}

