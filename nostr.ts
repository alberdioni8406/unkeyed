export interface NostrProfile {
  pubkey: string;
  name?: string;
  display_name?: string;
  about?: string;
  picture?: string;
  banner?: string;
  nip05?: string;
  lud16?: string;
  website?: string;
}

export interface ArticleEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: 30023;
  tags: string[][];
  content: string;
  sig: string;
}

export interface ArticleMeta {
  d: string; // unique slug
  title: string;
  summary?: string;
  image?: string;
  published_at?: number;
  tags: string[];
  naddr?: string;
}

export interface Article {
  id: string;
  pubkey: string;
  meta: ArticleMeta;
  content: string;
  created_at: number;
  published_at: number;
  author?: NostrProfile;
  naddr: string;
  address: string; // 30023:pubkey:d
}

export interface CommentEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
  author?: NostrProfile;
}

declare global {
  interface Window {
    nostr?: {
      getPublicKey: () => Promise<string>;
      signEvent: (event: any) => Promise<any>;
      nip04?: {
        encrypt: (pubkey: string, plaintext: string) => Promise<string>;
        decrypt: (pubkey: string, ciphertext: string) => Promise<string>;
      };
      nip44?: {
        encrypt: (pubkey: string, plaintext: string) => Promise<string>;
        decrypt: (pubkey: string, ciphertext: string) => Promise<string>;
      };
    };
  }
}
