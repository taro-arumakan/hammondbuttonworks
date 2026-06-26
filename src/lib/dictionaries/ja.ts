/**
 * Japanese UI dictionary. Mirrors the shape of en.ts (enforced where the two
 * are combined in i18n.ts). B2B / heritage-workwear tone.
 */
const ja = {
  langName: "日本語",

  nav: {
    catalog: "カタログ",
    quote: "見積もり依頼",
    login: "取引先ログイン",
    cartPrefix: "カート",
    signout: "ログアウト",
    home: "ホーム",
  },

  home: {
    // Display captions are kept in English (brand/display voice); the body copy,
    // CTAs, and details below stay Japanese. Auto-translated marketing headlines
    // read awkwardly, so headlines/section titles use the English original.
    eyebrow: "Heritage workwear buttons · Made in Japan",
    title: "Buttons built for hard wear, supplied for the trade.",
    subtitle:
      "アパレルメーカー様向けのタック・ジャンパーコート・オーバーオール・刻印ワークボタン。卸売の段階別価格、小ロット対応、名入れ刻印に対応します。",
    browse: "カタログを見る",
    requestQuote: "見積もりを依頼",
    props: [
      { t: "Trade pricing", d: "数量に応じた段階別の卸売価格。ログインで料金を表示します。" },
      { t: "Low minimums", d: "サンプル用の小ロットから量産ロットまで対応します。" },
      { t: "Made to spec", d: "名入れ刻印・ロゴ金型・ニッケルセーフの認証仕上げ。" },
    ],
    rangeTitle: "The pilot range",
    viewAll: "すべて見る →",
    guestNote: "価格は承認済みの取引先アカウントに表示されます。",
    guestLogin: "取引先ログイン",
    guestOr: "または",
    guestAccess: "アクセスを申請",
  },

  catalog: {
    title: "ボタンカタログ",
    subtitleTrade: "ヘリテージ・ワークウェアボタンのパイロットラインナップ。お客様の取引価格を表示しています。",
    subtitleGuest: "ヘリテージ・ワークウェアボタンのパイロットラインナップ。卸売価格とご注文にはログインが必要です。",
    guestBanner: "ゲストとして閲覧中です — 価格は非表示です。",
    guestBannerLogin: "取引先ログイン",
    guestBannerSuffix: "で価格を表示。",
    fromLigne: "最小",
    cardTradePricing: "取引価格 — ログイン",
    perUnit: "/",
  },

  product: {
    specs: "仕様",
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
    mockupNote: "画像はイメージです。実物サンプルはご請求いただけます。",
  },

  priceBlock: {
    heading: "取引価格",
    body: "卸売価格とご注文は承認済みの取引先アカウントでご利用いただけます。ログインしてこのスタイルの段階別価格をご確認いただくか、アクセスを申請してください。",
    login: "取引先ログイン",
    requestAccess: "取引アクセスを申請",
    moqLine: "最小ロット {moq} {unit} ・ 納期 約{days}日。",
  },

  order: {
    heading: "取引注文",
    sizeFinish: "サイズ・仕上げ",
    quantity: "数量",
    moq: "最小ロット",
    unitPrice: "単価",
    lineTotal: "小計",
    volumeApplied: "{qty}{unit}以上で数量価格が適用されます。",
    calculating: "取引価格を計算中…",
    addToCart: "カートに追加",
    cartDisabled: "カート未設定（テストモード）",
    customQuote: "別途お見積もりをご希望ですか？依頼する →",
    decrease: "数量を減らす",
    increase: "数量を増やす",
    pricingError: "価格の取得に失敗しました",
  },

  quote: {
    title: "見積もりを依頼",
    subtitle:
      "製作内容をお知らせください。取引価格・サンプル・納期をご返信し、アカウントをお持ちでない場合は取引先アカウントを開設します。",
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
    brand: "Hammond Button Works",
    copy: "© Hammond Button Works — B2B卸売供給（パイロット版）。",
    disclaimer: "製品画像はイメージです。実物サンプルはご請求いただけます。",
  },

  labels: {
    material: {
      metal: "金属",
      shell: "貝",
      horn: "水牛角",
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
