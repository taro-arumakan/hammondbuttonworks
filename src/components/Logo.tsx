/* eslint-disable @next/next/no-img-element */
/**
 * Hammond Button Works logo.
 *
 * The wordmark is the brand's REAL vector lockup (custom geometric "hammond"
 * with the sewing-needle through the `a` and the button `o`, over a serif
 * "BUTTON WORKS"), served from `public/brand/hammond-lockup.svg` — extracted
 * from the supplied artwork (references/hammond001logo.svg). Scales crisply.
 *
 * Variants:
 *  - "compact": the lockup, sized for the header
 *  - "full":    the lockup, sized for the hero
 *  - "stamp":   circular "·BUTTON WORKS· MADE IN JAPAN" maker's mark (footer)
 */

const GEOMETRIC =
  'Futura, "Century Gothic", "Trebuchet MS", "Avant Garde", system-ui, sans-serif';

type Variant = "compact" | "full" | "stamp";

export function Logo({
  variant = "full",
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  if (variant === "stamp") return <Stamp className={className} />;
  return (
    <img
      src="/brand/hammond-lockup.svg"
      alt="Hammond Button Works"
      className={className}
    />
  );
}

/** Circular maker's stamp echoing the "Made in Japan" identity. */
function Stamp({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="Hammond Button Works — Made in Japan"
      fill="none"
    >
      <defs>
        <path id="hbw-top" d="M 21,52 A 29,29 0 0 1 79,52" />
        <path id="hbw-bot" d="M 23,52 A 27,27 0 0 0 77,52" />
      </defs>
      <circle cx="50" cy="50" r="47" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="50" cy="50" r="42.5" stroke="currentColor" strokeWidth="0.7" />

      <text
        fill="currentColor"
        fontSize="9"
        style={{ fontFamily: GEOMETRIC, letterSpacing: "0.16em" }}
      >
        <textPath href="#hbw-top" startOffset="50%" textAnchor="middle">
          BUTTON WORKS
        </textPath>
      </text>
      <text
        fill="currentColor"
        fontSize="7.5"
        style={{ fontFamily: GEOMETRIC, letterSpacing: "0.14em" }}
      >
        <textPath href="#hbw-bot" startOffset="50%" textAnchor="middle">
          MADE IN JAPAN
        </textPath>
      </text>

      {/* center sew-button motif */}
      <circle cx="50" cy="50" r="13" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="50" cy="50" r="9.5" stroke="currentColor" strokeWidth="0.6" />
      <circle cx="46" cy="50" r="1.5" fill="currentColor" />
      <circle cx="54" cy="50" r="1.5" fill="currentColor" />
    </svg>
  );
}
