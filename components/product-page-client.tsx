"use client";

import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/markdown";
import { useCartStore } from "@/lib/store";
import { useOverlayStore } from "@/lib/ui-store";
import {
  ShoppingCart,
  MessageCircle,
  Zap,
  Truck,
  RotateCcw,
  Shield,
  Package,
  Sparkles,
} from "lucide-react";
import {
  Product,
  ProductVariant,
  ProductOption,
  ProductOptionValue,
} from "@/lib/schema";
import { ProductStructuredData } from "./structured-data";
import { fbPixelEvents } from "@/lib/facebook-pixel-events";
import { Analytics } from "@/lib/analytics";
import { VariantSelector } from "./variant-selector";
import { SelectedOption } from "@/lib/store";
import { ProductImageGallery } from "./product-image-gallery";
import { isFreeDeliveryActive, FREE_DELIVERY_MESSAGE, FREE_DELIVERY_SUBTITLE } from "@/lib/free-delivery";

interface VariantWithOptions extends ProductVariant {
  selectedOptions: Array<{
    optionName: string;
    valueName: string;
  }>;
}

interface ProductPageClientProps {
  product: Product;
  variants?: VariantWithOptions[];
  options?: Array<ProductOption & { values: ProductOptionValue[] }>;
}

export function ProductPageClient({
  product,
  variants = [],
  options = [],
}: ProductPageClientProps) {
  const [isAdding, setIsAdding] = useState(false);

  // Variant state
  const [selectedVariant, setSelectedVariant] =
    useState<VariantWithOptions | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const [variantImage, setVariantImage] = useState<string | null>(null);

  const addToCart = useCartStore((state) => state.addToCart);
  const setDirectBuy = useCartStore((state) => state.setDirectBuy);
  const openCart = useOverlayStore((s) => s.openCart);
  const openCheckout = useOverlayStore((s) => s.openCheckout);

  const hasVariants = !product.hasOnlyDefaultVariant && variants.length > 0;

  // For products with only default variant, auto-select the first available variant
  useEffect(() => {
    if (!hasVariants && variants.length > 0 && !selectedVariant) {
      // Filter only by availableForSale (ignore stock - customers can order even if out of stock)
      const availableVariants = variants.filter(v => v.availableForSale);
      const variantToSelect = availableVariants.length > 0 ? availableVariants[0] : variants[0];
      setSelectedVariant(variantToSelect);
    }
  }, [hasVariants, variants, selectedVariant]);

  // Collect product images only (variant image handled separately)
  const images = useMemo(() => {
    const productImages =
      Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : [];
    return productImages.length > 0 ? productImages : ["/og-image.png"];
  }, [product.images]);

  // Track product view on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      fbPixelEvents.viewContent({
        content_name: product.title,
        content_ids: [product.id.toString()],
        content_type: "product",
        value:
          hasVariants && selectedVariant
            ? parseFloat(selectedVariant.price)
            : 0,
        currency: "BDT",
        content_category:
          Array.isArray(product.tags) && product.tags.length > 0
            ? product.tags[0]
            : undefined,
      });

      Analytics.trackProductView({
        product_id: product.id.toString(),
        product_name: product.title,
        price:
          hasVariants && selectedVariant
            ? parseFloat(selectedVariant.price)
            : 0,
        tags: Array.isArray(product.tags) ? product.tags : [],
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [product.id]);

  // Calculate price based on variant selection
  const priceInfo = useMemo(() => {
    // For products with only default variant, use the first variant's price
    if (!hasVariants && variants.length > 0) {
      const defaultVariant = variants[0];
      const price = parseFloat(defaultVariant.price);
      const comparePrice = defaultVariant.compareAtPrice
        ? parseFloat(defaultVariant.compareAtPrice)
        : null;
      const hasDiscount = comparePrice && comparePrice > price;
      const discountPercentage = hasDiscount
        ? Math.round(((comparePrice! - price) / comparePrice!) * 100)
        : 0;
      const saving = hasDiscount ? comparePrice! - price : null;

      return {
        displayPrice: `TK ${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        comparePrice: comparePrice
          ? `TK ${comparePrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : null,
        hasDiscount,
        discountPercentage,
        maxSaving: saving
          ? `TK ${saving.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : null,
      };
    }

    if (!hasVariants) {
      return {
        displayPrice: "TK 0.00",
        comparePrice: null,
        hasDiscount: false,
        discountPercentage: 0,
        maxSaving: null,
      };
    }

    if (selectedVariant) {
      // Single variant selected
      const price = parseFloat(selectedVariant.price);
      const comparePrice = selectedVariant.compareAtPrice
        ? parseFloat(selectedVariant.compareAtPrice)
        : null;
      const hasDiscount = comparePrice && comparePrice > price;
      const discountPercentage = hasDiscount
        ? Math.round(((comparePrice! - price) / comparePrice!) * 100)
        : 0;
      const saving = hasDiscount ? comparePrice! - price : null;

      return {
        displayPrice: `TK ${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        comparePrice: comparePrice
          ? `TK ${comparePrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : null,
        hasDiscount,
        discountPercentage,
        maxSaving: saving
          ? `TK ${saving.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : null,
      };
    } else {
      // No variant selected - show price range
      const prices = variants.map((v) => parseFloat(v.price));
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      // Calculate max saving across all variants
      const savings = variants
        .map((v) => {
          const price = parseFloat(v.price);
          const comparePrice = v.compareAtPrice
            ? parseFloat(v.compareAtPrice)
            : null;
          return comparePrice && comparePrice > price
            ? comparePrice - price
            : 0;
        })
        .filter((s) => s > 0);

      const maxSavingAmount = savings.length > 0 ? Math.max(...savings) : null;

      return {
        displayPrice:
          minPrice === maxPrice
            ? `TK ${minPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : `TK ${minPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} - TK ${maxPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        comparePrice: null,
        hasDiscount: false,
        discountPercentage: 0,
        maxSaving: maxSavingAmount
          ? `TK ${maxSavingAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : null,
      };
    }
  }, [hasVariants, selectedVariant, variants]);

  const prettify = (s: string) =>
    s
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const { mainTitle, subTitle } = useMemo(() => {
    const name = product.title || "";
    let main = name.trim();
    let sub = "";
    const tagsArr = Array.isArray(product.tags) ? product.tags : [];

    const parenMatch = name.match(/^(.*?)[\s]*\((.+)\)[\s]*$/);
    if (parenMatch) {
      main = parenMatch[1].trim();
      sub = parenMatch[2]
        .replace(/[|,]/g, " | ")
        .replace(/\s+\|\s+/g, " | ")
        .trim();
    } else if (name.includes(" - ")) {
      const [m, ...rest] = name.split(" - ");
      main = m.trim();
      sub = rest.join(" - ").replace(/[|,]/g, " | ").trim();
    } else if (name.includes(" | ")) {
      const [m, ...rest] = name.split(" | ");
      main = m.trim();
      sub = rest.join(" | ").trim();
    } else if (tagsArr.length) {
      const nice = Array.from(
        new Set(tagsArr.map((t) => prettify(t)).filter(Boolean)),
      ).slice(0, 3);
      sub = nice.join(" | ");
    }

    return { mainTitle: main, subTitle: sub };
  }, [product.title, product.tags]);

  const handleVariantChange = (
    variant: VariantWithOptions,
    selectedOpts: SelectedOption[],
    variantImg?: string,
  ) => {
    setSelectedVariant(variant);
    setSelectedOptions(selectedOpts);

    // Update variant image to show variant-specific image
    // Only set if it's a valid non-empty string
    if (variantImg && variantImg.trim()) {
      setVariantImage(variantImg);
    } else {
      setVariantImage(null);
    }
  };

  const handleAddToCart = () => {
    if (hasVariants && !selectedVariant) return;
    if (!selectedVariant) return; // Should always have variant (either selected or auto-selected default)

    setIsAdding(true);

    const price = parseFloat(selectedVariant.price);

    fbPixelEvents.addToCart({
      content_name: product.title,
      content_ids: [product.id.toString()],
      content_type: "product",
      value: price,
      currency: "BDT",
      content_category:
        Array.isArray(product.tags) && product.tags.length > 0
          ? product.tags[0]
          : undefined,
    });

    Analytics.trackAddToCart({
      product_id: product.id.toString(),
      product_name: product.title,
      price: price,
      compare_price: selectedVariant.compareAtPrice
        ? parseFloat(selectedVariant.compareAtPrice)
        : undefined,
      tags: Array.isArray(product.tags) ? product.tags : [],
      quantity: 1,
      variant_id: selectedVariant.id.toString(),
      variant_title: selectedVariant.title,
    });

    addToCart(product, selectedVariant, selectedOptions);
    setTimeout(() => setIsAdding(false), 800);
    openCart();
  };

  const handleBuyNow = () => {
    if (hasVariants && !selectedVariant) return;
    if (!selectedVariant) return; // Should always have variant (either selected or auto-selected default)

    const price = parseFloat(selectedVariant.price);

    fbPixelEvents.addToCart({
      content_name: product.title,
      content_ids: [product.id.toString()],
      content_type: "product",
      value: price,
      currency: "BDT",
      content_category:
        Array.isArray(product.tags) && product.tags.length > 0
          ? product.tags[0]
          : undefined,
    });

    Analytics.trackButtonClick("buy_now", "product_page", {
      product_id: product.id,
      product_name: product.title,
      price: price,
      variant_id: selectedVariant.id,
      variant_title: selectedVariant.title,
    });

    setDirectBuy(product, selectedVariant, selectedOptions);
    openCheckout("direct");
  };

  const handleWhatsApp = () => {
    const productUrl = `https://kidstoysbangladesh.com/product/${product.handle}`;
    const variantText = selectedVariant ? ` (${selectedVariant.title})` : "";
    const priceText = selectedVariant
      ? selectedVariant.price
      : priceInfo.displayPrice;
    const message = `Hi! I'm interested in this product: ${product.title}${variantText} - ${priceText}\n\nProduct link: ${productUrl}`;
    const whatsappUrl = `https://wa.me/8801337411948?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <>
      <ProductStructuredData product={product} variants={variants} />
      <div className="container mx-auto max-w-7xl py-8 pb-28 md:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Images */}
          <div className="px-4">
            <ProductImageGallery
              images={images}
              productTitle={product.title}
              variantImage={variantImage}
              key={variantImage || "default"}
            />
          </div>

          {/* Right Column - Product Details */}
          <div className="space-y-6 px-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold leading-tight">
                {mainTitle}
              </h1>
              {subTitle && (
                <p className="mt-1 text-base lg:text-lg text-muted-foreground">
                  {subTitle}
                </p>
              )}
            </div>

            {/* Variant Selector */}
            {hasVariants && (
              <VariantSelector
                options={options}
                variants={variants}
                onVariantChange={handleVariantChange}
                defaultVariantId={
                  // Pass first available variant's ID as default (ignore stock levels)
                  variants.filter(v => v.availableForSale)[0]?.id || variants[0]?.id
                }
              />
            )}

            {/* Price Block */}
            <div className="space-y-1">
              <div className="flex items-end gap-3 flex-wrap">
                {priceInfo.comparePrice && (
                  <span className="text-xl text-muted-foreground line-through">
                    {priceInfo.comparePrice}
                  </span>
                )}
                <span className="text-3xl lg:text-4xl font-extrabold text-green-600">
                  {priceInfo.displayPrice}
                </span>
                {priceInfo.hasDiscount && (
                  <span className="text-sm font-medium text-green-700">
                    (Save {priceInfo.discountPercentage}%)
                  </span>
                )}
                {priceInfo.maxSaving && !selectedVariant && (
                  <span className="text-sm font-medium text-green-700">
                    (Save up to {priceInfo.maxSaving})
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">VAT/Tax included</p>
            </div>

            {/* Action Buttons (desktop/tablet) */}
            <div className="hidden md:block space-y-3">
              <div className="flex gap-3">
                <Button
                  onClick={handleAddToCart}
                  variant="outline"
                  className="flex-1 h-12 text-base font-semibold"
                  size="lg"
                  disabled={hasVariants && !selectedVariant}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {"Add to Cart"}
                </Button>

                <Button
                  onClick={handleBuyNow}
                  className="flex-1 h-12 text-base font-semibold bg-black text-white hover:bg-black/90"
                  size="lg"
                  disabled={hasVariants && !selectedVariant}
                >
                  <Zap className="mr-2 h-5 w-5" />
                  Buy Now
                </Button>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleWhatsApp}
                  variant="default"
                  size="lg"
                  className="flex-1 h-12 text-base font-semibold bg-[#25D366] hover:bg-[#1ebe57] text-white"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Chat on WhatsApp • +880 1337-411948
                </Button>
              </div>

              {/* Delivery & Return Information */}
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
                      <Package className="h-3 w-3" />
                      <span>Inside Dhaka: Same day delivery, Max 1 day</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="h-3 w-3" />
                      <span>Outside Dhaka: 3–5 business days</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <RotateCcw className="h-4 w-4 text-green-600" />
                    <span>Return Policy</span>
                  </div>
                  <div className="ml-6 space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Shield className="h-3 w-3" />
                      <span>7-day return guarantee</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="mt-16 px-4">
          <div className="relative flex items-center justify-center mb-6">
            <div className="flex-grow border-t border-border"></div>
            <span className="px-4 text-3xl font-semibold text-foreground">
              Description
            </span>
            <div className="flex-grow border-t border-border"></div>
          </div>
          <div className="bg-muted/50 rounded-lg">
            <div className="prose prose-sm max-w-none">
              {product.description ? (
                <Markdown content={product.description} />
              ) : (
                <p className="text-muted-foreground">
                  No description for this product.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Mobile Action Bar */}
      <div className="fixed md:hidden bottom-0 inset-x-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
        <div className="container mx-auto max-w-6xl px-4 py-3">
          <div className="grid grid-cols-2 gap-3 items-stretch">
            <Button
              onClick={handleAddToCart}
              variant="outline"
              className="h-12 text-base font-semibold"
              size="lg"
              disabled={isAdding || (hasVariants && !selectedVariant)}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              {isAdding ? "Added" : "Add to Cart"}
            </Button>
            <Button
              onClick={handleBuyNow}
              variant="default"
              className="h-12 text-base font-semibold bg-black hover:bg-black/90 text-white"
              size="lg"
              disabled={hasVariants && !selectedVariant}
            >
              <Zap className="mr-2 h-5 w-5" />
              Buy Now
            </Button>
          </div>
          <div className="mt-3">
            <Button
              onClick={handleWhatsApp}
              variant="default"
              size="lg"
              className="w-full h-11 text-base font-semibold bg-[#25D366] hover:bg-[#1ebe57] text-white"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Chat on WhatsApp
            </Button>
          </div>
          <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
      </div>
    </>
  );
}
