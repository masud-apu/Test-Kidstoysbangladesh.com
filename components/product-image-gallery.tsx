"use client";

import { useState, useRef } from "react";
import Zoom from "react-medium-image-zoom";
import { ZoomIn } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { cn } from "@/lib/utils";

interface ProductImageGalleryProps {
  images: string[];
  productTitle: string;
  variantImage?: string | null;
}

export function ProductImageGallery({
  images,
  productTitle,
  variantImage,
}: ProductImageGalleryProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  const plugin = useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true })
  );

  // Display images: show variant image first if available, then product images
  const displayImages = variantImage ? [variantImage, ...images] : images;
  const thumbnailImages = images; // Always show only product images in thumbnails

  // Update current slide when carousel changes
  const handleSelect = () => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
  };

  // Set up carousel API
  const handleApiChange = (carouselApi: CarouselApi) => {
    setApi(carouselApi);
    if (carouselApi) {
      carouselApi.on("select", handleSelect);
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Carousel */}
      <div className="relative">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[plugin.current]}
          setApi={handleApiChange}
          className="w-full"
          onMouseEnter={plugin.current.stop}
          onMouseLeave={plugin.current.reset}
        >
          <CarouselContent>
            {displayImages.map((image, index) => (
              <CarouselItem key={index}>
                <div className="aspect-square rounded-lg overflow-hidden bg-muted relative group">
                  <Zoom>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image}
                      alt={`${productTitle} - Image ${index + 1}`}
                      className="w-full h-full object-cover cursor-zoom-in"
                    />
                  </Zoom>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Navigation Buttons */}
          {displayImages.length > 1 && (
            <>
              <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2" />
              <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2" />
            </>
          )}
        </Carousel>

        {/* Slide Indicator Dots */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {displayImages.map((_, index) => (
              <button
                key={index}
                onClick={() => api?.scrollTo(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  current === index
                    ? "bg-white w-6"
                    : "bg-white/50 hover:bg-white/75",
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail Gallery - Only show product images */}
      {thumbnailImages.length > 1 && (
        <div className="grid grid-cols-6 gap-2">
          {thumbnailImages.map((image, index) => {
            // Calculate the actual carousel index (offset by 1 if variant image is shown)
            const carouselIndex = variantImage ? index + 1 : index;

            return (
              <button
                key={index}
                onClick={() => api?.scrollTo(carouselIndex)}
                className={cn(
                  "aspect-square rounded-lg overflow-hidden border-2 transition-all",
                  current === carouselIndex
                    ? "border-primary ring-2 ring-primary ring-offset-2"
                    : "border-gray-200 hover:border-gray-400",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt={`${productTitle} thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
