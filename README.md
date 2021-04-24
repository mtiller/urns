# Installation

You can install this library with:

```
$ yarn add ...
```

The library includes TypeScript types.

# Why URNs?

I've been vaguely aware of URNs for some time. But I never quite understood,
what is the point? I mean a URL seems so much more useful. After all, a URN only
names something, a URL tells you where to find it? Isn't the latter always
better than the former? And then I had several realizations in quick succession.

## Add some identity

The first was about the value of encoding in a URN. Yes, a URN is just a name.
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
either by using `slice` or (better yet) by parsing the URN and extracting the ID.

What's really great about this is that now you can't mix up your string
arguments! If accidentally called `fetchRecord` with:

```typescript
fetchRecord("urn:mongoid:1569-ab32-9f7a-15b3-9ccd", "example.com");
```

In this way, you can create a specially type constrained string type for pretty
much anything and keep them straight. This is especially useful if you've find
yourself definiting functions with multiple (generic) `string` arguments to them
and you want to avoid the situation where you mix things up. Once defined, each
of these URN types partitions the potentially space of string values nicely into
disjoint sets.

# URN Spaces

This library provides the notion of a URN space. This is basically a way of
identifying URNs with a common NID (namespace identifier). Defining such a
space not only gives a simple means of "constructing" URNs associated with that
NID, it gives you methods for narrowing types via TypeScript's `is`
functionality.

# Examples

```typescript
const mongoIds = urnSpace("mongoId");
const record1: URN<"mongoId", string> = mongoIds("1569-ab32-9f7a-15b3-9ccd"); // OK
const record2: string = mongoIds("1569-ab32-9f7a-15b3-9ccd"); // Also fine, but loses type information
const record3: URN<"mongoId", string> = "urn:mongoId:1569-ab32-9f7a-15b3-9ccd"; // works too
const record4: URN<"mongoId", string> = "urn:postgres:1569-ab32-9f7a-15b3-9ccd"; // Nope
const record5: URN<"mongoId", string> = "1569-ab32-9f7a-15b3-9ccd"; // Also nope
```

This also allows casting, _e.g._,

```typescript
if (mongoIds.is(record3)) {
  const id = nss(record3); // Extract the embedded hex id
}
```

# Encoding

One note...you need to be careful about encoding. URNs require encoding of
certain non-ASCII characters. As a result, even though you may assume that the
NSS portion of the URN is some subset of strings, _e.g.,_ `" " | "a" | "b"`,
once encoded the NSS portion may appear encoded, _e.g._ `"%20" | "a" | "b"`.
