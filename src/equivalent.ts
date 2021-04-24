import { parseURN } from "./parser";
import { FullURN } from "./types";

/**
 * This is testing for equivalence as defined in Section 3 of RFC 8141
 *
 * @param a
 * @param b
 * @returns
 */
export function equivalent(
  a: FullURN<string, string, string>,
  b: FullURN<string, string, string>
): boolean {
  const ap = parseURN(a);
  const bp = parseURN(b);
  return (
    ap.nid.toLowerCase() === bp.nid.toLowerCase() &&
    ap.nss_encoded === bp.nss_encoded
  );
}
