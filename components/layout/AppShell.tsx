"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { AuthProvider } from "@/components/providers/AuthProvider";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <AuthProvider>
      {isLoginPage ? (
        <>{children}</>
      ) : (
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden md:pl-64 transition-all duration-300">
            <Header />
            <main className="flex-1 overflow-y-auto bg-muted/20 p-6">
              {children}
            </main>
          </div>
        </div>
      )}
    </AuthProvider>
  );
}

