/**
 * Shim — previously created with createNavigation(routing) from next-intl.
 * Re-exports standard Next.js navigation so all existing imports keep working
 * after next-intl removal.
 */
export { default as Link } from "next/link";
export { usePathname, useRouter, redirect } from "next/navigation";

/** Trivial getPathname shim — returns the href as-is. */
export function getPathname({
  href,
}: {
  href: string | { pathname: string; params?: Record<string, string> };
}): string {
  return typeof href === "string" ? href : href.pathname;
}
