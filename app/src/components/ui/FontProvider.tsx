import React, { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { bundledFonts } from '../../assets/fonts';
import { FontsReadyContext } from './Text';

export function FontProvider({ children }: { children: React.ReactNode }) {
  const [loaded, error] = useFonts(bundledFonts);
  useEffect(() => {
    if (error) console.warn('Bundled fonts could not load; using system fonts.');
  }, [error]);
  // Keep navigation available during loading and on failure; never gate account access on fonts.
  return <FontsReadyContext.Provider value={loaded && !error}>{children}</FontsReadyContext.Provider>;
}
