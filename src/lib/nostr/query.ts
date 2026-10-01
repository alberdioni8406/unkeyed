export async function queryEvents(
  filters: Filter[],
  options: { timeoutMs?: number; maxEvents?: number } = {}
): Promise<Event[]> {
  const { timeoutMs = 8000, maxEvents = 200 } = options;
  const relays = getRelayUrls();
  const pool = new SimplePool();
  const seen = new Map<string, Event>();

  try {
    const queryPromise = Promise.all(
      filters.map((filter) => pool.querySync(relays, filter))
    ).then((results) => results.flat());

    const events = await Promise.race([
      queryPromise,
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
