import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/src/context/AuthContext";
import { ToastProvider } from "@/src/context/ToastContext";
import { ThemeProvider } from "@/src/context/ThemeContext";
import Header from "@/src/components/Header";
import AppRoutes from "@/src/routes/AppRoutes";

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors flex flex-col font-sans">
              {/* Sticky high-contrast navigation header */}
              <Header />
              
              {/* Main viewport panels */}
              <main className="flex-1 pb-16">
                <AppRoutes />
              </main>
            </div>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
