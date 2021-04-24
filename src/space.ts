import { createURN, unparseURN } from "./parser";
import { BaseURN } from "./types";

export interface URNSpace<NID extends string, NSS extends string> {
  <N extends NSS>(nss: N): BaseURN<NID, N>;
}

export function urnSpace<NID extends string, NSS extends string = string>(
  nid: NID
): URNSpace<NID, NSS> {
  const ret = function <N extends NSS>(nss: N): BaseURN<NID, N> {
    return createURN(nid, nss);
  };
  return ret;
}
