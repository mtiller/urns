/**
 * This function is not strictly related to URNs.  But it is useful in conjunction with the `trans`
 * functionality in the `URNSpace` class.  Specifically, the `decode` function takes an array
 * of field names as an argument and returns a function that, when given a colon separated list of
 * strings (*i.e.,* the typical construction of a hierarchal namespace specific string from a URN),
 * returns an object where each string in the list is mapped to the respective field.  For example,
 * 
 * ```
 * decode(["a", "b"])("foo:bar") => { "a": "foo", "b": "bar" }
 * ```
 * 
 * This provides an easy means to transform the NSS from the URN into an object.
 * 
 * NB - This function is overloaded so that it can provide a type safe mapping from
 * the string names provided as an argument to `decode` and the resulting object
 * type returned after processing the NSS>.  Only the first 5 cases are implemented
 * here.  If you have an NSS with more than 5 components, you'd need to write a
 * special transform function.  But the `URNSpace` class will accept any transform
 * function, it doesn't need to be derived from this one.
 * 
 * @param x Array of field names
 */
export function decode<T extends string>(
  x: [T]
): (nss: string) => Record<T, string>;
export function decode<T1 extends string, T2 extends string>(
  x: [T1, T2]
): (nss: string) => Record<T1 | T2, string>;
export function decode<T1 extends string, T2 extends string, T3 extends string>(
  x: [T1, T2, T3]
): (nss: string) => Record<T1 | T2 | T3, string>;
export function decode<
  T1 extends string,
  T2 extends string,
  T3 extends string,
  T4 extends string
>(x: [T1, T2, T3, T4]): (nss: string) => Record<T1 | T2 | T3 | T4, string>;
export function decode<
  T1 extends string,
  T2 extends string,
  T3 extends string,
  T4 extends string,
  T5 extends string
>(
  x: [T1, T2, T3, T4, T5]
): (nss: string) => Record<T1 | T2 | T3 | T4 | T5, string>;
export function decode(x: string[]): (nss: string) => Record<string, string> {
  /** Return a function that given an NSS of colon separated strings into an object. */
  return (nss: string) => {
    /** Start with an empty object */
    const ret: Record<string, string> = {};
    /** Split up the NSS into parts */
    const parts = nss.split(":");
    /** If the number of parts doesn't match the number of field expected, throw an exception */
    if (parts.length !== x.length)
      throw new Error(`Expected nss with ${x.length} segments but got ${nss}`);
    /** For each expected field, map the respective string in the NSS into the return object */
    x.forEach((key, i) => (ret[key] = parts[i]));
    return ret;
  };
}
