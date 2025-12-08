
import { Modality } from "@google/genai";
import { ProjectContext } from "../../types";
import { ai } from "./client";

export const generateAdScript = async (project: ProjectContext, personaName: string, angle: string): Promise<string> => {
    const model = "gemini-2.5-flash";
    const country = project.targetCountry || "USA";
    const isIndo = country.toLowerCase().includes("indonesia");
    
    let lang = isIndo ? "Bahasa Indonesia (Natural Social Media Style)" : "English";
    let extraInstr = "";
    
    if (isIndo) {
        extraInstr = `
        CRITICAL RULES:
        - NO formal words like "Halo", "Perkenalkan", "Fitur".
        - Use "Gue/Lo" or "Aku/Kamu".
        - Use particles: "sih", "dong", "deh".
        - Sound like a real user reviewing, not an ad script.
        `;
    }

    const response = await ai.models.generateContent({
        model,
        contents: `Write a 15-second TikTok/Reels UGC script for: ${project.productName}. What is it?: ${project.productDescription}. Language: ${lang}. ${extraInstr}. Angle: ${angle}. Keep it under 40 words. Hook the viewer instantly.`
    });
    return response.text || "Script generation failed.";
};

export const generateVoiceover = async (script: string, personaName: string): Promise<string | null> => {
    const spokenText = script.replace(/\[.*?\]/g, '').trim();
    let voiceName = 'Zephyr'; 
    if (personaName.toLowerCase().includes('skeptic') || personaName.toLowerCase().includes('man')) voiceName = 'Fenrir';
    if (personaName.toLowerCase().includes('status') || personaName.toLowerCase().includes('woman')) voiceName = 'Kore';

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: { parts: [{ text: spokenText }] },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } }
            }
        });
        return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (e) {
        console.error("TTS Error", e);
        return null;
    }
};
