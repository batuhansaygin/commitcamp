import { setRequestLocale } from "@/lib/i18n-server";
import { PostForm } from "@/components/forum/post-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New Post" };

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function NewPostPage({ params }: PageProps) {

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PostForm />
    </div>
  );
}
