/* eslint-disable @next/next/no-img-element */

/**
 * Full-bleed photo banner for the public pages. Server component, no JS: the
 * pages stay static/ISR (see the cacheability notes in CLAUDE.md).
 *
 * Images are pre-sized files under /public/images/site (`<name>-1200.jpg` and
 * `<name>-2400.jpg`), served as a plain srcset rather than through next/image,
 * so a page view costs no image-optimisation invocations.
 *
 * One image, or two that crossfade (CSS only, `.banner-fade` in globals.css):
 * the first sits still underneath and the second fades in and out over it, so
 * the first is also what prefers-reduced-motion gets. Two is a type-level
 * limit on purpose — the keyframes are written for exactly two slides.
 *
 * The owner's shots centre the buttons on a plain black ground, so
 * `object-cover` + centre crop keeps the subject in frame at every aspect —
 * square on phones, 16:9 on tablets, 21:9 on desktop.
 */
export type BannerImage = { name: string; alt: string };

export function Banner({
  images,
  className = "aspect-square sm:aspect-[16/9] lg:aspect-[21/9]",
  sizes = "100vw",
  priority = false,
}: {
  images: [BannerImage] | [BannerImage, BannerImage];
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
          // The first image is the LCP candidate; the second waits.
          loading={priority && i === 0 ? "eager" : "lazy"}
          fetchPriority={priority && i === 0 ? "high" : undefined}
          className={`absolute inset-0 h-full w-full object-cover ${i > 0 ? "banner-fade" : ""}`}
        />
      ))}
    </div>
  );
}
