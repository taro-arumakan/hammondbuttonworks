/**
 * The by-material pages (/materials, /materials/<slug>): which colourways
 * belong to which material.
 *
 * DERIVED, like the colour mapping in lib/colors.ts — never stored. Every input
 * already exists on the variant: its `hbw.material` list and its Color value.
 *
 *   wood     — any wood species (acacia / rosewood / mango): the "Himalayan
 *              wood" range, whatever the species.
 *   metal    — metal.
 *   buffalo  — buffalo horn sold under a natural horn code (BO, H2, H3, HT01…).
 *   dyed     — buffalo horn sold under a plain colour word (black, gray,
 *              indigo, military, brown, beige). The piece-dyed series is the
 *              only buffalo that is: natural horn always carries its horn code,
 *              so the colour value is what tells the two apart. Nothing in the
 *              data marks "dyed" on its own — if that ever changes, change it
 *              here.
 *
 * A colourway can sit in two groups: HBT-35-COMBI is a metal centre in a
 * buffalo surround, so it lists under both buffalo and metal.
 *
 * Plain module (no deps beyond colors.ts) so server and client can import it.
 */
import { isHornCode } from "./colors";

/** Page order, and the URL segment of each material's page. */
export const MATERIAL_SLUGS = ["buffalo", "wood", "dyed", "metal"] as const;
export type MaterialSlug = (typeof MATERIAL_SLUGS)[number];

const WOOD_SPECIES: ReadonlySet<string> = new Set(["acacia", "rosewood", "mango"]);

export function isMaterialSlug(value: string): value is MaterialSlug {
  return (MATERIAL_SLUGS as readonly string[]).includes(value);
}

/**
 * The material pages one colourway appears on. `materials` is the union of its
 * variants' `hbw.material` lists. Empty when the metafield is missing — such a
 * colourway still shows in the catalog, just on no material page.
 */
export function materialGroupsOf(color: string, materials: readonly string[]): MaterialSlug[] {
  const groups = new Set<MaterialSlug>();
  for (const m of materials) {
    if (WOOD_SPECIES.has(m)) groups.add("wood");
    else if (m === "metal") groups.add("metal");
    else if (m === "buffalo") groups.add(isHornCode(color) ? "buffalo" : "dyed");
  }
  return MATERIAL_SLUGS.filter((s) => groups.has(s));
}

/**
 * Photographs per material, by /public/images/site base name:
 *   grid   — the plain flat-lay on the /materials index (`-1200`/`-2400`),
 *            trimmed to 12:5 around the buttons, one framing scale for all four
 *   banner — the top of the material's own page (`-1200`/`-2400`), trimmed 12:5
 *   card   — the home page's Material row (`-1200` only, 3:2). Cropped from
 *            the owner's home-page mockup (2026-10-07); dyed and metal are
 *            styled shots on wood, so their alt text is `cardAlt`, not imageAlt
 * The files are cut to the aspect they display at, so nothing is cropped in
 * CSS: the index tile and the page banner both render `aspect-[12/5]`.
 * The owner's direction (2026-10): plain grid layouts for banners, close-ups
 * inside; nothing styled with props such as flowers. Metal has no close-up in
 * the shoot, so its page banner IS its index tile.
 */
export const MATERIAL_IMAGES: Record<MaterialSlug, { grid: string; banner: string; card: string }> = {
  buffalo: { grid: "materials-grid-buffalo", banner: "materials-banner-buffalo", card: "material-buffalo" },
  wood: { grid: "materials-grid-wood", banner: "materials-banner-wood", card: "material-wood" },
  dyed: { grid: "materials-grid-dyed", banner: "materials-banner-dyed", card: "material-dyed" },
  metal: { grid: "materials-grid-metal", banner: "materials-grid-metal", card: "material-metal" },
};
