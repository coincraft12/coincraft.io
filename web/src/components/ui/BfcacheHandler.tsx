'use client';
import { useEffect } from 'react';

export default function BfcacheHandler() {
  useEffect(() => {
    const handle = (e: PageTransitionEvent) => {
      if (e.persisted) {
        const url = new URL(window.location.href);
        url.searchParams.set('_r', Date.now().toString());
        window.location.replace(url.toString());
      }
    };
    window.addEventListener('pageshow', handle);
    return () => window.removeEventListener('pageshow', handle);
  }, []);
  return null;
}
