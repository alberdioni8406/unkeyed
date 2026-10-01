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
  disconnectSigner,
  getPublicKey,
  isNostrAvailable,
  restoreRemoteSigner,
} from "@/lib/nostr/signer";
import { getProfile } from "@/lib/nostr/profiles";
import type { NostrProfile } from "@/types/nostr";
import { ConnectModal } from "@/components/ConnectModal";

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
  const [isConnecting, setIsConnecting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    // 1. Restore a NIP-46 (remote signer) session
    const remotePk = restoreRemoteSigner();
    if (remotePk) {
      setPubkey(remotePk);
      getProfile(remotePk).then(setProfile).catch(() => {});
      return;
    }
    // 2. Restore a NIP-07 (extension) session
    const stored = sessionStorage.getItem("unkeyed-pubkey");
    if (stored && isNostrAvailable()) {
      setPubkey(stored);
      getProfile(stored).then(setProfile).catch(() => {});
    }
  }, []);

  const finishConnect = useCallback(async (pk: string) => {
    setPubkey(pk);
    setModalOpen(false);
    try {
      setProfile(await getProfile(pk));
    } catch {
      /* profile is optional */
    }
  }, []);

  const connect = useCallback(async () => {
    // No extension (e.g. mobile browsers): offer signer app / bunker link.
    if (!isNostrAvailable()) {
      setModalOpen(true);
      return;
    }
    setIsConnecting(true);
    try {
      await disconnectSigner(); // make sure the extension is the active signer
      const pk = await getPublicKey();
      if (pk) {
        sessionStorage.setItem("unkeyed-pubkey", pk);
        await finishConnect(pk);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to connect Nostr signer. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  }, [finishConnect]);

  const handleRemoteConnected = useCallback(
    (pk: string) => {
      sessionStorage.removeItem("unkeyed-pubkey");
      void finishConnect(pk);
    },
    [finishConnect]
  );

  const disconnect = useCallback(() => {
    setPubkey(null);
    setProfile(null);
    sessionStorage.removeItem("unkeyed-pubkey");
    void disconnectSigner();
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
        isAvailable: true, // extension OR signer app / bunker link
        isConnecting,
        connect,
        disconnect,
        refreshProfile,
      }}
    >
      {children}
      {modalOpen && (
        <ConnectModal
          onClose={() => setModalOpen(false)}
          onConnected={handleRemoteConnected}
        />
      )}
    </NostrContext.Provider>
  );
}

export function useNostr() {
  const ctx = useContext(NostrContext);
  if (!ctx) throw new Error("useNostr must be used within NostrProvider");
  return ctx;
}
