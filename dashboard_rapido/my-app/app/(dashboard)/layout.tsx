"use client";

import { AuthProvider } from '@/components/auth-provider';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </AuthProvider>
  );
}
