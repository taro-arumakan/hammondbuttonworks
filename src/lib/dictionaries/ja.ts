/**
 * Japanese UI dictionary. Mirrors the shape of en.ts (enforced where the two
 * are combined in i18n.ts). B2B / heritage-workwear tone.
 */
const ja = {
  langName: "日本語",

  nav: {
    // Menu keeps English display words for Product/Material/About (brand
    // voice), Japanese for the inquiry/login items — per owner direction. 別注
    // and catalog inquiries share one contact form. About was labelled "Craft"
    // until 2026-10-05; renamed to match the page's own ABOUT heading.
    catalog: "Product",
    materials: "Material",
    about: "About",
    quote: "別注/カタログ問い合わせ",
    login: "ログイン",
    cartPrefix: "カート",
    signout: "ログアウト",
    home: "ホーム",
  },

  about: {
    // Owner copy, verbatim ("HBW copies" sheet, about tab, 2026-10). The
    // ABOUT / HAMMOND BUTTON WORKS headings stay English, as in the sheet.
    eyebrow: "About",
    heading: "Hammond Button Works",
    lead: "2008年より、オリジナルボタンのデザイン・製作をスタート。",
    paragraphs: [
      "ハンドクラフトを軸に、手仕事ならではの質感と素材が持つ個性を活かした、独自のボタンを生み出しています。",
      "日本やアメリカ・ニューヨークをはじめ、国内外のクライアントとものづくりを重ね、それぞれの技術や背景を活かしたプロダクトを追求。素材選びから加工、仕上げまで細部にこだわり、長く愛されるアイテムを形にしています。",
      "これまで数多くのブランドとのコラボレーションやボタンの開発を手掛け、ファッションをはじめとする幅広い分野にデザインを提案してきました。",
      "これからも、ここでしか生み出せないデザインと技術を通じて、多様なプロダクトを届けていきます。",
    ],
    bannerAlt: "黒い背景に並ぶ水牛ボタンのアップ。HAMMOND H.B.W. の刻印入り",
  },

  // Owner copy, verbatim ("HBW copies" sheet, one tab per material, 2026-10).
  // Names stay English (brand/display voice); titles are the sheet's own.
  materials: {
    title: "Material",
    description:
      "水牛、ヒマラヤンウッド、水牛製品染め、メタル。Hammond Button Works のボタンに使う素材のご紹介です。",
    items: [
      {
        id: "buffalo",
        name: "Buffalo Horn",
        title: "水牛ボタンについて",
        blocks: [
          [
            "水牛から生まれる、自然な風合いと落ち着いた表情。",
            "一つひとつ異なる色や素材感が、洋服にさりげない品格を添えます。",
            "長年つくり続けてきた定番素材として、これからも素材の個性を大切に届けていきます。",
          ],
          [
            "カラーはBLACK（HT01）、DARK BROWN（H2）、BROWN（H3）、OFF WHITE（BO）の4色展開。",
            "刻印や別注デザイン、色にも対応しております。",
          ],
        ],
        imageAlt: "黒い背景に並ぶ水牛ボタンとトグルのアップ",
        gridAlt: "黒い背景に整然と並ぶ4色の水牛ボタン",
      },
      {
        id: "wood",
        name: "Himalayan Wood",
        title: "ヒマラヤンウッド・ボタンについて",
        blocks: [
          [
            "ヒマラヤの高地に自生する木材を使用した、強度と温かみのある質感を備えたボタン。",
            "独特の色合いと木目が、ものづくりに個性と上質さを添えます。",
          ],
          [
            "カラーはダークブラウン、ブラウン、ベージュの3色展開。刻印や別注デザインにも対応しております。",
            "また、ご好評いただいているトグルボタンも展開しております。",
          ],
        ],
        imageAlt: "黒い背景に並ぶウッドボタンとトグルのアップ",
        gridAlt: "黒い背景に整然と並ぶウッドボタンとトグル",
      },
      {
        id: "dyed",
        name: "Piece-dyed Buffalo Horn",
        title: "水牛製品染めボタンについて",
        blocks: [
          [
            "新たに開発した、製品染めによる水牛ボタンシリーズ。",
            "天然素材の表情を残しながら、独特の色合いとヴィンテージ感を引き出しました。",
            "上品な色ムラと素朴な風合いが、洋服づくりの新たなアクセントになれば幸いです。",
          ],
          [
            "カラーはBLACK、GRAY、INDIGO、MILITARY、BROWN、BEIGEの6色展開。",
            "別注のご相談は、お気軽にお問い合わせください。",
          ],
        ],
        imageAlt: "黒い背景に並ぶ6色の水牛製品染めボタンのアップ",
        gridAlt: "黒い背景に整然と並ぶ6色の水牛製品染めボタン",
      },
      {
        id: "metal",
        name: "Metal",
        title: "メタルボタン",
        blocks: [] as string[][],
        imageAlt: "黒い背景に並ぶ、刻印やレリーフ入りのメタルボタン",
        gridAlt: "黒い背景に整然と並ぶメタルボタン",
      },
    ],
    rangeTitle: "The range",
    empty: "このシリーズの商品は現在準備中です。サンプルや別注については、お気軽にお問い合わせください。",
    emptyCta: "お問い合わせ →",
    backLink: "← 素材一覧",
    customLink: "別注デザイン・オリジナル刻印について →",
  },

  home: {
    // Display captions are kept in English (brand/display voice); the body copy,
    // CTAs, and details below stay Japanese. Auto-translated marketing headlines
    // read awkwardly, so headlines/section titles use the English original.
    eyebrow: "Handcrafted natural buttons · Buffalo · Wood · Metal",
    title: "Buttons of horn, wood & metal — handcrafted, made to order.",
    subtitle:
      "アパレルメーカー様向けの、天然水牛ホーン・ウッド・メタルボタン。手仕上げ・無塗装で、小ロット・サイズ別注に対応します。",
    browse: "カタログを見る",
    requestQuote: "見積もりを依頼",
    props: [
      { t: "Natural materials", d: "水牛ホーン・ウッド・メタル。無塗装で素材本来の表情を活かします。" },
      { t: "Handcrafted", d: "一つひとつ手作業で削り・仕上げ。同じものはひとつとしてありません。" },
      { t: "Made to order", d: "サイズ・仕上げ・刻印まで別注対応。小ロットから承ります。" },
    ],
    propsImageAlts: ["Hammond Button Works のロゴ入りキャンバスポーチ", "水牛・ウッドボタンのサンプルカード"],
    rangeTitle: "The range",
    viewAll: "すべて見る →",
    guestNote: "価格は承認済みの取引先アカウントに表示されます。",
    guestLogin: "取引先ログイン",
    guestOr: "または",
    guestAccess: "アクセスを申請",
    bannerAlt: "黒い背景に整然と並ぶウッドボタンと水牛ボタン",
    materialsTitle: "Material",
    materialsMore: "素材について →",
  },

  catalog: {
    title: "ボタンカタログ",
    intro: "小ロットの手仕事、無塗装の自然な仕上げ。サイズ・仕様は別注対応いたします。",
    subtitleTrade: "手仕事による天然ボタンのラインナップ — 水牛ホーン・ウッド・メタル。お客様の取引価格を表示しています。",
    subtitleGuest: "手仕事による天然ボタンのラインナップ — 水牛ホーン・ウッド・メタル。卸売価格とご注文にはログインが必要です。",
    guestBanner: "ゲストとして閲覧中です — 価格は非表示です。",
    guestBannerLogin: "取引先ログイン",
    guestBannerSuffix: "で価格を表示。",
    fromLigne: "最小",
    cardTradePricing: "取引価格 — ログイン",
    perUnit: "/",
    results: "{count}件",
    filters: {
      title: "絞り込み",
      category: "カテゴリー",
      size: "サイズ",
      color: "色",
      availability: "在庫状況",
      inStock: "在庫あり",
      madeToOrder: "受注生産",
      clear: "すべてクリア",
      empty: "条件に一致するスタイルがありません。",
      emptyReset: "絞り込みを解除",
    },
    sort: {
      label: "並び替え",
      title: "名前順",
      newest: "新着順",
      priceAsc: "価格が安い順",
      priceDesc: "価格が高い順",
    },
    pagination: {
      prev: "前へ",
      next: "次へ",
      pageOf: "{page} / {total} ページ",
    },
  },

  product: {
    specs: "仕様",
    category: "カテゴリー",
    colors: "色",
    material: "素材",
    attachment: "取り付け",
    sizes: "サイズ",
    applications: "用途",
    moq: "最小ロット",
    leadTime: "納期",
    leadTimeValue: "約{days}日",
    origin: "原産国",
    certifications: "認証",
    careLabel: "お手入れ:",
    mockupNote: "実物サンプルの写真です。色・杢目は個体ごとに異なります。",
  },

  priceBlock: {
    heading: "取引価格",
    body: "卸売価格とご注文は承認済みの取引先アカウントでご利用いただけます。ログインしてこのスタイルの段階別価格をご確認いただくか、アクセスを申請してください。",
    login: "取引先ログイン",
    requestAccess: "取引アクセスを申請",
    moqLine: "受注生産 ・ 納期 約{days}日。",
  },

  order: {
    heading: "取引注文",
    color: "色",
    size: "サイズ",
    engraving: "刻印を追加",
    inStock: "在庫あり — 短納期で出荷",
    madeToOrder: "受注生産 ・ 約{days}日",
    shipDate: "出荷予定",
    sizeFinish: "サイズ・仕上げ",
    quantity: "数量",
    moq: "最小ロット",
    unitPrice: "単価",
    lineTotal: "小計",
    volumeApplied: "{qty}{unit}以上で数量価格が適用されます。",
    calculating: "取引価格を計算中…",
    addToCart: "カートに追加",
    added: "カートに追加しました。",
    viewCart: "カートを見る →",
    cartDisabled: "カート未設定（テストモード）",
    customQuote: "別途お見積もりをご希望ですか？依頼する →",
    decrease: "数量を減らす",
    increase: "数量を増やす",
    pricingError: "価格の取得に失敗しました",
  },

  cart: {
    title: "カート",
    subtitle: "ご注文内容をご確認ください。お支払いは銀行振込です — ご注文後に請求書をお送りします。",
    empty: "カートは空です。",
    browseCatalog: "カタログを見る →",
    guestHeading: "お取引アカウントのログインが必要です",
    guestBody:
      "カートの確認とご注文には、承認済みのお取引アカウントでのログインが必要です。お取引がまだの場合は、お見積りフォームからお申し込みください。",
    item: "商品",
    qty: "数量",
    unitPrice: "単価",
    lineTotal: "小計",
    engravingYes: "刻印あり",
    remove: "削除",
    staleLine: "現在お取り扱いがありません — 削除してください。",
    shipInStock: "在庫あり — 短納期で出荷",
    shipMto: "受注生産 ・ 約{days}日",
    orderTotal: "合計",
    shipEstimate: "出荷予定",
    shipEstimateAll: "全品在庫あり — 短納期で出荷",
    shipEstimateMto: "約{days}日（受注生産品を含む）",
    bankNote: "お支払い：ご注文全体を銀行振込にて承ります。カードは不要です。",
    placeOrder: "注文を確定する",
    placing: "注文を送信中…",
    loading: "価格を取得中…",
    successTitle: "ご注文を受け付けました — ありがとうございます。",
    successBody: "ご注文 {name} を受け付けました。銀行振込のご案内を記載した請求書をメールでお送りし、出荷日をご連絡します。",
    successShipping: "出荷予定：{date}。",
    continueShopping: "カタログへ戻る →",
    errorGeneric: "注文を確定できませんでした。もう一度お試しいただくか、見積もりをご依頼ください。",
  },

  quote: {
    title: "別注/カタログ問い合わせ",
    // Owner copy, verbatim ("HBW copies" sheet, 別注 tab, 2026-10).
    customTitle: "別注デザイン / オリジナル刻印",
    customBlocks: [
      [
        "ご要望に合わせたオリジナルボタンを製作いたします。",
        "ヴィンテージをモチーフにしたものから新たなデザインまで、幅広く対応しております。",
      ],
      ["ブランド名の刻印、サンプル製作、レーザー加工も承っております。"],
      ["ご相談は、メールまたは担当者までお問い合わせください。"],
    ],
    bannerAlt: "黒い背景に整然と並ぶ刻印入りのメタルボタン",
    inquiryTitle: "お問い合わせ",
    subtitleCatalog:
      "新規のお取引をご検討中の企業様には、商品カタログをお送りしております。会社名・ご担当者様のお名前を添えて、本フォームよりお気軽にご請求ください。",
    preferEmail: "メールをご希望ですか？担当者へ直接ご連絡いただければ、適切な担当におつなぎします。",
    company: "会社名",
    name: "お名前",
    email: "仕事用メールアドレス",
    phone: "電話番号（任意）",
    sku: "品番（任意）",
    qty: "概算数量（任意）",
    message: "ご要望",
    messagePlaceholder: "サイズ・仕上げ・色・希望価格・納期など…",
    send: "送信する",
    sending: "送信中…",
    successTitle: "ありがとうございます — 依頼を受け付けました。",
    successBody: "内容を確認のうえ、通常1営業日以内にメールでご返信します。",
    errorGeneric: "エラーが発生しました。もう一度お試しください。",
  },

  login: {
    title: "取引先ログイン",
    subtitle:
      "承認済みの取引先アカウントは、メールのワンタイムリンクでログインし、卸売価格の確認とご注文ができます。",
    emailLabel: "仕事用メールアドレス",
    emailPlaceholder: "you@yourbrand.com",
    submit: "ログインリンクをメールで送る",
    notTrade: "まだ取引先アカウントをお持ちでないですか？",
    requestAccess: "取引アクセスを申請",
    requestQuoteLink: "見積もりを依頼 →",
    msgSent:
      "メールをご確認ください — ログインリンクを送信しました（有効期限15分）。メールキー未設定のローカル環境では、リンクはサーバーコンソールに出力されます。",
    msgNotfound:
      "このメールアドレスはまだ承認済みの取引先リストにありません。見積もりを依頼いただければ、アカウントを開設します。",
    msgInvalid: "このログインリンクは無効か、有効期限が切れています。新しいリンクを請求してください。",
    msgError: "有効なメールアドレスを入力してください。",
  },

  footer: {
    navLabel: "サイト内のページ",
    brand: "Hammond Button Works",
    handcraft: "ネパールの手仕事 ・ 東京（日本）",
    contact: "info@alvana.jp",
    copy: "© Hammond Button Works — ハンドクラフトボタン供給（パイロット版）。",
    disclaimer: "天然素材のため、色・杢目は個体ごとに異なります。サンプルご請求いただけます。",
  },

  labels: {
    // Category and color values display in ENGLISH even on the JA UI
    // (owner direction, 2026-07 — matches the English style names).
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
      metal: "金属",
      shell: "貝",
      horn: "水牛角",
      buffalo: "水牛ホーン",
      corozo: "コロゾ（タグア）",
      polyester: "ポリエステル",
      wood: "木",
    } as Record<string, string>,
    holeType: {
      "2-hole": "2つ穴",
      "4-hole": "4つ穴",
      shank: "足付き（シャンク）",
      toggle: "トグル",
      tack: "打ち込み（タック）",
    } as Record<string, string>,
    application: {
      denim: "デニム",
      workwear: "ワークウェア",
      coat: "コート",
      outerwear: "アウターウェア",
      uniform: "ユニフォーム",
      knitwear: "ニットウェア",
    } as Record<string, string>,
    unit: {
      gross: "グロス",
      dozen: "ダース",
      piece: "個",
    } as Record<string, string>,
  },
};

export default ja;
