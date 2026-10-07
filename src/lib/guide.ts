/**
 * Shape of the /guide page copy (dictionaries' `guide` key). Kept apart from
 * the dictionaries because the inline links need a declared union — inferring
 * it from the EN literal would make `ja` fail to type-check.
 */

/** Pages the guide links to inline. Resolved to hrefs in the guide page. */
export type GuideLink = "terms" | "register" | "login" | "email";

/** A run of text, or a run rendered as a link to one of the GuideLink targets. */
export type GuideSegment = string | { text: string; link: GuideLink };

export type GuideBlock =
  | { kind: "p"; text: GuideSegment[] }
  /** Small-print aside (the owner's ※ notes). */
  | { kind: "note"; text: GuideSegment[] }
  | { kind: "list"; items: string[] };

export type GuideCopy = {
  eyebrow: string;
  title: string;
  description: string;
  sections: { heading: string; blocks: GuideBlock[] }[];
};
