import { GoogleGenAI } from "@google/genai";

// 1. English Persona
const SYSTEM_INSTRUCTION_EN = `You are a world-class cultural historian and museum guide for Badan Warisan Malaysia, specializing in the traditional game "Batu Seremban".
Your task is to provide accurate, engaging, and concise information based on the user's query.
- Answer in ENGLISH.
- Your tone should be educational, respectful, and engaging.
- After your main answer, suggest three distinct follow-up questions. Format strictly as 'Follow-up Questions:'.
- Keep the main answer under 120 words.`;

// 2. Malay Persona
const SYSTEM_INSTRUCTION_BM = `Anda adalah ahli sejarah budaya bertaraf dunia dan pemandu muzium untuk Badan Warisan Malaysia, pakar dalam permainan tradisional "Batu Seremban".
Tugas anda adalah memberikan maklumat yang tepat, menarik, dan ringkas berdasarkan pertanyaan pengguna.
- Jawab dalam BAHASA MELAYU.
- Nada anda haruslah mendidik, hormat, dan menarik.
- Selepas jawapan utama, cadangkan tiga soalan susulan yang menarik. Formatkan dengan tajuk 'Follow-up Questions:'.
- Pastikan jawapan utama di bawah 120 patah perkataan.`;

export const getGroundedKnowledge = async (message: string, lang: 'en' | 'bm'): Promise<{ text: string; sources: { title: string; uri: string }[]; followUpQuestions: string[] }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // 3. Select Instruction based on Language
    const instruction = lang === 'bm' ? SYSTEM_INSTRUCTION_BM : SYSTEM_INSTRUCTION_EN;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: instruction,
      }
    });

    const fullText = response.text ?? (lang === 'bm' ? "Maaf, saya tidak dapat mencari maklumat itu sekarang." : "I couldn't retrieve that information right now.");
    
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map(chunk => ({
        title: chunk.web?.title || new URL(chunk.web?.uri || '').hostname,
        uri: chunk.web?.uri || '#',
      }))
      .filter((source, index, self) => 
        index === self.findIndex((s) => s.uri === source.uri)
      ) || [];
      
    const followUpRegex = /Follow-up Questions:([\s\S]*)/i;
    const followUpMatch = fullText.match(followUpRegex);
    const mainText = fullText.replace(followUpRegex, '').trim();
    
    let followUpQuestions: string[] = [];
    if (followUpMatch && followUpMatch[1]) {
      followUpQuestions = followUpMatch[1].trim().split('\n').map(q => q.replace(/^[-\d.]+\s*/, '').trim()).filter(Boolean);
    }

    return { text: mainText, sources, followUpQuestions };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      text: lang === 'bm' 
        ? "Ralat berlaku semasa menyemak arkib digital." 
        : "An error occurred while consulting the archives.",
      sources: [],
      followUpQuestions: lang === 'bm' 
        ? ["Bagaimana cara main Batu Seremban?", "Asal usul permainan ini?"] 
        : ["How to play Batu Seremban?", "Origins of the game?"]
    };
  }
};