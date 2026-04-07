// eslint-disable-next-line @typescript-eslint/no-require-imports
const enMessages = require("@/messages/en.json") as Record<string, unknown>;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const trPartial = require("@/messages/tr.json") as Record<string, unknown>;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { deepMergeMessages } = require("@/lib/i18n-merge") as {
  deepMergeMessages: (a: Record<string, unknown>, b: Record<string, unknown>) => Record<string, unknown>;
};
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getUiLocale } = require("@/lib/ui-locale") as { getUiLocale: () => "en" | "tr" };

const activeMessages: Record<string, unknown> =
  getUiLocale() === "tr" ? deepMergeMessages(enMessages, trPartial) : enMessages;

function lookup(obj: unknown, keys: string[]): string {
  let cur: unknown = obj;
  for (const k of keys) {
    cur = (cur as Record<string, unknown>)?.[k];
  }
  return typeof cur === "string" ? cur : keys.join(".");
}

function makeT(namespace: string) {
  const parts = namespace.split(".");
  let ns: unknown = activeMessages;
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

export async function getTranslations(
  namespaceOrOptions: string | { namespace: string }
) {
  const ns =
    typeof namespaceOrOptions === "string"
      ? namespaceOrOptions
      : namespaceOrOptions.namespace;
  return makeT(ns);
}

/** No-op — UI locale defaults to English; optional Turkish via `NEXT_PUBLIC_DEFAULT_LOCALE=tr`. */
export function setRequestLocale(_locale: string): void {}
