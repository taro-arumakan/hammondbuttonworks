/**
 * Japanese UI dictionary. Mirrors the shape of en.ts (enforced where the two
 * are combined in i18n.ts). B2B / heritage-workwear tone.
 */
import type { GuideCopy } from "../guide";

const ja = {
  langName: "日本語",

  nav: {
    // Menu keeps English display words for Product/Material/About (brand
    // voice), Japanese for the inquiry/login items — per owner direction. 別注
    // and catalog inquiries share one contact form. About was labelled "Craft"
    // until 2026-10-05; renamed to match the page's own ABOUT heading.
    catalog: "Product",
    materials: "Material",
    printCatalog: "Catalog",
    about: "About",
    quote: "別注/カタログ問い合わせ",
    login: "ログイン",
    cartPrefix: "カート",
    signout: "ログアウト",
    home: "ホーム",
  },

  printCatalog: {
    // Owner's caption (2026-10-07): 「カタログ請求の依頼はこちらより問い合わせください。」
    heading: "Catalog",
    requestBefore: "カタログ請求の依頼は",
    requestLink: "こちら",
    requestAfter: "より問い合わせください。",
    metaDescription:
      "水牛・ウッド・メタルのボタンを綿のサンプルカードに収めた、Hammond Button Works の商品カタログです。お取引先様へご請求に応じてお送りしております。",
    pageAlt: "カタログ {n} / {total} ページ",
    coverAlt: "カタログ表紙",
    backAlt: "カタログ裏表紙",
    cta: "カタログを請求する",
  },

  about: {
    // Owner copy, verbatim ("HBW copies" sheet, about tab, 2026-10; revised
    // after the owner's review, 2026-10-06). The
    // ABOUT / HAMMOND BUTTON WORKS headings stay English, as in the sheet.
    eyebrow: "About",
    heading: "Hammond Button Works",
    lead: "2008年より、オリジナルボタンのデザイン・製作をスタート。",
    paragraphs: [
      "ハンドクラフトを軸に、手仕事ならではの質感と素材が持つ個性を活かした、独自のボタンを生み出しています。",
      "日本国内やアメリカ・ニューヨークをはじめ、さまざまな地域のクライアントとものづくりを重ね、それぞれの技術や背景を活かしたプロダクトを追求。素材選びから加工、仕上げまで細部にこだわり、長く愛されるアイテムを形にしています。",
      "これまで数多くのブランドとのコラボレーションやボタンの開発を手掛け、ファッションをはじめとする幅広い分野にデザインを提案してきました。",
      "そのものづくりを支えるのは、雄大なヒマラヤを望む国・ネパールのファクトリーが、長年にわたり大切に受け継いできた手仕事の技術。職人の手によって形づくられる表情と、天然素材がもたらす奥行きが、一つひとつに存在感を与えています。",
      "これからも、ここでしか生み出せないデザインと技術を通じて、愛着が深まるものづくりを続けていきます。",
    ],
    bannerAlt: "木の器に集めた青・緑・グレー・ベージュのボタン",
    nepalAlts: [
      "朝靄に包まれたネパールの谷と朝日",
      "ヒマラヤの雪山を背に揺れるネパールの国旗",
      "ボートが並ぶフェワ湖のほとりを歩く、柄物のショールをまとった女性",
    ],
  },

  guide: {
    // Owner copy (thread "create a /guide page", 2026-10-07), with login,
    // registration and payment lines corrected to match the site (Taro, same day).
    eyebrow: "Guide",
    title: "発注・ご購入の前に",
    description:
      "はじめてご利用の方・メーカー様へ。会員登録、価格の表示、商品の選択、お支払い、別注のご依頼についてのご案内です。",
    sections: [
      {
        heading: "はじめてご利用の方・メーカー様へ",
        blocks: [
          { kind: "p", text: ["ご利用にあたり、", { text: "利用規約", link: "terms" }, "をお読みください。"] },
          {
            kind: "p",
            text: [
              "当ウェブサイトで商品をご購入いただくには、会員登録が必要です。",
              { text: "新規会員登録画面", link: "register" },
              "よりお手続きください。",
            ],
          },
          { kind: "p", text: ["アカウントの設定が完了しましたら、ご登録のメールアドレス宛に登録完了メールをお送りいたします。"] },
          { kind: "note", text: ["※パスワードは不要です。ログインの際は、ご登録のメールアドレス宛にお送りするログイン用リンクをご利用ください。"] },
        ],
      },
      {
        heading: "価格の表示について",
        blocks: [
          {
            kind: "p",
            text: [
              { text: "ログイン画面", link: "login" },
              "にて、ご登録のメールアドレスを入力してください。お送りするメールのリンクからログインいただくと、商品の価格が表示されます。",
            ],
          },
        ],
      },
      {
        heading: "商品の選択",
        blocks: [
          { kind: "p", text: ["商品詳細ページでカラー・サイズを選択し、「カートに入れる」ボタンをクリックしてください。"] },
          {
            kind: "note",
            text: [
              "※商品は原則として在庫を持たず、受注生産にて承っております。お届けまでの目安は、ご注文から約30日です。デザイン・仕様により納期が異なりますので、あらかじめご了承ください。",
            ],
          },
        ],
      },
      {
        heading: "お支払いについて",
        blocks: [
          { kind: "p", text: ["お支払いは、銀行振込（請求書に基づくお支払い）にて承っております。"] },
        ],
      },
      {
        heading: "別注・オリジナルデザインのご依頼について",
        blocks: [
          { kind: "p", text: ["別注やオリジナルデザインのご依頼・ご相談は、下記メールアドレスまでお問い合わせください。"] },
          { kind: "p", text: [{ text: "info@hammondbutton.works", link: "email" }] },
        ],
      },
    ],
  } satisfies GuideCopy as GuideCopy,

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
        cardAlt: "黒い背景に並ぶ水牛ボタンとトグル",
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
        cardAlt: "黒い背景に並ぶウッドボタンとトグル",
      },
      {
        id: "dyed",
        name: "Dyed Buffalo Horn",
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
        cardAlt: "木の器に盛られた色とりどりの水牛製品染めボタン",
      },
      {
        id: "metal",
        name: "Metal",
        title: "メタルボタン",
        blocks: [] as string[][],
        imageAlt: "黒い背景に並ぶ、刻印やレリーフ入りのメタルボタン",
        gridAlt: "黒い背景に整然と並ぶメタルボタン",
        cardAlt: "木の台に置かれた、刻印やレリーフ入りのメタルボタン",
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
    // Owner copy, verbatim (2026-10). Line breaks are the owner's; the hero
    // renders them with whitespace-pre-line.
    subtitle:
      "アパレルブランドのモノづくりを支える、オリジナルボタンの企画・生産。\n水牛、ウッド、メタル、それぞれの素材が持つ表情を生かし、手仕事で丁寧に仕上げます。\n小ロットの生産からサイズ別注まで、柔軟に対応。ブランドの意図をくみ取り、ご希望の仕様や数量に合わせたボタンをご提供いたします。",
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
    bannerAlt: "黒い背景に整然と並ぶメタルボタンと水牛ボタン",
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
    bannerAlt: "黒い背景に散らばる水牛ボタンのアップ。HAMMOND H.B.W. の刻印入り",
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
    // オーナーのモック（2026-10-07）準拠。リンク名はヘッダー同様に英語表記。
    navLabel: "サイト内のページ",
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
    copy: "© Hammond Button Works. All rights reserved",
  },

  privacy: {
    // 下書き（2026-10-07、こちらで作成）。公開前にオーナーの確認が必要。
    heading: "プライバシーポリシー",
    metaDescription:
      "Hammond Button Works における、お取引先様およびサイト利用者の個人情報の取り扱いについて。",
    updated: "最終更新日：2026年10月7日",
    intro:
      "Hammond Button Works は、本サイトをご利用になる方、お問い合わせいただく方、お取引先様の個人情報を大切に取り扱います。本ポリシーでは、取得する個人情報、その利用目的、および管理方法についてご説明します。",
    sections: [
      {
        title: "取得する情報",
        body: [
          "お問い合わせ、カタログ請求、お取引口座の開設の際：お名前、会社名、メールアドレス、電話番号、ご依頼内容。",
          "ご注文の際：配送先住所、ご注文内容など、ご注文の処理に必要な情報。",
          "サイトの閲覧時：お取引先様のログイン用クッキー、ログイン状態を表示するためのクッキー、およびお使いのブラウザ内に保存されるカートの内容。",
        ],
      },
      {
        title: "利用目的",
        body: [
          "お問い合わせへの回答、カタログ・サンプルの送付、お見積りのため。",
          "ご注文の処理およびご注文に関するご連絡のため。",
          "サイトの安全な運営および不正利用の防止のため。",
        ],
      },
      {
        title: "業務委託先",
        body: [
          "本サイトの運営には、Shopify（顧客・注文情報の管理）、Vercel（ホスティング）、Resend（メール送信）、Google Workspace（メール受信）を利用しています。これらの事業者は当社の委託に基づいてのみ情報を取り扱います。お客様の個人情報を第三者に販売・貸与することはありません。",
        ],
      },
      {
        title: "開示・訂正・削除のご請求",
        body: [
          "当社が保有するお客様の個人情報について、開示・訂正・削除・利用停止をご請求いただけます。下記の連絡先までご連絡ください。速やかに対応いたします。",
        ],
      },
      {
        title: "お問い合わせ窓口",
        body: ["個人情報に関するご質問・ご請求は info@hammondbutton.works までメールでお問い合わせください。"],
      },
    ],
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
