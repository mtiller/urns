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
  return (nss: string) => {
    const ret: Record<string, string> = {};
    const parts = nss.split(":");
    if (parts.length !== x.length)
      throw new Error(`Expected nss with ${x.length} segments but got ${nss}`);
    x.forEach((key, i) => (ret[key] = parts[i]));
    return ret;
  };
}
