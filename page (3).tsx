"use client";

import { useState, useEffect } from "react";
import { useNostr } from "@/components/NostrProvider";
import { isValidCashAddr, normalizeCashAddr } from "@/lib/bch/address";
import { displayName, npubFromPubkey } from "@/lib/nostr/profiles";

export default function SettingsPage() {
  const { pubkey, profile, connect, isConnecting } = useNostr();
  const [bchAddress, setBchAddress] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (pubkey) {
      const stored = localStorage.getItem(`unkeyed-bch-${pubkey}`);
      if (stored) setBchAddress(stored);
    }
  }, [pubkey]);

  const handleSave = () => {
    setError(null);
    setSaved(false);
    if (!bchAddress.trim()) {
      localStorage.removeItem(`unkeyed-bch-${pubkey}`);
      setSaved(true);
      return;
    }
    if (!isValidCashAddr(bchAddress)) {
      setError("Invalid Bitcoin Cash address. Please use CashAddr format (bitcoincash:q…).");
      return;
    }
    const normalized = normalizeCashAddr(bchAddress);
    localStorage.setItem(`unkeyed-bch-${pubkey!}`, normalized);
    setBchAddress(normalized);
    setSaved(true);
  };

  if (!pubkey) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Settings
        </h1>
        <p className="mt-3 text-[var(--text-secondary)]">
          Connect your Nostr signer to configure your BCH receiving address.
        </p>
        <button
          onClick={connect}
          disabled={isConnecting}
          className="mt-6 rounded-full bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-[var(--bg-primary)] hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-60"
        >
          {isConnecting ? "Connecting…" : "Connect Nostr"}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
        Settings
      </h1>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        {displayName(profile)} · {npubFromPubkey(pubkey).slice(0, 16)}…
      </p>

      <section className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Bitcoin Cash receiving address
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Tips from readers go directly to this address. Unkeyed never holds
          your BCH. One address per author is sufficient for the MVP.
        </p>

        <div className="mt-4">
          <input
            type="text"
            value={bchAddress}
            onChange={(e) => {
              setBchAddress(e.target.value);
              setSaved(false);
              setError(null);
            }}
            placeholder="bitcoincash:q…"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-2.5 text-sm font-mono text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        {error && (
          <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>
        )}
        {saved && (
          <p className="mt-2 text-sm text-[var(--success)]">Saved.</p>
        )}

        <button
          onClick={handleSave}
          className="mt-4 rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-[var(--bg-primary)] hover:bg-[var(--accent-hover)] transition-colors"
        >
          Save address
        </button>
      </section>

      <p className="mt-6 text-xs text-[var(--text-muted)]">
        Address is stored locally in this browser for the MVP. A future version
        can publish it via a Nostr event so it is available across devices.
      </p>
    </div>
  );
}
