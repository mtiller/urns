/**
 * A full URN is one that (potentially) includes an r-component, q-component or fragment.
 */
export type FullURN<
  NID extends string,
  NSS extends string,
  X extends string = ""
> = `urn:${NID}:${NSS}${X}`;

/**
 * A "base" URN is one that includes _only_ the NID and the NSS (no r-component, q-component or fragment)
 *
 * The distinction can be important when trying to exploit TypeScript's "template literal types" where
 * we want to carefully control the possible strings that can be formulated.  Removing all the optional
 * components minimizes the possible combinations into something easier for the type system to reason about.
 */
export type BaseURN<NID extends string, NSS extends string> = FullURN<
  NID,
  NSS,
  ""
>;

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
