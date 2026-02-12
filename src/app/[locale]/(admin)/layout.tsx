import { setRequestLocale } from "next-intl/server";
import { Header } from "@/components/layout/header";
import { BackButton } from "@/components/layout/back-button";

interface AdminLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        {/* Admin Sidebar */}
        <aside className="hidden w-60 border-r border-border bg-card/50 md:block">
          <div className="p-4">
            <div className="mb-4">
              <BackButton />
            </div>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Admin Panel
            </h2>
            <nav className="space-y-1">
              {[
                { href: "/admin", label: "Dashboard", icon: "📊" },
                { href: "/admin/users", label: "Users", icon: "👥" },
                { href: "/admin/reports", label: "Reports", icon: "📋" },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <span>{item.icon}</span>
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
