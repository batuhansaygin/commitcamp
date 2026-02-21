"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  AuthChangeEvent,
  Session,
  User as SupabaseUser,
} from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  level: number;
  role: string;
}

interface UserContextValue {
  user: SupabaseUser | null;
  profile: UserProfile | null;
  /** True only on the very first load — false once initial data is resolved */
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  profile: null,
  isLoading: true,
  refreshProfile: async () => {},
});

interface UserProviderProps {
  /** Pre-fetched server-side user (eliminates first-render flash) */
  initialUser: SupabaseUser | null;
  /** Pre-fetched server-side profile (eliminates first-render flash) */
  initialProfile: UserProfile | null;
  children: React.ReactNode;
}

interface ProfileUpdatePayload {
  new: Partial<UserProfile>;
}

export function UserProvider({
  initialUser,
  initialProfile,
  children,
}: UserProviderProps) {
  const [user, setUser] = useState<SupabaseUser | null>(initialUser);
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile);
  // If initial data is provided from server, no loading state needed
  const [isLoading, setIsLoading] = useState(!initialUser && !initialProfile);
  const realtimeRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, level, role")
      .eq("id", userId)
      .single();
    if (data) setProfile(data as UserProfile);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  // Auth state listener — handles login/logout/token refresh
  useEffect(() => {
    const supabase = createClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        const nextUser = session?.user ?? null;
        setUser(nextUser);

        if (nextUser) {
          await fetchProfile(nextUser.id);
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    // If no initial server data was provided, do a client-side fetch
    if (!initialUser) {
      supabase.auth.getUser().then(async (result: { data: { user: SupabaseUser | null } }) => {
        const u = result.data.user;
        setUser(u);
        if (u) await fetchProfile(u.id);
        setIsLoading(false);
      });
    }

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Profile real-time subscription — updates all consumers instantly
  // when the user changes their avatar, display name, etc.
  useEffect(() => {
    if (!user) return;

    const supabase = createClient();

    realtimeRef.current = supabase
      .channel(`profile_updates:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload: ProfileUpdatePayload) => {
          setProfile((prev) =>
            prev ? { ...prev, ...payload.new } : null
          );
        }
      )
      .subscribe();

    return () => {
      if (realtimeRef.current) {
        supabase.removeChannel(realtimeRef.current);
        realtimeRef.current = null;
      }
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <UserContext.Provider value={{ user, profile, isLoading, refreshProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
