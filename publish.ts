import { SimplePool, type Event, type VerifiedEvent } from "nostr-tools";
import { getRelayUrls } from "./relays";

export interface PublishResult {
  success: boolean;
  eventId?: string;
  relayResults: { url: string; success: boolean; error?: string }[];
}

/**
 * Publish a signed event to multiple relays concurrently.
 * Continues even if some relays fail.
 */
export async function publishEvent(
  signedEvent: VerifiedEvent | Event
): Promise<PublishResult> {
  const relays = getRelayUrls();
  const pool = new SimplePool();
  const results: PublishResult["relayResults"] = [];

  const promises = relays.map(async (url) => {
    try {
      await pool.publish([url], signedEvent as Event);
      results.push({ url, success: true });
      return true;
    } catch (err: any) {
      results.push({
        url,
        success: false,
        error: err?.message || String(err),
      });
      return false;
    }
  });

  await Promise.allSettled(promises);
  pool.close(relays);

  const successCount = results.filter((r) => r.success).length;
  return {
    success: successCount > 0,
    eventId: signedEvent.id,
    relayResults: results,
  };
}
