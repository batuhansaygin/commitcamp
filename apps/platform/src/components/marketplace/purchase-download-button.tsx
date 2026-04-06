"use client";

import { useTransition } from "react";
import { downloadProduct } from "@/lib/actions/marketplace/purchases";
import { Button } from "@/components/ui/button";

interface PurchaseDownloadButtonProps {
  productId: string;
}

export function PurchaseDownloadButton({ productId }: PurchaseDownloadButtonProps) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            const out = await downloadProduct(productId);
            window.location.assign(out.url);
          } catch (e) {
            const msg = e instanceof Error ? e.message : "Download failed";
            window.alert(msg);
          }
        })
      }
    >
      {pending ? "Preparing…" : "Download"}
    </Button>
  );
}
