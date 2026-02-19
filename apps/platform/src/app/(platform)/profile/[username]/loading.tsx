import { Card, CardContent } from "@/components/ui/card";

export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="h-9 w-20 animate-pulse rounded-lg bg-muted" />

      {/* Profile header skeleton */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="h-20 w-20 shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-3">
              <div className="h-6 w-40 animate-pulse rounded bg-muted" />
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-4 w-64 animate-pulse rounded bg-muted" />
              <div className="flex gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-3 w-20 animate-pulse rounded bg-muted" />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content skeleton */}
      <div className="space-y-3">
        <div className="h-4 w-28 animate-pulse rounded bg-muted" />
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-3 space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="h-3 w-48 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
