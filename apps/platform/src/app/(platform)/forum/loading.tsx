import { Card, CardContent } from "@/components/ui/card";

export default function ForumLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 animate-pulse rounded bg-muted" />
          <div className="h-4 w-56 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-9 w-28 animate-pulse rounded-lg bg-muted" />
      </div>

      {/* Tabs skeleton */}
      <div className="h-10 animate-pulse rounded-lg bg-muted" />

      {/* Cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-3">
              <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
              <div className="h-4 w-40 animate-pulse rounded bg-muted" />
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
              <div className="flex justify-between">
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                <div className="h-3 w-12 animate-pulse rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
