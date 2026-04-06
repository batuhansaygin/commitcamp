import { Card, CardContent } from "@/components/ui/card";
import { getPurchaseHistory } from "@/lib/actions/marketplace/purchases";
import { ensureMarketplaceEnabled } from "@/lib/actions/marketplace/_common";
import { PurchaseDownloadButton } from "@/components/marketplace/purchase-download-button";

export default async function MyPurchasesPage() {
  const enabled = await ensureMarketplaceEnabled();
  if (!enabled) {
    return (
      <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Marketplace is currently disabled.</CardContent></Card>
    );
  }

  const purchases = await getPurchaseHistory();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <h1 className="text-2xl font-bold">My Purchases</h1>
      <div className="space-y-2">
        {purchases.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No purchases yet.</CardContent></Card>
        ) : (
          purchases.map((p) => (
            // Supabase nested select can be typed as array depending on relation metadata.
            // Normalize here to support both object/array shapes.
            (() => {
              const product = Array.isArray(p.products) ? p.products[0] : p.products;
              return (
            <Card key={p.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{product?.title ?? "Product"}</p>
                  <p className="text-xs text-muted-foreground">${(p.amount_cents / 100).toFixed(2)} • {new Date(p.created_at).toLocaleString()}</p>
                </div>
                <PurchaseDownloadButton productId={p.product_id} />
              </CardContent>
            </Card>
              );
            })()
          ))
        )}
      </div>
    </div>
  );
}
