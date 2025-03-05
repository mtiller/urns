import { ComponentMaps, createFullURN, createURN, parseURN } from "./parser";
import { BaseURN, FullURN, ParsedURN } from "./types";

/**
 * The `URNSpace` class allows you to define a space of URNs defined
 * by a common namespace identifier (NID).  You can further restrict
 * this space by providing your own subtype of string for the
 * namespace specific string (NSS) as well.  Furthermore, via the
 * `options` you can provide your own functions for validating
 * the NSS (see `is` functionality) and potentially providing
 * further semantic parsing of the NSS (see `transform` functionality).
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

  private cache = new Map<any, any>();
  private parsecache = new Map<any, any>();
  /**
   * Create a new URN in this namespace.  The type parameter `N` here
   * can be a subtype of the `NSS` type parameter of the `URNSpace` itself.
   * This allows you to deliberately create URNs that are part of a
   * more narrow subspace.
   */
  urn<N extends NSS>(nss: N | R): BaseURN<NID, N> {
    let createdURN: BaseURN<NID, N>;
    if (this.cache.get(nss)) {
      return this.cache.get(nss);
    }
    if (this.options?.encode) {
      createdURN = createURN(this.nid, this.options.encode(nss as R) as N);
    } else {
      createdURN = createURN(this.nid, nss as N);
    }
    try {
      this.cache.set(nss, createURN);
      this.assume(createdURN);
      return createdURN;
    } catch (e) {
      throw e;
    }
  }

  /**
   * This creates a URN that will no longer conform to the BaseURN type (which assumes no components).
   * But it is still useful to create full URNs (with components) within a space.
   **/
  fullUrn<N extends NSS>(
    nss: N | R,
    components: ComponentMaps
  ): FullURN<NID, N, string> {
    let createdURN: FullURN<NID, N, string>;
    if (this.options?.encode) {
      createdURN = createFullURN(
        this.nid,
        this.options.encode(nss as R) as N,
        components
      );
    } else {
      createdURN = createFullURN(this.nid, nss as N, components);
    }
    return createdURN;
  }

  /**
   * This is the main benefit of a `URNSpace`, it allows you to perform a runtime
   * check that narrows the scope of an ordinary string down to that of a member
   * of this URNSpace.  This is useful if, for example, you are deserializing
   * content (e.g., from a JSON payload) and you want to ensure that a given
   * string is in fact of the (URN) type you expect.
   *
   * NB - This confirms that the URN is a base URN (no components).  If you are
   * dealing with a full URN, use isFull
   * @param s
   * @returns
   */
  is(s: string): s is BaseURN<NID, NSS> {
    /**
     * Assume it is in this space and then check for exceptions.
     *
     * Note: this might prove more expensive in practice in which case you could use an
     * alternative formulation of the `assume` method here but changing how it addresses
     * each contingency.  I opted for code reuse over optimization here.  Time will tell
     * if that was the right call.
     */
    try {
      this.assume(s);
      return true;
    } catch (e) {
      return false;
    }
  }
  /**
   * Check if this string qualifies as a full URN belonging to this URN space.
   *
   * @param s A string which may be a full URN in this space, or it may not
   * @returns
   */
  isFull(s: string): s is FullURN<NID, NSS, string> {
    /**
     * Assume it is in this space and then check for exceptions.
     *
     * Note: this might prove more expensive in practice in which case you could use an
     * alternative formulation of the `assume` method here but changing how it addresses
     * each contingency.  I opted for code reuse over optimization here.  Time will tell
     * if that was the right call.
     */
    try {
      /** We start by parsing the string as a URN */
      const parsed = parseURN(s);

      /** First check the NID */
      if (parsed.nid !== this.nid) return false;

      /** Next, check the NSS if a predicate is defined */
      if (this.options?.pred) {
        if (!this.options.pred(parsed.nss)) {
          return false;
        }
      }
      return true;
    } catch (e) {
      return false;
    }
  }
  /**
   * This function is like `is`, but it assumes the result will be true.  This can save you some
   * condition handling.  You should use this when you have a high degree of confidence that the
   * string does actually conform this URNSpace because it will throw an exception if it doesn't.
   * @param s
   * @returns
   */
  assume(s: string): BaseURN<NID, NSS> {
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
          throw new Error(
            `Assumption that '${s}' belongs to the specified URNSpace('${this.nid}') is faulty, predicate failed`
          );
        }
      }
      /**
       * Now check if there is an optional transformational process
       * defined and ensure that it runs without throwing an exception.
       */
      if (this.options?.decode) {
        try {
          this.options.decode(parsed.nss);
        } catch (e) {
          throw new Error(
            `Assumption that '${s}' belongs to the specified URNSpace('${
              this.nid
            }') fails in decoding: ${(e as Error).message}`
          );
        }
      }
      /** If we get here, the NSS has passed all further validation we can do. */
      return s as BaseURN<NID, NSS>;
    }
    throw new Error(
      `Assumption that '${s}' belongs to the specified URNSpace('${this.nid}') is faulty`
    );
  }
  /**
   * This function parses the provided URN and also invokes the optional `decode` function (if provided).
   * @param urn
   * @returns
   */
  parse(urn: FullURN<NID, NSS, string>): ParsedURN<NID, NSS> & { decoded: R } {
    if (this.parsecache.has(urn)) {
      return this.parsecache.get(urn);
    }
    const parsed = parseURN<NID, NSS>(urn);
    if (!this.isFull(urn)) {
      throw new Error(
        `Assumption that '${urn}' belongs to the specified URNSpace('${this.nid}') is faulty`
      );
    }
    try {
      const decoded =
        this.options && this.options.decode
          ? this.options.decode(parsed.nss)
          : ({} as any);
      const ret = { ...parsed, decoded };
      this.parsecache.set(urn, ret);
      return ret;
    } catch (e: any) {
      throw new Error(
        `Assumption that '${urn}' belongs to the specified URNSpace('${this.nid}') fails in decoding: ${e.message}`
      );
    }
  }
  /**
   * This helper function is for the use case where you simply want to extract the NSS value
   * of a provided string.
   * @param urn
   * @returns Namespace specific string
   */
  nss(urn: FullURN<NID, NSS, string>) {
    return this.parse(urn).nss;
  }
  /**
   * This is another helper function that provides the result of the optional `transform`
   * function if provided.  Otherwise, it simply returns `{}`.
   */
  decode(urn: FullURN<NID, NSS, string>) {
    return this.parse(urn).decoded;
  }
}

/**
 * A type that indicates the options that can be passed when creating a `URNSpace`.
 */
export interface SpaceOptions<NSS extends string, R> {
  pred: (nss: string) => nss is NSS;
  encode: (val: R) => string;
  decode: (nss: string) => R;
}

/**
 * A special conditional type that can be used to extract the type
 * associated with URNs in that `URNSpace`
 *
 * For example, `URNFrom<typeof s>` will return the type for URNs
 * that belong to the `URNSpace` `s`.
 */
export type URNFrom<S extends URNSpace<string, string, any>> =
  S extends URNSpace<infer NID, infer NSS, infer R> ? BaseURN<NID, NSS> : never;

/**
 * A special conditional type that can be used to extract the type
 * associated with URNs in that `URNSpace`
 *
 * For example, `URNFrom<typeof s>` will return the type for URNs
 * that belong to the `URNSpace` `s`.
 */
export type FullURNFrom<S extends URNSpace<string, string, any>> =
  S extends URNSpace<infer NID, infer NSS, infer R>
    ? FullURN<NID, NSS, string>
    : never;
