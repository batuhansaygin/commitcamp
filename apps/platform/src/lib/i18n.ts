import enMessages from "@/messages/en.json";
import trPartial from "@/messages/tr.json";
import { deepMergeMessages } from "@/lib/i18n-merge";
import { getUiLocale, type UiLocale } from "@/lib/ui-locale";

type Messages = typeof enMessages;

const activeMessages: Messages =
  getUiLocale() === "tr"
    ? (deepMergeMessages(
        enMessages as unknown as Record<string, unknown>,
        trPartial as unknown as Record<string, unknown>
      ) as unknown as Messages)
    : enMessages;

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
  let ns: unknown = activeMessages as Messages;
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

/** Mirrors {@link getUiLocale}: default `en`, only `tr` when explicitly enabled via env. */
export function useLocale(): UiLocale {
  return getUiLocale();
}
