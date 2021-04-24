import { ParsedURN, FullURN, BaseURN } from "./types";

const rfc8141 = /^urn:([a-z0-9][a-z0-9-]{1,31}):((?:[-a-z0-9()+,.:=@;$_!*'&~\/]|%[0-9a-f]{2})+)(?:(\?\+)((?:(?!\?=)(?:[-a-z0-9()+,.:=@;$_!*'&~\/\?]|%[0-9a-f]{2}))*))?(?:(\?=)((?:(?!#).)*))?(?:(#)((?:[-a-z0-9()+,.:=@;$_!*'&~\/\?]|%[0-9a-f]{2})*))?$/i;

export function createURN<
  NID extends string = string,
  NSS extends string = string
>(nid: NID, nss: NSS): BaseURN<NID, NSS> {
  const encoded_nid = encodeURI(nid);
  const encoded_nss = encodeURI(nss);
  const ret = `urn:${encoded_nid}:${encoded_nss}`;
  if (!rfc8141.test(ret)) {
    throw new Error("Unable to create a syntactically valid URN");
  }
  return ret as BaseURN<NID, NSS>;
}

export function unparseURN<
  NID extends string = string,
  NSS extends string = string
>(p: Omit<ParsedURN<NID, NSS>, "nss_encoded">): FullURN<NID, NSS, string> {
  const nid = encodeURI(p.nid);
  const nss = encodeURI(p.nss);
  const rcomponent = p.rcomponent ? `?+${encodeURI(p.rcomponent)}` : "";
  const qcomponent = p.qcomponent ? `?=${encodeURI(p.qcomponent)}` : "";
  const fragment = p.fragment ? `#${encodeURI(p.fragment)}` : "";
  const ret = `urn:${nid}:${nss}${rcomponent}${qcomponent}${fragment}`;
  if (!rfc8141.test(ret)) {
    throw new Error("Unable to create a syntactically valid URN");
  }
  return ret as FullURN<NID, NSS, string>;
}

export function nid<NID extends string>(s: FullURN<NID, string, string>): NID {
  return parseURN(s).nid as NID;
}

export function nss<NSS extends string>(s: FullURN<string, NSS, string>): NSS {
  return parseURN(s).nss as NSS;
}

export function parseURN(s: string): ParsedURN<string, string> {
  const results = s.match(rfc8141);
  if (!results) {
    throw new Error(`String "${s}" is not a valid RFC8141 compliant URN`);
  }

  /* istanbul ignore next */
  if (results.length < 3) {
    throw new Error(`Error parsing URN "${s}"`); // I don't see how this can happen
  }

  const nid = decodeURI(results[1]);
  const nss = decodeURI(results[2]);
  const nss_encoded = results[2];
  const ridx = results.indexOf("?+");
  const qidx = results.indexOf("?=");
  const fidx = results.indexOf("#");
  const rcomponent = ridx === -1 ? null : decodeURI(results[ridx + 1]);
  const qcomponent = qidx === -1 ? null : decodeURI(results[qidx + 1]);
  const fragment = fidx === -1 ? null : decodeURI(results[fidx + 1]);
  return {
    nid,
    nss,
    nss_encoded,
    rcomponent,
    qcomponent,
    fragment,
  };
}
