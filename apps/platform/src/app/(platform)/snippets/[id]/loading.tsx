export default function SnippetDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back button skeleton */}
      <div className="h-9 w-20 animate-pulse rounded-lg bg-muted" />

      {/* Title + badge skeleton */}
      <div className="space-y-3">
        <div className="flex justify-between">
          <div className="h-7 w-64 animate-pulse rounded bg-muted" />
          <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="h-4 w-96 animate-pulse rounded bg-muted" />
        <div className="flex gap-4">
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        </div>
      </div>

      {/* Code block skeleton */}
      <div className="rounded-lg border border-border">
        <div className="flex justify-between border-b border-border px-4 py-2">
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
          <div className="h-5 w-14 animate-pulse rounded bg-muted" />
        </div>
        <div className="p-4 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-4 animate-pulse rounded bg-muted"
              style={{ width: `${60 + Math.random() * 35}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
