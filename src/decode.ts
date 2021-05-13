export function decode<T extends string>(
  nss: string,
  x: [T]
): Record<T, string>;
export function decode<T1 extends string, T2 extends string>(
  nss: string,
  x: [T1, T2]
): Record<T1 | T2, string>;
export function decode<T1 extends string, T2 extends string, T3 extends string>(
  nss: string,
  x: [T1, T2, T3]
): Record<T1 | T2 | T3, string>;
export function decode<
  T1 extends string,
  T2 extends string,
  T3 extends string,
  T4 extends string
>(nss: string, x: [T1, T2, T3, T4]): Record<T1 | T2 | T3 | T4, string>;
export function decode<
  T1 extends string,
  T2 extends string,
  T3 extends string,
  T4 extends string,
  T5 extends string
>(nss: string, x: [T1, T2, T3, T4, T5]): Record<T1 | T2 | T3 | T4 | T5, string>;
export function decode(nss: string, x: string[]): Record<string, string> {
  const ret: Record<string, string> = {};
  const parts = nss.split(":");
  if (parts.length !== x.length)
    throw new Error(`Expected nss with ${x.length} segments but got ${nss}`);
  x.forEach((key, i) => (ret[key] = parts[i]));
  return ret;
}
