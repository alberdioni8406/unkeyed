/**
 * Nostr signer utilities.
 *
 * Two ways to sign, both non-custodial (private keys never touch Unkeyed):
 *  1. NIP-07 browser extension (window.nostr) — desktop.
 *  2. NIP-46 remote signer (Amber, nsec.app, Aegis, ...) — mobile friendly.
 *
 * For NIP-46 we only keep an ephemeral *app* key in localStorage (used to talk
 * to the signer). The user's real key never leaves their signer app.
 */
import { generateSecretKey } from "nostr-tools/pure";
import {
  BunkerSigner,
  createNostrConnectURI,
  parseBunkerInput,
  type BunkerPointer,
} from "nostr-tools/nip46";
import { SimplePool } from "nostr-tools/pool";
import { getPublicKey as pubkeyFromSecret } from "nostr-tools/pure";
import { bytesToHex, hexToBytes } from "nostr-tools/utils";

const NIP46_RELAYS = [
  "wss://relay.nsec.app",
  "wss://relay.damus.io",
  "wss://nos.lol",
];

const STORAGE_KEY = "unkeyed-nip46";

let pool: SimplePool | null = null;
let remote: BunkerSigner | null = null;

function getPool(): SimplePool {
  if (!pool) pool = new SimplePool();
  return pool;
}

interface StoredSession {
  sk: string; // ephemeral app key (hex) — NOT the user's Nostr key
  bp: BunkerPointer;
  pubkey: string;
}

function saveSession(sk: Uint8Array, bp: BunkerPointer, pubkey: string) {
  try {
    const data: StoredSession = {
      sk: bytesToHex(sk),
      bp: { ...bp, secret: null },
      pubkey,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* storage unavailable */
  }
}

async function setRemote(next: BunkerSigner | null) {
  const prev = remote;
  remote = next;
  if (prev && prev !== next) {
    try {
      await prev.close();
    } catch {
      /* ignore */
    }
  }
}

/* ---------------------------- NIP-07 extension ---------------------------- */

export function isNostrAvailable(): boolean {
  return typeof window !== "undefined" && !!window.nostr;
}

/* ------------------------------ NIP-46 remote ----------------------------- */

export function hasRemoteSigner(): boolean {
  return remote !== null;
}

/**
 * Connect using a bunker:// link (or NIP-05 address) pasted by the user.
 * Returns the user's pubkey (hex).
 */
export async function connectBunker(input: string): Promise<string> {
  const bp = await parseBunkerInput(input.trim());
  if (!bp) throw new Error("That doesn't look like a valid bunker:// link.");

  const sk = generateSecretKey();
  const signer = BunkerSigner.fromBunker(sk, bp, { pool: getPool() });
  await signer.connect();
  const pubkey = await signer.getPublicKey();

  await setRemote(signer);
  saveSession(sk, bp, pubkey);
  return pubkey;
}

/**
 * Start a nostrconnect:// handshake. Open `uri` in the signer app
 * (a plain link / location change works on mobile), then await `wait`.
 */
export function beginNostrConnect(timeoutMs = 120_000): {
  uri: string;
  wait: Promise<string>;
  cancel: () => void;
} {
  const sk = generateSecretKey();
  const secret = bytesToHex(generateSecretKey()).slice(0, 16);
  const uri = createNostrConnectURI({
    clientPubkey: pubkeyFromSecret(sk),
    relays: NIP46_RELAYS,
    secret,
    name: "Unkeyed",
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const wait = (async () => {
    try {
      const signer = await BunkerSigner.fromURI(
        sk,
        uri,
        { pool: getPool() },
        controller.signal
      );
      const pubkey = await signer.getPublicKey();
      await setRemote(signer);
      saveSession(sk, signer.bp, pubkey);
      return pubkey;
    } finally {
      clearTimeout(timer);
    }
  })();

  return { uri, wait, cancel: () => controller.abort() };
}

/**
 * Restore a previous NIP-46 session after a page reload.
 * Returns the stored pubkey immediately; the signer reconnects lazily.
 */
export function restoreRemoteSigner(): string | null {
  if (typeof window === "undefined") return null;
  if (remote) {
    try {
      const s = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return s?.pubkey ?? null;
    } catch {
      return null;
    }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as StoredSession;
    if (!s?.sk || !s?.bp || !s?.pubkey) return null;
    remote = BunkerSigner.fromBunker(hexToBytes(s.sk), s.bp, {
      pool: getPool(),
    });
    return s.pubkey;
  } catch {
    return null;
  }
}

export async function disconnectSigner(): Promise<void> {
  await setRemote(null);
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/* ------------------------------ Unified API ------------------------------- */

export async function getPublicKey(): Promise<string | null> {
  try {
    if (remote) return await remote.getPublicKey();
    if (isNostrAvailable()) return await window.nostr!.getPublicKey();
    return null;
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
  try {
    if (remote) return await remote.signEvent(event);
    if (isNostrAvailable()) return await window.nostr!.signEvent(event);
  } catch (err) {
    console.error("Failed to sign event:", err);
    throw err;
  }
  throw new Error(
    "No Nostr signer connected. Connect with a signer app (Amber, nsec.app, Aegis) or a browser extension."
  );
}

export function truncateNpub(npub: string, chars = 8): string {
  if (npub.length <= chars * 2 + 3) return npub;
  return `${npub.slice(0, chars)}…${npub.slice(-chars)}`;
}
