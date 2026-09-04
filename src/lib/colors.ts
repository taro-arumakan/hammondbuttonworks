/**
 * Colour resolution: supplier colour code → the colour a buyer filters by.
 *
 * WHY THIS IS DERIVED, NOT STORED
 * The filter colour is a pure function of the colour code, so storing it on
 * every variant would be ~120 hand-entered copies of something already known —
 * and copies drift. This project has now unwound that same mistake twice: the
 * species baked into `"Brown (Rosewood)"`, and wood colour duplicated alongside
 * the material it is derivable from. One table, one place to fix.
 *
 * THREE ATTRIBUTES, THREE HOMES — do not let them collapse back into one string:
 *   material → `hbw.material` (variant metafield, a list)
 *   finish   → the `x…` suffix on the colour code (see `splitFinish`)
 *   colour   → the Color option, mapped to a filter colour here
 *
 * Plain module (no deps) so Edge, Node and client components can all import it.
 */

/** The colours a buyer can filter by. Everything maps into exactly one. */
export const FILTER_COLORS = [
  "white",
  "beige",
  "brown",
  "dark brown",
  "black",
  "grey",
  "indigo",
  "military",
  "metal",
] as const;
export type FilterColor = (typeof FILTER_COLORS)[number];

/** Natural buffalo-horn codes (owner-supplied, 2026-09-04). */
const HORN: Record<string, FilterColor> = {
  bo: "white",
  h3: "brown",
  h2: "dark brown",
  ht01: "black",
  h01: "black",
  hb01: "dark brown",
  th01: "black", // only ever seen compounded, as TH01xAG
};

/**
 * Metal finish codes. They name a finish (antique brass, dull ordinary, …) but
 * all filter as one colour — the owner's rule is that metal is metal.
 */
const METAL: ReadonlySet<string> = new Set(["do", "as", "ab", "an", "b", "sp", "ag"]);

/**
 * A colour code may carry a finish after an `x`: `H2xDULL` is H2 in a dull
 * finish; `H3xAG` is HBT-35-COMBI's horn colour beside its metal ring's finish.
 * The finish must NOT stay glued to the colour — otherwise filtering `H2` misses
 * `H2xDULL`, which is exactly how `"Brown (Rosewood)"` broke colour filtering.
 */
export function splitFinish(option: string): { base: string; finish: string | null } {
  const [base, ...rest] = option.split("x");
  return { base: base.trim(), finish: rest.length ? rest.join("x").trim() : null };
}

/**
 * Resolve a Color option value to its filter colour.
 *
 * Returns `null` for anything unmapped — deliberately, so a new supplier code
 * surfaces as a visible gap instead of being silently bucketed as "other" and
 * quietly dropping out of every filter.
 *
 * `materials` is the variant's `hbw.material` list; it only matters for metal,
 * where the code is a finish name rather than a colour.
 */
export function filterColorOf(
  option: string,
  materials: readonly string[] = [],
): FilterColor | null {
  const { base } = splitFinish(option.trim().toLowerCase());

  // Horn codes first: on a mixed-material button (metal centre, buffalo
  // surround) the horn is the face a buyer sees, so it decides the colour.
  // The metal is still discoverable — through the material filter.
  if (base in HORN) return HORN[base];

  // Wood colours and dyed-buffalo colours are already plain words.
  if ((FILTER_COLORS as readonly string[]).includes(base)) return base as FilterColor;

  if (METAL.has(base) || materials.includes("metal")) return "metal";

  return null;
}

/**
 * The key to look up in `dict.labels.color` for display on a card.
 *
 * Dyed buffalo shows as `dyed-black`, `dyed-brown`, … while still filtering as
 * plain `black` / `brown` — the display qualifier and the filter value are
 * deliberately different, which is the whole reason they are separate concerns.
 *
 * `dyed` should come from the product's category once that is decided; it is a
 * property of the product (BT-3579 and BT-3605 are the dyed ranges), never of
 * the colour, so it must not be encoded into colour values.
 */
export function displayColorKey(
  option: string,
  materials: readonly string[] = [],
  opts: { dyed?: boolean } = {},
): string {
  const filter = filterColorOf(option, materials);
  if (!filter) return option.trim().toLowerCase(); // unmapped: show it as-is
  return opts.dyed ? `dyed-${filter}` : filter;
}
