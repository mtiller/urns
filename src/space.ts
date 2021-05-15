import { createURN, parseURN, unparseURN } from "./parser";
import { BaseURN, ParsedURN, Segment } from "./types";

export interface SpaceOptions<NSS extends string, R> {
  pred: (nss: string) => nss is NSS;
  trans: (nss: string) => R;
}

export type URNFrom<
  S extends URNSpace<string, string, any>
> = S extends URNSpace<infer NID, infer NSS, infer R>
  ? BaseURN<NID, NSS>
  : never;

export class URNSpace<NID extends string, NSS extends string, R> {
  constructor(
    protected nid: NID,
    protected options?: Partial<SpaceOptions<NSS, R>>
  ) {}
  urn<N extends NSS>(nss: N, decode?: (nss: string) => R): BaseURN<NID, N> {
    return createURN(this.nid, nss);
  }
  is(s: string): s is BaseURN<NID, NSS> {
    const parsed = parseURN(s);
    if (
      parsed.nid === this.nid &&
      parsed.rcomponent === null &&
      parsed.qcomponent === null &&
      parsed.fragment === null
    ) {
      if (this.options?.pred) {
        return this.options.pred(parsed.nss);
      }
      if (this.options?.trans) {
        try {
          this.options.trans(parsed.nss);
          return true;
        } catch (e) {
          return false;
        }
      }
      return true;
    }
    return false;
  }
  parse(urn: BaseURN<NID, NSS>): ParsedURN<NID, NSS> & { trans: R } {
    const parsed = parseURN<NID, NSS>(urn);
    const trans =
      this.options && this.options.trans
        ? this.options.trans(parsed.nss)
        : ({} as any);
    return { ...parsed, trans: trans };
  }
}
