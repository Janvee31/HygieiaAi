'use client';

import { ThemeProvider } from '@/context/ThemeContext';
import ThemeSelector from '@/components/ThemeSelector';

export default function AppointmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <div className="min-h-screen">
        {children}
        <ThemeSelector />
      </div>
    </ThemeProvider>
  );
}
