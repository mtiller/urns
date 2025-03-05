import { ParsedURN, FullURN, BaseURN } from "./types";

/**
 * This is a Javascript regular expression for a URN that is compliant with RFC 8141.
 *
 * You can find a bit more commentary on this here:
 *
 * https://stackoverflow.com/questions/59032211/regex-which-matches-urn-by-rfc8141#comment118833940_59048720
 *
 * You can also play around with the Regexp interactively here:
 *
 * https://regex101.com/r/WMty99/1
 */
const rfc8141 =
  /^urn:([a-z0-9][a-z0-9-]{1,31}):((?:[-a-z0-9()+,.:=@;$_!*'&~\/]|%[0-9a-f]{2})+)(?:(\?\+)((?:(?!\?=)(?:[-a-z0-9()+,.:=@;$_!*'&~\/\?]|%[0-9a-f]{2}))*))?(?:(\?=)((?:(?!#).)*))?(?:(#)((?:[-a-z0-9()+,.:=@;$_!*'&~\/\?]|%[0-9a-f]{2})*))?$/i;

/** Used to pass q/r/f components into the urn construction */
export interface ComponentMaps {
  r?: string;
  q?: Record<string, string> | string;
  f?: string;
}

/**
 * This function takes a given NID and NSS and creates a full URN.  This is relatively straight forward.  The
 * only real complexity comes from handling the URI encoding.
 * @param nid
 * @param nss
 * @param {boolean=} skipVerification skip test against rfc8141 regex (optional, default false)
 * @returns
 */
export function createFullURN<
  NID extends string = string,
  NSS extends string = string
>(nid: NID, nss: NSS, components?: ComponentMaps, skipVerification?: boolean): FullURN<NID, NSS, string> {
  /** Encode the NID */
  const encoded_nid = encodeURI(nid);
  /** Encode the NSS */
  const encoded_nss = encodeURI(nss);
  let ret = `urn:${encoded_nid}:${encoded_nss}`;

  if (components?.r) {
    ret += `?+${encodeURIComponent(components.r)}`;
  }
  if (components?.q) {
    const elements = Object.entries(components.q).map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    );
    ret += `?=${elements.join("&")}`;
  }
  if (components?.f) {
    ret += `#${components.f}`;
  }
  /** Ensure the result satisfies the regular expression */
  if (!skipVerification && !rfc8141.test(ret)) {
    throw new Error("Unable to create a syntactically valid URN");
  }
  return ret as FullURN<NID, NSS, string>;
}

/**
 * This function takes a given NID and NSS and creates a URN.  This is relatively straight forward.  The
 * only real complexity comes from handling the URI encoding.
 * @param nid
 * @param nss
 * @param {boolean=} skipVerification skip test against rfc8141 regex (optional, default false)
 * @returns
 */
export function createURN<
  NID extends string = string,
  NSS extends string = string
>(nid: NID, nss: NSS, skipVerification?: boolean): BaseURN<NID, NSS> {
  /** Encode the NID */
  const encoded_nid = encodeURI(nid);
  /** Encode the NSS */
  const encoded_nss = encodeURI(nss);
  let ret = `urn:${encoded_nid}:${encoded_nss}`;

  /** Ensure the result satisfies the regular expression */
  if (!skipVerification && !rfc8141.test(ret)) {
    throw new Error("Unable to create a syntactically valid URN");
  }
  return ret as BaseURN<NID, NSS>;
}

/**
 * This function "unparses" a URN.  That is to say that it takes the normal output
 * of the `parse` function and reverses it to form the original URN.  This is quite
 * similar to the `createURN` function above except that it handles components as
 * well.
 * @param p
 * @param {boolean=} skipVerification skip test against rfc8141 regex (optional, default false)
 * @returns
 */
export function unparseURN<
  NID extends string = string,
  NSS extends string = string
>(p: Omit<ParsedURN<NID, NSS>, "nss_encoded">, skipVerification?: boolean): FullURN<NID, NSS, string> {
  /** Again, ensure everything is properly URI encoded */
  const nid = encodeURI(p.nid);
  const nss = encodeURI(p.nss);
  const rcomponent = p.rcomponent ? `?+${encodeURI(p.rcomponent)}` : "";
  const qcomponent = p.qcomponent ? `?=${encodeURI(p.qcomponent)}` : "";
  const fragment = p.fragment ? `#${encodeURI(p.fragment)}` : "";
  const ret = `urn:${nid}:${nss}${rcomponent}${qcomponent}${fragment}`;
  /** Ensure the result is a valid URN */
  if (!skipVerification && !rfc8141.test(ret)) {
    throw new Error("Unable to create a syntactically valid URN");
  }
  return ret as FullURN<NID, NSS, string>;
}

/** A helper function to extract just the namespace identifier (NID) */
export function nid<NID extends string>(s: FullURN<NID, string, string>): NID {
  return parseURN(s).nid as NID;
}

/** A helper function to extract just the namespace specific string (NSS) */
export function nss<NSS extends string>(s: FullURN<string, NSS, string>): NSS {
  return parseURN(s).nss as NSS;
}

/**
 * This function parses a string as a URN and returns an object containing all
 * the various aspects of the URN.  Much of the "heavy lifting" here is done
 * by the regular expression parsing itself.  But there are a few more bits
 * we need to do in the function as well.
 * @param s
 * @returns
 */
export function parseURN<
  NID extends string = string,
  NSS extends string = string,
>(s: string): ParsedURN<NID, NSS> {
  /** Parse this using the regular expression at the top of this file */
  const results = s.match(rfc8141);
  /** If it doesn't conform, we are done. */
  if (!results) {
    throw new Error(`String "${s}" is not a valid RFC8141 compliant URN`);
  }

  /* istanbul ignore next */
  if (results.length < 3) {
    throw new Error(`Error parsing URN "${s}"`); // I don't see how this can happen
  }

  /** URI decode the NID and the NSS */
  const nid = decodeURI(results[1]) as NID;
  const nss = decodeURI(results[2]) as NSS;

  /** We keep the encoded NSS as well */
  const nss_encoded = results[2];

  /**
   * Now we have to go through the Regexp output and match it up with
   * any r-component, q-component or f-component, if present.
   */
  const ridx = results.indexOf("?+");
  const qidx = results.indexOf("?=");
  const fidx = results.indexOf("#");
  const rcomponent = ridx === -1 ? null : decodeURI(results[ridx + 1]);
  const qcomponent = qidx === -1 ? null : decodeURI(results[qidx + 1]);
  const fragment = fidx === -1 ? null : decodeURI(results[fidx + 1]);

  /** Return the resulting fully parsed URN. */
  return {
    nid,
    nss,
    nss_encoded,
    rcomponent,
    qcomponent,
    fragment,
  };
}
