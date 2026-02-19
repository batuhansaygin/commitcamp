// eslint-disable-next-line @typescript-eslint/no-require-imports
const enMessages = require("@/messages/en.json") as Record<string, unknown>;

function lookup(obj: unknown, keys: string[]): string {
  let cur: unknown = obj;
  for (const k of keys) {
    cur = (cur as Record<string, unknown>)?.[k];
  }
  return typeof cur === "string" ? cur : keys.join(".");
}

function makeT(namespace: string) {
  const parts = namespace.split(".");
  let ns: unknown = enMessages;
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

/** No-op — locale is fixed to "en" */
export function setRequestLocale(_locale: string): void {}
