import type { Metadata, Viewport } from 'next';
import { Open_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  applicationName: 'Carmelo',
  title: 'Carmelo • Gestão de Grupos de Crescimento',
  description:
    'Aplicação web para líderes e supervisores administrarem grupos de crescimento, reuniões e visitantes.',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/apple-icon.png',
  },
  appleWebApp: {
    capable: true,
    title: 'Carmelo',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  themeColor: '#00A499',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={openSans.variable}>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
