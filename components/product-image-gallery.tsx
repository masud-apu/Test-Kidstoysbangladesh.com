"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import Zoom from "react-medium-image-zoom";
import { Play } from "lucide-react";
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
import type { MediaItem } from "@/lib/schema";

// Client-only modern video player
const ModernVideoPlayer = dynamic(
  () => import("@/components/modern-video-player").then((mod) => ({ default: mod.ModernVideoPlayer })),
  { ssr: false }
);

interface ProductImageGalleryProps {
  images: (string | MediaItem)[];
  productTitle: string;
  variantImage?: string | null;
}

// Helper function to normalize media items
function normalizeMediaItem(item: string | MediaItem): MediaItem {
  if (typeof item === 'string') {
    // Check if it's a video URL
    const isVideo = item.includes('.mp4') || item.includes('.webm') || item.includes('.mov') ||
                   item.includes('video/upload') || item.includes('resource_type=video');
    return { url: item, type: isVideo ? 'video' : 'image' };
  }
  return item;
}

// Helper function to generate thumbnail from video URL for static images
function generateCloudinaryThumbnail(videoUrl: string): string {
  try {
    if (!videoUrl.includes('res.cloudinary.com') || !videoUrl.includes('/video/upload/')) {
      return videoUrl;
    }

    // Simple approach: replace /video/upload/ with /video/upload/so_0,w_200,h_200,c_fill/
    const thumbUrl = videoUrl.replace('/video/upload/', '/video/upload/so_0,w_200,h_200,c_fill,f_jpg/');

    // Remove video extension and add .jpg
    const finalThumbUrl = thumbUrl.replace(/\.(mp4|mov|webm|avi)(\?.*)?$/i, '.jpg$2');

    console.log('Thumbnail URL generated:', finalThumbUrl);
    return finalThumbUrl;
  } catch (err) {
    console.error('Error generating thumbnail:', err);
    return videoUrl;
  }
}

export function ProductImageGallery({
  images,
  productTitle,
  variantImage,
}: ProductImageGalleryProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const plugin = useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true })
  );

  // Display media: show variant image first if available, then product media
  const displayMedia = useMemo(() =>
    variantImage
      ? [normalizeMediaItem(variantImage), ...images.map(normalizeMediaItem)]
      : images.map(normalizeMediaItem),
    [variantImage, images]
  );

  const thumbnailMedia = useMemo(() =>
    images.map(normalizeMediaItem),
    [images]
  ); // Always show only product media in thumbnails

  // Update current slide when carousel changes
  const handleSelect = () => {
    if (!api) return;
    const newIndex = api.selectedScrollSnap();
    setCurrent(newIndex);
    // Pause all videos not on the active slide
    videoRefs.current.forEach((videoEl, idx) => {
      if (!videoEl) return;
      if (idx !== newIndex && !videoEl.paused) {
        try { videoEl.pause(); } catch {}
      }
    });
    // Auto-play active slide video (muted) if present
    const activeVideo = videoRefs.current[newIndex];
    const isActiveVideo = displayMedia[newIndex]?.type === 'video';
    if (activeVideo && isActiveVideo) {
      try {
        activeVideo.muted = true;
        plugin.current.stop();
        const playPromise = activeVideo.play();
        if (playPromise && typeof playPromise.then === 'function') {
          playPromise.catch(() => {});
        }
      } catch {}
    } else {
      // Resume carousel autoplay when not on a video slide
      plugin.current.reset();
    }
  };

  // Set up carousel API
  const handleApiChange = (carouselApi: CarouselApi) => {
    setApi(carouselApi);
    if (carouselApi) {
      carouselApi.on("select", handleSelect);
      // Trigger for the initial slide
      setTimeout(() => handleSelect(), 0);
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
            {displayMedia.map((media, index) => {
              const isVideo = media.type === 'video';

              return (
                <CarouselItem key={index}>
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted relative group">
                    {isVideo ? (
                      <ModernVideoPlayer
                        src={media.url}
                        videoRef={(el) => { videoRefs.current[index] = el }}
                        onPlay={() => plugin.current.stop()}
                        onPause={() => plugin.current.reset()}
                        onEnded={() => plugin.current.reset()}
                      />
                    ) : (
                      <Zoom>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={media.url}
                          alt={`${productTitle} - Image ${index + 1}`}
                          className="w-full h-full object-cover cursor-zoom-in"
                        />
                      </Zoom>
                    )}
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>

          {/* Navigation Buttons */}
          {displayMedia.length > 1 && (
            <>
              <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2" />
              <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2" />
            </>
          )}
        </Carousel>

        {/* Slide Indicator Dots */}
        {displayMedia.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {displayMedia.map((_, index) => (
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

      {/* Thumbnail Gallery - Only show product media */}
      {thumbnailMedia.length > 1 && (
        <div className="grid grid-cols-6 gap-2">
          {thumbnailMedia.map((media, index) => {
            // Calculate the actual carousel index (offset by 1 if variant image is shown)
            const carouselIndex = variantImage ? index + 1 : index;
            const isVideo = media.type === 'video';

            // For videos, use thumbnail if available, otherwise generate from Cloudinary
            const thumbnailSrc = isVideo
              ? (media.thumbnail || generateCloudinaryThumbnail(media.url))
              : media.url;

            return (
              <button
                key={index}
                onClick={() => api?.scrollTo(carouselIndex)}
                className={cn(
                  "aspect-square rounded-lg overflow-hidden border-2 transition-all relative bg-muted",
                  current === carouselIndex
                    ? "border-primary ring-2 ring-primary ring-offset-2"
                    : "border-gray-200 hover:border-gray-400",
                )}
              >
                {/* Always use img for thumbnails - much lighter on mobile */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbnailSrc}
                  alt={`${productTitle} thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {isVideo && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/30">
                    <div className="bg-white/90 rounded-full p-1.5">
                      <Play className="h-3 w-3 text-black fill-black" />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
