/**
 * Colour resolution: supplier colour code → the colour a buyer filters by, and
 * the label a buyer reads (`colorLabels`).
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
 * Metal finish codes. They name a finish (antique brass, dark oxidised, … — the
 * display names are in `FINISHES` below) but all filter as one colour — the
 * owner's rule is that metal is metal.
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
  if (Object.hasOwn(HORN, base)) return HORN[base];

  // Wood colours and dyed-buffalo colours are already plain words.
  if ((FILTER_COLORS as readonly string[]).includes(base)) return base as FilterColor;

  if (METAL.has(base) || materials.includes("metal")) return "metal";

  return null;
}

/**
 * Finish code → its display name, which is also its `dict.labels.color` key.
 * The metal codes are named from the 2026-09-04 shoot; only `ab` was ever
 * recorded, the rest are read off the photographs and await the owner:
 *   ab  antique brass  — recorded, and the photos agree
 *   an  antique nickel — inferred: blackened, silvery metal rubbed back on the rim
 *   as  antique silver — inferred: matte grey-silver over brass, darkened recesses
 *   do  dark oxidised  — inferred; the only record says "dull ordinary", which
 *                        names no colour a buyer could picture
 *   b   brass          — inferred: plain satin yellow brass, never beside ab
 *   sp  bright silver  — inferred, LOW confidence: pale satin silver, warm cast
 *   ag  antique gold   — inferred, LOW confidence: seen only on HBT-35-COMBI.
 *                        Never "silver" (Ag): it would collide with `as` there.
 * `dull` is not a metal (it is absent from METAL and filters by its horn
 * colour); it is HBW-3584's surface finish, as in `H2xDULL`.
 */
const FINISHES: Record<string, string> = {
  ab: "antique brass",
  an: "antique nickel",
  as: "antique silver",
  do: "dark oxidised",
  b: "brass",
  sp: "bright silver",
  ag: "antique gold",
  dull: "dull",
};

/**
 * The `dict.labels.color` keys a colour value displays as: its colour, then its
 * finish when it carries one — `H2xDULL` → ["dark brown", "dull"], `AB` →
 * ["antique brass"], `H3xAG` → ["brown", "antique gold"].
 *
 * NOT the filter colour: that is many-to-one by design (four metal finishes are
 * all "metal"), so it can never tell two colourways of one product apart.
 *
 * `null` when any part is unmapped, so the caller shows the value verbatim — a
 * visible gap, never a guess.
 */
export function colorLabelKeys(option: string): string[] | null {
  const { base, finish } = splitFinish(option.trim().toLowerCase());
  const color =
    Object.hasOwn(HORN, base)
      ? HORN[base]
      : (FILTER_COLORS as readonly string[]).includes(base)
        ? base
        : METAL.has(base)
          ? FINISHES[base]
          : undefined;
  if (!color) return null;
  if (finish === null) return [color];
  return Object.hasOwn(FINISHES, finish) ? [color, FINISHES[finish]] : null;
}

/**
 * Display labels for ONE product's colours, keyed by the exact option value.
 *
 * ⚠️ Display only. The option value is an identity — /api/price compares it
 * exactly, catalog links carry it in `?color=`, the order panel preselects by
 * it — so look the label up by the value; never replace the value with it.
 *
 * HARD RULE: two colourways of one product never share a label. Two codes can
 * honestly name the same colour (H2 and HB01 are both dark brown), so labels
 * that would collide get the supplier code appended — "Dark Brown (H2)" — and
 * a collision that survives that THROWS rather than rendering two identical
 * chips a buyer cannot tell apart. The catalog listing labels every active
 * product while it prerenders, so a collision fails the build instead of
 * shipping. Compared case-insensitively: the catalog tile renders uppercase.
 *
 * `names` is the locale's `dict.labels.color`; passed in so this module keeps
 * no dependencies.
 */
export function colorLabels(
  options: readonly string[],
  names: Readonly<Record<string, string>>,
  product = "a product",
): Record<string, string> {
  const values = [...new Set(options)];
  const plain = values.map((v) => {
    const keys = colorLabelKeys(v);
    return keys ? keys.map((k) => names[k] ?? k).join(" / ") : v.trim();
  });
  const fold = (label: string) => label.toLowerCase();
  const uses = new Map<string, number>();
  for (const label of plain) uses.set(fold(label), (uses.get(fold(label)) ?? 0) + 1);

  const labels = values.map((v, i) =>
    (uses.get(fold(plain[i])) ?? 0) > 1 ? `${plain[i]} (${v.trim()})` : plain[i],
  );
  const seen = new Map<string, string>();
  labels.forEach((label, i) => {
    const clash = seen.get(fold(label));
    if (clash !== undefined) {
      throw new Error(
        `Colour labels collide on ${product}: ${JSON.stringify(clash)} and ` +
          `${JSON.stringify(values[i])} would both display as ${JSON.stringify(label)}. ` +
          `Fix the colour values in Shopify, or the label tables in src/lib/colors.ts.`,
      );
    }
    seen.set(fold(label), values[i]);
  });
  return Object.fromEntries(values.map((v, i) => [v, labels[i]]));
}
