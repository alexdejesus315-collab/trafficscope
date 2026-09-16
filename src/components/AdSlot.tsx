import { useEffect, useState, useRef } from 'react';
import { X, ArrowRight } from 'lucide-react';

interface Ad {
  id: string;
  title: string | null;
  media_type: 'image' | 'gif' | 'video';
  media_url: string;
  link_url: string;
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

const ROTATE_INTERVAL_MS = 8000;
const DISMISS_KEY = 'trafficscope_ads_dismissed_until';
const DISMISS_DURATION_MS = 5 * 60 * 1000; // 5 minutos

const FALLBACK_COLOR: RGB = { r: 5, g: 40, b: 58 }; // #05283A

function extractDominantColor(url: string): Promise<RGB | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const size = 24;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 125) continue;
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }
        if (count === 0) return resolve(null);
        resolve({ r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function getLuminance({ r, g, b }: RGB): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function rgbStr({ r, g, b }: RGB, alpha = 1): string {
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function AdSlot() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [themeColor, setThemeColor] = useState<RGB>(FALLBACK_COLOR);
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    const until = sessionStorage.getItem(DISMISS_KEY);
    return until ? Date.now() < Number(until) : false;
  });
  const [isVisible, setIsVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isDismissed) return;

    fetch('/api/ads/active')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.ads?.length > 0) {
          setAds(data.ads);
          setTimeout(() => setIsVisible(true), 600);
        }
      })
      .catch(() => {});
  }, [isDismissed]);

  useEffect(() => {
    if (!isDismissed) return;
    const until = Number(sessionStorage.getItem(DISMISS_KEY) || 0);
    const msRemaining = until - Date.now();
    if (msRemaining <= 0) {
      setIsDismissed(false);
      return;
    }
    const timeout = setTimeout(() => setIsDismissed(false), msRemaining);
    return () => clearTimeout(timeout);
  }, [isDismissed]);

  useEffect(() => {
    if (ads.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, ROTATE_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [ads.length]);

  useEffect(() => {
    const currentAd = ads[currentIndex];
    if (!currentAd) return;

    if (currentAd.media_type === 'video') {
      setThemeColor(FALLBACK_COLOR);
      return;
    }

    let cancelled = false;
    extractDominantColor(currentAd.media_url).then((color) => {
      if (!cancelled) setThemeColor(color || FALLBACK_COLOR);
    });
    return () => { cancelled = true; };
  }, [ads, currentIndex]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    sessionStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DURATION_MS));
    setIsVisible(false);
    setTimeout(() => setIsDismissed(true), 300);
  };

  const handleClick = () => {
    const ad = ads[currentIndex];
    if (ad) window.open(ad.link_url, '_blank', 'noopener,noreferrer');
  };

  if (isDismissed || ads.length === 0) return null;

  const currentAd = ads[currentIndex];
  const luminance = getLuminance(themeColor);
  const isLightBg = luminance > 0.55;
  const textColor = isLightBg ? '#111111' : '#ffffff';
  const badgeBg = isLightBg ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.15)';

  return (
    <div
      className={`fixed bottom-5 right-5 z-[100] transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
      }`}
    >
      <div
        onClick={handleClick}
        role="button"
        tabIndex={0}
        className="group relative flex items-center gap-3 pl-2 pr-3 py-2 rounded-full shadow-xl cursor-pointer w-[210px] hover:w-[340px] transition-[width,transform] duration-300 ease-out hover:scale-[1.02]"
        style={{ backgroundColor: rgbStr(themeColor) }}
      >
        <button
          onClick={handleDismiss}
          aria-label="Fechar anúncio"
          className="absolute -top-1.5 -right-1.5 z-10 h-5 w-5 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
        >
          <X className="h-3 w-3" />
        </button>

        <div className="h-10 w-10 rounded-full overflow-hidden shrink-0 bg-black/10 border-2" style={{ borderColor: rgbStr(themeColor, 0.4) }}>
          {currentAd.media_type === 'video' ? (
            <video
              key={currentAd.id}
              src={currentAd.media_url}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              key={currentAd.id}
              src={currentAd.media_url}
              alt={currentAd.title || 'Anúncio'}
              crossOrigin="anonymous"
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <p
          className="text-sm font-extrabold tracking-tight flex-1 whitespace-nowrap overflow-hidden"
          style={{ color: textColor }}
        >
          {currentAd.title || 'Publicidade'}
        </p>

        <span
          className="shrink-0 h-7 w-7 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-0.5"
          style={{ backgroundColor: badgeBg, color: textColor }}
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </span>

        {ads.length > 1 && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1">
            {ads.map((_, i) => (
              <span
                key={i}
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: i === currentIndex ? '12px' : '4px',
                  backgroundColor: i === currentIndex ? rgbStr(themeColor) : `${rgbStr(themeColor, 0.3)}`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}