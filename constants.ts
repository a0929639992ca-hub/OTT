
export const PLATFORM_DATA: Record<string, { name: string; url: string }> = {
  "Netflix": { name: "Netflix", url: "https://www.netflix.com/" },
  "Disney+": { name: "Disney+", url: "https://www.disneyplus.com/" },
  "Hami Video": { name: "Hami Video", url: "https://hamivideo.hinet.net/" },
  "KKTV": { name: "KKTV", url: "https://www.kktv.me/" },
  "LINE TV": { name: "LINE TV", url: "https://www.linetv.tw/" },
  "LiTV": { name: "LiTV", url: "https://www.litv.tv/" },
  "myVideo": { name: "myVideo", url: "https://www.myvideo.net.tw/" },
  "Amazon Prime Video": { name: "Amazon Prime Video", url: "https://www.primevideo.com/" },
  "CATCHPLAY+": { name: "CATCHPLAY+", url: "https://www.catchplay.com/" },
  "friDay影音": { name: "friDay影音", url: "https://video.friday.tw/" },
  "Google Play電影": { name: "Google Play", url: "https://play.google.com/store/movies" },
  "動畫瘋": { name: "巴哈姆特動畫瘋", url: "https://ani.gamer.com.tw/" },
  "愛奇藝台灣": { name: "iQIYI 愛奇藝", url: "https://www.iq.com/" },
  "WeTV": { name: "WeTV", url: "https://wetv.vip/" },
  "GagaOOLala": { name: "GagaOOLala", url: "https://www.gagaoolala.com/" },
  "ELTA TV": { name: "ELTA TV", url: "https://eltaott.tv/" },
  "公視+": { name: "公視+", url: "https://www.ptsplus.tv/" },
  "四季線上": { name: "四季線上", url: "https://www.4gtv.tv/" },
  "木棉花Youtube": { name: "木棉花 Youtube", url: "https://www.youtube.com/@MuseTaiwan" },
  "羚邦Youtube": { name: "羚邦 Youtube", url: "https://www.youtube.com/@AniOneTaiwan" }
};

export const PLATFORMS_LIST = Object.keys(PLATFORM_DATA);

export const SUGGESTED_MOVIES = [
  "奧本海默", "沙丘：第二部", "蒼鷺與少年", "破墓", "周處除三害"
];

export const MOOD_TAGS = [
  "🍿 週末爆米花片", "🧠 燒腦懸疑", "😭 痛哭一場", "🔥 爽度破表", "❤️ 甜甜戀愛"
];

export const SYSTEM_PROMPT = `你是一個專業的台灣 OTT 影音搜尋助手。
你的目標是協助使用者找到電影或影集在台灣哪些合法平台上架，並提供準確且道地的繁體中文資訊。

你的任務：
1. **基本資訊**：提供中文標題、原文名稱、類別、年份、類型、評分。
2. **高品質海報**：必須提供該作品的高清官方電影海報直接連結。
   - **優先來源**：請務必搜尋來自 themoviedb.org (image.tmdb.org) 的圖片網址，這是最穩定的來源。
   - **備選來源**：IMDb (m.media-amazon.com) 或 維基百科 (upload.wikimedia.org)。
   - **嚴格格式**：海報連結必須獨立一行，格式為「海報連結：[直接圖片URL]」。
   - **禁止事項**：絕對禁止在網址末尾加上句號。絕對禁止使用 Markdown 的 [文字](網址) 格式。
3. **格式化輸出**（請完全按照此格式）：
   中文標題：[名稱]
   原文名稱：[Original Title]
   作品類別：[電影/影集/動畫]
   上映年份：[年份]
   作品類型：[類型]
   影評評分：[分數]
   海報連結：[純網址]
   亮點觀點：[一句話總結]
   劇情大綱：[100-150字]
   串流平台供應與進度：
   - [平台名稱]：[狀態]

重要：
- 海報連結必須是能直接在 <img> 標籤顯示的圖片檔網址。
- 如果完全找不到平台，回覆：「未在指定平台中找到此內容」。`;
