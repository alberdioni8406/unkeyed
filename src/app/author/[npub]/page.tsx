"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { pubkeyFromNpub, getProfile, displayName, npubFromPubkey } from "@/lib/nostr/profiles";
import { fetchArticlesByAuthor, estimateReadingTime } from "@/lib/nostr/articles";
import type { Article, NostrProfile } from "@/types/nostr";

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AuthorPage() {
  const params = useParams();
  const npubOrHex = params?.npub as string;

  const [profile, setProfile] = useState<NostrProfile | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!npubOrHex) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        let pubkey = pubkeyFromNpub(npubOrHex);
        if (!pubkey) {
          // maybe already hex
          if (/^[0-9a-f]{64}$/i.test(npubOrHex)) {
            pubkey = npubOrHex.toLowerCase();
          } else {
            setError("Invalid Nostr identity");
            setLoading(false);
            return;
          }
        }

        const [p, arts] = await Promise.all([
          getProfile(pubkey),
          fetchArticlesByAuthor(pubkey),
        ]);
        if (cancelled) return;
        setProfile(p);
        setArticles(arts);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load author");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [npubOrHex]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-[var(--text-muted)] animate-pulse">
          Loading author from Nostr…
        </p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-[var(--danger)]">{error || "Author not found"}</p>
        <Link href="/" className="mt-4 inline-block text-sm text-[var(--accent)] hover:underline">
          ← Home
        </Link>
      </div>
    );
  }

  const npub = npubFromPubkey(profile.pubkey);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="flex flex-col sm:flex-row items-start gap-5 mb-10">
        {profile.picture ? (
          <img
            src={profile.picture}
            alt=""
            className="h-20 w-20 rounded-full object-cover border-2 border-[var(--border)]"
          />
        ) : (
          <div className="h-20 w-20 rounded-full bg-[var(--bg-elevated)] border-2 border-[var(--border)] flex items-center justify-center text-2xl text-[var(--accent)]">
            {(displayName(profile)[0] || "?").toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            {displayName(profile)}
          </h1>
          {profile.name && profile.display_name && (
            <p className="text-sm text-[var(--text-muted)]">@{profile.name}</p>
          )}
          <p className="mt-1 text-xs font-mono text-[var(--text-muted)] truncate max-w-xs">
            {npub}
          </p>
          {profile.about && (
            <p className="mt-3 text-sm text-[var(--text-secondary)] max-w-md">
              {profile.about}
            </p>
          )}
          {profile.nip05 && (
            <p className="mt-1 text-xs text-[var(--accent)]">{profile.nip05}</p>
          )}
        </div>
      </header>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-4">
          Articles
        </h2>
        {articles.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">
            No articles found on the configured relays.
          </p>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {articles.map((a) => (
              <article key={a.id} className="py-5">
                <Link href={`/blog/${a.meta.d}`} className="group">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                    {a.meta.title}
                  </h3>
                  <div className="mt-1 text-sm text-[var(--text-muted)]">
                    {formatDate(a.published_at)} · {estimateReadingTime(a.content)} min read
                  </div>
                  {a.meta.summary && (
                    <p className="mt-1.5 text-sm text-[var(--text-secondary)] line-clamp-2">
                      {a.meta.summary}
                    </p>
                  )}
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
