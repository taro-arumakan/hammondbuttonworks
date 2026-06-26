import type { HoleType, Material } from "@/lib/schema";

/**
 * Pure SVG render of a garment button — no photos required. Tuned to read as a
 * real, struck-metal heritage button (à la the vintage Scovill sample cards):
 * layered metallic gradients, a turbulence-displacement filter that warps the
 * surface and silhouette so it looks cast and worn rather than vector-perfect,
 * patina pooled at the rim, embossed/stamped relief, fine grain, and a soft
 * contact shadow. Consistent, infinitely scalable, varied by finish + hole type.
 *
 * It's a plain server-renderable component (no interactivity), so it works
 * inside Server Components and ships zero client JS.
 */

type Props = {
  colorHex: string;
  holeType: HoleType;
  material: Material;
  size?: number; // px
  label?: string;
  className?: string;
};

function shade(hex: string, amount: number): string {
  // amount in [-1,1]; positive lightens, negative darkens.
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  const adj = (c: number) =>
    Math.max(0, Math.min(255, Math.round(c + amount * 255)));
  const to2 = (c: number) => adj(c).toString(16).padStart(2, "0");
  return `#${to2(r)}${to2(g)}${to2(b)}`;
}

// Stable per-finish seed so each button has its own (but unchanging) wear,
// grain, and patina pattern — no two finishes look stamped from one mold.
function seedFrom(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 997;
}

export function ButtonSwatch({
  colorHex,
  holeType,
  material,
  size = 160,
  label,
  className,
}: Props) {
  const seed = seedFrom(`${colorHex}-${holeType}-${material}`);
  const id = `b${seed}-${holeType.replace(/[^a-z0-9]/gi, "")}`;
  const isMetal = material === "metal";
  const isShell = material === "shell";

  const light = shade(colorHex, 0.26);
  const hot = shade(colorHex, 0.42);
  const dark = shade(colorHex, -0.3);
  const rim = shade(colorHex, -0.16);
  const edgeDark = shade(colorHex, -0.42);
  const patina = shade(colorHex, -0.52);
  const embossLight = shade(colorHex, isMetal ? 0.34 : 0.16);
  const embossDark = shade(colorHex, -0.34);

  const cx = 50;
  const cy = 50;
  const r = 42;

  // Hole geometry (sew-through types)
  const holeR = 4.1;
  const holeFill = shade(colorHex, -0.58);
  const holeOffset = 12;
  const holes: Array<[number, number]> = [];
  if (holeType === "2-hole") {
    holes.push([cx - holeOffset, cy], [cx + holeOffset, cy]);
  } else if (holeType === "4-hole") {
    holes.push(
      [cx - holeOffset, cy - holeOffset],
      [cx + holeOffset, cy - holeOffset],
      [cx - holeOffset, cy + holeOffset],
      [cx + holeOffset, cy + holeOffset],
    );
  }

  // A small, stable rotation so the surface texture/highlight isn't identical
  // across every button in the grid.
  const rot = (seed % 24) - 12;

  return (
    <svg
      role="img"
      aria-label={label ?? `${material} ${holeType} button`}
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
    >
      <defs>
        {/* Brushed/struck metal face */}
        <radialGradient id={`${id}-face`} cx="40%" cy="34%" r="78%">
          <stop offset="0%" stopColor={hot} />
          <stop offset="30%" stopColor={light} />
          <stop offset="68%" stopColor={colorHex} />
          <stop offset="100%" stopColor={dark} />
        </radialGradient>
        {/* Vertical edge gradient — the button's milled thickness */}
        <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={shade(colorHex, 0.1)} />
          <stop offset="50%" stopColor={rim} />
          <stop offset="100%" stopColor={edgeDark} />
        </linearGradient>
        {/* Patina / tarnish pooled toward the rim */}
        <radialGradient id={`${id}-patina`} cx="50%" cy="50%" r="52%">
          <stop offset="52%" stopColor={patina} stopOpacity="0" />
          <stop offset="86%" stopColor={patina} stopOpacity="0.32" />
          <stop offset="100%" stopColor={patina} stopOpacity="0.62" />
        </radialGradient>
        {isShell && (
          <radialGradient id={`${id}-iri`} cx="64%" cy="68%" r="62%">
            <stop offset="0%" stopColor="#bfe3e0" stopOpacity="0.55" />
            <stop offset="45%" stopColor="#e9d6e8" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        )}
        <radialGradient id={`${id}-cast`} cx="50%" cy="50%" r="60%">
          <stop offset="60%" stopColor="#000000" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        {/* Organic warp: makes the silhouette + surface read cast/worn, not
            machined-perfect. Anisotropic noise = faint struck/brushed grain. */}
        <filter id={`${id}-warp`} x="-12%" y="-12%" width="124%" height="124%">
          <feTurbulence
            type="turbulence"
            baseFrequency="0.14 0.13"
            numOctaves={2}
            seed={seed}
            stitchTiles="stitch"
            result="n"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale={isMetal ? 2.1 : 1.4}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* Fine metallic grain speckle, mapped to alpha only */}
        <filter id={`${id}-grain`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves={2}
            seed={seed + 7}
            result="g"
          />
          <feColorMatrix
            in="g"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.8 0"
          />
        </filter>

        <clipPath id={`${id}-clip`}>
          <circle cx={cx} cy={cy} r={r - 2} />
        </clipPath>
      </defs>

      {/* Cast contact shadow (stays crisp — not warped) */}
      <ellipse cx={cx} cy={cy + 7} rx={r} ry={r * 0.9} fill={`url(#${id}-cast)`} />

      {/* Everything from here is gently warped for an organic, worn read. */}
      <g filter={`url(#${id}-warp)`}>
        {/* Milled edge / body */}
        <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-edge)`} />
        {/* Face */}
        <circle cx={cx} cy={cy} r={r - 2} fill={`url(#${id}-face)`} />

        <g transform={`rotate(${rot} ${cx} ${cy})`}>
          {/* fine grain over the face */}
          <circle
            cx={cx}
            cy={cy}
            r={r - 2}
            fill="#000000"
            filter={`url(#${id}-grain)`}
            clipPath={`url(#${id}-clip)`}
            opacity={isMetal ? 0.07 : 0.05}
          />
          {/* patina pooled at the rim */}
          <circle cx={cx} cy={cy} r={r - 2} fill={`url(#${id}-patina)`} />
        </g>

        {/* rim bevel ring */}
        <circle
          cx={cx}
          cy={cy}
          r={r - 5.5}
          fill="none"
          stroke={embossLight}
          strokeWidth={1.3}
          opacity={0.7}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r - 6.8}
          fill="none"
          stroke={embossDark}
          strokeWidth={0.8}
          opacity={0.5}
        />

        {isShell && <circle cx={cx} cy={cy} r={r - 2} fill={`url(#${id}-iri)`} />}

        {/* specular highlight (raked light, upper-left) */}
        <ellipse
          cx={cx - 11}
          cy={cy - 14}
          rx={12}
          ry={7}
          fill="#ffffff"
          opacity={isMetal ? 0.42 : 0.24}
          transform={`rotate(${rot - 24} ${cx - 11} ${cy - 14})`}
        />

        {/* holes, shank, or tack stud */}
        {holeType === "tack" ? (
          <>
            {/* concentric struck rings of a tack / jeans button */}
            <circle
              cx={cx}
              cy={cy}
              r={r - 11}
              fill="none"
              stroke={embossDark}
              strokeWidth={1.6}
              opacity={0.7}
            />
            <circle
              cx={cx}
              cy={cy}
              r={r - 12.4}
              fill="none"
              stroke={embossLight}
              strokeWidth={0.9}
              opacity={0.8}
            />
            <circle
              cx={cx}
              cy={cy}
              r={r - 18}
              fill="none"
              stroke={embossDark}
              strokeWidth={1}
              opacity={0.5}
            />
            {/* raised center boss */}
            <circle cx={cx} cy={cy} r={6} fill={shade(colorHex, 0.16)} />
            <circle cx={cx} cy={cy} r={6} fill="none" stroke={embossDark} strokeWidth={1} />
            <circle cx={cx} cy={cy} r={6} fill={`url(#${id}-patina)`} opacity={0.5} />
            <circle cx={cx - 1.6} cy={cy - 1.6} r={1.5} fill="#ffffff" opacity={0.5} />
          </>
        ) : holeType === "shank" || holeType === "toggle" ? (
          <>
            {/* domed center over a recessed shank eye */}
            <circle cx={cx} cy={cy} r={9} fill={shade(colorHex, 0.12)} opacity={0.5} />
            <circle cx={cx} cy={cy} r={6.5} fill={embossDark} opacity={0.55} />
            <circle cx={cx} cy={cy} r={2.6} fill={holeFill} />
          </>
        ) : (
          holes.map(([hx, hy], i) => (
            <g key={i}>
              {/* drilled, slightly dished sew holes */}
              <circle cx={hx} cy={hy} r={holeR + 1.4} fill={embossDark} opacity={0.55} />
              <circle cx={hx} cy={hy} r={holeR + 0.6} fill={embossLight} opacity={0.5} />
              <circle cx={hx} cy={hy} r={holeR} fill={holeFill} />
            </g>
          ))
        )}
      </g>
    </svg>
  );
}
