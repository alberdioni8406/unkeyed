# Unkeyed

**Your words. Your keys. Your BCH.**

A Nostr-native blogging platform with non-custodial Bitcoin Cash tipping.

## Philosophy

- **Nostr** = identity + article ownership + publication + social layer
- **Bitcoin Cash** = payment / settlement layer
- **Unkeyed** = interface + discovery + caching + BCH payment verification

The platform never custodies BCH.  
The platform never requires username/password accounts.  
Articles are signed Nostr events (NIP-23 kind 30023) published to multiple relays.  
BCH tips go directly from the reader’s wallet to the author’s address.

## Features (MVP)

### Phase 1 — Nostr publishing loop
- NIP-07 browser signer connection
- Nostr profile (kind 0) loading
- Markdown article editor
- Sign & publish kind 30023 events to multiple relays
- Article reading with safe Markdown rendering
- Author pages
- Multi-relay query + deduplication

### Phase 2 — BCH tipping (UI ready)
- CashAddr validation
- BCH payment URI generation
- Tip amount presets + custom
- Copy address / URI / open wallet
- Author BCH address configuration (local for MVP)

### Themes
Green cyberpunk (default) with footer toggle for:
- Amber (orange)
- Crimson (red)
- Sky Blue
- Phantom (violet)

## Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- nostr-tools
- react-markdown + rehype-sanitize + remark-gfm

## Getting started

```bash
cd unkeyed
npm install
npm run dev
```

Open http://localhost:3000

### Required for publishing

Install a NIP-07 Nostr browser extension:
- [Alby](https://getalby.com)
- nos2x
- Flamingo
- or any other NIP-07 compatible signer

### Relays

Default public relays are configured in `src/lib/nostr/relays.ts`.  
Override with environment variable:

```
NEXT_PUBLIC_RELAY_URLS=wss://relay.damus.io,wss://nos.lol,wss://relay.nostr.band
```

## Project structure

```
src/
  app/               # Next.js routes
    page.tsx         # Homepage / discovery
    write/           # Article editor
    blog/[slug]/     # Article view
    author/[npub]/   # Author profile
    settings/        # BCH address config
  components/        # UI
  lib/
    nostr/           # Signer, relays, publish, query, articles, profiles
    bch/             # Address validation, payment URI
  types/
```

## Security notes

- Private keys never leave the browser signer.
- Canonical articles live on Nostr relays, not in a database.
- BCH never touches the platform.
- Markdown is sanitized before render.
- Tip amounts and recipients are determined server-side in later verification phases (not yet fully implemented).

## Roadmap (not in this MVP)

- Server-side BCH TX verification + tip records
- Application-specific Nostr tip events (kind 30078)
- NIP-22 comments
- Prisma + PostgreSQL for tip caching & search index
- Automatic payment detection
- NIP-46 remote signers

## License

MIT
