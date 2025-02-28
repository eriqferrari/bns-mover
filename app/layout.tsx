import type { Metadata } from 'next';
import { Jersey_15 as FontSans } from 'next/font/google';
import { Providers } from './providers';
import localFont from 'next/font/local';
import ThemeProviderWrapper from "@/hooks/theme-provider"

const avenueMono = localFont({
  src: './fonts/Avenue Mono.ttf',
  variable: '--font-avenue-mono',
  weight: '100, 900',
});
const roobert = localFont({
  src: [
    { path: './fonts/Roobert-Light.ttf', weight: '300', style: 'normal' },
    { path: './fonts/Roobert-Regular.ttf', weight: '400', style: 'normal' },
    { path: './fonts/Roobert-Medium.ttf', weight: '500', style: 'normal' },
    { path: './fonts/Roobert-SemiBold.ttf', weight: '600', style: 'normal' },
    { path: './fonts/Roobert-Bold.ttf', weight: '700', style: 'normal' },
    { path: './fonts/Roobert-Heavy.ttf', weight: '800', style: 'normal' },
  ],
  variable: '--font-roobert',
});

import './globals.css';
import { cn } from '@/lib/utils';

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: '400',
});

export const metadata: Metadata = {
  title: 'BNS Mover',
  description: 'Easily transfer all your BNS names',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <Providers>
        <ThemeProviderWrapper >
          <body
            className={cn(
              'bg-background font-sans antialiased',
              fontSans.variable,
              roobert.variable,
              avenueMono.variable
            )}
          >
            {children}
          </body>
        </ThemeProviderWrapper >
      </Providers>
    </html>
  );
}
