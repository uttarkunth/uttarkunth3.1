'use client';

import React from 'react';

interface ProductsBrowserProps {
  products?: any[];
  initialCategory?: string;
  initialQuery?: string;
}

export function ProductsBrowser(_props: ProductsBrowserProps) {
  return (
    <section className="py-10 sm:py-16 text-center" data-testid="products-coming-soon">
      <p className="font-serif text-2xl sm:text-4xl md:text-5xl font-bold text-[#1F332A] tracking-tight inline-flex items-baseline justify-center">
        <span>Coming Soon</span>
        <span aria-hidden="true" className="inline-flex items-baseline ml-1 text-[#C55B23]">
          <span className="coming-soon-dot" style={{ animationDelay: '0ms' }}>.</span>
          <span className="coming-soon-dot ml-0.5" style={{ animationDelay: '220ms' }}>.</span>
          <span className="coming-soon-dot ml-0.5" style={{ animationDelay: '440ms' }}>.</span>
          <span className="coming-soon-dot ml-0.5" style={{ animationDelay: '660ms' }}>.</span>
        </span>
      </p>
    </section>
  );
}

