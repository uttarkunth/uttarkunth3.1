'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface HeroVideoProps {
  videoSrc: string;
  posterSrc: string;
}

export function HeroVideo({ videoSrc, posterSrc }: HeroVideoProps) {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.play().catch(() => {
        // Autoplay may be restricted by browser policy; poster remains visible
      });
    }
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-forest-dark select-none pointer-events-none">
      {/* 1. Authentic Fallback Poster (always present behind video) */}
      <Image
        src={posterSrc}
        alt="Uttarkunth Himalayan Panorama"
        fill
        priority
        className={`object-cover object-center transition-opacity duration-1000 ${
          isVideoLoaded ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* 2. Original WebM Hero Video */}
      {!videoError && (
        <video
          ref={videoRef}
          src={videoSrc}
          poster={posterSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onCanPlay={() => setIsVideoLoaded(true)}
          onError={() => setVideoError(true)}
          className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ${
            isVideoLoaded ? 'opacity-90' : 'opacity-0'
          }`}
        />
      )}

      {/* 3. Restrained Editorial Gradient Overlay to guarantee 100% text legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-forest-dark/85 via-forest-dark/70 to-forest-dark/95" />
      <div className="absolute inset-0 bg-radial-vignette opacity-60" />
    </div>
  );
}
