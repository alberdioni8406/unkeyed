"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useNostr } from "@/components/NostrProvider";
import { createAndPublishArticle } from "@/lib/nostr/articles";
import type { PublishResult } from "@/lib/nostr/publish";

export default function WritePage() {
  const { pubkey, connect, isConnecting } = useNostr();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [tags, setTags] = useState("");
  const [preview, setPreview] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePublish = useCallback(async () => {
    if (!pubkey) {
      await connect();
      return;
    }
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }

    setPublishing(true);
    setError(null);
    setPublishResult(null);

    try {
      const tagList = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const { article, publishResult: result } = await createAndPublishArticle({
        title: title.trim(),
        summary: summary.trim() || undefined,
        content: content.trim(),
        image: image.trim() || undefined,
        tags: tagList,
      });

      setPublishResult(result);

      if (result.success) {
        // Small delay so user sees success, then navigate
        setTimeout(() => {
          router.push(`/blog/${article.meta.d}`);
        }, 1500);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to publish");
    } finally {
      setPublishing(false);
    }
  }, [pubkey, connect, title, summary, content, image, tags, router]);

  if (!pubkey) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Write an article
        </h1>
        <p className="mt-3 text-[var(--text-secondary)]">
          Connect your Nostr signer to publish. Your article will be signed
          with your key and sent to multiple relays. We never hold your keys
          or your content.
        </p>
        <button
          onClick={connect}
          disabled={isConnecting}
          className="mt-6 rounded-full bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-[var(--bg-primary)] hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-60"
        >
          {isConnecting ? "Connecting…" : "Connect Nostr"}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Write
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Publishing signs the article with your Nostr key and broadcasts it
          to relays. The platform does not store the canonical copy.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </div>
      )}

      {publishResult && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            publishResult.success
              ? "border-[var(--success)]/40 bg-[var(--success)]/10 text-[var(--success)]"
              : "border-[var(--warning)]/40 bg-[var(--warning)]/10 text-[var(--warning)]"
          }`}
        >
          {publishResult.success
            ? "Published successfully. Redirecting…"
            : "Some relays failed, but the event may still be available."}
          <ul className="mt-2 text-xs space-y-0.5 opacity-80">
            {publishResult.relayResults.map((r) => (
              <li key={r.url}>
                {r.success ? "✓" : "✗"} {r.url.replace("wss://", "")}
                {r.error ? ` — ${r.error}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Article title"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">
            Summary
          </label>
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Short summary for previews"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">
            Cover image URL
          </label>
          <input
            type="url"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://…"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">
            Tags (comma separated)
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="bitcoin-cash, nostr, privacy"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
              Content (Markdown)
            </label>
            <button
              type="button"
              onClick={() => setPreview(!preview)}
              className="text-xs text-[var(--accent)] hover:underline"
            >
              {preview ? "Edit" : "Preview"}
            </button>
          </div>
          {preview ? (
            <div className="prose min-h-[320px] rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-5 py-4">
              {/* Simple preview – full renderer on article page */}
              <pre className="whitespace-pre-wrap font-sans text-sm text-[var(--text-secondary)]">
                {content || "Nothing to preview yet."}
              </pre>
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="# Heading&#10;&#10;Write your article in Markdown…"
              rows={16}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none font-mono text-sm leading-relaxed resize-y"
            />
          )}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handlePublish}
            disabled={publishing || !title.trim() || !content.trim()}
            className="rounded-full bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-[var(--bg-primary)] hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[var(--glow)]"
          >
            {publishing ? "Signing & publishing…" : "Publish with Nostr"}
          </button>
          <p className="text-xs text-[var(--text-muted)]">
            Signs with your key · Broadcasts to multiple relays
          </p>
        </div>
      </div>
    </div>
  );
}
