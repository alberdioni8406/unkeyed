"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  getPublicKey,
  isNostrAvailable,
} from "@/lib/nostr/signer";
import { getProfile } from "@/lib/nostr/profiles";
import type { NostrProfile } from "@/types/nostr";

interface NostrContextValue {
  pubkey: string | null;
  profile: NostrProfile | null;
  isAvailable: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshProfile: () => Promise<void>;
}

const NostrContext = createContext<NostrContextValue | null>(null);

export function NostrProvider({ children }: { children: ReactNode }) {
  const [pubkey, setPubkey] = useState<string | null>(null);
  const [profile, setProfile] = useState<NostrProfile | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    setIsAvailable(isNostrAvailable());
    // Try restore from session
    const stored = sessionStorage.getItem("unkeyed-pubkey");
    if (stored && isNostrAvailable()) {
      setPubkey(stored);
      getProfile(stored).then(setProfile).catch(() => {});
    }
  }, []);

  const connect = useCallback(async () => {
    if (!isNostrAvailable()) {
      alert(
        "No Nostr signer detected.\n\nInstall a NIP-07 browser extension such as Alby, nos2x, or Flamingo to connect."
      );
      return;
    }
    setIsConnecting(true);
    try {
      const pk = await getPublicKey();
      if (pk) {
        setPubkey(pk);
        sessionStorage.setItem("unkeyed-pubkey", pk);
        const p = await getProfile(pk);
        setProfile(p);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to connect Nostr signer. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setPubkey(null);
    setProfile(null);
    sessionStorage.removeItem("unkeyed-pubkey");
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!pubkey) return;
    const p = await getProfile(pubkey);
    setProfile(p);
  }, [pubkey]);

  return (
    <NostrContext.Provider
      value={{
        pubkey,
        profile,
        isAvailable,
        isConnecting,
        connect,
        disconnect,
        refreshProfile,
      }}
    >
      {children}
    </NostrContext.Provider>
  );
}

export function useNostr() {
  const ctx = useContext(NostrContext);
  if (!ctx) throw new Error("useNostr must be used within NostrProvider");
  return ctx;
}
