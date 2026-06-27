import { z } from "zod";

/**
 * Single source of truth for the product data model. Product JSON in
 * `content/products/*.json` is validated against these schemas at build time
 * (see `products.ts`), so malformed data — a missing SKU, a bad hex color, or
 * non-ascending price breaks — fails `next build` on purpose.
 */

// --- Tiers -------------------------------------------------------------------
export const TIERS = ["tier_standard", "tier_volume", "tier_partner"] as const;
export const TierSchema = z.enum(TIERS);
export type Tier = (typeof TIERS)[number];

// --- Attachment / hole types (drive the SVG render in ButtonSwatch) ----------
export const HOLE_TYPES = ["2-hole", "4-hole", "shank", "toggle", "tack"] as const;
export const HoleTypeSchema = z.enum(HOLE_TYPES);
export type HoleType = (typeof HOLE_TYPES)[number];

// --- Materials ---------------------------------------------------------------
export const MATERIALS = ["metal", "shell", "horn", "buffalo", "corozo", "polyester", "wood"] as const;
export const MaterialSchema = z.enum(MATERIALS);
export type Material = (typeof MATERIALS)[number];

// --- Selling unit ------------------------------------------------------------
export const UNITS = ["gross", "dozen", "piece"] as const;
export const UnitSchema = z.enum(UNITS);
export type Unit = (typeof UNITS)[number];

const hex = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "colorHex must be a 6-digit hex like #1a2b3c");

// --- Price ladder ------------------------------------------------------------
export const PriceBreakSchema = z.object({
  minQty: z.number().int().positive(),
  unitPrice: z.number().positive(),
  currency: z.string().length(3),
});
export type PriceBreak = z.infer<typeof PriceBreakSchema>;

export const PriceByTierSchema = z
  .object({
    tier_standard: z.array(PriceBreakSchema).min(1),
    tier_volume: z.array(PriceBreakSchema).min(1),
    tier_partner: z.array(PriceBreakSchema).min(1),
  })
  .superRefine((val, ctx) => {
    for (const tier of TIERS) {
      const breaks = val[tier];
      for (let i = 1; i < breaks.length; i++) {
        // Quantity breaks must be strictly ascending by minQty...
        if (breaks[i].minQty <= breaks[i - 1].minQty) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [tier, i, "minQty"],
            message: `${tier}: price breaks must have strictly ascending minQty`,
          });
        }
        // ...and the unit price must not go UP as quantity goes up.
        if (breaks[i].unitPrice > breaks[i - 1].unitPrice) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [tier, i, "unitPrice"],
            message: `${tier}: unit price must not increase at a higher quantity break`,
          });
        }
      }
    }
  });
export type PriceByTier = z.infer<typeof PriceByTierSchema>;

// --- Variant (size × finish) -------------------------------------------------
export const VariantSchema = z.object({
  variantSku: z.string().min(1),
  sizeLigne: z.number().positive(),
  sizeMm: z.number().positive(),
  finish: z.string().min(1),
  colorHex: hex,
  inStockSample: z.boolean(),
  priceByTier: PriceByTierSchema,
});
export type Variant = z.infer<typeof VariantSchema>;

// --- Translations (optional, per-locale overrides) ---------------------------
export const TranslationSchema = z.object({
  name: z.string().optional(),
  shortDescription: z.string().optional(),
  longDescription: z.string().optional(),
  careNotes: z.string().optional(),
  // Map of English finish text → localized finish text.
  finishes: z.record(z.string()).optional(),
  seo: z
    .object({ title: z.string().optional(), description: z.string().optional() })
    .optional(),
});
export type Translation = z.infer<typeof TranslationSchema>;

// --- Product (a button style) ------------------------------------------------
export const ProductSchema = z.object({
  sku: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase kebab-case"),
  name: z.string().min(1),
  shortDescription: z.string().min(1),
  longDescription: z.string().min(1),
  material: MaterialSchema,
  holeType: HoleTypeSchema,
  // Face treatment for the SVG fallback render (independent of attachment):
  //  flat = plain struck face · stamped = relief medallion ·
  //  open = open-center "doughnut" · domed = convex face.
  face: z.enum(["flat", "stamped", "open", "domed"]).optional(),
  // Optional product photo (path under /public). When present it is shown
  // instead of the SVG ButtonSwatch.
  image: z.string().optional(),
  application: z.array(z.string()).default([]),
  careNotes: z.string().optional().default(""),
  countryOfOrigin: z.string().optional(),
  certifications: z.array(z.string()).default([]),
  leadTimeDays: z.number().int().positive(),
  moq: z.number().int().positive(),
  unit: UnitSchema,
  variants: z.array(VariantSchema).min(1),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
    })
    .default({}),
  translations: z.object({ ja: TranslationSchema.optional() }).optional(),
});
export type Product = z.infer<typeof ProductSchema>;
