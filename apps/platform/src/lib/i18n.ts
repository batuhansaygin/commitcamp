import enMessages from "@/messages/en.json";

type Messages = typeof enMessages;

function lookup(obj: unknown, keys: string[]): string {
  let cur: unknown = obj;
  for (const k of keys) {
    cur = (cur as Record<string, unknown>)?.[k];
  }
  return typeof cur === "string" ? cur : keys.join(".");
}

/** Works in both Server Components and Client Components. */
export function useTranslations(namespace: string) {
  const parts = namespace.split(".");
  let ns: unknown = enMessages as Messages;
  for (const p of parts) {
    ns = (ns as Record<string, unknown>)?.[p];
  }

  return function t(
    key: string,
    params?: Record<string, string | number>
  ): string {
    const str = lookup(ns, key.split("."));
    if (!params) return str;
    return str.replace(/\{(\w+)\}/g, (_, k: string) =>
      String(params[k] ?? `{${k}}`)
    );
  };
}

/** Always returns "en" — locale is fixed after removing next-intl. */
export function useLocale(): string {
  return "en";
}
