"use client";

import { Check, Crown, Loader2, Sparkles, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface AiToolsUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** First line explaining which limit was hit */
  limitDescription: string;
  isUpgradePending: boolean;
  isTrialPending: boolean;
  onUpgrade: () => void;
  onTrial: () => void;
}

export function AiToolsUpgradeModal({
  open,
  onOpenChange,
  limitDescription,
  isUpgradePending,
  isTrialPending,
  onUpgrade,
  onTrial,
}: AiToolsUpgradeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-400" aria-hidden />
            Daily limit reached
          </DialogTitle>
          <DialogDescription>{limitDescription}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p className="font-medium text-foreground">Upgrade to Pro for:</p>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
              Unlimited AI tool usage
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
              Priority model access for faster responses
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
              7-day free trial on Pro
            </li>
          </ul>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              className="w-full sm:w-auto"
              onClick={() => onOpenChange(false)}
            >
              Maybe later
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={onTrial}
              disabled={isTrialPending}
            >
              {isTrialPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" aria-hidden />
              )}
              Try Pro free
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={onUpgrade}
              disabled={isUpgradePending}
            >
              {isUpgradePending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <TriangleAlert className="mr-2 h-4 w-4" aria-hidden />
              )}
              Upgrade to Pro
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
