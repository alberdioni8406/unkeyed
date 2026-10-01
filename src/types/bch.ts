export interface BchTip {
  id: string;
  articleAddress: string;
  authorPubkey: string;
  recipientBchAddress: string;
  amountSats: number;
  amountBch: number;
  txid?: string;
  status: "pending" | "detected" | "confirmed" | "invalid";
  confirmations: number;
  createdAt: Date;
  verifiedAt?: Date;
}

export interface TipFormData {
  amountBch: number;
  articleAddress: string;
  authorPubkey: string;
  recipientBchAddress: string;
}

export type TipPreset = 0.01 | 0.05 | 0.1 | "custom";
