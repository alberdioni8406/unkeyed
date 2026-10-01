/**
 * Generate BIP-21 style BCH payment URI.
 * amount is in BCH (not sats).
 */

export function generatePaymentUri(
  address: string,
  amountBch?: number,
  label?: string,
  message?: string
): string {
  let uri = address.startsWith("bitcoincash:")
    ? address
    : `bitcoincash:${address.replace(/^bitcoincash:/i, "")}`;

  const params: string[] = [];

  if (amountBch !== undefined && amountBch > 0) {
    // BIP-21 uses BTC units; BCH is 1:1 for this purpose
    params.push(`amount=${amountBch.toFixed(8).replace(/\.?0+$/, "")}`);
  }
  if (label) {
    params.push(`label=${encodeURIComponent(label)}`);
  }
  if (message) {
    params.push(`message=${encodeURIComponent(message)}`);
  }

  if (params.length > 0) {
    uri += "?" + params.join("&");
  }

  return uri;
}

export function bchToSats(bch: number): number {
  return Math.round(bch * 1e8);
}

export function satsToBch(sats: number): number {
  return sats / 1e8;
}
