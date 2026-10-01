"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchArticleBySlug, estimateReadingTime } from "@/lib/nostr/articles";
import { getProfile, displayName, npubFromPubkey } from "@/lib/nostr/profiles";
import type { Article, NostrProfile } from "@/types/nostr";
import { ArticleRenderer } from "@/components/ArticleRenderer";
import { BCHTipSection } from "@/components/BCHTipSection";

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ArticlePage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [author, setAuthor] = useState<NostrProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const art = await fetchArticleBySlug(slug);
        if (cancelled) return;
        if (!art) {
          setError("Article not found on configured relays.");
          setLoading(false);
          return;
        }
        setArticle(art);
        const profile = await getProfile(art.pubkey);
        if (!cancelled) setAuthor(profile);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load article");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-[var(--text-muted)] animate-pulse">
          Loading article from Nostr relays…
        </p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-[var(--danger)]">{error || "Article not found"}</p>
        <Link
          href="/"
          className="mt-4 inline-block text-sm text-[var(--accent)] hover:underline"
        >
          ← Back to home
        </Link>
      </div>
    );
  }

  const minutes = estimateReadingTime(article.content);
  const npub = npubFromPubkey(article.pubkey);

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      {/* Header */}
      <header className="mb-10">
        {article.meta.image && (
          <div className="mb-8 -mx-4 sm:mx-0 overflow-hidden rounded-none sm:rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.meta.image}
              alt=""
              className="w-full max-h-[420px] object-cover"
            />
          </div>
        )}

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)] leading-tight">
          {article.meta.title}
        </h1>

        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[var(--text-muted)]">
          <Link
            href={`/author/${npub}`}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
          >
            {author?.picture ? (
              <img
                src={author.picture}
                alt=""
                className="h-8 w-8 rounded-full object-cover border border-[var(--border)]"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center text-xs text-[var(--accent)]">
                {(displayName(author)[0] || "?").toUpperCase()}
              </div>
            )}
            <span className="font-medium">{displayName(author)}</span>
          </Link>
          <span>·</span>
          <time dateTime={new Date(article.published_at * 1000).toISOString()}>
            {formatDate(article.published_at)}
          </time>
          <span>·</span>
          <span>{minutes} min read</span>
        </div>

        {article.meta.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {article.meta.tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-0.5 text-xs text-[var(--text-muted)]"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Content */}
      <div className="mb-14">
        <ArticleRenderer content={article.content} />
      </div>

      {/* Tip section */}
      <BCHTipSection
        articleAddress={article.address}
        authorPubkey={article.pubkey}
        authorName={displayName(author)}
      />

      {/* Nostr identity note */}
      <div className="mt-10 pt-6 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
        <p>
          This article is a signed Nostr event (kind 30023). Canonical identity:{" "}
          <code className="text-[var(--accent)]">{article.address}</code>
        </p>
        {article.naddr && (
          <p className="mt-1 truncate">
            naddr: <code className="text-[var(--text-secondary)]">{article.naddr}</code>
          </p>
        )}
      </div>
    </article>
  );
}
