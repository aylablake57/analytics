import type { ReactNode } from 'react';
import { Inter, JetBrains_Mono } from 'next/font/google';
import '@/app/executive/executive.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <div
      data-exec
      data-theme="dark"
      className={`${inter.variable} ${mono.variable}`}
      style={{ minHeight: '100vh' }}
    >
      <div className="exec-root">{children}</div>
    </div>
  );
}
