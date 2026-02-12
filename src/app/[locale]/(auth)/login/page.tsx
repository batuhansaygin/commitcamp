import { setRequestLocale } from "next-intl/server";
import { LoginForm } from "@/components/auth/login-form";
import { Header } from "@/components/layout/header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your CommitCamp account.",
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function LoginPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center p-4">
        <LoginForm />
      </main>
    </div>
  );
}
