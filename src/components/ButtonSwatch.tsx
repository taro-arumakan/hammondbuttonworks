import type { HoleType, Material } from "@/lib/schema";

/**
 * Pure SVG render of a garment button, tuned to the vintage Scovill sample-card
 * look: a FLAT, top-lit metal disc with crisp machined edges, a matte/satin
 * sheen (not glossy), a clean raised rim, and a stamped face that varies by
 * `face` — flat tack, relief medallion (stamped/engraved), open-center
 * "doughnut", or a gently domed jumper-coat face. Muted, consistent, scalable;
 * no photos, zero client JS.
 */

export type ButtonFace = "flat" | "stamped" | "open" | "domed";

type Props = {
  colorHex: string;
  holeType: HoleType;
  material: Material;
  face?: ButtonFace;
  size?: number; // px
  label?: string;
  className?: string;
};

function shade(hex: string, amount: number): string {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  const adj = (c: number) => Math.max(0, Math.min(255, Math.round(c + amount * 255)));
  const to2 = (c: number) => adj(c).toString(16).padStart(2, "0");
  return `#${to2(r)}${to2(g)}${to2(b)}`;
}

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
  face,
  size = 160,
  label,
  className,
}: Props) {
  const seed = seedFrom(`${colorHex}-${holeType}-${face ?? ""}`);
  const id = `b${seed}-${holeType.replace(/[^a-z0-9]/gi, "")}-${face ?? "x"}`;
  const isMetal = material === "metal";
  const isShell = material === "shell";

  // Decide the effective face: shank/toggle read as domed; sew-through types
  // keep their holes; tack defaults to a flat struck face.
  const eff: ButtonFace | "holes" =
    holeType === "2-hole" || holeType === "4-hole"
      ? "holes"
      : holeType === "shank" || holeType === "toggle"
        ? "domed"
        : (face ?? (holeType === "tack" ? "flat" : "flat"));

  // Muted, top-lit palette — gentle contrast for a matte metal read.
  const rimLight = shade(colorHex, 0.2);
  const rimDark = shade(colorHex, -0.22);
  const faceTop = shade(colorHex, 0.1);
  const faceBot = shade(colorHex, -0.12);
  const groove = shade(colorHex, -0.3); // recessed engraving / ring shadow
  const ridge = shade(colorHex, isMetal ? 0.18 : 0.1); // raised highlight
  const innerWall = shade(colorHex, -0.34);
  const holeDark = shade(colorHex, -0.52);

  const cx = 50;
  const cy = 50;
  const rRim = 42; // outer edge
  const rFace = 37.5; // recessed flat face

  // Embossed concentric ring: a dark groove with a light upper edge.
  const Ring = ({ r, w = 1.2, op = 0.7 }: { r: number; w?: number; op?: number }) => (
    <>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={groove} strokeWidth={w} opacity={op} />
      <circle
        cx={cx}
        cy={cy - 0.5}
        r={r}
        fill="none"
        stroke={ridge}
        strokeWidth={w * 0.7}
        opacity={op * 0.8}
      />
    </>
  );

  const sewHoles: Array<[number, number]> = [];
  if (holeType === "2-hole") sewHoles.push([cx - 11, cy], [cx + 11, cy]);
  if (holeType === "4-hole")
    sewHoles.push([cx - 10, cy - 10], [cx + 10, cy - 10], [cx - 10, cy + 10], [cx + 10, cy + 10]);

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
        {/* Flat top-lit face */}
        <linearGradient id={`${id}-face`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={faceTop} />
          <stop offset="52%" stopColor={colorHex} />
          <stop offset="100%" stopColor={faceBot} />
        </linearGradient>
        {/* Convex face for domed (jumper-coat) buttons */}
        <radialGradient id={`${id}-dome`} cx="42%" cy="38%" r="72%">
          <stop offset="0%" stopColor={shade(colorHex, 0.16)} />
          <stop offset="58%" stopColor={colorHex} />
          <stop offset="100%" stopColor={shade(colorHex, -0.16)} />
        </radialGradient>
        {/* Milled rim edge */}
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={rimLight} />
          <stop offset="100%" stopColor={rimDark} />
        </linearGradient>
        {/* Soft satin sheen near the top (matte, low opacity) */}
        <radialGradient id={`${id}-sheen`} cx="50%" cy="24%" r="55%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={isMetal ? 0.22 : 0.12} />
          <stop offset="70%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        {isShell && (
          <radialGradient id={`${id}-iri`} cx="64%" cy="66%" r="60%">
            <stop offset="0%" stopColor="#bfe3e0" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#e9d6e8" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        )}
        <radialGradient id={`${id}-cast`} cx="50%" cy="50%" r="58%">
          <stop offset="62%" stopColor="#000000" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
        {/* Fine cast grain — applied to the FACE only, edges stay crisp */}
        <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={seed} result="g" />
          <feColorMatrix
            in="g"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.5 0"
          />
        </filter>
        <clipPath id={`${id}-clip`}>
          <circle cx={cx} cy={cy} r={rFace} />
        </clipPath>
      </defs>

      {/* contact shadow */}
      <ellipse cx={cx} cy={cy + 6} rx={rRim} ry={rRim * 0.92} fill={`url(#${id}-cast)`} />

      {/* milled rim */}
      <circle cx={cx} cy={cy} r={rRim} fill={`url(#${id}-rim)`} />
      <circle cx={cx} cy={cy} r={rRim - 1.6} fill="none" stroke={ridge} strokeWidth={0.7} opacity={0.6} />

      {/* recessed face */}
      <circle
        cx={cx}
        cy={cy}
        r={rFace}
        fill={`url(#${id}-${eff === "domed" ? "dome" : "face"})`}
      />
      {/* seat shadow where the face meets the rim */}
      <circle cx={cx} cy={cy} r={rFace} fill="none" stroke={groove} strokeWidth={1} opacity={0.45} />

      {/* cast grain + sheen on the face */}
      <circle
        cx={cx}
        cy={cy}
        r={rFace}
        fill="#000000"
        filter={`url(#${id}-grain)`}
        clipPath={`url(#${id}-clip)`}
        opacity={isMetal ? 0.05 : 0.04}
      />
      {isShell && <circle cx={cx} cy={cy} r={rFace} fill={`url(#${id}-iri)`} />}
      <circle cx={cx} cy={cy} r={rFace} fill={`url(#${id}-sheen)`} />

      {/* ---- face detailing ---- */}
      {eff === "open" ? (
        <>
          {/* open-center "doughnut": stamped ring + recessed central hole */}
          <Ring r={26} w={1.3} op={0.7} />
          <circle cx={cx} cy={cy} r={15} fill={innerWall} />
          <circle cx={cx} cy={cy} r={15} fill="none" stroke={groove} strokeWidth={1.2} opacity={0.8} />
          <circle cx={cx} cy={cy} r={10.5} fill={holeDark} />
          {/* inner-wall shading: dark at top, faint light at bottom (top-lit) */}
          <path
            d={`M ${cx - 10.5} ${cy} A 10.5 10.5 0 0 1 ${cx + 10.5} ${cy}`}
            fill="none"
            stroke="#000000"
            strokeOpacity="0.35"
            strokeWidth={1.6}
          />
          <path
            d={`M ${cx - 10.5} ${cy} A 10.5 10.5 0 0 0 ${cx + 10.5} ${cy}`}
            fill="none"
            stroke={ridge}
            strokeOpacity="0.5"
            strokeWidth={1}
          />
        </>
      ) : eff === "stamped" ? (
        <>
          {/* relief medallion (suggests an engraved maker's stamp) */}
          <Ring r={30} w={1.1} op={0.6} />
          <circle cx={cx} cy={cy} r={16} fill={shade(colorHex, -0.05)} />
          <Ring r={16} w={1.3} op={0.85} />
          <Ring r={11} w={0.9} op={0.55} />
          {/* small raised center pip with a top highlight */}
          <circle cx={cx} cy={cy} r={3} fill={ridge} />
          <circle cx={cx} cy={cy} r={3} fill="none" stroke={groove} strokeWidth={0.8} opacity={0.7} />
          <circle cx={cx - 0.8} cy={cy - 0.8} r={0.9} fill="#ffffff" opacity={0.4} />
        </>
      ) : eff === "domed" ? (
        <>
          {/* jumper-coat: clean domed face, subtle stamped center, no front hole */}
          <Ring r={30} w={1} op={0.5} />
          <Ring r={12} w={1} op={0.6} />
          <circle cx={cx} cy={cy} r={2.4} fill={groove} opacity={0.6} />
          <ellipse cx={cx - 9} cy={cy - 11} rx={9} ry={5.5} fill="#ffffff" opacity={isMetal ? 0.22 : 0.12} />
        </>
      ) : eff === "holes" ? (
        sewHoles.map(([hx, hy], i) => (
          <g key={i}>
            <circle cx={hx} cy={hy} r={4.6} fill={groove} opacity={0.6} />
            <circle cx={hx} cy={hy} r={3.4} fill={holeDark} />
            <circle cx={hx} cy={hy - 0.6} r={3.4} fill="none" stroke={ridge} strokeWidth={0.5} opacity={0.5} />
          </g>
        ))
      ) : (
        <>
          {/* flat struck tack face: clean border ring + faint center */}
          <Ring r={30} w={1.2} op={0.65} />
          <Ring r={26} w={0.7} op={0.4} />
          <circle cx={cx} cy={cy} r={3.4} fill="none" stroke={groove} strokeWidth={0.9} opacity={0.55} />
          <circle cx={cx} cy={cy} r={1.2} fill={groove} opacity={0.5} />
        </>
      )}
    </svg>
  );
}
