"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClipboard } from "@/hooks/use-clipboard";
import { Copy, Check } from "lucide-react";

// ── Color conversion helpers ──
function hexToRgb(hex: string) {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  const n = parseInt(hex, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r: number, g: number, b: number) {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h: number, s: number, l: number) {
  h /= 360; s /= 100; l /= 100;
  let r: number, g: number, b: number;
  if (s === 0) { r = g = b = l; }
  else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

type PaletteMode = "complementary" | "analogous" | "triadic";

function generatePalette(h: number, s: number, l: number, mode: PaletteMode) {
  const colors: { h: number; s: number; l: number }[] = [];
  switch (mode) {
    case "complementary":
      colors.push({ h, s, l }, { h: (h + 180) % 360, s, l });
      colors.push({ h, s, l: Math.min(l + 20, 95) }, { h, s, l: Math.max(l - 20, 5) });
      colors.push({ h: (h + 180) % 360, s, l: Math.min(l + 15, 95) });
      colors.push({ h: (h + 180) % 360, s, l: Math.max(l - 15, 5) });
      break;
    case "analogous":
      [-30, -15, 0, 15, 30, 45].forEach((offset) => colors.push({ h: (h + offset + 360) % 360, s, l }));
      break;
    case "triadic":
      [0, 120, 240].forEach((offset) => colors.push({ h: (h + offset) % 360, s, l }));
      colors.push({ h, s, l: Math.min(l + 20, 95) });
      colors.push({ h: (h + 120) % 360, s, l: Math.max(l - 15, 5) });
      colors.push({ h: (h + 240) % 360, s, l: Math.min(l + 15, 95) });
      break;
  }
  return colors.map((c) => {
    const { r, g, b } = hslToRgb(c.h, c.s, c.l);
    return rgbToHex(r, g, b);
  });
}

export function ColorConverter() {
  const t = useTranslations("tools.colorConverter");
  const { copy, copied } = useClipboard();
  const [hex, setHex] = useState("#00d4ff");
  const [rgb, setRgb] = useState("rgb(0, 212, 255)");
  const [hsl, setHsl] = useState("hsl(190, 100%, 50%)");
  const [paletteMode, setPaletteMode] = useState<PaletteMode>("complementary");
  const [recentColors, setRecentColors] = useState<string[]>([]);

  const updateFromHex = useCallback(
    (newHex: string) => {
      if (!/^#[0-9A-Fa-f]{6}$/.test(newHex)) return;
      const { r, g, b } = hexToRgb(newHex);
      const { h, s, l } = rgbToHsl(r, g, b);
      setHex(newHex);
      setRgb(`rgb(${r}, ${g}, ${b})`);
      setHsl(`hsl(${h}, ${s}%, ${l}%)`);
      setRecentColors((prev) => {
        if (prev.includes(newHex)) return prev;
        return [newHex, ...prev].slice(0, 12);
      });
    },
    []
  );

  const handleHexChange = (val: string) => {
    let v = val.trim();
    if (!v.startsWith("#")) v = "#" + v;
    setHex(v);
    updateFromHex(v);
  };

  const handleRgbChange = (val: string) => {
    setRgb(val);
    const m = val.match(/(\d+)/g);
    if (m && m.length >= 3) {
      updateFromHex(rgbToHex(parseInt(m[0]), parseInt(m[1]), parseInt(m[2])));
    }
  };

  const handleHslChange = (val: string) => {
    setHsl(val);
    const m = val.match(/(\d+)/g);
    if (m && m.length >= 3) {
      const { r, g, b } = hslToRgb(parseInt(m[0]), parseInt(m[1]), parseInt(m[2]));
      updateFromHex(rgbToHex(r, g, b));
    }
  };

  const { r, g, b } = hexToRgb(hex.length === 7 ? hex : "#00d4ff");
  const { h, s, l } = rgbToHsl(r, g, b);
  const palette = generatePalette(h, s, l, paletteMode);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t("pickerTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <input
              type="color"
              value={hex.length === 7 ? hex : "#00d4ff"}
              onChange={(e) => updateFromHex(e.target.value)}
              className="h-20 w-20 cursor-pointer rounded-lg border-0 bg-transparent"
            />
            <div className="flex-1 rounded-xl" style={{ background: hex.length === 7 ? hex : "#00d4ff" }} />
          </div>
          <div className="space-y-3">
            {[
              { label: "HEX", value: hex, onChange: handleHexChange },
              { label: "RGB", value: rgb, onChange: handleRgbChange },
              { label: "HSL", value: hsl, onChange: handleHslChange },
            ].map((field) => (
              <div key={field.label}>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">{field.label}</label>
                <div className="flex gap-2">
                  <input
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-input px-3 py-1.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copy(field.value)}>
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>{t("paletteTitle")}</CardTitle>
          <Tabs value={paletteMode} onValueChange={(v) => setPaletteMode(v as PaletteMode)}>
            <TabsList>
              <TabsTrigger value="complementary">{t("complementary")}</TabsTrigger>
              <TabsTrigger value="analogous">{t("analogous")}</TabsTrigger>
              <TabsTrigger value="triadic">{t("triadic")}</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-6 gap-2">
            {palette.map((color, i) => (
              <button
                key={i}
                onClick={() => updateFromHex(color)}
                className="flex flex-col items-center gap-1 cursor-pointer"
              >
                <div className="aspect-square w-full rounded-lg border border-border" style={{ background: color }} />
                <span className="text-[10px] font-mono text-muted-foreground">{color}</span>
              </button>
            ))}
          </div>

          {recentColors.length > 0 && (
            <>
              <div className="border-t border-border pt-4">
                <h4 className="mb-2 text-xs font-medium text-muted-foreground">{t("recentTitle")}</h4>
                <div className="flex flex-wrap gap-2">
                  {recentColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => updateFromHex(color)}
                      className="h-8 w-8 rounded-md border border-border cursor-pointer transition-transform hover:scale-110"
                      style={{ background: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
