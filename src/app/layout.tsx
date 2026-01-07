import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/sidebar';
import { Providers } from '@/components/providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Variational Analytics | DeFi Dashboard',
  description: 'Comprehensive analytics dashboard for Variational - A generalized protocol for leveraged peer-to-peer trading',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased dark`}
      >
        <Providers>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="ml-56 flex-1">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}

