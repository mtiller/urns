import { createURN, parseURN, unparseURN } from "./parser";
import { BaseURN, ParsedURN, Segment } from "./types";

export interface URNSpace<NID extends string, NSS extends string, R> {
  <N extends NSS>(nss: N, decode?: (nss: string) => R): BaseURN<NID, N>;
  is(s: string): s is BaseURN<NID, NSS>;
  parse(s: BaseURN<NID, NSS>): ParsedURN<NID, NSS> & { trans: R };
}

export interface SpaceOptions<NSS extends string, R> {
  pred: (nss: string) => nss is NSS;
  trans: (nss: string) => R;
}

export function urnSpace<
  NID extends string,
  NSS extends string = string,
  R = {}
>(nid: NID, options?: Partial<SpaceOptions<NSS, R>>): URNSpace<NID, NSS, R> {
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
      if (options?.pred) {
        return options.pred(parsed.nss);
      }
      if (options?.trans) {
        try {
          options.trans(parsed.nss);
          return true;
        } catch (e) {
          return false;
        }
      }
      return true;
    }
    return false;
  };

  ret.parse = (urn: BaseURN<NID, NSS>): ParsedURN<NID, NSS> & { trans: R } => {
    const parsed = parseURN<NID, NSS>(urn);
    const trans =
      options && options.trans ? options.trans(parsed.nss) : ({} as any);
    return { ...parsed, trans: trans };
  };
  return ret;
}
