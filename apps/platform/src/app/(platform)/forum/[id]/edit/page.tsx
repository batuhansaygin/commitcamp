import { setRequestLocale } from "@/lib/i18n-server";
import { notFound } from "next/navigation";
import { PostEditForm } from "@/components/forum/post-edit-form";
import { getPostById } from "@/lib/actions/posts";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit Post" };

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function ForumPostEditPage({ params }: PageProps) {
  const { id } = await params;

  const { data: post } = await getPostById(id);
  if (!post) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthor = user?.id === post.user_id;

  if (!isAuthor) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PostEditForm post={post} />
    </div>
  );
}
