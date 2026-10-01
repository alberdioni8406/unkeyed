import { SimplePool, type Filter, type Event } from "nostr-tools";
import { getRelayUrls } from "./relays";

/**
 * Query multiple relays concurrently and deduplicate by event ID.
 * Returns the newest version for addressable events when possible.
 */
export async function queryEvents(
  filters: Filter[],
  options: { timeoutMs?: number; maxEvents?: number } = {}
): Promise<Event[]> {
  const { timeoutMs = 8000, maxEvents = 200 } = options;
  const relays = getRelayUrls();
  const pool = new SimplePool();
  const seen = new Map<string, Event>();

  try {
    const events = await Promise.race([
      pool.querySync(relays, filters),
      new Promise<Event[]>((resolve) =>
        setTimeout(() => resolve([]), timeoutMs)
      ),
    ]);

    for (const ev of events) {
      const existing = seen.get(ev.id);
      if (!existing || ev.created_at > existing.created_at) {
        seen.set(ev.id, ev);
      }
    }
  } finally {
    pool.close(relays);
  }

  return Array.from(seen.values())
    .sort((a, b) => b.created_at - a.created_at)
    .slice(0, maxEvents);
}

/**
 * Resolve the latest addressable event (kind 30023) for author + d-tag.
 */
export async function resolveAddressableEvent(
  pubkey: string,
  dTag: string,
  kind = 30023
): Promise<Event | null> {
  const filters: Filter[] = [
    {
      kinds: [kind],
      authors: [pubkey],
      "#d": [dTag],
      limit: 5,
    },
  ];

  const events = await queryEvents(filters, { timeoutMs: 10000 });
  if (events.length === 0) return null;

  // Prefer highest created_at
  return events.sort((a, b) => b.created_at - a.created_at)[0];
}
