# Installation

You can install this library with:

```
$ yarn add urns
```

The library includes TypeScript types.

# Functionality

## Parse URNs

Ensure that a given URN is valid according to RFC 8141 and extract
all the relevant bits:

```typescript
const parsed = parseURN("example:a:b");
```

This includes the ability to parse URNs with `q`, `r` and `f` components,
*e.g.*, `urn:example:a123,0%7C00~&z456/789?+abc?=xyz#12/3`.

## URN Types

In addition to the parsing functionality, it easy to define subtypes of `string` for
representing specific classes of URNs, *e.g.*,

```typescript
export type MyURN = BaseURN<"mydomain">;

// You can then use this type for strings, but only those that really 
// fit the expected URN syntax, e.g.,
const a: MyURN = "urn:mydomain:anything";    // Conforms
const b: MyURN = "urn:wrongdomain:anything"; // TypeScript will flag this as an error!
```

You can further specialize these URNs with a second type parameter to specity
the type for the namespace specific string (NSS), *e.g.,*

```typescript
export type MySpecificURN = BaseURN<"mydomain", "foo" | "bar">;

// We now are restricted in what the NSS can be
const a: MySpecifcURN = "urn:mydomain:foo";  // Conforms
const b: MyURN = "urn:mydomain:buz";         // TypeScript will flag this as an error!
```

But the main functionality of this library is related to the use of `URNSpace`s...

## Create URN "spaces"

This library provides the notion of a `URNSpace`. This is basically a way of
identifying URNs with a common NID (namespace identifier). Defining such a space
not only gives a simple means of "constructing" URNs associated with that NID,
it gives you methods for parsing and narrowing types via TypeScript's `is`
functionality.

## Examples

### Basics

```typescript
const mongoIds = new URNSpace("mongoId");
const record1: BaseURN<"mongoId", string> = mongoIds("1569-ab32-9f7a-15b3-9ccd"); // OK
const record2: string = mongoIds("1569-ab32-9f7a-15b3-9ccd"); // Also fine, but loses type information
const record3: BaseURN<"mongoId", string> = "urn:mongoId:1569-ab32-9f7a-15b3-9ccd"; // works too
const record4: BaseURN<"mongoId", string> = "urn:postgres:1569-ab32-9f7a-15b3-9ccd"; // Nope
const record5: BaseURN<"mongoId", string> = "1569-ab32-9f7a-15b3-9ccd"; // Also nope
```

This also allows casting, _e.g._,

```typescript
// This narrows the type of `record3` from string to a more specific URN syntax string
if (mongoIds.is(record3)) {
  const id = nss(record3); // Extract the embedded hex id
}
```

### Predicates

When creating a `URNSpace` you can provide a predicate function to perform further semantic checks on the NSS and/or
narrow the potential types for the namespace specific string (NSS).  TypeScript's compiler will infer this from
the return type of the predicate.  For example, we might define our `URNSpace` like this:

```typescript
const space = new URNSpace("example", {
  pred: (s: string): s is "a" | "b" => s === "a" || s === "b",
});
```

...in which case, we get the following behavior:

```typescript
space.is("urn:example:b")) // True (and narrows the type)
space.is("urn:example:c")) // False, TypeScript can "see" this isn't allowed!
```

### Decoding

It is also possible to provide a `decode` function when defining a `URNSpace`.  This allows us to perform
an additional `decode` step during URN parsing which saves us the step of having to perform that decoding as
an additional step but also provides an additional semantic check (like the predicate) for testing whether
the URN truly belongs to the `URNSpace`, *e.g.,*

```typescript
const space = new URNSpace("customer", {
  decode: (nss) => {
    const v = parseInt(nss);
    if (Number.isNaN(v)) throw new Error(`NSS (${nss}) is not a number!`);
    return v;
  },
});

space.decode("urn:customer:25"));          // Evaluates to the number 25
space.decode("urn:customer:twenty-five")); // Throws an error
```

# Motivation

## Why URNs?

I've been vaguely aware of URNs for some time. But I never quite understood,
what is the point? I mean a URL seems so much more useful. After all, a URN only
names something, a URL tells you where to find it? Isn't the latter always
better than the former? And then I had several realizations in quick succession.

## Add some identity

The first was about the value of encoding in a URN. Yes, a URN is just a name/string.
But it is a qualified name. How many times have I written code that looks like
this:

```typescript
function fetchRecord(server: string, id: string): string {
    ...
}

fetchRecord("example.com", "1569-ab32-9f7a-15b3-9ccd");
```

The first issue is how do I know what the heck `"1569-ab32-9f7a-15b3-9ccd"` even
is?

So just in terms of attaching a bit more meaning to these things, what if,
instead of `"1569-ab32-9f7a-15b3-9ccd"` I had used a string like this
`"urn:mongoid:1569-ab32-9f7a-15b3-9ccd"` or, even better,
`"urn:mongoid:user:1569-ab32-9f7a-15b3-9ccd"`. Now if I'm debugging this code or
looking at error messages I have a better sense of what that cryptic identifier
actually is (_e.g.,_ this is a mongo document id or, better yet, a mongo
document id that resolves to a user record)

So that's already a good reason to use URNs, _i.e.,_ they give you some context
with which to interpret otherwise non-descript identifiers.

## Not all strings are equal

This was around the time that TypeScript's template literal types came out. If
you aren't familiar with template literal types, they let you do things like
this:

```typescript
type EventType = "create" | "update" | "delete";
type EventName = `event-${EventType}`;
```

This means that you can define a type that is a narrow set of possible strings
(without having to enumerate them all). But you can also create types like this:

```typescript
type URN = `urn:${string}`;
```

or, **more specifically**,

```typescript
type MongoID = `urn:mongoid:${string}`;
```

or even,

```typescript
type MongoUserID = `urn:mongoid:user:${string}`;
```

So what's the big deal here? The big deal is that now you have _type safety_.
Recall my previous `fetchRecord` example but rewritten slightly:

```typescript
function fetchRecord(server: string, id: MongoID): string {
    ...
}

fetchRecord("example.com", "urn:mongoid:1569-ab32-9f7a-15b3-9ccd");
```

Yes, the `id` argument can't be passed directly to a Mongo call because it has
that extra `"urn:mongoid:"` in front of it. But that is easily stripped away
either by using `slice` or (better yet) by parsing the URN and extracting the ID
(which is one of the things this library takes care of).

What's really great about this is that now you can't mix up your string
arguments! If I accidentally called `fetchRecord` with:

```typescript
fetchRecord("urn:mongoid:1569-ab32-9f7a-15b3-9ccd", "example.com");
```

In this way, you can create a specially type constrained string type for pretty
much anything and keep them straight. This is especially useful if you find
yourself definiting functions with multiple (generic) `string` arguments to them
and you want to avoid the situation where you mix things up. Once defined, each
of these URN types partitions the potential space of string values nicely into
disjoint sets.


# Caveats

## RFC 8141

I tried to stay as close as possible to [RFC
8141](https://tools.ietf.org/html/rfc8141). This includes processing
`r-components`, `q-components` and `f-components`. If you find anything in this
library that deviates from that, let me know.

## Encoding

One note...you need to be careful about encoding. URNs require encoding of
certain non-ASCII characters. As a result, even though you may assume that the
NSS portion of the URN is some subset of strings, _e.g.,_ `" " | "a" | "b"`
based on TypeScript types, once encoded the NSS portion may appear encoded,
_e.g._ `"%20" | "a" | "b"`. So the actual strings may not strictly satisfy the
types implied by the type definitions. But the strings that go in
(pre-encoding) and come out (post-decoding) should so I don't think this is a
big deal.
