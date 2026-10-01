"use client";

import { useState, useEffect } from "react";
import { generatePaymentUri, bchToSats } from "@/lib/bch/uri";
import { isValidCashAddr, normalizeCashAddr } from "@/lib/bch/address";

interface Props {
  articleAddress: string;
  authorPubkey: string;
  authorName: string;
}

const PRESETS = [0.01, 0.05, 0.1] as const;

/**
 * For MVP we store author BCH addresses in localStorage keyed by pubkey.
 * In a full system this would come from a lightweight DB or a Nostr tag.
 */
function getAuthorBchAddress(pubkey: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(`unkeyed-bch-${pubkey}`);
}

export function BCHTipSection({
  articleAddress,
  authorPubkey,
  authorName,
}: Props) {
  const [bchAddress, setBchAddress] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | "custom">(0.01);
  const [customAmount, setCustomAmount] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState<"address" | "uri" | null>(null);

  useEffect(() => {
    setBchAddress(getAuthorBchAddress(authorPubkey));
  }, [authorPubkey]);

  const amount =
    selected === "custom" ? parseFloat(customAmount) || 0 : selected;

  const paymentUri =
    bchAddress && amount > 0
      ? generatePaymentUri(
          bchAddress,
          amount,
          `Tip for ${authorName}`,
          `Unkeyed tip · ${articleAddress.slice(0, 24)}…`
        )
      : null;

  const handleCopy = async (text: string, type: "address" | "uri") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // ignore
    }
  };

  if (!bchAddress) {
    return (
      <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Support the author
        </h2>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          {authorName} has not configured a Bitcoin Cash receiving address yet.
          Tips go directly to authors — no middleman, no platform custody.
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Support the author
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          If this was useful, you can send Bitcoin Cash directly to{" "}
          <span className="text-[var(--text-primary)]">{authorName}</span>.
          No middleman. No platform custody.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => setSelected(p)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                selected === p
                  ? "bg-[var(--accent)] text-[var(--bg-primary)]"
                  : "border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
              }`}
            >
              {p} BCH
            </button>
          ))}
          <button
            onClick={() => setSelected("custom")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              selected === "custom"
                ? "bg-[var(--accent)] text-[var(--bg-primary)]"
                : "border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
            }`}
          >
            Custom
          </button>
        </div>

        {selected === "custom" && (
          <div className="mt-3">
            <input
              type="number"
              min="0.0001"
              step="0.01"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Amount in BCH"
              className="w-40 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
        )}

        <button
          onClick={() => setShowModal(true)}
          disabled={!amount || amount <= 0}
          className="mt-5 w-full sm:w-auto rounded-full bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-[var(--bg-primary)] hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[var(--glow)]"
        >
          Tip with BCH
        </button>
      </section>

      {/* Modal */}
      {showModal && paymentUri && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                Tip {amount} BCH
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl leading-none"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Pay directly from your BCH wallet. The platform never receives
              the funds.
            </p>

            {/* QR placeholder – real QR needs qrcode.react once installed */}
            <div className="flex justify-center mb-4">
              <div className="h-48 w-48 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center text-xs text-[var(--text-muted)] text-center p-4">
                Scan with a BCH wallet
                <br />
                <span className="mt-2 block font-mono text-[10px] break-all opacity-60">
                  {paymentUri.slice(0, 40)}…
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleCopy(normalizeCashAddr(bchAddress!), "address")}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors text-left"
              >
                {copied === "address" ? "Copied address ✓" : "Copy BCH address"}
              </button>
              <button
                onClick={() => handleCopy(paymentUri, "uri")}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors text-left"
              >
                {copied === "uri" ? "Copied URI ✓" : "Copy payment URI"}
              </button>
              <a
                href={paymentUri}
                className="block w-full rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--bg-primary)] text-center hover:bg-[var(--accent-hover)] transition-colors"
              >
                Open in wallet
              </a>
            </div>

            <p className="mt-4 text-xs text-[var(--text-muted)] text-center">
              After paying you can optionally submit the TXID on a future
              version for public tip attribution.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
