'use client';

import { ConnectProvider } from './ConnectProvider';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return <ConnectProvider>{children}</ConnectProvider>;
}
