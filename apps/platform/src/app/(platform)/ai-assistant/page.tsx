import { setRequestLocale } from "@/lib/i18n-server";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AIChatPage } from "@/components/ai/ai-chat-page";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export const metadata: Metadata = {
  title: "AI Assistant — CommitCamp",
  description: "Your personal AI coding assistant. Powered by Gemini 2.5 Flash and Llama 3.3.",
};

export default async function AIAssistantPage({ params }: PageProps) {

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login`);

  return (
    <div className="h-full">
      <AIChatPage />
    </div>
  );
}
