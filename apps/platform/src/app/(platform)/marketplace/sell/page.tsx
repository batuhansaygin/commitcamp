import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createProduct } from "@/lib/actions/marketplace/products";
import { ensureMarketplaceEnabled } from "@/lib/actions/marketplace/_common";

export default async function SellProductPage() {
  const enabled = await ensureMarketplaceEnabled();
  if (!enabled) {
    return (
      <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Marketplace is currently disabled.</CardContent></Card>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Sell a Product</h1>
        <p className="text-sm text-muted-foreground">Submit product for admin approval.</p>
      </div>
      <Card>
        <CardContent className="p-5">
          <form
            action={async (formData) => {
              "use server";
              const title = String(formData.get("title") ?? "");
              const description = String(formData.get("description") ?? "");
              const long_description = String(formData.get("long_description") ?? "");
              const type = String(formData.get("type") ?? "template") as
                | "template"
                | "cheatsheet"
                | "course"
                | "snippet_pack"
                | "tool";
              const price_cents = Number(formData.get("price_cents") ?? 0);
              const file = formData.get("file");
              await createProduct(
                { title, description, long_description, type, price_cents },
                file instanceof File ? file : undefined
              );
            }}
            className="space-y-3"
          >
            <input name="title" required placeholder="Product title" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" />
            <input name="description" required placeholder="Short description" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" />
            <textarea name="long_description" placeholder="Long description" className="min-h-[140px] w-full rounded-md border border-input bg-background p-3 text-sm" />
            <div className="grid gap-3 sm:grid-cols-2">
              <select name="type" defaultValue="template" className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="template">template</option>
                <option value="cheatsheet">cheatsheet</option>
                <option value="course">course</option>
                <option value="snippet_pack">snippet_pack</option>
                <option value="tool">tool</option>
              </select>
              <input name="price_cents" type="number" min={0} required placeholder="Price (cents)" className="h-10 rounded-md border border-input bg-background px-3 text-sm" />
            </div>
            <input name="file" type="file" className="text-sm" />
            <Button type="submit">Submit for review</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
