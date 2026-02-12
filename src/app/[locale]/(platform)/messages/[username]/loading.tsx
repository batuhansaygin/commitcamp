export default function ThreadLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 border-b border-border pb-3">
        <div className="h-9 w-20 animate-pulse rounded-lg bg-muted" />
        <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
        <div className="space-y-1">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
        </div>
      </div>

      {/* Messages skeleton */}
      <div className="space-y-3 py-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
          >
            <div
              className="animate-pulse rounded-2xl bg-muted px-4 py-3"
              style={{ width: `${40 + Math.random() * 30}%` }}
            >
              <div className="h-4 w-full rounded bg-muted-foreground/10" />
              <div className="mt-1 h-3 w-1/3 rounded bg-muted-foreground/10 ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
