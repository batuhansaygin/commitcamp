# TypeScript Complete Cheat Sheet — CommitCamp Official

A compact reference for daily TypeScript work. Use alongside the official handbook: https://www.typescriptlang.org/docs/

## Types from values

```ts
const x = "hello"; // x: string
const n = 42 as const; // literal 42
type T = typeof n;
```

## Utility types

| Type | Use |
|------|-----|
| `Partial<T>` | All props optional |
| `Required<T>` | All props required |
| `Readonly<T>` | Immutable surface |
| `Pick<T, K>` | Subset of keys |
| `Omit<T, K>` | Exclude keys |
| `Record<K, V>` | Map-like object |
| `Exclude<U, V>` | Union minus V |
| `Extract<U, V>` | Union intersect V |
| `NonNullable<T>` | Remove null/undefined |

## Generics

```ts
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}
```

## Narrowing

```ts
function printId(id: number | string) {
  if (typeof id === "string") console.log(id.toUpperCase());
  else console.log(id.toFixed(0));
}
```

## `satisfies` (TS 4.9+)

```ts
const cfg = {
  api: "https://api.example.com",
  retries: 3,
} satisfies { api: string; retries: number };
```

---

*CommitCamp marketplace — official digital product. Personal and team use only; redistribution prohibited.*
