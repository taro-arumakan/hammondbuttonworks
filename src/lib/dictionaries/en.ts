/**
 * English UI dictionary. The shape here is the canonical `Dictionary` type
 * (see i18n.ts); `ja.ts` must mirror it. Strings with `{placeholders}` are
 * filled via `fmt()` from i18n-config.
 */
const en = {
  langName: "English",

  nav: {
    catalog: "Product",
    materials: "Material",
    about: "About",
    quote: "Custom & Catalog Inquiry",
    login: "Login",
    cartPrefix: "Cart",
    signout: "Sign out",
    home: "Home",
  },

  about: {
    // Owner copy, 2026-10 ("HBW copies" sheet, about tab), translated;
    // revised after the owner's review, 2026-10-06.
    eyebrow: "About",
    heading: "Hammond Button Works",
    lead: "Since 2008, we have been designing and making original buttons.",
    paragraphs: [
      "Rooted in handcraft, we create distinctive buttons that bring out the texture only handwork can achieve and the individual character of each material.",
      "We have worked alongside clients across Japan, in New York and in many other places, pursuing products that draw on each partner's expertise and background. Attentive to every detail, from selecting materials through shaping and finishing, we make pieces that are cherished for years.",
      "Over the years, we have collaborated with many brands and developed buttons for them, offering designs to fashion and a broad range of other fields.",
      "Our work is supported by the handcraft skills that our factory in Nepal, a country in view of the majestic Himalayas, has carefully preserved and passed down over many years. The expression shaped by the artisans' hands and the depth of natural materials give each button a presence of its own.",
      "We will continue to create pieces that grow more cherished with time, through design and craftsmanship found nowhere else.",
    ],
    bannerAlt: "Close-up of buffalo horn buttons, some engraved HAMMOND H.B.W., on a black ground",
  },

  // The by-material pages: /materials (index) and /materials/<id>. Owner copy,
  // 2026-10 ("HBW copies" sheet, one tab per material), translated. `id` is the
  // URL segment and must match MATERIAL_SLUGS in lib/materials.ts, which also
  // decides which products each page lists. `name` is the display title on the
  // index (kept English in both locales); `title` heads the material's page.
  // Each block is one paragraph; its lines render as separate lines in JA.
  // Images: /images/site/material-<id>-*.jpg (page banner, home row) and the
  // index's grid shots, named in app/[locale]/materials/page.tsx.
  materials: {
    title: "Material",
    description:
      "Buffalo horn, Himalayan wood, dyed buffalo horn and metal: the materials behind Hammond Button Works.",
    items: [
      {
        id: "buffalo",
        name: "Buffalo Horn",
        title: "Buffalo horn buttons",
        blocks: [
          [
            "Natural texture and a calm, settled look, born of buffalo horn.",
            "No two buttons share quite the same colour or grain, which lends clothing a quiet distinction.",
            "A material we have made for many years, and one whose character we will keep bringing to you.",
          ],
          [
            "Available in four colours: BLACK (HT01), DARK BROWN (H2), BROWN (H3) and OFF WHITE (BO).",
            "Engraving, custom designs and custom colours are also available.",
          ],
        ],
        imageAlt: "Close-up of buffalo horn buttons and toggles on a black ground",
        gridAlt: "Buffalo horn buttons in four colours laid out in rows on a black ground",
        cardAlt: "Buffalo horn buttons and toggles on a black ground",
      },
      {
        id: "wood",
        name: "Himalayan Wood",
        title: "Himalayan wood buttons",
        blocks: [
          [
            "Buttons made from wood that grows wild in the high Himalaya, strong yet warm to the touch.",
            "Its distinctive colour and grain add character and quality to whatever you make.",
          ],
          [
            "Available in three colours: dark brown, brown and beige. Engraving and custom designs are also available.",
            "Our popular toggle buttons are also in the range.",
          ],
        ],
        imageAlt: "Close-up of wood buttons and toggles on a black ground",
        gridAlt: "Wood buttons and toggles laid out in rows on a black ground",
        cardAlt: "Wood buttons and toggles on a black ground",
      },
      {
        id: "dyed",
        name: "Dyed Buffalo Horn",
        title: "Dyed buffalo horn buttons",
        blocks: [
          [
            "A newly developed series of buffalo horn buttons, dyed after they are made.",
            "They keep the natural look of the material while drawing out a distinctive colour and a vintage feel.",
            "We hope their gentle unevenness of colour and simple, honest texture bring a new accent to your garments.",
          ],
          [
            "Available in six colours: BLACK, GRAY, INDIGO, MILITARY, BROWN and BEIGE.",
            "For custom orders, please feel free to get in touch.",
          ],
        ],
        imageAlt: "Close-up of dyed buffalo horn buttons in six colours on a black ground",
        gridAlt: "Dyed buffalo horn buttons in six colours laid out in rows on a black ground",
        cardAlt: "Dyed buffalo horn buttons in several colours in a wooden dish",
      },
      {
        // No owner copy for metal yet — the page shows its title and products.
        id: "metal",
        name: "Metal",
        title: "Metal buttons",
        blocks: [] as string[][],
        imageAlt: "Metal buttons with engraved and embossed faces on a black ground",
        gridAlt: "Metal buttons laid out in rows on a black ground",
        cardAlt: "Metal buttons with engraved and embossed faces on a wooden board",
      },
    ],
    rangeTitle: "The range",
    empty:
      "This series is not in the online catalog yet. For samples or custom orders, please get in touch.",
    emptyCta: "Contact us →",
    backLink: "← All materials",
    customLink: "Custom design & original engraving →",
  },

  home: {
    eyebrow: "Handcrafted natural buttons · Buffalo · Wood · Metal",
    title: "Buttons of horn, wood & metal — handcrafted, made to order.",
    subtitle:
      "We plan and produce original buttons that support the craftsmanship of apparel brands.\nBuffalo horn, wood, and metal, each finished carefully by hand to bring out the character of its material.\nFrom small production runs to custom sizes, we work flexibly, taking in each brand's intent and delivering buttons to the specifications and quantities you need.",
    browse: "Browse the catalog",
    requestQuote: "Request a quote",
    props: [
      { t: "Natural materials", d: "Buffalo horn, hardwood, and solid metal — uncoated, so the material shows." },
      { t: "Handcrafted", d: "Cut and finished by hand; no two pieces are exactly alike." },
      { t: "Made to order", d: "Any size, finish, or engraving — from small quantities up." },
    ],
    propsImageAlts: ["Canvas pouch printed with the Hammond Button Works logo", "Button sample card of buffalo horn and wood buttons"],
    rangeTitle: "The range",
    viewAll: "View all →",
    guestNote: "Prices are visible to approved trade accounts.",
    guestLogin: "Trade login",
    guestOr: "or",
    guestAccess: "request access",
    bannerAlt: "Metal and buffalo horn buttons laid out in rows on a black ground",
    materialsTitle: "Material",
    materialsMore: "About our materials →",
  },

  catalog: {
    title: "Button catalog",
    intro: "Handcrafted in small quantities with a natural, uncoated finish. Any size or spec made to order.",
    subtitleTrade: "Our range of handcrafted natural buttons — buffalo horn, wood, and metal. Showing your trade pricing.",
    subtitleGuest: "Our range of handcrafted natural buttons — buffalo horn, wood, and metal. Sign in for wholesale pricing and ordering.",
    guestBanner: "You're browsing as a guest — prices are hidden.",
    guestBannerLogin: "Trade login",
    guestBannerSuffix: "to see pricing.",
    fromLigne: "from",
    cardTradePricing: "Trade pricing — sign in",
    perUnit: "/",
    results: "{count} items",
    filters: {
      title: "Refine",
      category: "Category",
      size: "Size",
      color: "Color",
      availability: "Availability",
      inStock: "In stock",
      madeToOrder: "Made to order",
      clear: "Clear all",
      empty: "No styles match the selected filters.",
      emptyReset: "Clear filters",
    },
    sort: {
      label: "Sort",
      title: "Name A–Z",
      newest: "Newest",
      priceAsc: "Price: low to high",
      priceDesc: "Price: high to low",
    },
    pagination: {
      prev: "Previous",
      next: "Next",
      pageOf: "Page {page} of {total}",
    },
  },

  product: {
    specs: "Specifications",
    category: "Category",
    colors: "Colors",
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
    mockupNote: "Photographed samples — natural colour and grain vary piece to piece.",
  },

  priceBlock: {
    heading: "Trade pricing",
    body: "Wholesale pricing and ordering are available to approved trade accounts. Sign in to see tiered pricing for this style, or request access.",
    login: "Trade login",
    requestAccess: "Request trade access",
    moqLine: "Made to order · lead time ~{days} days.",
  },

  order: {
    heading: "Trade order",
    color: "Color",
    size: "Size",
    engraving: "Add engraving (刻印)",
    inStock: "In stock — ships promptly",
    madeToOrder: "Made to order · ~{days} days",
    shipDate: "Expected shipping",
    sizeFinish: "Size & finish",
    quantity: "Quantity",
    moq: "MOQ",
    unitPrice: "Unit price",
    lineTotal: "Line total",
    volumeApplied: "Volume price applied at {qty}+ {unit}.",
    calculating: "Calculating trade price…",
    addToCart: "Add to cart",
    added: "Added to cart.",
    viewCart: "View cart →",
    cartDisabled: "Cart not configured (test mode)",
    customQuote: "Prefer a custom quote? Request one →",
    decrease: "Decrease quantity",
    increase: "Increase quantity",
    pricingError: "Pricing error",
  },

  cart: {
    title: "Cart",
    subtitle: "Review your order. Payment is by bank transfer — we'll send an invoice (請求書) after you place the order.",
    empty: "Your cart is empty.",
    browseCatalog: "Browse the catalog →",
    guestHeading: "Trade sign-in required",
    guestBody:
      "Sign in with your approved trade account to view your cart and place orders. Not a trade customer yet? Request access via the quote form.",
    item: "Item",
    qty: "Qty",
    unitPrice: "Unit price",
    lineTotal: "Total",
    engravingYes: "With engraving (刻印)",
    remove: "Remove",
    staleLine: "No longer available — please remove.",
    shipInStock: "In stock — ships promptly",
    shipMto: "Made to order · ~{days} days",
    orderTotal: "Order total",
    shipEstimate: "Expected shipping",
    shipEstimateAll: "All items in stock — ships promptly",
    shipEstimateMto: "~{days} days (made-to-order items)",
    bankNote: "Payment: bank transfer for the whole order. No card required.",
    placeOrder: "Place order",
    placing: "Placing order…",
    loading: "Loading your pricing…",
    successTitle: "Order received — thank you.",
    successBody: "Your order {name} has been placed. We'll email your invoice (請求書) with bank-transfer details, and confirm the shipping date.",
    successShipping: "Expected shipping: {date}.",
    continueShopping: "Back to catalog →",
    errorGeneric: "The order could not be placed. Please try again, or request a quote.",
  },

  quote: {
    title: "Custom & Catalog Inquiry",
    // Owner copy, 2026-10 ("HBW copies" sheet, 別注 tab), translated. Same
    // block/line layout as materials.sections[].blocks.
    customTitle: "Custom design / Original engraving",
    customBlocks: [
      [
        "We make original buttons to your requirements.",
        "From vintage-inspired pieces to entirely new designs, we take on a wide range of work.",
      ],
      ["We also offer brand-name engraving, sample making and laser work."],
      ["To discuss a project, email us or contact your account representative."],
    ],
    bannerAlt: "Close-up of buffalo horn buttons, some engraved HAMMOND H.B.W., scattered on a black ground",
    inquiryTitle: "Inquiry",
    subtitleCatalog:
      "Considering doing business with us? Our product catalog is available on request — send your company name and contact person via this form and we'll follow up with the catalog and trade details.",
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
    // Footer layout per the owner's mockup (2026-10-07): newsletter sign-up,
    // site links, then the white lockup and copyright on black. The link
    // labels stay English on both locales (brand voice, like the header menu).
    navLabel: "Site pages",
    wordmark: "hammond button works",
    links: {
      home: "Home",
      product: "Product",
      material: "Material",
      catalog: "Catalog",
      about: "About",
      custom: "Custom Orders",
      contact: "Contact",
      privacy: "Privacy",
    },
    contact: "info@hammondbutton.works",
    newsletter: {
      label: "Newsletter",
      placeholder: "Enter your e-mail",
      // Rendered as: {consentBefore}<link to /privacy>{consentLink}</link>{consentAfter}
      consentBefore: "I confirm that I have read and understood the ",
      consentLink: "Privacy Policy",
      consentAfter: "",
      submit: "Sign up",
      sending: "Signing up…",
      success: "Thank you. You are now subscribed to our newsletter.",
      error: "Sorry, we could not sign you up. Please try again.",
    },
    copy: "© Hammond Button Works. All rights reserved",
  },

  privacy: {
    // DRAFT written by us (2026-10-07) so the footer's consent checkbox links
    // to a real page. Needs the owner's review before launch.
    heading: "Privacy Policy",
    metaDescription:
      "How Hammond Button Works collects, uses and protects the personal information of trade customers and newsletter subscribers.",
    updated: "Last updated: 7 October 2026",
    intro:
      "Hammond Button Works respects the privacy of everyone who visits this site, contacts us, or trades with us. This policy explains what personal information we collect, why we collect it, and how we look after it.",
    sections: [
      {
        title: "Information we collect",
        body: [
          "When you send an inquiry, request a catalog or open a trade account: your name, company name, e-mail address, phone number and the details of your request.",
          "When you sign up for our newsletter: your e-mail address and the date you gave consent.",
          "When you place an order: the information needed to fulfil it, such as shipping address and order contents.",
          "When you browse the site: a sign-in cookie for trade customers, a display cookie that remembers your sign-in state, and your cart selections, which are stored in your own browser.",
        ],
      },
      {
        title: "How we use it",
        body: [
          "To answer inquiries, send catalogs and samples, and provide quotes.",
          "To process orders and communicate with you about them.",
          "To send our newsletter, only if you have signed up for it.",
          "To keep the site secure and prevent abuse.",
        ],
      },
      {
        title: "Service providers",
        body: [
          "We use trusted providers to run this site: Shopify (customer and order records), Vercel (hosting), Resend (sending e-mail) and Google Workspace (receiving e-mail). They process information only on our behalf. We do not sell or rent your personal information to anyone.",
        ],
      },
      {
        title: "Newsletter",
        body: [
          "You can unsubscribe at any time by using the link in any newsletter, or by e-mailing us.",
        ],
      },
      {
        title: "Your rights",
        body: [
          "You may ask us to disclose, correct, or delete the personal information we hold about you, or to stop using it. Contact us at the address below and we will respond without undue delay.",
        ],
      },
      {
        title: "Contact",
        body: ["For any privacy question or request, please e-mail info@hammondbutton.works."],
      },
    ],
  },

  labels: {
    category: {
      military: "Military",
      classic: "Classic",
      work: "Work",
      craft: "Craft",
      design: "Design",
    } as Record<string, string>,
    color: {
      brown: "Brown",
      beige: "Beige",
      "antique brass": "Antique Brass",
      silver: "Silver",
      gold: "Gold",
      metal: "Metal",
      black: "Black",
      natural: "Natural",
      grey: "Grey",
      navy: "Navy",
      green: "Green",
      red: "Red",
      blue: "Blue",
      white: "White",
      "dark brown": "Dark Brown",
      indigo: "Indigo",
      military: "Military",
      // Finishes (FINISHES in lib/colors.ts): a metal code shows its finish
      // alone ("Antique Brass"); a horn code with a suffix shows both
      // ("Dark Brown / Dull", "Brown / Antique Gold") — see colorLabels.
      "antique nickel": "Antique Nickel",
      "antique silver": "Antique Silver",
      "dark oxidised": "Dark Oxidised",
      brass: "Brass",
      "bright silver": "Bright Silver",
      "antique gold": "Antique Gold",
      dull: "Dull",
      // Dyed buffalo (BT-3579 / BT-3605). Not shown yet: the qualifier belongs
      // to the product (its category, still undecided), never to the colour
      // value — they display and filter as the plain colour until then.
      "dyed-black": "Dyed Black",
      "dyed-brown": "Dyed Brown",
      "dyed-beige": "Dyed Beige",
      "dyed-grey": "Dyed Grey",
      "dyed-indigo": "Dyed Indigo",
      "dyed-military": "Dyed Military",
    } as Record<string, string>,
    material: {
      metal: "Metal",
      shell: "Shell",
      horn: "Horn",
      buffalo: "Buffalo horn",
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
