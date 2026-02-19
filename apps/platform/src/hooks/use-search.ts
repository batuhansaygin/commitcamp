"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { globalSearch } from "@/lib/actions/search";
import type { SearchResults, SearchCategory } from "@/lib/types/search";

const RECENT_KEY = "cc_recent_searches";
const MAX_RECENT = 5;
const DEBOUNCE_MS = 300;

function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveRecent(searches: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(searches));
  } catch {
    // ignore
  }
}

export function useSearch() {
  const [isOpen, setIsOpen]                     = useState(false);
  const [query, setQuery]                       = useState("");
  const [results, setResults]                   = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading]               = useState(false);
  const [activeCategory, setActiveCategory]     = useState<SearchCategory>("all");
  const [recentSearches, setRecentSearches]     = useState<string[]>([]);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    setRecentSearches(loadRecent());
  }, []);

  // Keyboard shortcut (Cmd+K / Ctrl+K) + custom open event from SearchTrigger button
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    }
    function handleOpenEvent() {
      setIsOpen(true);
    }
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("open-search-command", handleOpenEvent);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("open-search-command", handleOpenEvent);
    };
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (query.trim().length < 2) {
      setResults(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    debounceTimer.current = setTimeout(async () => {
      const data = await globalSearch(query.trim());
      setResults(data);
      setIsLoading(false);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  // Clear query when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults(null);
      setIsLoading(false);
      setActiveCategory("all");
    }
  }, [isOpen]);

  const addToRecent = useCallback((q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s !== trimmed);
      const next = [trimmed, ...filtered].slice(0, MAX_RECENT);
      saveRecent(next);
      return next;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecentSearches([]);
    saveRecent([]);
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
  }, []);

  return {
    isOpen,
    setIsOpen: handleOpenChange,
    query,
    setQuery,
    results,
    isLoading,
    activeCategory,
    setActiveCategory,
    recentSearches,
    addToRecent,
    clearRecent,
  };
}
