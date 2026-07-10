#!/usr/bin/env python3
"""
DEV/SIMULATION ONLY — generate dummy per-colour photos and assign them as Shopify
VARIANT IMAGES, so the colourway-tile catalog can be evaluated before the real
per-colour photography exists.

For each product it takes the featured photo, masks the button off its neutral
backdrop, normalises the button's luminance, tints it to the target colour, and
composites it back over the untouched backdrop. The result is then:
  stagedUploadsCreate → PUT/POST bytes → productUpdate(media:) → poll READY
  → productVariantAppendMedia (image attached to every variant of that colour)

This mirrors the real workflow (one image per colour, shared across that colour's
sizes), so the storefront reads native `variant.image` exactly as it will in prod.

Requires: pip install pillow requests
Run:      set -a; source .env.local; set +a; python3 scripts/seed-colorway-images.py [--force]

Idempotent: a colour whose variants already carry an image is skipped unless --force.
Cleanup: these are dummies — delete the media in Shopify admin when real photos land.
"""
import io
import os
import sys
import time
import json
import requests
from PIL import Image, ImageChops, ImageFilter, ImageOps, ImageStat

DOMAIN = os.environ["SHOPIFY_STORE_DOMAIN"]
TOKEN = os.environ["SHOPIFY_ADMIN_TOKEN"]
VER = os.environ.get("SHOPIFY_API_VERSION", "2025-07")
EP = f"https://{DOMAIN}/admin/api/{VER}/graphql.json"
HDR = {"X-Shopify-Access-Token": TOKEN, "Content-Type": "application/json"}
FORCE = "--force" in sys.argv

# (shadow, highlight) ramp per colour option value. Luminance of the masked button
# is stretched to 0..255 then mapped onto this ramp, so a dark horn photo can
# become a convincing white/blue button and vice-versa.
PALETTE = {
    "Black":            ((12, 12, 14),   (112, 110, 112)),
    "White":            ((148, 146, 142), (252, 252, 250)),
    "Brown":            ((48, 28, 16),   (198, 150, 102)),
    "Metal":            ((58, 60, 66),   (216, 220, 228)),
    "Blue":             ((14, 30, 62),   (122, 162, 214)),
    "Brown (Rosewood)": ((44, 22, 14),   (184, 124, 90)),
    "Beige (Mango)":    ((108, 84, 50),  (240, 218, 176)),
    "Antique Brass":    ((66, 48, 18),   (214, 182, 118)),
    "Blackened Brass":  ((22, 20, 16),   (126, 112, 84)),
}
FALLBACK = ((40, 40, 44), (200, 200, 204))


def gql(query, variables=None):
    r = requests.post(EP, headers=HDR, json={"query": query, "variables": variables or {}}, timeout=60)
    j = r.json()
    if "errors" in j:
        raise SystemExit("GraphQL: " + json.dumps(j["errors"])[:600])
    return j["data"]


def bg_color(img):
    """Backdrop colour, sampled from the four corners."""
    w, h = img.size
    s = max(6, min(w, h) // 25)
    boxes = [(0, 0, s, s), (w - s, 0, w, s), (0, h - s, s, h), (w - s, h - s, w, h)]
    cols = [img.crop(b).resize((1, 1), Image.LANCZOS).getpixel((0, 0)) for b in boxes]
    return tuple(sum(c[i] for c in cols) // len(cols) for i in range(3))


def fg_mask(img, bg, thresh=34):
    """Button mask: pixels far enough from the backdrop colour."""
    ch = img.split()
    diffs = [ImageChops.difference(ch[i], Image.new("L", img.size, bg[i])) for i in range(3)]
    dist = ImageChops.lighter(ImageChops.lighter(diffs[0], diffs[1]), diffs[2])
    m = dist.point(lambda v: 255 if v > thresh else 0)
    m = m.filter(ImageFilter.MaxFilter(3))  # close pinholes (drill holes keep their own edges)
    return m.filter(ImageFilter.GaussianBlur(1.0))  # feather the edge + shadow


def recolor(img, dark, light):
    img = img.convert("RGB")
    bg = bg_color(img)
    mask = fg_mask(img, bg)
    lum = ImageOps.grayscale(img)

    # Stretch the BUTTON's luminance (not the whole frame) to the full range,
    # so a dark source can map onto a light target ramp without going muddy.
    binm = mask.point(lambda v: 255 if v > 128 else 0)
    lo, hi = ImageStat.Stat(lum, binm).extrema[0]
    if hi - lo < 8:
        lo, hi = 0, 255
    lut = [max(0, min(255, int((i - lo) * 255 / (hi - lo)))) for i in range(256)]
    tinted = ImageOps.colorize(lum.point(lut), black=dark, white=light)

    return Image.composite(tinted.convert("RGB"), img, mask)


def jpeg(im, quality=88):
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=quality, optimize=True)
    return buf.getvalue()


Q_PRODUCTS = """
{ products(first: 50) { nodes {
    id title handle
    featuredMedia { preview { image { url } } }
    variants(first: 100) { nodes { id image { url } selectedOptions { name value } } }
} } }"""

M_STAGED = """
mutation($input:[StagedUploadInput!]!){ stagedUploadsCreate(input:$input){
  stagedTargets { url resourceUrl parameters { name value } }
  userErrors { field message } } }"""

M_MEDIA = """
mutation($product:ProductUpdateInput!,$media:[CreateMediaInput!]){ productUpdate(product:$product, media:$media){
  product { id } userErrors { field message } } }"""

Q_MEDIA = """
query($id:ID!){ product(id:$id){ media(first:60){ nodes { id alt status } } } }"""

M_APPEND = """
mutation($productId:ID!,$variantMedia:[ProductVariantAppendMediaInput!]!){
  productVariantAppendMedia(productId:$productId, variantMedia:$variantMedia){
    userErrors { field message } } }"""


def color_of(variant):
    for o in variant["selectedOptions"]:
        if o["name"].lower() == "color":
            return o["value"]
    return None


def main():
    products = gql(Q_PRODUCTS)["products"]["nodes"]
    print(f"{len(products)} products")
    made = skipped = 0

    for p in products:
        src_url = (p.get("featuredMedia") or {}).get("preview", {}).get("image", {}).get("url")
        if not src_url:
            print(f"  ! {p['title']}: no featured image, skipping")
            continue

        by_color = {}
        for v in p["variants"]["nodes"]:
            c = color_of(v)
            if c:
                by_color.setdefault(c, []).append(v)

        todo = [
            c for c, vs in by_color.items()
            if FORCE or not all(v.get("image") for v in vs)
        ]
        if not todo:
            skipped += len(by_color)
            print(f"  = {p['title']}: all colours already have variant images")
            continue

        src = Image.open(io.BytesIO(requests.get(src_url, timeout=60).content))

        # 1) build + stage the recoloured images
        blobs = {}
        for c in todo:
            dark, light = PALETTE.get(c, FALLBACK)
            blobs[c] = jpeg(recolor(src, dark, light))

        staged_in = [
            {
                "resource": "IMAGE",
                "filename": f"{p['handle']}-{c.lower().replace(' ', '-').replace('(', '').replace(')', '')}.jpg",
                "mimeType": "image/jpeg",
                "httpMethod": "POST",
                "fileSize": str(len(blobs[c])),
            }
            for c in todo
        ]
        res = gql(M_STAGED, {"input": staged_in})["stagedUploadsCreate"]
        if res["userErrors"]:
            raise SystemExit(f"stagedUploadsCreate: {res['userErrors']}")
        targets = res["stagedTargets"]

        for c, t, si in zip(todo, targets, staged_in):
            form = [(param["name"], param["value"]) for param in t["parameters"]]
            up = requests.post(
                t["url"], data=form,
                files={"file": (si["filename"], blobs[c], "image/jpeg")}, timeout=180,
            )
            if up.status_code not in (200, 201, 204):
                raise SystemExit(f"upload {c} failed {up.status_code}: {up.text[:300]}")

        # 2) attach as product media (alt carries the colour so we can map it back)
        media_in = [
            {"originalSource": t["resourceUrl"], "alt": f"{p['title']} – {c}", "mediaContentType": "IMAGE"}
            for c, t in zip(todo, targets)
        ]
        mres = gql(M_MEDIA, {"product": {"id": p["id"]}, "media": media_in})["productUpdate"]
        if mres["userErrors"]:
            raise SystemExit(f"productUpdate media: {mres['userErrors']}")

        # 3) wait for media processing, resolve ids by alt
        wanted = {f"{p['title']} – {c}": c for c in todo}
        ids = {}
        for _ in range(30):
            nodes = gql(Q_MEDIA, {"id": p["id"]})["product"]["media"]["nodes"]
            ids = {wanted[n["alt"]]: n["id"] for n in nodes if n["alt"] in wanted and n["status"] == "READY"}
            if len(ids) == len(wanted):
                break
            time.sleep(2)
        if len(ids) != len(wanted):
            print(f"  ! {p['title']}: media not READY for {set(wanted.values()) - set(ids)} — skipping those")

        # 4) attach each colour's image to every variant of that colour
        variant_media = [
            {"variantId": v["id"], "mediaIds": [ids[c]]}
            for c in todo if c in ids for v in by_color[c]
        ]
        if variant_media:
            ares = gql(M_APPEND, {"productId": p["id"], "variantMedia": variant_media})["productVariantAppendMedia"]
            if ares["userErrors"]:
                raise SystemExit(f"productVariantAppendMedia: {ares['userErrors']}")
        made += len(ids)
        print(f"  + {p['title']}: {', '.join(sorted(ids))}  ({len(variant_media)} variants)")

    print(f"\ndone — {made} colourway images created, {skipped} already present")


if __name__ == "__main__":
    main()
