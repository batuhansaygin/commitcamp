"use client";

import { useEffect } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // Next.js 16 / Turbopack calls AbortController.abort() without a reason when
  // cancelling in-flight server-component fetches during navigation or HMR.
  // These unhandled rejections are framework noise — they are not real errors.
  // We filter them out globally here so they don't clutter the browser console.
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      if (reason instanceof DOMException && reason.name === "AbortError") {
        event.preventDefault();
        return;
      }
      if (reason instanceof Error) {
        const msg = reason.message || "";
        if (
          reason.name === "AbortError" ||
          msg.includes("signal is aborted") ||
          msg.includes("signal is aborted without reason") ||
          msg.includes("The operation was aborted") ||
          msg.includes("aborted a request")
        ) {
          event.preventDefault();
        }
      }
    };
    window.addEventListener("unhandledrejection", handler);

    const errorHandler = (event: ErrorEvent) => {
      if (
        event.message?.includes("signal is aborted") ||
        event.message?.includes("AbortError")
      ) {
        event.preventDefault();
      }
    };
    window.addEventListener("error", errorHandler);

    return () => {
      window.removeEventListener("unhandledrejection", handler);
      window.removeEventListener("error", errorHandler);
    };
  }, []);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
