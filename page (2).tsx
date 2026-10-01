"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchLatestArticles, estimateReadingTime } from "@/lib/nostr/articles";
import { getProfile, displayName, npubFromPubkey } from "@/lib/nostr/profiles";
import type { Article, NostrProfile } from "@/types/nostr";
import { useNostr } from "@/components/NostrProvider";

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function HomePage() {
  const { connect, pubkey, isConnecting } = useNostr();
  const [articles, setArticles] = useState<Article[]>([]);
  const [profiles, setProfiles] = useState<Record<string, NostrProfile>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const list = await fetchLatestArticles(12);
        if (cancelled) return;
        setArticles(list);

        // Load profiles in parallel
        const uniquePubkeys = [...new Set(list.map((a) => a.pubkey))];
        const profileEntries = await Promise.all(
          uniquePubkeys.map(async (pk) => {
            const p = await getProfile(pk);
            return [pk, p] as const;
          })
        );
        if (cancelled) return;
        const map: Record<string, NostrProfile> = {};
        for (const [pk, p] of profileEntries) {
          if (p) map[pk] = p;
        }
        setProfiles(map);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load articles");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
      {/* Hero */}
      <section className="mb-16 text-center sm:text-left">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[var(--text-primary)]">
          Unkeyed
        </h1>
        <p className="mt-3 text-xl sm:text-2xl text-[var(--accent)] font-medium">
          Your words. Your keys. Your BCH.
        </p>
        <p className="mt-4 max-w-xl text-[var(--text-secondary)] leading-relaxed">
          Publish long-form articles on Nostr. Readers tip you directly in
          Bitcoin Cash. No platform custody. No accounts. Just keys.
        </p>
        {!pubkey && (
          <button
            onClick={connect}
            disabled={isConnecting}
            className="mt-6 inline-flex items-center rounded-full bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-[var(--bg-primary)] hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-60 shadow-[var(--glow)]"
          >
            {isConnecting ? "Connecting…" : "Connect Nostr to publish"}
          </button>
        )}
        {pubkey && (
          <Link
            href="/write"
            className="mt-6 inline-flex items-center rounded-full bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-[var(--bg-primary)] hover:bg-[var(--accent-hover)] transition-colors shadow-[var(--glow)]"
          >
            Write an article
          </Link>
        )}
      </section>

      {/* Latest */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] tracking-wide">
            Latest
          </h2>
          {loading && (
            <span className="text-xs text-[var(--text-muted)] animate-pulse">
              Querying relays…
            </span>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)] mb-6">
            {error}
            <p className="mt-1 text-xs opacity-80">
              Relays may be slow or offline. Try refreshing.
            </p>
          </div>
        )}

        {!loading && articles.length === 0 && !error && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-6 py-12 text-center">
            <p className="text-[var(--text-secondary)]">
              No articles found on the configured relays yet.
            </p>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Be the first to publish.
            </p>
            <Link
              href="/write"
              className="mt-4 inline-block text-sm text-[var(--accent)] hover:underline"
            >
              Write an article →
            </Link>
          </div>
        )}

        <div className="space-y-0 divide-y divide-[var(--border)]">
          {articles.map((article) => {
            const author = profiles[article.pubkey];
            const minutes = estimateReadingTime(article.content);
            return (
              <article key={article.id} className="py-6 first:pt-0">
                <Link
                  href={`/blog/${article.meta.d}`}
                  className="group block"
                >
                  <h3 className="text-xl font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                    {article.meta.title}
                  </h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--text-muted)]">
                    <span className="text-[var(--text-secondary)]">
                      {displayName(author)}
                    </span>
                    <span>·</span>
                    <time dateTime={new Date(article.published_at * 1000).toISOString()}>
                      {formatDate(article.published_at)}
                    </time>
                    <span>·</span>
                    <span>{minutes} min read</span>
                  </div>
                  {article.meta.summary && (
                    <p className="mt-2 text-[var(--text-secondary)] line-clamp-2 max-w-2xl">
                      {article.meta.summary}
                    </p>
                  )}
                </Link>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
