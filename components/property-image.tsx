'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';

interface PropertyImageProps extends Omit<ImageProps, 'src'> {
  src: string;
  transformWidth?: number;
  transformHeight?: number;
}

const PROPERTY_PHOTO_HOST = 'xyplgugxpmlnjsvlosdg.supabase.co';

function getTransformedPropertyImageUrl(source: string, width: number, height: number): string {
  try {
    const url = new URL(source);
    const isApprovedPropertyPhoto =
      url.protocol === 'https:' &&
      url.hostname === PROPERTY_PHOTO_HOST &&
      url.pathname.startsWith('/storage/v1/object/public/property-photos/');

    if (!isApprovedPropertyPhoto) return source;

    const options = [
      'width=' + width,
      'height=' + height,
      'fit=cover',
      'gravity=auto',
      'quality=82',
      'format=auto',
    ].join(',');

    return '/cdn-cgi/image/' + options + '/' + url.toString();
  } catch {
    return source;
  }
}

export function PropertyImage({
  src,
  transformWidth = 600,
  transformHeight = 400,
  onError,
  ...imageProps
}: PropertyImageProps) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const transformedSrc = getTransformedPropertyImageUrl(src, transformWidth, transformHeight);
  const useOriginal = failedSource === src || transformedSrc === src;

  return (
    <Image
      {...imageProps}
      src={useOriginal ? src : transformedSrc}
      unoptimized
      onError={(event) => {
        if (!useOriginal) {
          setFailedSource(src);
          return;
        }
        onError?.(event);
      }}
    />
  );
}
