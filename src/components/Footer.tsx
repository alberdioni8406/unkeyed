"use client";

import { useTheme, type ThemeId } from "./ThemeProvider";

export function Footer() {
  const { theme, setTheme, themes } = useTheme();

  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--bg-secondary)]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Unkeyed
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)] max-w-xs">
              Your words. Your keys. Your BCH.
              <br />
              Articles live on Nostr. Tips go directly to authors.
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-2">
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
              Theme
            </span>
            <div className="flex items-center gap-2">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id as ThemeId)}
                  title={t.label}
                  aria-label={`Switch to ${t.label}`}
                  className={`h-7 w-7 rounded-full border-2 transition-all ${
                    theme === t.id
                      ? "border-[var(--accent)] scale-110 shadow-[var(--glow)]"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: t.swatch }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[var(--border)] flex flex-col sm:flex-row justify-between gap-2 text-xs text-[var(--text-muted)]">
          <p>No custody. No accounts. Just Nostr + BCH.</p>
          <p>
            <a
              href="https://github.com"
              className="hover:text-[var(--accent)] transition-colors"
              target="_blank"
              rel="noreferrer"
            >
              Open source
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
