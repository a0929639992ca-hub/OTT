
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * 清洗擷取到的 URL，移除結尾可能的標點符號與非圖片路徑字元
 */
const sanitizeUrl = (url: string | null): string | null => {
  if (!url) return null;
  // 移除結尾的句號、逗號、括號、星號或換行
  // 注意：我們保留網址中間的括號，只移除結尾處被當作標點的括號
  return url.replace(/[.,\)\*\]\s]+$/, '').trim();
};

export const searchOTT = async (query: string): Promise<{
  text: string;
  sources: Array<{ uri: string; title: string }>;
  posterUrl: string | null;
}> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `搜尋作品供應平台與官方高清海報連結： 「${query}」。優先提供 image.tmdb.org 的海報 URL。`,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        uri: chunk.web.uri,
        title: chunk.web.title
      }));

    // 1. 強化正則：
    // 使用 .*? 跳過「海報連結：」與「http」之間的任何字元（包含 Markdown 的 [文字]( 部分）
    // 這樣即使 AI 輸出「海報連結：[點此](https://...)」，我們也能抓到 https://...
    const posterRegex = /(?:海報連結|官方海報|Poster URL|Image URL)[：:].*?(https?:\/\/[^\s\n\)]+)/i;
    const posterMatch = text.match(posterRegex);
    let rawPosterUrl = posterMatch ? posterMatch[1].trim() : null;

    // 2. 後備擷取：搜尋常見電影資料庫的圖片路徑
    if (!rawPosterUrl) {
      const dbImageRegex = /(https?:\/\/(?:image\.tmdb\.org|m\.media-amazon\.com|upload\.wikimedia\.org)[^\s\n]+\.(?:jpg|jpeg|png|webp))/i;
      const dbMatch = text.match(dbImageRegex);
      if (dbMatch) {
        rawPosterUrl = dbMatch[1].trim();
      }
    }

    // 3. 清洗網址
    const posterUrl = sanitizeUrl(rawPosterUrl);

    // 清理顯示文字，移除海報連結行 (支援更多變體)
    const cleanedText = text.replace(/(?:(?:\*\*|__)?(?:海報連結|官方海報|Poster URL|Image URL)(?:\*\*|__)?[：:].*?https?:\/\/[^\s\n]+\n?)/gi, "");

    return { text: cleanedText, sources, posterUrl };
  } catch (error) {
    console.error("Gemini Search Error:", error);
    throw error;
  }
};
