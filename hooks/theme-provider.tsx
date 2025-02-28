"use client"

import { useEffect, useState } from 'react';
import { ThemeProvider } from 'next-themes';

export default function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) { return }
  return (
    <ThemeProvider attribute="class" enableSystem={true} defaultTheme="light">
      {children}
    </ThemeProvider>
  );
}