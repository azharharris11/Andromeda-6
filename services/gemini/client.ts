
import { GoogleGenAI } from "@google/genai";

// Initialize the client
export const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Shared Utility
export function extractJSON<T>(text: string): T {
  try {
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText) as T;
  } catch (e) {
    console.error("JSON Parse Error", e, text);
    return {} as T;
  }
}
