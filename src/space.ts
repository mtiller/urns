import { createURN, parseURN } from "./parser";
import { BaseURN, ParsedURN } from "./types";

/**
 * The `URNSpace` class allows you to define a space of URNs defined
 * by a common namespace identifier (NID).  You can further restrict
 * this space by providing your own subtype of string for the 
 * namespace specific string (NSS) as well.  Furthermore, via the
 * `options` you can provide your own functions for validating
 * the NSS (see `is` functionality) and potentially providing
 * further semantic parsing of the NSS (see `trans` functionality).
 * 
 * With an instance of `URNSpace` in hand, it becomes very easy to
 * create new URNs and validate/parse existing URNs that belong
 * to the space.
 */
export class URNSpace<NID extends string, NSS extends string, R> {
  /**
   * Create a new URNSpace with the specifid NID
   * @param nid Namespace identifer (NID)
   * @param options 
   */
  constructor(
    protected nid: NID,
    protected options?: Partial<SpaceOptions<NSS, R>>
  ) {}
  /** 
   * Create a new URN in this namespace.  The type parameter `N` here
   * can be a subtype of the `NSS` type parameter of the `URNSpace` itself.
   * This allows you to deliberately create URNs that are part of a
   * more narrow subspace.
   */
  urn<N extends NSS>(nss: N, decode?: (nss: string) => R): BaseURN<NID, N> {
    return createURN(this.nid, nss);
  }
  /**
   * This is the main benefit of a `URNSpace`, it allows you to perform a runtime
   * check that narrows the scope of an ordinary string down to that of a member
   * of this URNSpace.  This is useful if, for example, you are deserializing
   * content (e.g., from a JSON payload) and you want to ensure that a given 
   * string is in fact of the (URN) type you expect.
   * @param s 
   * @returns 
   */
  is(s: string): s is BaseURN<NID, NSS> {
    /** We start by parsing the string as a URN */
    const parsed = parseURN(s);
    /** Then we confirm that it conforms to the type of `BaseURN<NID, NSS>`. */
    if (
      parsed.nid === this.nid &&
      parsed.rcomponent === null &&
      parsed.qcomponent === null &&
      parsed.fragment === null
    ) {
      /** 
       * If there is an optional `pred` function provided for this space,
       * run it to perform further semantic validation on the NSS.
      */
      if (this.options?.pred) {
        if (!this.options.pred(parsed.nss)) {
          return false;
        }
      }
      /** 
       * Now check if there is an optional transformational process
       * defined and ensure that it runs without throwing an exception.
       */
      if (this.options?.trans) {
        try {
          this.options.trans(parsed.nss);
        } catch (e) {
          return false;
        }
      }
      /** If we get here, the NSS has passed all further validation we can do. */
      return true;
    }
    return false;
  }
  /**
   * This function is like `is`, but it assumes the result will be true.  This can save you some
   * condition handling.  You should use this when you have a high degree of confidence that the
   * string does actually conform this URNSpace because it will throw an exception if it doesn't.
   * @param s 
   * @returns 
   */
  assume(s: string): BaseURN<NID, NSS> {
    if (this.is(s)) {
      return s;
    }
    throw new Error(`Assumption that '${s}' belongs to the specified URNSpace('${this.nid}') is faulty`);
  }
  /**
   * This function parses the provided URN and also invokes the optional `transform` function (if provided).
   * @param urn 
   * @returns 
   */
  parse(urn: BaseURN<NID, NSS>): ParsedURN<NID, NSS> & { trans: R } {
    const parsed = parseURN<NID, NSS>(urn);
    this.assume(urn);
    const trans =
      this.options && this.options.trans
        ? this.options.trans(parsed.nss)
        : ({} as any);
    return { ...parsed, trans: trans };
  }
  /**
   * This helper function is for the use case where you simply want to extract the NSS value
   * of a provided string.
   * @param urn 
   * @returns Namespace specific string
   */
  nss(urn: BaseURN<NID, NSS>) {
    return this.parse(urn).nss;
  }
  /**
   * This is another helper function that provides the result of the optional `transform`
   * function if provided.  Otherwise, it simply returns `{}`.
   */
  decode(urn: BaseURN<NID, NSS>) {
    return this.parse(urn).trans;
  }
}

/**
 * A type that indicates the options that can be passed when creating a `URNSpace`.
 */
export interface SpaceOptions<NSS extends string, R> {
  pred: (nss: string) => nss is NSS;
  trans: (nss: string) => R;
}

/**
 * A special conditional type that can be used to extract the type
 * associated with URNs in that `URNSpace` 
 * 
 * For example, `URNFrom<typeof s>` will return the type for URNs
 * that belong to the `URNSpace` `s`.
 */
export type URNFrom<
  S extends URNSpace<string, string, any>
> = S extends URNSpace<infer NID, infer NSS, infer R>
  ? BaseURN<NID, NSS>
  : never;
