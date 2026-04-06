import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getProduct } from "@/lib/actions/marketplace/products";
import { getProductReviews, addReview } from "@/lib/actions/marketplace/reviews";
import { purchaseProduct } from "@/lib/actions/marketplace/purchases";
import { ensureMarketplaceEnabled } from "@/lib/actions/marketplace/_common";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ productId: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const enabled = await ensureMarketplaceEnabled();
  if (!enabled) {
    return (
      <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Marketplace is currently disabled.</CardContent></Card>
    );
  }

  const { productId } = await params;
  const product = await getProduct(productId);
  if (!product || !product.is_published) {
    return <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Product not found.</CardContent></Card>;
  }
  const reviews = await getProductReviews(product.id);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <Card>
        <CardContent className="space-y-3 p-5">
          <p className="text-xs uppercase text-muted-foreground">{product.type}</p>
          <h1 className="text-2xl font-bold">{product.title}</h1>
          <p className="text-sm text-muted-foreground">{product.description}</p>
          {product.long_description ? <p className="text-sm">{product.long_description}</p> : null}
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold">${(product.price_cents / 100).toFixed(2)}</p>
            <form
              action={async () => {
                "use server";
                const result = await purchaseProduct(product.id);
                redirect(result.url);
              }}
            >
              <Button>Buy now</Button>
            </form>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-5">
          <h2 className="font-semibold">Reviews</h2>
          <form
            action={async (formData) => {
              "use server";
              const rating = Number(formData.get("rating") ?? 5);
              const comment = String(formData.get("comment") ?? "");
              await addReview(product.id, rating, comment);
            }}
            className="space-y-2 rounded-md border border-border p-3"
          >
            <div className="flex items-center gap-2">
              <select name="rating" defaultValue="5" className="h-8 rounded-md border border-input bg-background px-2 text-xs">
                <option value="5">5</option>
                <option value="4">4</option>
                <option value="3">3</option>
                <option value="2">2</option>
                <option value="1">1</option>
              </select>
              <input name="comment" placeholder="Write a short review..." className="h-8 flex-1 rounded-md border border-input bg-background px-2 text-xs" />
              <Button type="submit" size="sm">Post</Button>
            </div>
          </form>

          <div className="space-y-2">
            {reviews.length === 0 ? (
              <p className="text-xs text-muted-foreground">No reviews yet.</p>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="rounded-md border border-border p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium">
                      {r.reviewer?.display_name ?? r.reviewer?.username ?? "User"}
                    </p>
                    <p className="text-xs text-muted-foreground">⭐ {r.rating}</p>
                  </div>
                  {r.comment ? <p className="mt-1 text-xs text-muted-foreground">{r.comment}</p> : null}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
