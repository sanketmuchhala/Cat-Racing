import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CatRoads - Infinite Procedural Driving',
  description: 'Drive endlessly through procedural landscapes with your cat companion',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
