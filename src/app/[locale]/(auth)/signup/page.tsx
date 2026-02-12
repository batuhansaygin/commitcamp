import { setRequestLocale } from "next-intl/server";
import { SignupForm } from "@/components/auth/signup-form";
import { Header } from "@/components/layout/header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your CommitCamp account and join the developer community.",
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function SignupPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center p-4">
        <SignupForm />
      </main>
    </div>
  );
}
