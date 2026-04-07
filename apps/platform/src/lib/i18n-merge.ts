/** Deep-merge `patch` over `base` (objects only; arrays and primitives replace). */
export function deepMergeMessages(
  base: Record<string, unknown>,
  patch: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const key of Object.keys(patch)) {
    const pv = patch[key];
    const bv = base[key];
    if (
      pv !== null &&
      typeof pv === "object" &&
      !Array.isArray(pv) &&
      bv !== null &&
      typeof bv === "object" &&
      !Array.isArray(bv)
    ) {
      out[key] = deepMergeMessages(bv as Record<string, unknown>, pv as Record<string, unknown>);
    } else if (pv !== undefined) {
      out[key] = pv;
    }
  }
  return out;
}
