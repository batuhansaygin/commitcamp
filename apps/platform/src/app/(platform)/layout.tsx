import { createClient } from "@/lib/supabase/server";
import { PlatformLayoutClient } from "@/components/layout/platform-layout-client";
import type { UserProfile } from "@/components/providers/user-provider";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: UserProfile | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, level, role")
      .eq("id", user.id)
      .single();
    profile = data as UserProfile | null;
  }

  return (
    <PlatformLayoutClient initialUser={user} initialProfile={profile}>
      {children}
    </PlatformLayoutClient>
  );
}
