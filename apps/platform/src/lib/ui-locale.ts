/**
 * In-app UI strings (next-intl replacement). **Default is always English (`en`).**
 *
 * Turkish is optional: set `NEXT_PUBLIC_DEFAULT_LOCALE=tr` at build time to deep-merge
 * `messages/tr.json` over `en.json`. Any other value (including unset / empty / `en`) → English only.
 */
export type UiLocale = "en" | "tr";

export function getUiLocale(): UiLocale {
  const raw = process.env.NEXT_PUBLIC_DEFAULT_LOCALE;
  if (raw == null) return "en";
  const v = String(raw).trim().toLowerCase();
  if (v === "" || v === "en" || v.startsWith("en-")) return "en";
  if (v === "tr" || v === "tr-tr") return "tr";
  return "en";
}

export function isTurkishUi(): boolean {
  return getUiLocale() === "tr";
}
