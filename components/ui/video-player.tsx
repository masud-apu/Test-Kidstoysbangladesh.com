"use client"

import { forwardRef, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Maximize, Minimize, Pause, Play, Volume2, VolumeX } from "lucide-react"

interface VideoPlayerProps {
  src: string
  className?: string
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
  // new: control object-fit for different contexts
  objectFit?: 'cover' | 'contain'
}

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(function VideoPlayer(
  { src, className, onPlay, onPause, onEnded, objectFit = 'contain' }: VideoPlayerProps,
  forwardedRef
) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const internalVideoRef = useRef<HTMLVideoElement | null>(null)
  const isScrubbing = useRef(false)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const timeLabel = useMemo(() => {
    const fmt = (t: number) => {
      const m = Math.floor(t / 60).toString().padStart(1, "0")
      const s = Math.floor(t % 60).toString().padStart(2, "0")
      return `${m}:${s}`
    }
    return `${fmt(currentTime)} / ${fmt(duration || 0)}`
  }, [currentTime, duration])

  useEffect(() => {
    const v = internalVideoRef.current
    if (!v) return

    const onLoadedMetadata = () => setDuration(v.duration || 0)
    const onTimeUpdate = () => {
      if (!isScrubbing.current) {
        setCurrentTime(v.currentTime || 0)
      }
    }
    const onPlayEvt = () => {
      setIsPlaying(true)
      onPlay?.()
    }
    const onPauseEvt = () => {
      setIsPlaying(false)
      onPause?.()
    }
    const onEndedEvt = () => {
      setIsPlaying(false)
      onEnded?.()
    }

    v.addEventListener("loadedmetadata", onLoadedMetadata)
    v.addEventListener("timeupdate", onTimeUpdate)
    v.addEventListener("play", onPlayEvt)
    v.addEventListener("pause", onPauseEvt)
    v.addEventListener("ended", onEndedEvt)
    return () => {
      v.removeEventListener("loadedmetadata", onLoadedMetadata)
      v.removeEventListener("timeupdate", onTimeUpdate)
      v.removeEventListener("play", onPlayEvt)
      v.removeEventListener("pause", onPauseEvt)
      v.removeEventListener("ended", onEndedEvt)
    }
  }, [onPlay, onPause, onEnded])

  const togglePlay = () => {
    const v = internalVideoRef.current
    if (!v) return
    if (v.paused) v.play()
    else v.pause()
  }

  const toggleMute = () => {
    const v = internalVideoRef.current
    if (!v) return
    v.muted = !v.muted
    setIsMuted(v.muted)
  }

  const onScrub = (vals: number[]) => {
    const v = internalVideoRef.current
    if (!v) return
    isScrubbing.current = true
    const pct = vals[0] / 100
    setCurrentTime((duration || 0) * pct)
  }

  const onScrubCommit = (vals: number[]) => {
    const v = internalVideoRef.current
    if (!v) return
    const pct = vals[0] / 100
    v.currentTime = (duration || 0) * pct
    isScrubbing.current = false
  }

  const onVolumeChange = (vals: number[]) => {
    const v = internalVideoRef.current
    if (!v) return
    const vol = Math.min(1, Math.max(0, (vals[0] ?? 0) / 100))
    v.volume = vol
    v.muted = vol === 0
    setIsMuted(v.muted)
    setVolume(vol)
  }

  const toggleFullscreen = async () => {
    try {
      const el = containerRef.current
      if (!el) return
      if (!document.fullscreenElement) {
        await el.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch {}
  }

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0

  // Only stop propagation to carousel, DON'T preventDefault (let sliders work)
  const stopPropagation = (e: React.SyntheticEvent) => {
    e.stopPropagation()
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full h-full bg-black flex items-center justify-center", className)}
    >
      <video
        ref={(el) => {
          internalVideoRef.current = el
          if (typeof forwardedRef === 'function') forwardedRef(el)
          else if (forwardedRef && typeof forwardedRef === 'object' && 'current' in forwardedRef) {
            (forwardedRef as React.MutableRefObject<HTMLVideoElement | null>).current = el
          }
        }}
        src={src}
        className={cn("w-full h-full", objectFit === 'cover' ? 'object-cover' : 'object-contain')}
        preload="metadata"
        playsInline
        draggable={false}
        style={{ pointerEvents: 'none' }}
      />

      {/* Center Play/Pause overlay - only show when paused, don't block controls */}
      {!isPlaying && (
        <button
          type="button"
          aria-label="Play"
          onClick={togglePlay}
          onPointerDown={stopPropagation}
          className="absolute inset-0 grid place-items-center focus:outline-none pointer-events-auto"
          style={{ zIndex: 1 }}
        >
          <div className="rounded-full bg-black/50 p-4 text-white">
            <Play className="h-10 w-10" />
          </div>
        </button>
      )}

      {/* Controls bar */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3" style={{ zIndex: 10 }}>
        <div
          className="pointer-events-auto rounded-md bg-black/70 backdrop-blur-sm px-3 py-2 flex items-center gap-2 select-none"
          onPointerDown={stopPropagation}
          onPointerMove={stopPropagation}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className="text-white h-8 w-8" onClick={togglePlay}>
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Play/Pause</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex-1 flex items-center gap-3">
            <Slider
              value={[progressPct]}
              max={100}
              step={0.1}
              onValueChange={onScrub}
              onValueCommit={onScrubCommit}
              className="w-full cursor-pointer"
            />
            <span className="text-xs tabular-nums text-white/90 min-w-[84px] text-right">{timeLabel}</span>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className="text-white h-8 w-8" onClick={toggleMute}>
                  {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Mute</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="w-24">
            <Slider 
              value={[Math.round(volume * 100)]} 
              max={100} 
              step={1} 
              onValueChange={onVolumeChange}
              className="cursor-pointer"
            />
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className="text-white h-8 w-8" onClick={toggleFullscreen}>
                  {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Fullscreen</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  )
})


