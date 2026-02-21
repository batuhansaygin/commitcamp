"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "@/lib/i18n";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";

const STORAGE_KEY = "saveToolHistory";

export function ToolsSaveSwitch({
  defaultChecked = false,
  onToggle,
}: {
  defaultChecked?: boolean;
  onToggle?: (checked: boolean) => void;
}) {
  const t = useTranslations("tools");
  const [checked, setChecked] = useState(defaultChecked);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    const value = stored === "true";
    setChecked(value);
  }, []);

  const handleChange = (value: boolean) => {
    setChecked(value);
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, String(value));
    }
    onToggle?.(value);
  };

  if (!mounted) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
        <Save className="h-4 w-4 text-muted-foreground" />
        <div className="flex-1">
          <Label className="text-sm font-medium">{t("saveHistory")}</Label>
          <p className="text-xs text-muted-foreground mt-0.5">{t("saveHistoryHint")}</p>
        </div>
        <Switch checked={false} disabled />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
      <Save className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <Label htmlFor="save-history" className="text-sm font-medium cursor-pointer">
          {t("saveHistory")}
        </Label>
        <p className="text-xs text-muted-foreground mt-0.5">{t("saveHistoryHint")}</p>
      </div>
      <Switch
        id="save-history"
        checked={checked}
        onCheckedChange={handleChange}
        aria-label={t("saveHistory")}
      />
    </div>
  );
}

export function getSaveHistoryPreference(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "true";
}
