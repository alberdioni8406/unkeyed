/**
 * NIP-07 browser signer utilities.
 * Never handles private keys. Only interacts with window.nostr.
 */

export function isNostrAvailable(): boolean {
  return typeof window !== "undefined" && !!window.nostr;
}

export async function getPublicKey(): Promise<string | null> {
  if (!isNostrAvailable()) return null;
  try {
    const pubkey = await window.nostr!.getPublicKey();
    return pubkey;
  } catch (err) {
    console.error("Failed to get public key from Nostr signer:", err);
    return null;
  }
}

export async function signEvent(event: {
  kind: number;
  created_at: number;
  tags: string[][];
  content: string;
}): Promise<any | null> {
  if (!isNostrAvailable()) {
    throw new Error("Nostr signer not available. Install a NIP-07 extension such as Alby or nos2x.");
  }
  try {
    const signed = await window.nostr!.signEvent(event);
    return signed;
  } catch (err) {
    console.error("Failed to sign event:", err);
    throw err;
  }
}

export function truncateNpub(npub: string, chars = 8): string {
  if (npub.length <= chars * 2 + 3) return npub;
  return `${npub.slice(0, chars)}…${npub.slice(-chars)}`;
}
