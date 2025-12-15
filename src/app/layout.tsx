import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SMC Analyzer',
  description: 'Smart Money Concept Trading Signals',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}