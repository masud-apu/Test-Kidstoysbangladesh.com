import { MediaItem } from '@/lib/schema'

/**
 * Normalizes a media item to ensure consistent type structure.
 * Converts string URLs to MediaItem objects with proper type detection.
 */
export function normalizeMediaItem(item: string | MediaItem): MediaItem {
    if (typeof item === 'string') {
        const isVideo = item.includes('.mp4') || item.includes('.webm') || item.includes('.mov') ||
            item.includes('video/upload') || item.includes('resource_type=video');
        return { url: item, type: isVideo ? 'video' : 'image' };
    }
    return item;
}

/**
 * Forces Cloudinary video URLs to use MP4 format.
 * Adds f_mp4 transformation and ensures .mp4 extension.
 */
export function forceCloudinaryMp4(url: string): string {
    try {
        if (!url.includes('res.cloudinary.com') || !url.includes('/video/upload/')) return url;
        const [prefix, restRaw] = url.split('/upload/');
        let rest = restRaw || '';
        if (!rest.startsWith('f_mp4/')) {
            rest = `f_mp4/${rest}`;
        }
        rest = rest.replace(/\.(mov|webm|mkv|avi|mpg|mpeg|3gp|wmv)(\?.*)?$/i, '.mp4$2');
        if (!/\.mp4(\?|$)/i.test(rest)) {
            const qIndex = rest.indexOf('?');
            if (qIndex >= 0) {
                rest = `${rest.slice(0, qIndex)}.mp4${rest.slice(qIndex)}`;
            } else {
                rest = `${rest}.mp4`;
            }
        }
        return `${prefix}/upload/${rest}`;
    } catch {
        return url;
    }
}
