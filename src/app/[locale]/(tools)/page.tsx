import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const TOOLS = [
  { href: "/tools/json-formatter", icon: "{ }", titleKey: "jsonFormatter", color: "from-cyan-500 to-blue-500" },
  { href: "/tools/regex-tester", icon: ".*", titleKey: "regexTester", color: "from-purple-500 to-pink-500" },
  { href: "/tools/base64-encoder", icon: "B64", titleKey: "base64Encoder", color: "from-green-500 to-emerald-500" },
  { href: "/tools/color-converter", icon: "◆", titleKey: "colorConverter", color: "from-orange-500 to-red-500" },
  { href: "/tools/uuid-generator", icon: "#", titleKey: "uuidGenerator", color: "from-blue-500 to-indigo-500" },
  { href: "/tools/jwt-decoder", icon: "🔑", titleKey: "jwtDecoder", color: "from-red-500 to-rose-500" },
  { href: "/tools/timestamp-converter", icon: "⏱", titleKey: "timestampConverter", color: "from-indigo-500 to-purple-500" },
  { href: "/tools/lorem-generator", icon: "¶", titleKey: "loremGenerator", color: "from-pink-500 to-fuchsia-500" },
] as const;

interface ToolsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function ToolsPage({ params }: ToolsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ToolsGrid />;
}

function ToolsGrid() {
  const t = useTranslations("tools");

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-2xl font-bold">
          Welcome to <span className="gradient-text">CommitCamp</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          All the developer utilities you need in one place. Fast, private, and fully client-side.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TOOLS.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-5 text-center transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${tool.color} text-white text-lg font-mono shadow-md transition-transform group-hover:scale-110`}
            >
              {tool.icon}
            </div>
            <div>
              <h3 className="text-sm font-semibold">{t(`${tool.titleKey}.title`)}</h3>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {t(`${tool.titleKey}.description`)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
