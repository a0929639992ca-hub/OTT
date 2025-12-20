
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";

const sanitizeUrl = (url: string | null): string | null => {
  if (!url) return null;
  return url.replace(/[.,\)\*\]\s!]+$/, '').trim();
};

export const searchOTT = async (query: string): Promise<{
  text: string;
  sources: Array<{ uri: string; title: string }>;
  posterUrl: string | null;
}> => {
  console.log("Gemini Service: Starting AI content search for", query);
  
  // 按照規範，每次調用時初始化以獲取最新的 API_KEY
  // Fixed: Directly using process.env.API_KEY for SDK initialization.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `搜尋台灣合法串流平台供應與「${query}」的高清海報連結。`,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: [{ googleSearch: {} }],
      },
    });

    // Fixed: Accessed .text property directly (not as a method).
    const text = response.text || "";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter((chunk: any) => chunk && chunk.web)
      .map((chunk: any) => ({
        uri: chunk.web.uri,
        title: chunk.web.title
      }));

    // 提取海報網址
    const posterRegex = /(?:海報連結|官方海報|Poster URL|Image URL|海報網址)[：:\s]+(https?:\/\/[^\s\n\)\*]+)/i;
    const posterMatch = text.match(posterRegex);
    let rawPosterUrl = posterMatch ? posterMatch[1].trim() : null;

    if (!rawPosterUrl) {
      const dbImageRegex = /(https?:\/\/(?:image\.tmdb\.org|m\.media-amazon\.com|upload\.wikimedia\.org|occ-0|m\.media-amazon\.com)[^\s\n\*]+\.(?:jpg|jpeg|png|webp))/i;
      const dbMatch = text.match(dbImageRegex);
      if (dbMatch) rawPosterUrl = dbMatch[1].trim();
    }

    const posterUrl = sanitizeUrl(rawPosterUrl);
    const cleanedText = text.replace(/(?:(?:\*\*|__)?(?:海報連結|官方海報|Poster URL|Image URL|海報網址)(?:\*\*|__)?[：:\s]+https?:\/\/[^\s\n]+\n?)/gi, "");

    return { text: cleanedText, sources, posterUrl };
  } catch (error: any) {
    console.error("Gemini API Invocation Error:", error);
    throw error;
  }
};
