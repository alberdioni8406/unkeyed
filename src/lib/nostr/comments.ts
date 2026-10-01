import { type Event, type Filter } from "nostr-tools";
import { queryEvents } from "./query";
import { getProfile } from "./profiles";
import type { CommentEvent } from "@/types/nostr";

/**
 * NIP-22 style comments (kind 1111) or fallback to kind 1 replies tagged with a-tag.
 * For MVP we look for events that reference the article address.
 */
export async function fetchCommentsForArticle(
  articleAddress: string,
  limit = 50
): Promise<CommentEvent[]> {
  // Look for kind 1111 (NIP-22) or kind 1 with a-tag
  const filters: Filter[] = [
    {
      kinds: [1111, 1],
      "#a": [articleAddress],
      limit,
    },
  ];

  const events = await queryEvents(filters, { maxEvents: limit });
  const comments: CommentEvent[] = [];

  for (const ev of events) {
    const author = await getProfile(ev.pubkey);
    comments.push({
      id: ev.id,
      pubkey: ev.pubkey,
      created_at: ev.created_at,
      kind: ev.kind,
      tags: ev.tags,
      content: ev.content,
      sig: ev.sig,
      author: author || undefined,
    });
  }

  return comments.sort((a, b) => a.created_at - b.created_at);
}
