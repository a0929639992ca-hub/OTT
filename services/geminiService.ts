
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";

/**
 * 清洗擷取到的 URL，移除結尾可能的標點符號與非圖片路徑字元
 */
const sanitizeUrl = (url: string | null): string | null => {
  if (!url) return null;
  return url.replace(/[.,\)\*\]\s]+$/, '').trim();
};

export const searchOTT = async (query: string): Promise<{
  text: string;
  sources: Array<{ uri: string; title: string }>;
  posterUrl: string | null;
}> => {
  try {
    // 在呼叫時才初始化，避免模組載入階段的 ReferenceError
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
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

    const posterRegex = /(?:海報連結|官方海報|Poster URL|Image URL)[：:].*?(https?:\/\/[^\s\n\)]+)/i;
    const posterMatch = text.match(posterRegex);
    let rawPosterUrl = posterMatch ? posterMatch[1].trim() : null;

    if (!rawPosterUrl) {
      const dbImageRegex = /(https?:\/\/(?:image\.tmdb\.org|m\.media-amazon\.com|upload\.wikimedia\.org)[^\s\n]+\.(?:jpg|jpeg|png|webp))/i;
      const dbMatch = text.match(dbImageRegex);
      if (dbMatch) {
        rawPosterUrl = dbMatch[1].trim();
      }
    }

    const posterUrl = sanitizeUrl(rawPosterUrl);
    const cleanedText = text.replace(/(?:(?:\*\*|__)?(?:海報連結|官方海報|Poster URL|Image URL)(?:\*\*|__)?[：:].*?https?:\/\/[^\s\n]+\n?)/gi, "");

    return { text: cleanedText, sources, posterUrl };
  } catch (error) {
    console.error("Gemini Search Error:", error);
    throw error;
  }
};
