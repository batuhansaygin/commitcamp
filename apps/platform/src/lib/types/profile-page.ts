import type { Profile } from "./profiles";

export interface ProfileStats {
  posts_count: number;
  total_likes: number;
  followers_count: number;
  following_count: number;
  total_xp: number;
  member_since: string;
}

export interface ProfilePageData {
  profile: Profile;
  stats: ProfileStats;
  isOwnProfile: boolean;
  isFollowing: boolean;
}

export interface FollowerEntry {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  level: number;
  bio: string | null;
}

export type { Profile };
