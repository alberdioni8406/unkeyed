"use client";

import Link from "next/link";
import { useNostr } from "./NostrProvider";
import { displayName, npubFromPubkey } from "@/lib/nostr/profiles";
import { truncateNpub } from "@/lib/nostr/signer";

export function Header() {
  const { pubkey, profile, isConnecting, connect, disconnect } = useNostr();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-primary)]/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-xl font-bold tracking-tight text-[var(--accent)] group-hover:text-[var(--accent-hover)] transition-colors">
            Unkeyed
          </span>
          <span className="hidden sm:inline text-xs text-[var(--text-muted)] font-mono">
            your words · your keys · your BCH
          </span>
        </Link>

        <nav className="flex items-center gap-3 sm:gap-5">
          <Link
            href="/write"
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
          >
            Write
          </Link>
          <Link
            href="/settings"
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
          >
            Settings
          </Link>

          {pubkey ? (
            <div className="flex items-center gap-3">
              <Link
                href={`/author/${npubFromPubkey(pubkey)}`}
                className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
              >
                {profile?.picture ? (
                  <img
                    src={profile.picture}
                    alt=""
                    className="h-7 w-7 rounded-full object-cover border border-[var(--border)]"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center text-xs text-[var(--accent)]">
                    {(displayName(profile)[0] || "?").toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline max-w-[120px] truncate">
                  {displayName(profile)}
                </span>
              </Link>
              <button
                onClick={disconnect}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="rounded-full bg-[var(--accent)] px-4 py-1.5 text-sm font-medium text-[var(--bg-primary)] hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-60"
            >
              {isConnecting ? "Connecting…" : "Connect Nostr"}
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
