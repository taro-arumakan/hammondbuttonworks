/* eslint-disable @next/next/no-img-element */

/**
 * Full-bleed photo banner for the public pages. Server component, no JS: the
 * pages stay static/ISR (see the cacheability notes in CLAUDE.md).
 *
 * Images are pre-sized files under /public/images/site (`<name>-1200.jpg` and
 * `<name>-2400.jpg`), served as a plain srcset rather than through next/image,
 * so a page view costs no image-optimisation invocations.
 *
 * One image, or two to four that crossfade (CSS only, `.banner-fade*` in
 * globals.css): the first sits still underneath and the others fade in over it
 * in turn, so the first is also what prefers-reduced-motion gets. Four is a
 * type-level limit on purpose — the keyframes are written per slide count.
 *
 * The owner's shots centre the buttons on a plain black ground, so
 * `object-cover` + centre crop keeps the subject in frame at every aspect —
 * square on phones, 16:9 on tablets, 21:9 on desktop. A wide subject that a
 * square crop would cut (the sample-card row) sets `phoneGround` instead: on
 * phones it is shown whole, letterboxed on that colour (its own backdrop, so
 * the bands read as part of the photo and hide the slide beneath).
 */
export type BannerImage = { name: string; alt: string; phoneGround?: string };

/** The fade class for slide `i` (0-based) of `n`; the first slide never fades. */
function fadeClass(i: number, n: number) {
  if (i === 0) return "";
  return n === 2 ? "banner-fade" : `banner-fade-${i + 1}of${n}`;
}

export function Banner({
  images,
  className = "aspect-square sm:aspect-[16/9] lg:aspect-[21/9]",
  sizes = "100vw",
  priority = false,
}: {
  images:
    | [BannerImage]
    | [BannerImage, BannerImage]
    | [BannerImage, BannerImage, BannerImage]
    | [BannerImage, BannerImage, BannerImage, BannerImage];
  className?: string;
  /** The rendered width, for srcset; full-bleed by default. */
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <div className={`relative w-full overflow-hidden bg-[#141312] ${className}`}>
      {images.map((img, i) => (
        <img
          key={img.name}
          src={`/images/site/${img.name}-1200.jpg`}
          srcSet={`/images/site/${img.name}-1200.jpg 1200w, /images/site/${img.name}-2400.jpg 2400w`}
          sizes={sizes}
          alt={i === 0 ? img.alt : ""}
          // The first image is the LCP candidate; the others wait.
          loading={priority && i === 0 ? "eager" : "lazy"}
          fetchPriority={priority && i === 0 ? "high" : undefined}
          className={`absolute inset-0 h-full w-full ${
            img.phoneGround ? "object-contain sm:object-cover" : "object-cover"
          } ${fadeClass(i, images.length)}`}
          style={img.phoneGround ? { backgroundColor: img.phoneGround } : undefined}
        />
      ))}
    </div>
  );
}
