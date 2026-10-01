export const DEFAULT_RELAYS = [
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.nostr.band",
  "wss://nostr.wine",
  "wss://relay.snort.social",
  "wss://purplepag.es",
];

export function getRelayUrls(): string[] {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_RELAY_URLS) {
    return process.env.NEXT_PUBLIC_RELAY_URLS.split(",").map((r) => r.trim());
  }
  return DEFAULT_RELAYS;
}

export interface RelayStatus {
  url: string;
  connected: boolean;
  error?: string;
  lastSeen?: number;
}
