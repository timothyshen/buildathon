"use client";

import { DynamicProvider } from "./dynamic-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DynamicProvider>
      <AuthProvider>
        {children}
        <Toaster position="top-center" richColors />
      </AuthProvider>
    </DynamicProvider>
  );
}
