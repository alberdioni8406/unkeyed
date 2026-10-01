/**
 * Basic CashAddr validation for Bitcoin Cash.
 * For production, prefer a full library such as @psf/bch-js or cashaddrjs.
 * This is a lightweight format check for MVP.
 */

const CASHADDR_PREFIXES = ["bitcoincash:", "bchtest:", "bchreg:"];
const CASHADDR_CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";

export function isValidCashAddr(address: string): boolean {
  if (!address || typeof address !== "string") return false;

  let addr = address.trim().toLowerCase();

  // Allow bare cashaddr without prefix for convenience
  const hasPrefix = CASHADDR_PREFIXES.some((p) => addr.startsWith(p));
  if (!hasPrefix) {
    addr = "bitcoincash:" + addr;
  }

  // Basic length and charset checks
  const payload = addr.includes(":") ? addr.split(":")[1] : addr;
  if (!payload || payload.length < 14 || payload.length > 110) return false;

  for (const c of payload) {
    if (!CASHADDR_CHARSET.includes(c)) return false;
  }

  // Reject obvious legacy base58 that might be pasted by mistake
  if (/^[13]/.test(payload) && payload.length >= 26 && payload.length <= 35) {
    // Likely legacy – reject for MVP to force CashAddr
    return false;
  }

  return true;
}

export function normalizeCashAddr(address: string): string {
  const trimmed = address.trim().toLowerCase();
  if (CASHADDR_PREFIXES.some((p) => trimmed.startsWith(p))) {
    return trimmed;
  }
  return "bitcoincash:" + trimmed;
}
