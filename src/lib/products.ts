import fs from "node:fs";
import path from "node:path";
import { ProductSchema, type Product, type Variant } from "./schema";

/**
 * Product loader + build-time validation. Reads every JSON file under
 * `content/products/`, validates it against the Zod schema (the single source
 * of truth), and throws on the first bad file — which fails `next build`.
 *
 * The set is loaded once at module init and cached. Pages are statically
 * generated from it; the gated /api/price route reads it at runtime (the
 * content dir is traced into that function via next.config.ts).
 */

const DIR = path.join(process.cwd(), "content", "products");

function load(): Product[] {
  let files: string[];
  try {
    files = fs.readdirSync(DIR).filter((f) => f.endsWith(".json"));
  } catch (err) {
    throw new Error(`Could not read product directory ${DIR}: ${String(err)}`);
  }

  const products: Product[] = [];
  const seenSlugs = new Set<string>();
  const seenSkus = new Set<string>();

  for (const file of files) {
    const full = path.join(DIR, file);
    const raw = JSON.parse(fs.readFileSync(full, "utf8"));
    const parsed = ProductSchema.safeParse(raw);
    if (!parsed.success) {
      const detail = parsed.error.issues
        .map((i) => `  • ${i.path.join(".") || "(root)"}: ${i.message}`)
        .join("\n");
      throw new Error(`Invalid product data in ${file}:\n${detail}`);
    }
    const product = parsed.data;

    if (seenSlugs.has(product.slug)) {
      throw new Error(`Duplicate product slug "${product.slug}" (in ${file})`);
    }
    if (seenSkus.has(product.sku)) {
      throw new Error(`Duplicate product SKU "${product.sku}" (in ${file})`);
    }
    seenSlugs.add(product.slug);
    seenSkus.add(product.sku);
    products.push(product);
  }

  // Deterministic order regardless of filesystem readdir order.
  return products.sort((a, b) => a.name.localeCompare(b.name));
}

const PRODUCTS: Product[] = load();

export function getAllProducts(): Product[] {
  return PRODUCTS;
}

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function getVariantBySku(product: Product, variantSku: string): Variant | undefined {
  return product.variants.find((v) => v.variantSku === variantSku);
}
