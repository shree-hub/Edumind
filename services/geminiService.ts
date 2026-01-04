import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Difficulty, Question, QuizConfig } from "../types";

const COMPLEX_MODEL = 'gemini-3-pro-preview';
const STANDARD_MODEL = 'gemini-3-flash-preview';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

export const getDailyCurrentAffairs = async (language: string = "English"): Promise<{text: string, sources: any[]}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const today = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
    
    const prompt = `Act as a senior news curator. Provide a concise daily digest of the top 5 most important current affairs for today, ${today}. 
    CRITICAL: The entire response MUST be written in ${language}.
    Focus on events relevant for students and competitive exams (UPSC, SSC, Banking, etc.).
    Format each item clearly using Markdown:
    - [CATEGORY] (e.g., [NATIONAL], [INTERNATIONAL], [SCIENCE])
    - Bold headline
    - 2-3 sentence summary explaining the context and importance.
    - A "Student Takeaway" bullet point for each.`;

    const response = await ai.models.generateContent({
      model: STANDARD_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    
    const text = response.text || "Unable to fetch today's updates.";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    return { text, sources };
  } catch (error) {
    console.error("Error fetching current affairs:", error);
    throw new Error("Failed to load current affairs. Please check your internet connection.");
  }
};

export const generateCurrentAffairsSpeech = async (text: string, language: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const cleanText = text.replace(/[*#\[\]]/g, '').substring(0, 1000);
    const prompt = `Read the following current affairs summary in ${language} naturally and clearly: ${cleanText}`;

    const response = await ai.models.generateContent({
      model: TTS_MODEL,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) throw new Error("No audio data returned from the API");
    
    return audioData;
  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};

export const generateStudyNotes = async (topic: string, isUPSCDepth: boolean = false): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const model = isUPSCDepth ? COMPLEX_MODEL : STANDARD_MODEL;
    
    let prompt = `Generate comprehensive, structured educational study notes for the topic: "${topic}". 
    Use clear Markdown formatting with headers, bold text, and bullet points. 
    Include: Introduction, Core Principles, Key Pillars, Historical/Contextual background, and a Conclusion.`;

    if (isUPSCDepth) {
      prompt = `Generate high-level, analytical study notes for the topic: "${topic}" specifically for UPSC Civil Services Examination standards.
      Structure:
      1. Contextual Introduction.
      2. Multi-dimensional Analysis (Political, Socio-Economic, Environmental).
      3. Critical Challenges & Contemporary Significance.
      4. Government Policy Framework (if applicable).
      5. Analytical Conclusion & Way Forward.
      Use professional, academic language and structured Markdown.`;
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    
    return response.text || "Failed to generate notes.";
  } catch (error) {
    console.error("Error generating notes:", error);
    throw new Error("Note generation failed. Topic might be too broad or restricted.");
  }
};

export const generateStaticGK = async (topic: string, format: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const prompt = `Generate a highly structured Static General Knowledge (GK) summary for the topic: "${topic}".
    Format requested: ${format}.
    
    Instructions:
    1. Ensure 100% factual accuracy.
    2. Use Markdown for high readability.
    3. If the format is 'Comparison Table', use a standard Markdown table (headers followed by |---|--- separator).
    4. If the format is 'Timeline', use a chronological bulleted list with bold years/dates.
    5. If the format is 'Fact Sheet', use categories like 'Key Highlights', 'Statistics', and 'Significance'.
    6. Always include a "Memory Tip" or "Mnemonic" at the end.`;

    const response = await ai.models.generateContent({
      model: STANDARD_MODEL,
      contents: prompt,
    });
    
    return response.text || "Failed to generate GK content.";
  } catch (error) {
    console.error("Error generating GK:", error);
    throw new Error("GK generation failed.");
  }
};

export const generateMockTest = async (config: QuizConfig): Promise<Question[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { topic, exam, subject, difficulty, questionCount } = config;
  
  try {
    const response = await ai.models.generateContent({
      model: COMPLEX_MODEL,
      contents: `Generate a professional mock test for ${exam} on the subject of ${subject}, focusing specifically on: "${topic}".
      Difficulty Level: ${difficulty}
      Number of Questions: ${questionCount}
      
      The output MUST be a valid JSON array of objects.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Four distinct multiple choice options.",
              },
              correctAnswerIndex: { 
                type: Type.INTEGER, 
                description: "0-based index of the correct option." 
              },
              explanation: { 
                type: Type.STRING, 
                description: "Detailed explanation of why the answer is correct." 
              },
            },
            required: ["question", "options", "correctAnswerIndex", "explanation"],
          },
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    
    const data = JSON.parse(text);
    return data.map((q: any, index: number) => ({ 
      ...q, 
      id: index,
      options: q.options.slice(0, 4) // Ensure strictly 4 options
    }));
  } catch (error) {
    console.error("Error generating mock test:", error);
    throw new Error("Quiz generation failed. Please try a different topic or exam pattern.");
  }
};