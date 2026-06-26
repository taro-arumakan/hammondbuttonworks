/**
 * English UI dictionary. The shape here is the canonical `Dictionary` type
 * (see i18n.ts); `ja.ts` must mirror it. Strings with `{placeholders}` are
 * filled via `fmt()` from i18n-config.
 */
const en = {
  langName: "English",

  nav: {
    catalog: "Catalog",
    quote: "Request a quote",
    login: "Trade login",
    cartPrefix: "Cart",
    signout: "Sign out",
    home: "Home",
  },

  home: {
    eyebrow: "Heritage workwear buttons · Made in Japan",
    title: "Buttons built for hard wear, supplied for the trade.",
    subtitle:
      "Tack, jumper-coat, overall, and engraved work buttons for apparel makers. Wholesale tiered pricing, low minimums, and custom face stamping.",
    browse: "Browse the catalog",
    requestQuote: "Request a quote",
    props: [
      { t: "Trade pricing", d: "Tiered wholesale pricing with volume breaks. Sign in to see your rates." },
      { t: "Low minimums", d: "Start from small gross quantities for sampling, scale to production lots." },
      { t: "Made to spec", d: "Custom face stamping, logo tooling, and certified, nickel-safe finishes." },
    ],
    rangeTitle: "The pilot range",
    viewAll: "View all →",
    guestNote: "Prices are visible to approved trade accounts.",
    guestLogin: "Trade login",
    guestOr: "or",
    guestAccess: "request access",
  },

  catalog: {
    title: "Button catalog",
    subtitleTrade: "Our pilot range of heritage workwear buttons. Showing your trade pricing.",
    subtitleGuest: "Our pilot range of heritage workwear buttons. Sign in for wholesale pricing and ordering.",
    guestBanner: "You're browsing as a guest — prices are hidden.",
    guestBannerLogin: "Trade login",
    guestBannerSuffix: "to see pricing.",
    fromLigne: "from",
    cardTradePricing: "Trade pricing — sign in",
    perUnit: "/",
  },

  product: {
    specs: "Specifications",
    material: "Material",
    attachment: "Attachment",
    sizes: "Sizes",
    applications: "Applications",
    moq: "MOQ",
    leadTime: "Lead time",
    leadTimeValue: "~{days} days",
    origin: "Origin",
    certifications: "Certifications",
    careLabel: "Care:",
    mockupNote: "Visuals are representative mockups; physical samples available on request.",
  },

  priceBlock: {
    heading: "Trade pricing",
    body: "Wholesale pricing and ordering are available to approved trade accounts. Sign in to see tiered pricing for this style, or request access.",
    login: "Trade login",
    requestAccess: "Request trade access",
    moqLine: "MOQ {moq} {unit} · lead time ~{days} days.",
  },

  order: {
    heading: "Trade order",
    sizeFinish: "Size & finish",
    quantity: "Quantity",
    moq: "MOQ",
    unitPrice: "Unit price",
    lineTotal: "Line total",
    volumeApplied: "Volume price applied at {qty}+ {unit}.",
    calculating: "Calculating trade price…",
    addToCart: "Add to cart",
    cartDisabled: "Cart not configured (test mode)",
    customQuote: "Prefer a custom quote? Request one →",
    decrease: "Decrease quantity",
    increase: "Increase quantity",
    pricingError: "Pricing error",
  },

  quote: {
    title: "Request a quote",
    subtitle:
      "Tell us what you're making. We'll reply with trade pricing, sample options, and lead times — and set up a trade account if you don't have one yet.",
    preferEmail: "Prefer email? Reach us directly and we'll route your request to the right person.",
    company: "Company",
    name: "Your name",
    email: "Work email",
    phone: "Phone (optional)",
    sku: "Item SKU (optional)",
    qty: "Estimated quantity (optional)",
    message: "What do you need?",
    messagePlaceholder: "Sizes, finishes, colors, target price, timeline…",
    send: "Send request",
    sending: "Sending…",
    successTitle: "Thanks — your request is in.",
    successBody: "We'll review and get back to you by email, usually within one business day.",
    errorGeneric: "Something went wrong. Please try again.",
  },

  login: {
    title: "Trade login",
    subtitle:
      "Approved trade accounts sign in with a one-time email link to see wholesale pricing and place orders.",
    emailLabel: "Work email",
    emailPlaceholder: "you@yourbrand.com",
    submit: "Email me a sign-in link",
    notTrade: "Not a trade customer yet?",
    requestAccess: "Request trade access",
    requestQuoteLink: "Request a quote →",
    msgSent:
      "Check your inbox — we've emailed you a sign-in link (valid for 15 minutes). In local dev with no email key set, the link is printed in the server console.",
    msgNotfound:
      "That email isn't on our approved trade list yet. Request a quote and we'll set you up with an account.",
    msgInvalid: "That sign-in link is invalid or has expired. Please request a new one.",
    msgError: "Please enter a valid email address.",
  },

  footer: {
    brand: "Hammond Button Works",
    copy: "© Hammond Button Works — B2B trade supply (pilot).",
    disclaimer: "Product visuals are representative mockups; physical samples available on request.",
  },

  labels: {
    material: {
      metal: "Metal",
      shell: "Shell",
      horn: "Horn",
      corozo: "Corozo",
      polyester: "Polyester",
      wood: "Wood",
    } as Record<string, string>,
    holeType: {
      "2-hole": "2-hole",
      "4-hole": "4-hole",
      shank: "Shank",
      toggle: "Toggle",
      tack: "Tack",
    } as Record<string, string>,
    application: {
      denim: "Denim",
      workwear: "Workwear",
      coat: "Coat",
      outerwear: "Outerwear",
      uniform: "Uniform",
      knitwear: "Knitwear",
    } as Record<string, string>,
    unit: {
      gross: "gross",
      dozen: "dozen",
      piece: "piece",
    } as Record<string, string>,
  },
};

export default en;
