import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { approveProduct, listProductsAdmin, rejectProduct, removeProduct } from "@/lib/actions/marketplace/products";

export default async function AdminProductsPage() {
  const products = await listProductsAdmin();
  const pending = products.filter((p) => !p.is_published);
  const published = products.filter((p) => p.is_published);

  return (
    <div className="h-full overflow-y-auto space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Product Moderation</h1>
        <p className="text-sm text-muted-foreground">Approve, reject, or remove marketplace products.</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Pending approval ({pending.length})</h2>
        {pending.length === 0 ? (
          <Card><CardContent className="py-8 text-sm text-muted-foreground">No pending products.</CardContent></Card>
        ) : (
          pending.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.type} • ${(p.price_cents / 100).toFixed(2)}</p>
                  {p.file_path ? (
                    <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground" title={p.file_path}>
                      {p.file_path}
                    </p>
                  ) : (
                    <p className="mt-1 text-[10px] text-amber-600 dark:text-amber-500">No file_path — upload before publish</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <form action={async () => { "use server"; await approveProduct(p.id); }}><Button size="sm">Approve</Button></form>
                  <form action={async () => { "use server"; await rejectProduct(p.id); }}><Button size="sm" variant="outline">Reject</Button></form>
                  <form action={async () => { "use server"; await removeProduct(p.id); }}><Button size="sm" variant="destructive">Remove</Button></form>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Published ({published.length})</h2>
        {published.length === 0 ? (
          <Card><CardContent className="py-8 text-sm text-muted-foreground">No published products.</CardContent></Card>
        ) : (
          published.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.type} • ${(p.price_cents / 100).toFixed(2)}</p>
                  {p.file_path ? (
                    <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground" title={p.file_path}>
                      {p.file_path}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <form action={async () => { "use server"; await rejectProduct(p.id); }}><Button size="sm" variant="outline">Unpublish</Button></form>
                  <form action={async () => { "use server"; await removeProduct(p.id); }}><Button size="sm" variant="destructive">Remove</Button></form>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
