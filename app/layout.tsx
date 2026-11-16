import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'SoundSense · Summary Review',
  description: 'Evidence-led quality assurance for collections call summaries.',
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
