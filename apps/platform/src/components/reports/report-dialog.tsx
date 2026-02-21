"use client";

import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import { createReport, type ReportReason, type ReportTargetType } from "@/lib/actions/reports";
import { useTranslations } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "copyright", label: "Copyright" },
  { value: "other", label: "Other" },
];

interface ReportDialogProps {
  targetType: ReportTargetType;
  targetId: string;
  triggerLabel?: string;
  compact?: boolean;
}

export function ReportDialog({
  targetType,
  targetId,
  triggerLabel = "Report",
  compact = false,
}: ReportDialogProps) {
  const t = useTranslations("reports");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("spam");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    const result = await createReport({
      targetType,
      targetId,
      reason,
      details,
    });

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setSubmitting(false);
    window.setTimeout(() => {
      setOpen(false);
      setSuccess(false);
      setDetails("");
      setReason("spam");
    }, 600);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={compact ? "h-7 px-2 text-[11px]" : "text-xs"}
          type="button"
        >
          <Flag className="mr-1 h-3 w-3" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground">{t("reason")}</p>
            <Select value={reason} onValueChange={(value) => setReason(value as ReportReason)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground">{t("details")}</p>
            <Textarea
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              maxLength={1000}
              rows={4}
              placeholder={t("detailsPlaceholder")}
            />
          </div>

          {error ? <p className="text-xs text-destructive">{error}</p> : null}
          {success ? (
            <p className="text-xs text-emerald-500">{t("success")}</p>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={onSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {submitting ? t("loading") : t("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
