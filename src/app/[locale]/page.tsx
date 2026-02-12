import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ArrowRight, Shield, Zap, Heart, Code, Hash, Palette, Key, Clock, FileText, Braces, Regex } from "lucide-react";

const TOOLS = [
  { href: "/tools/json-formatter", icon: Braces, title: "jsonFormatter", color: "from-cyan-500 to-blue-500" },
  { href: "/tools/regex-tester", icon: Regex, title: "regexTester", color: "from-purple-500 to-pink-500" },
  { href: "/tools/base64-encoder", icon: Code, title: "base64Encoder", color: "from-green-500 to-emerald-500" },
  { href: "/tools/color-converter", icon: Palette, title: "colorConverter", color: "from-orange-500 to-red-500" },
  { href: "/tools/uuid-generator", icon: Hash, title: "uuidGenerator", color: "from-blue-500 to-indigo-500" },
  { href: "/tools/jwt-decoder", icon: Key, title: "jwtDecoder", color: "from-red-500 to-rose-500" },
  { href: "/tools/timestamp-converter", icon: Clock, title: "timestampConverter", color: "from-indigo-500 to-purple-500" },
  { href: "/tools/lorem-generator", icon: FileText, title: "loremGenerator", color: "from-pink-500 to-fuchsia-500" },
] as const;

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function LandingPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LandingContent />;
}

function LandingContent() {
  const t = useTranslations("landing");
  const tTools = useTranslations("tools");

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-4 py-20 text-center md:py-32">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-gradient-to-br from-cyan-accent/10 to-purple-accent/10 blur-3xl" />
        </div>

        <div className="mb-4 inline-flex items-center rounded-full border border-border bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
          <Zap className="mr-1.5 h-3 w-3 text-cyan-accent" />
          {t("hero.badge")}
        </div>

        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight md:text-6xl">
          {t("hero.title")}{" "}
          <span className="gradient-text">{t("hero.titleHighlight")}</span>
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground md:text-base">
          {t("hero.subtitle")}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/tools"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-accent to-purple-accent px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-accent/20 transition-transform hover:scale-105"
          >
            {t("hero.cta")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">{t("features.title")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("features.subtitle")}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Shield, title: t("features.clientSide"), desc: t("features.clientSideDesc"), color: "text-cyan-accent" },
            { icon: Zap, title: t("features.fast"), desc: t("features.fastDesc"), color: "text-purple-accent" },
            { icon: Heart, title: t("features.open"), desc: t("features.openDesc"), color: "text-pink-accent" },
          ].map((feature) => (
            <div key={feature.title} className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/30">
              <feature.icon className={`mb-3 h-8 w-8 ${feature.color}`} />
              <h3 className="mb-1 font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tools Grid */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">{t("toolsSection.title")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("toolsSection.subtitle")}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 text-center transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${tool.color} text-white shadow-md transition-transform group-hover:scale-110`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{tTools(`${tool.title}.title`)}</h3>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {tTools(`${tool.title}.description`)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <Footer />
    </div>
  );
}
