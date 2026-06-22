'use client';
import type { ReactNode } from 'react';
import { ThemeProvider } from './primitives/ThemeProvider';

export default function ExecProviders({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
