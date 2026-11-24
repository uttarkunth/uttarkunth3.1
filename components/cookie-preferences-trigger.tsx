'use client';

import React from 'react';
import { openCookiePreferencesModal } from '@/lib/cookie-consent';

interface CookiePreferencesTriggerProps {
  className?: string;
  label?: string;
  testId?: string;
}

export function CookiePreferencesTrigger({
  className = 'hover:text-terracotta transition-colors text-left cursor-pointer',
  label = 'Cookie Preferences',
  testId = 'open-cookie-preferences-btn',
}: CookiePreferencesTriggerProps) {
  return (
    <button
      type="button"
      onClick={() => openCookiePreferencesModal()}
      className={className}
      data-testid={testId}
    >
      {label}
    </button>
  );
}
