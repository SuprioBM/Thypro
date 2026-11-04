import React from 'react';

interface PictureProps {
  /** Path to the JPEG under /images, e.g. "/images/hero-family.jpg" */
  src: string;
  alt: string;
  className?: string;
  /** Intrinsic dimensions — always supplied so the browser reserves space (no CLS). */
  width: number;
  height: number;
  priority?: boolean;
  sizes?: string;
}

/**
 * Serves a WebP sibling with a JPEG fallback and always carries intrinsic
 * dimensions so images never shift the layout while loading.
 */
export const Picture: React.FC<PictureProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  sizes
}) => {
  const webp = src.replace(/\.jpe?g$/i, '.webp');

  return (
    <picture>
      <source srcSet={webp} type="image/webp" sizes={sizes} />
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        /* @ts-expect-error fetchpriority is valid HTML, typings lag behind */
        fetchpriority={priority ? 'high' : undefined}
        className={className}
      />
    </picture>
  );
};
