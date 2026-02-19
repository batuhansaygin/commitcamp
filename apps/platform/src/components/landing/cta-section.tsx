"use client";

import { useTranslations } from "@/lib/i18n";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { FadeInUp } from "./motion-wrappers";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  const t = useTranslations("landing.cta");

  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[700px] rounded-full bg-gradient-to-r from-cyan-500/10 to-purple-500/10 blur-3xl" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 md:px-6 text-center">
        <FadeInUp>
          {/* Accent line */}
          <div className="mx-auto mb-6 h-px w-24 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />

          <h2 className="text-3xl font-black tracking-tight md:text-5xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-muted-foreground md:text-lg max-w-xl mx-auto">
            {t("subtitle")}
          </p>

          <div className="mt-10">
            <Link href="/signup">
              <Button
                size="lg"
                className="h-14 px-10 text-base font-semibold bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:from-cyan-600 hover:to-purple-700 border-0 shadow-2xl shadow-cyan-500/30 transition-all hover:scale-105 hover:shadow-cyan-500/50"
              >
                {t("button")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            {t("signIn")}{" "}
            <Link href="/login" className="text-foreground font-medium underline underline-offset-4 hover:text-primary transition-colors">
              {t("signInLink")} →
            </Link>
          </p>
        </FadeInUp>
      </div>
    </section>
  );
}
