import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Minimi — Temporal Web Search Agent',
  description: 'Precision chat agent with episodic memory and real-time web search verification',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090a0f] text-zinc-100 antialiased selection:bg-blue-600/30 selection:text-blue-200">
        {children}
      </body>
    </html>
  );
}
