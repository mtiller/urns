import { createURN, parseURN, unparseURN } from "./parser";
import { BaseURN, Segment } from "./types";

export interface URNSpace<
  NID extends string,
  NSS extends string,
  P extends {}
> {
  <N extends NSS>(nss: N, pred?: (nss: string) => nss is NSS): BaseURN<NID, N>;
  is(s: string): s is BaseURN<NID, NSS>;
}

// export type SingleField<T extends string> = Record<T, string>;

// const a: SingleField<"foo"> & SingleField<"bar"> = undefined as any;

// const foo = urn("example", [["foo", (s: string): s is "foo" => true]]);
// const bar = urn("example", [
//   ["foo", (s: string): s is "foo" => true],
//   ["bar", (s: string): s is "bar" => true],
// ]);
// export function urn<
//   NID extends string,
//   NSS extends string = string,
//   T extends string = "nss"
// >(nid: NID): URNSpace<NID, NSS, SingleField<"nss">>;
// export function urn<
//   NID extends string,
//   NSS extends string = string,
//   T extends string = string
// >(nid: NID, segment: [Segment<T>]): URNSpace<NID, NSS, SingleField<T>>;
// export function urn<
//   NID extends string,
//   NSS extends string = string,
//   T extends string = string,
//   S extends string = string
// >(
//   nid: NID,
//   segment: [Segment<T>, Segment<S>]
// ): URNSpace<NID, NSS, SingleField<T> & SingleField<S>>;
// export function urn<NID extends string, NSS extends string = string>(
//   nid: NID,
//   segment: Array<Segment<string>> = [["nss", (s: string): s is string => true]]
// ): URNSpace<NID, NSS, { [key: string]: string }> {
//   return undefined as any;
// }

// export function urn2<NID extends string, NSS extends string = string>(
//   nid: NID,
//   segment: Array<Segment<string>> = [["nss", (s: string): s is string => true]]
// ): URNSpace<NID, NSS, { [key: string]: string }> {
//   return undefined as any;
// }

export function urnSpace<NID extends string, NSS extends string = string>(
  nid: NID,
  pred?: (nss: string) => nss is NSS
): URNSpace<NID, NSS, {}> {
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
