import { Card, CardContent } from "@/components/ui/card";
import { getMyProducts } from "@/lib/actions/marketplace/products";
import { getSellerStats } from "@/lib/actions/marketplace/seller";
import { ensureMarketplaceEnabled } from "@/lib/actions/marketplace/_common";

export default async function MyProductsPage() {
  const enabled = await ensureMarketplaceEnabled();
  if (!enabled) {
    return (
      <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Marketplace is currently disabled.</CardContent></Card>
    );
  }

  const [products, stats] = await Promise.all([getMyProducts(), getSellerStats()]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <h1 className="text-2xl font-bold">My Products</h1>
      <div className="grid gap-3 sm:grid-cols-4">
        <Card><CardContent className="p-3 text-xs">Products: <span className="font-semibold">{stats.products}</span></CardContent></Card>
        <Card><CardContent className="p-3 text-xs">Sales: <span className="font-semibold">{stats.sales}</span></CardContent></Card>
        <Card><CardContent className="p-3 text-xs">Revenue: <span className="font-semibold">${(stats.revenue_cents / 100).toFixed(2)}</span></CardContent></Card>
        <Card><CardContent className="p-3 text-xs">Commission: <span className="font-semibold">${(stats.commission_cents / 100).toFixed(2)}</span></CardContent></Card>
      </div>

      <div className="space-y-2">
        {products.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No products yet.</CardContent></Card>
        ) : (
          products.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.type} • ${(p.price_cents / 100).toFixed(2)}</p>
                </div>
                <p className={`text-xs ${p.is_published ? "text-emerald-500" : "text-amber-500"}`}>
                  {p.is_published ? "Published" : "Pending"}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
