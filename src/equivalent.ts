import { parseURN } from "./parser";
import { FullURN } from "./types";

/**
 * This is testing for equivalence as defined in Section 3 of RFC 8141
 *
 * @param a First URN
 * @param b Second URN
 * @returns boolean
 */
export function equivalent(
  a: FullURN<string, string, string>,
  b: FullURN<string, string, string>
): boolean {
  /** Parse both URNs */
  const ap = parseURN(a);
  const bp = parseURN(b);
  /** 
   * We only pay attention to the NID and the NSS, all other components are
   * ignored (per RFC 8141).  Furthermore, the NID comparison is case insensitive. 
   */
  return (
    ap.nid.toLowerCase() === bp.nid.toLowerCase() &&
    ap.nss_encoded === bp.nss_encoded
  );
}
