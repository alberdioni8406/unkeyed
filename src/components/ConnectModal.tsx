"use client";

import { useEffect, useRef, useState } from "react";
import { beginNostrConnect, connectBunker } from "@/lib/nostr/signer";

interface Props {
  onClose: () => void;
  onConnected: (pubkey: string) => void;
}

export function ConnectModal({ onClose, onConnected }: Props) {
  const [uri, setUri] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [bunker, setBunker] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const cancelRef = useRef<(() => void) | null>(null);
  const dismissed = useRef(false);

  useEffect(() => {
    dismissed.current = false;
    return () => {
      dismissed.current = true;
      cancelRef.current?.();
    };
  }, []);

  function startSignerApp() {
    setError(null);
    const { uri, wait, cancel } = beginNostrConnect();
    cancelRef.current = cancel;
    setUri(uri);
    setWaiting(true);
    wait
      .then((pk) => {
        if (!dismissed.current) onConnected(pk);
      })
      .catch((e) => {
        if (dismissed.current) return;
        setError(
          e instanceof Error && e.message
            ? e.message
            : "Connection timed out. Try again."
        );
      })
      .finally(() => {
        if (!dismissed.current) setWaiting(false);
      });
    // Hand off to the signer app (Amber, Aegis, ...). Must run inside the tap.
    window.location.href = uri;
  }

  async function submitBunker() {
    if (!bunker.trim()) return;
    setError(null);
    setBusy(true);
    try {
      const pk = await connectBunker(bunker);
      onConnected(pk);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not connect.");
    } finally {
      setBusy(false);
    }
  }

  async function copyUri() {
    if (!uri) return;
    try {
      await navigator.clipboard.writeText(uri);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md space-y-5 rounded-xl border border-white/10 bg-neutral-950 p-5 text-neutral-100 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Connect a Nostr signer"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Connect with Nostr</h2>
            <p className="mt-1 text-sm text-neutral-400">
              Your private key stays in your signer app. Unkeyed only asks it to
              sign.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <section className="space-y-2">
          <button
            onClick={startSignerApp}
            disabled={waiting}
            className="w-full rounded-lg border border-white/20 px-4 py-3 text-left font-medium hover:bg-white/5 disabled:opacity-60"
          >
            {waiting ? "Waiting for approval…" : "Open signer app"}
            <span className="block text-xs font-normal text-neutral-400">
              Amber (Android), Aegis (iOS), nsec.app and other NIP-46 signers
            </span>
          </button>
          {uri && (
            <div className="flex gap-2 text-xs">
              <a
                href={uri}
                className="flex-1 rounded border border-white/10 px-3 py-2 text-center hover:bg-white/5"
              >
                Open again
              </a>
              <button
                onClick={copyUri}
                className="flex-1 rounded border border-white/10 px-3 py-2 hover:bg-white/5"
              >
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>
          )}
        </section>

        <div className="flex items-center gap-3 text-xs text-neutral-500">
          <span className="h-px flex-1 bg-white/10" />
          or
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <section className="space-y-2">
          <label className="text-sm font-medium" htmlFor="bunker-input">
            Paste a bunker link
          </label>
          <input
            id="bunker-input"
            value={bunker}
            onChange={(e) => setBunker(e.target.value)}
            placeholder="bunker://…"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm outline-none focus:border-white/40"
          />
          <button
            onClick={submitBunker}
            disabled={busy || !bunker.trim()}
            className="w-full rounded-lg bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15 disabled:opacity-50"
          >
            {busy ? "Connecting…" : "Connect"}
          </button>
        </section>

        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    </div>
  );
}
