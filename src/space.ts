import { createURN, parseURN, unparseURN } from "./parser";
import { BaseURN } from "./types";

export interface URNSpace<NID extends string, NSS extends string> {
  <N extends NSS>(nss: N, pred?: (nss: string) => nss is NSS): BaseURN<NID, N>;
  is(s: string): s is BaseURN<NID, NSS>;
}

export function urnSpace<NID extends string, NSS extends string = string>(
  nid: NID,
  pred?: (nss: string) => nss is NSS
): URNSpace<NID, NSS> {
  const ret = function <N extends NSS>(nss: N): BaseURN<NID, N> {
    return createURN(nid, nss);
  };
  ret.is = (s: string): s is BaseURN<NID, NSS> => {
    const parsed = parseURN(s);
    if (
      parsed.nid === nid &&
      parsed.rcomponent === null &&
      parsed.qcomponent === null &&
      parsed.fragment === null
    ) {
      if (pred) return pred(parsed.nss);
      return true;
    }
    return false;
  };
  return ret;
}
