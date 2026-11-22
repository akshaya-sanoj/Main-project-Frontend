import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

// Image with a teal placeholder if the file is missing or fails to load.
// Pass alt="" for purely decorative images.
export default function Photo({ src, alt = '', className = '', eager = false }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : 'true'}
        className={`flex items-center justify-center bg-gradient-to-br from-[#0E4D55] to-[#0B3F46] text-white/40 ${className}`}
      >
        <ImageIcon className="h-8 w-8" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}