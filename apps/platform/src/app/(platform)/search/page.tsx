import { getTranslations, setRequestLocale } from "@/lib/i18n-server";
import { searchPosts, searchUsers, getPopularTags } from "@/lib/actions/search";
import { SearchResultsClient } from "./search-results-client";
import type { Metadata } from "next";
import type { SearchCategory } from "@/lib/types/search";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; type?: string; tag?: string }>;
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `Search results for "${q}" — CommitCamp` : "Search — CommitCamp",
  };
}

export default async function SearchPage({ params, searchParams }: PageProps) {
  const { q = "", type, tag } = await searchParams;

  const category = (type as SearchCategory) || "all";
  const query = q.trim();

  const [postsResult, usersResult, trendingTags] = await Promise.all([
    query.length >= 2
      ? searchPosts(query, category !== "users" && category !== "tags" ? category : undefined, tag)
      : { data: [], total: 0, error: null },
    query.length >= 2 ? searchUsers(query) : { data: [], total: 0, error: null },
    getPopularTags(15),
  ]);

  return (
    <SearchResultsClient
      initialQuery={query}
      initialTag={tag}
      initialCategory={category}
      initialPosts={postsResult.data}
      initialUsers={usersResult.data}
      trendingTags={trendingTags}
    />
  );
}
