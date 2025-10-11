"use client";

import { useState, useRef, useEffect } from "react";
import Zoom from "react-medium-image-zoom";
import { ZoomIn, Play } from "lucide-react";
// Removed custom VideoPlayer
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

// Helper function to ensure video URL is properly formatted for Cloudinary
function forceCloudinaryMp4(url: string): string {
  try {
    if (!url.includes('res.cloudinary.com') || !url.includes('/video/upload/')) return url;

    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/upload/');
    if (pathParts.length < 2) return url;

    const prefix = pathParts[0];
    let assetPath = pathParts[1];

    // Remove existing transformations (everything before the version or actual filename)
    // Cloudinary format: /upload/[transformations]/[v1234567890]/filename.ext
    const versionMatch = assetPath.match(/\/(v\d+\/.+)$/);
    if (versionMatch) {
      assetPath = versionMatch[1]; // Keep version and filename only
    }

    // Add proper video transformations for web playback
    const transformations = 'f_mp4,vc_h264,q_auto:good';
    assetPath = `${transformations}/${assetPath}`;

    // Ensure .mp4 extension
    assetPath = assetPath.replace(/\.(mov|webm|mkv|avi|mpg|mpeg|3gp|wmv)(\?.*)?$/i, '.mp4$2');
    if (!/\.mp4(\?|$)/i.test(assetPath)) {
      const qIndex = assetPath.indexOf('?');
      if (qIndex >= 0) {
        assetPath = `${assetPath.slice(0, qIndex)}.mp4${assetPath.slice(qIndex)}`;
      } else {
        assetPath = `${assetPath}.mp4`;
      }
    }

    return `${urlObj.origin}${prefix}/upload/${assetPath}`;
  } catch (err) {
    console.error('Error formatting video URL:', err);
    return url;
  }
}

// Helper function to generate thumbnail from video URL
function generateCloudinaryThumbnail(videoUrl: string): string {
  try {
    if (!videoUrl.includes('res.cloudinary.com') || !videoUrl.includes('/video/upload/')) {
      return videoUrl;
    }

    const urlObj = new URL(videoUrl);
    const pathParts = urlObj.pathname.split('/upload/');
    if (pathParts.length < 2) return videoUrl;

    const prefix = pathParts[0];
    let assetPath = pathParts[1];

    // Remove existing transformations (everything before the version or actual filename)
    const versionMatch = assetPath.match(/\/(v\d+\/.+)$/);
    if (versionMatch) {
      assetPath = versionMatch[1];
    }

    // Get frame at 1 second, convert to jpg thumbnail
    const thumbTransform = 'so_1.0,w_200,h_200,c_fill,f_jpg,q_auto';
    assetPath = `${thumbTransform}/${assetPath}`;

    // Replace extension with .jpg
    assetPath = assetPath.replace(/\.[^.]+$/, '.jpg');

    return `${urlObj.origin}${prefix}/upload/${assetPath}`;
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
  const displayMedia = variantImage 
    ? [normalizeMediaItem(variantImage), ...images.map(normalizeMediaItem)] 
    : images.map(normalizeMediaItem);
  const thumbnailMedia = images.map(normalizeMediaItem); // Always show only product media in thumbnails

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
              const videoSrc = isVideo ? forceCloudinaryMp4(media.url) : '';

              return (
                <CarouselItem key={index}>
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted relative group">
                    {isVideo ? (
                      <video
                        ref={(el) => { videoRefs.current[index] = el }}
                        controls
                        playsInline
                        muted
                        preload="metadata"
                        className="w-full h-full object-cover"
                        src={videoSrc}
                        onPlay={() => plugin.current.stop()}
                        onPause={() => plugin.current.reset()}
                        onEnded={() => plugin.current.reset()}
                      >
                        <source src={videoSrc} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
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
