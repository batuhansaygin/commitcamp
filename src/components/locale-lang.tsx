"use client";

import { useEffect } from "react";

interface LocaleLangProps {
  locale: string;
  children: React.ReactNode;
}

/** Sets document.documentElement.lang for a11y (root layout has no access to locale). */
export function LocaleLang({ locale, children }: LocaleLangProps) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return <>{children}</>;
}
