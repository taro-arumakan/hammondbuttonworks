"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { type GalleryImage, shopifySized } from "@/lib/gallery";

/** Fired by TradeOrderPanel when the buyer picks a colour (detail = colour value). */
export const COLOR_EVENT = "hbw:color";

/**
 * Main photo + a horizontally scrollable thumbnail strip (front, side, ¾,
 * back of each colour). Follows the colour from the catalog tile's `?color=`
 * link (read after mount — the page is static) and from the order panel's
 * colour chips, jumping to that colour's first frame.
 */
export function ProductGallery({
  images,
  name,
  colorLabels,
}: {
  images: GalleryImage[];
  name: string;
  colorLabels: Record<string, string>;
}) {
  const [index, setIndex] = useState(0);
  const strip = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const showColor = (color: string | null) => {
      const i = color ? images.findIndex((img) => img.color === color) : -1;
      if (i >= 0) setIndex(i);
    };
    showColor(new URLSearchParams(window.location.search).get("color"));
    const onColor = (e: Event) => showColor((e as CustomEvent<string>).detail);
    window.addEventListener(COLOR_EVENT, onColor);
    return () => window.removeEventListener(COLOR_EVENT, onColor);
  }, [images]);

  // Keep the selected thumbnail in view. Scrolls the strip only — not
  // scrollIntoView, which would also scroll the page.
  useEffect(() => {
    const box = strip.current;
    const thumb = box?.children[index] as HTMLElement | undefined;
    if (!box || !thumb) return;
    const left = thumb.offsetLeft - box.offsetLeft;
    if (left < box.scrollLeft || left + thumb.offsetWidth > box.scrollLeft + box.clientWidth) {
      box.scrollTo({ left: left - (box.clientWidth - thumb.offsetWidth) / 2, behavior: "smooth" });
    }
  }, [index]);

  const current = images[index];
  const label = (img: GalleryImage) =>
    img.color ? `${name} — ${colorLabels[img.color] ?? img.color}` : name;

  if (!current) return <div className="aspect-square w-full rounded-2xl bg-stone-100" />;

  // min-w-0: the strip is wider than the screen; without it the implicit
  // single-column grid on mobile grows to fit it and the page scrolls sideways.
  return (
    <div className="min-w-0">
      <div className="overflow-hidden rounded-2xl bg-stone-50">
        <img
          src={shopifySized(current.url, 1200)}
          alt={label(current)}
          className="aspect-square w-full object-cover"
        />
      </div>

      {images.length > 1 && (
        <div
          ref={strip}
          className="mt-3 flex snap-x gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]"
        >
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={label(img)}
              aria-current={i === index || undefined}
              className={`relative aspect-square w-20 shrink-0 snap-start overflow-hidden rounded-lg border bg-stone-50 transition sm:w-24 ${
                i === index ? "border-foreground" : "border-line opacity-80 hover:opacity-100"
              }`}
            >
              <img
                src={shopifySized(img.url, 240)}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
