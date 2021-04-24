export type FullURN<
  NID extends string,
  NSS extends string,
  X extends string = ""
> = `urn:${NID}:${NSS}${X}`;

export type BaseURN<NID extends string, NSS extends string> = FullURN<
  NID,
  NSS,
  ""
>;

export type F = BaseURN<"a" | "c", "b">;

export interface ParsedURN<
  NID extends string = string,
  NSS extends string = string
> {
  nid: NID;
  nss: NSS;
  nss_encoded: string;
  rcomponent: string | null;
  qcomponent: string | null;
  fragment: string | null;
}
