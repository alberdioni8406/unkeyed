import { type Event, type Filter } from "nostr-tools";
import { nip19 } from "nostr-tools";
import { queryEvents, resolveAddressableEvent } from "./query";
import { publishEvent } from "./publish";
import { signEvent } from "./signer";
import type { Article, ArticleMeta, NostrProfile } from "@/types/nostr";
import { getProfile } from "./profiles";

function getTagValue(tags: string[][], name: string): string | undefined {
  const tag = tags.find((t) => t[0] === name);
  return tag?.[1];
}

function getTagValues(tags: string[][], name: string): string[] {
  return tags.filter((t) => t[0] === name).map((t) => t[1]).filter(Boolean);
}

export function parseArticleEvent(event: Event): Article | null {
  if (event.kind !== 30023) return null;

  const d = getTagValue(event.tags, "d");
  if (!d) return null;

  const title = getTagValue(event.tags, "title") || "Untitled";
  const summary = getTagValue(event.tags, "summary");
  const image = getTagValue(event.tags, "image");
  const publishedAtStr = getTagValue(event.tags, "published_at");
  const published_at = publishedAtStr
    ? parseInt(publishedAtStr, 10)
    : event.created_at;
  const tags = getTagValues(event.tags, "t");

  const address = `30023:${event.pubkey}:${d}`;

  let naddr = "";
  try {
    naddr = nip19.naddrEncode({
      identifier: d,
      pubkey: event.pubkey,
      kind: 30023,
    });
  } catch {
    // ignore
  }

  return {
    id: event.id,
    pubkey: event.pubkey,
    meta: {
      d,
      title,
      summary,
      image,
      published_at,
      tags,
      naddr,
    },
    content: event.content,
    created_at: event.created_at,
    published_at,
    naddr,
    address,
  };
}

export async function fetchLatestArticles(
  limit = 20
): Promise<Article[]> {
  const filters: Filter[] = [
    {
      kinds: [30023],
      limit,
    },
  ];

  const events = await queryEvents(filters, { maxEvents: limit * 2 });
  const articles: Article[] = [];

  for (const ev of events) {
    const article = parseArticleEvent(ev);
    if (article) articles.push(article);
  }

  // Deduplicate by address, keep newest
  const byAddress = new Map<string, Article>();
  for (const a of articles) {
    const existing = byAddress.get(a.address);
    if (!existing || a.created_at > existing.created_at) {
      byAddress.set(a.address, a);
    }
  }

  return Array.from(byAddress.values())
    .sort((a, b) => b.published_at - a.published_at)
    .slice(0, limit);
}

export async function fetchArticleBySlug(
  slug: string,
  authorPubkey?: string
): Promise<Article | null> {
  // Try as d-tag first. If author known, use it.
  if (authorPubkey) {
    const event = await resolveAddressableEvent(authorPubkey, slug);
    if (event) return parseArticleEvent(event);
  }

  // Fallback: search by d-tag across authors (less efficient)
  const filters: Filter[] = [
    {
      kinds: [30023],
      "#d": [slug],
      limit: 10,
    },
  ];
  const events = await queryEvents(filters);
  if (events.length === 0) return null;

  // Pick the newest
  const newest = events.sort((a, b) => b.created_at - a.created_at)[0];
  return parseArticleEvent(newest);
}

export async function fetchArticlesByAuthor(
  pubkey: string,
  limit = 50
): Promise<Article[]> {
  const filters: Filter[] = [
    {
      kinds: [30023],
      authors: [pubkey],
      limit,
    },
  ];
  const events = await queryEvents(filters, { maxEvents: limit * 2 });
  const articles: Article[] = [];

  const byD = new Map<string, Article>();
  for (const ev of events) {
    const article = parseArticleEvent(ev);
    if (article) {
      const existing = byD.get(article.meta.d);
      if (!existing || article.created_at > existing.created_at) {
        byD.set(article.meta.d, article);
      }
    }
  }

  return Array.from(byD.values()).sort(
    (a, b) => b.published_at - a.published_at
  );
}

export interface CreateArticleInput {
  title: string;
  summary?: string;
  content: string;
  image?: string;
  tags?: string[];
  d?: string; // for edits – keep same d-tag
  published_at?: number;
}

export async function createAndPublishArticle(
  input: CreateArticleInput
): Promise<{ article: Article; publishResult: Awaited<ReturnType<typeof publishEvent>> }> {
  const d =
    input.d ||
    input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 64) ||
    `article-${Date.now()}`;

  const now = Math.floor(Date.now() / 1000);
  const published_at = input.published_at || now;

  const tags: string[][] = [
    ["d", d],
    ["title", input.title],
    ["published_at", String(published_at)],
  ];

  if (input.summary) tags.push(["summary", input.summary]);
  if (input.image) tags.push(["image", input.image]);
  if (input.tags) {
    for (const t of input.tags) {
      if (t.trim()) tags.push(["t", t.trim().toLowerCase()]);
    }
  }

  const unsigned = {
    kind: 30023,
    created_at: now,
    tags,
    content: input.content,
  };

  const signed = await signEvent(unsigned);
  if (!signed) throw new Error("Signing failed");

  const publishResult = await publishEvent(signed);
  const article = parseArticleEvent(signed);
  if (!article) throw new Error("Failed to parse published article");

  return { article, publishResult };
}

export function estimateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}
