import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { listProducts } from "@/lib/actions/marketplace/products";
import { ensureMarketplaceEnabled } from "@/lib/actions/marketplace/_common";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    minPrice?: string;
    maxPrice?: string;
    minRating?: string;
  }>;
}

export default async function MarketplacePage({ searchParams }: PageProps) {
  const enabled = await ensureMarketplaceEnabled();
  if (!enabled) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Marketplace is currently disabled.
        </CardContent>
      </Card>
    );
  }

  const params = await searchParams;
  const products = await listProducts({
    query: params.q,
    type: params.type,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    minRating: params.minRating ? Number(params.minRating) : undefined,
  });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Marketplace</h1>
          <p className="text-sm text-muted-foreground">Buy and sell developer digital products.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/marketplace/my-purchases"><Button variant="outline" size="sm">My Purchases</Button></Link>
          <Link href="/marketplace/my-products"><Button variant="outline" size="sm">My Products</Button></Link>
          <Link href="/marketplace/sell"><Button size="sm">Sell Product</Button></Link>
        </div>
      </div>

      <form className="grid gap-2 rounded-lg border border-border p-3 md:grid-cols-6">
        <Input name="q" defaultValue={params.q ?? ""} placeholder="Search products..." className="md:col-span-2" />
        <select name="type" defaultValue={params.type ?? ""} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">All types</option>
          <option value="template">Template</option>
          <option value="cheatsheet">Cheatsheet</option>
          <option value="course">Course</option>
          <option value="snippet_pack">Snippet pack</option>
          <option value="tool">Tool</option>
        </select>
        <Input name="minPrice" defaultValue={params.minPrice ?? ""} placeholder="Min price (cents)" />
        <Input name="maxPrice" defaultValue={params.maxPrice ?? ""} placeholder="Max price (cents)" />
        <Button type="submit">Filter</Button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <Link key={p.id} href={`/marketplace/${p.slug}`} className="block">
            <Card className="h-full transition hover:border-primary/40">
              <CardContent className="space-y-2 p-4">
                <p className="text-xs uppercase text-muted-foreground">{p.type}</p>
                <h3 className="line-clamp-2 font-semibold">{p.title}</h3>
                <p className="line-clamp-2 text-xs text-muted-foreground">{p.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">${(p.price_cents / 100).toFixed(2)}</span>
                  <span className="text-xs text-muted-foreground">⭐ {Number(p.rating_avg ?? 0).toFixed(1)}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
