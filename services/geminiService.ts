
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";

const sanitizeUrl = (url: string | null): string | null => {
  if (!url) return null;
  // 移除網址末尾可能被 AI 誤加的標點符號或括號
  return url.replace(/[.,\)\*\]\s!]+$/, '').trim();
};

export const searchOTT = async (query: string): Promise<{
  text: string;
  sources: Array<{ uri: string; title: string }>;
  posterUrl: string | null;
}> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `搜尋台灣合法串流平台供應與「${query}」的高清海報連結。優先尋找 image.tmdb.org 的來源。`,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter((chunk: any) => chunk && chunk.web)
      .map((chunk: any) => ({
        uri: chunk.web.uri,
        title: chunk.web.title
      }));

    // 擴大匹配範圍的正規表達式
    const posterRegex = /(?:海報連結|官方海報|Poster URL|Image URL|海報網址)[：:\s]+(https?:\/\/[^\s\n\)\*]+)/i;
    const posterMatch = text.match(posterRegex);
    let rawPosterUrl = posterMatch ? posterMatch[1].trim() : null;

    // 如果沒匹配到特定格式，嘗試從內文中抓取常見的圖片資料庫網址
    if (!rawPosterUrl) {
      const dbImageRegex = /(https?:\/\/(?:image\.tmdb\.org|m\.media-amazon\.com|upload\.wikimedia\.org|occ-0|m\.media-amazon\.com)[^\s\n\*]+\.(?:jpg|jpeg|png|webp))/i;
      const dbMatch = text.match(dbImageRegex);
      if (dbMatch) rawPosterUrl = dbMatch[1].trim();
    }

    const posterUrl = sanitizeUrl(rawPosterUrl);
    
    // 清理掉文字內容中的海報連結行，讓 UI 更乾淨
    const cleanedText = text.replace(/(?:(?:\*\*|__)?(?:海報連結|官方海報|Poster URL|Image URL|海報網址)(?:\*\*|__)?[：:\s]+https?:\/\/[^\s\n]+\n?)/gi, "");

    return { text: cleanedText, sources, posterUrl };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
