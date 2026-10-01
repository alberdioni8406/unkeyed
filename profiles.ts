import { type Event, type Filter } from "nostr-tools";
import { nip19 } from "nostr-tools";
import { queryEvents } from "./query";
import type { NostrProfile } from "@/types/nostr";

export async function getProfile(pubkey: string): Promise<NostrProfile | null> {
  const filters: Filter[] = [
    {
      kinds: [0],
      authors: [pubkey],
      limit: 5,
    },
  ];

  const events = await queryEvents(filters, { timeoutMs: 6000 });
  if (events.length === 0) {
    return { pubkey };
  }

  // Newest metadata
  const newest = events.sort((a, b) => b.created_at - a.created_at)[0];
  try {
    const meta = JSON.parse(newest.content);
    return {
      pubkey,
      name: meta.name,
      display_name: meta.display_name || meta.displayName,
      about: meta.about,
      picture: meta.picture,
      banner: meta.banner,
      nip05: meta.nip05,
      lud16: meta.lud16,
      website: meta.website,
    };
  } catch {
    return { pubkey };
  }
}

export function npubFromPubkey(pubkey: string): string {
  try {
    return nip19.npubEncode(pubkey);
  } catch {
    return pubkey;
  }
}

export function pubkeyFromNpub(npub: string): string | null {
  try {
    const decoded = nip19.decode(npub);
    if (decoded.type === "npub") return decoded.data as string;
    return null;
  } catch {
    return null;
  }
}

export function displayName(profile: NostrProfile | null | undefined): string {
  if (!profile) return "Anonymous";
  return (
    profile.display_name ||
    profile.name ||
    npubFromPubkey(profile.pubkey).slice(0, 12) + "…"
  );
}
