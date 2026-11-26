// =========================================================
// 導入時設定ファイル（config.js）
// スマホ・PC両対応 / ウィザード形式 / パスワード無し全国公開設定
// =========================================================
window.STUDIO_CONFIG = {
  appTitle: "LINE 40-Stamp Motion Studio",
  badgeText: "ステップ式ウィザード・スマホ＆PC対応",

  // パスワードロック設定（false = パスワード無しで誰でも利用可能）
  auth: {
    enabled: false,
    passwordHashes: []
  },

  defaults: {
    canvasWidth: 370,
    canvasHeight: 320,
    showMarginGuide: true,
    tolerance: 35,
    animationFramesPerStamp: 10,
    defaultCaptionColor: "#1e293b",
    defaultCaptionSize: 32,
    defaultSpeed: 1.0,
    defaultAmp: 1.0
  },

  preset40Pack: [
    { text: "おはよう！", motion: "bounce" },
    { text: "ありがとう！", motion: "bow" },
    { text: "了解です！", motion: "nod" },
    { text: "おつかれさま", motion: "bow" },
    { text: "おやすみ〜", motion: "float" },
    { text: "わーい！！", motion: "bounce" },
    { text: "えっ！？", motion: "shock" },
    { text: "ごめんなさい", motion: "droop" },
    { text: "いいね！", motion: "pulse" },
    { text: "よろしくね", motion: "bow" },
    { text: "はーい！", motion: "bounce" },
    { text: "なるほど！", motion: "nod" },
    { text: "うそでしょ!?", motion: "shock" },
    { text: "照れるなぁ", motion: "jelly" },
    { text: "大好き♡", motion: "pulse" },
    { text: "ふふっ♪", motion: "jelly" },
    { text: "最高！！", motion: "spin" },
    { text: "無理…", motion: "droop" },
    { text: "ガンバレ！", motion: "pulse" },
    { text: "やったね！", motion: "bounce" },
    { text: "ペコリ", motion: "bow" },
    { text: "ワクワク", motion: "jelly" },
    { text: "眠い…", motion: "float" },
    { text: "ガーン！", motion: "shock" },
    { text: "OK！", motion: "swing" },
    { text: "まっててね", motion: "swing" },
    { text: "急ぎます！", motion: "shock" },
    { text: "助かりました", motion: "bow" },
    { text: "神！！", motion: "spin" },
    { text: "えーん泣", motion: "droop" },
    { text: "それな！", motion: "nod" },
    { text: "尊い…", motion: "pulse" },
    { text: "またね〜", motion: "swing" },
    { text: "おめでとう！", motion: "spin" },
    { text: "ほっ…", motion: "float" },
    { text: "なんでやねん", motion: "shock" },
    { text: "ぺこぺこ", motion: "bow" },
    { text: "ルンルン♪", motion: "swing" },
    { text: "ちーん…", motion: "droop" },
    { text: "感謝感激！", motion: "bounce" }
  ]
};
