import { Card, CardContent } from "@/components/ui/card";

export default function PostDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="h-9 w-20 animate-pulse rounded-lg bg-muted" />

      <div className="space-y-3">
        <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
        <div className="h-7 w-80 animate-pulse rounded bg-muted" />
        <div className="flex gap-4">
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-4 animate-pulse rounded bg-muted"
              style={{ width: `${60 + Math.random() * 35}%` }}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
