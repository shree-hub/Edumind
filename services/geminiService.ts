import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Difficulty, Question, QuizConfig } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const COMPLEX_MODEL = 'gemini-3-pro-preview';
const STANDARD_MODEL = 'gemini-3-flash-preview';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

export const getDailyCurrentAffairs = async (language: string = "English"): Promise<{text: string, sources: any[]}> => {
  try {
    const today = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
    
    const prompt = `Provide a concise daily digest of the top 5 most important current affairs for today, ${today}. 
    The entire response MUST be in ${language}.
    Focus on events relevant for students and competitive exams.
    Format each item clearly with:
    - A category (e.g., [NATIONAL], [INTERNATIONAL], [ECONOMY], [SCIENCE])
    - A bold headline
    - A 2-3 sentence summary explaining the significance.
    Include a "Why it matters for students" takeaway for each.`;

    const response = await ai.models.generateContent({
      model: STANDARD_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    return {
      text: response.text || "Unable to fetch today's updates.",
      sources: sources
    };
  } catch (error) {
    console.error("Error fetching current affairs:", error);
    throw new Error("Failed to load current affairs.");
  }
};

export const generateCurrentAffairsSpeech = async (text: string, language: string): Promise<string> => {
  try {
    const cleanText = text.replace(/[*#]/g, '');
    const prompt = `Read the following current affairs summary in ${language} naturally: ${cleanText.substring(0, 1000)}`;

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
    if (!audioData) throw new Error("No audio data returned");
    
    return audioData;
  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};

export const generateStudyNotes = async (topic: string, isUPSCDepth: boolean = false): Promise<string> => {
  try {
    const model = isUPSCDepth ? COMPLEX_MODEL : STANDARD_MODEL;
    
    let prompt = `Generate comprehensive, structured educational study notes for the topic: "${topic}". 
    Use clear Markdown formatting. 
    Include a brief introduction, key concepts defined clearly, bullet points for important details, examples where applicable, and a summary.`;

    if (isUPSCDepth) {
      prompt = `Generate high-level, analytical study notes for the topic: "${topic}" specifically tailored for UPSC (Union Public Service Commission) Civil Services Examination standards.
      Structure the response according to General Studies (GS) Paper requirements.
      Include:
      1. Historical Context & Evolution.
      2. Multi-dimensional Analysis (Social, Political, Economic, Environmental).
      3. Critical Pros and Cons / Challenges.
      4. Recent Government Initiatives or Current Relevance.
      5. Way Forward / Conclusion.
      Use professional, academic language suitable for Mains preparation.`;
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    
    return response.text || "Failed to generate notes.";
  } catch (error) {
    console.error("Error generating notes:", error);
    throw new Error("Failed to generate study notes. Please try again.");
  }
};

export const generateMockTest = async (config: QuizConfig): Promise<Question[]> => {
  const { topic, exam, subject, difficulty, questionCount } = config;
  
  try {
    const response = await ai.models.generateContent({
      model: COMPLEX_MODEL,
      contents: `Create a professional mock test for the ${exam} exam on the subject of ${subject}. 
      The specific topic is "${topic}".
      Standard: ${difficulty} difficulty level relative to the ${exam} pattern.
      Requirements:
      - Exactly ${questionCount} multiple-choice questions.
      - Each question must have exactly 4 options.
      - Questions must mimic the style and complexity of ${exam}.
      - Provide a correct answer index (0-3) and a comprehensive explanation that clarifies the concept for the student.`,
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
              },
              correctAnswerIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING },
            },
            required: ["question", "options", "correctAnswerIndex", "explanation"],
          },
        },
      },
    });

    const data = JSON.parse(response.text || "[]");
    
    return data.map((q: any, index: number) => ({
      ...q,
      id: index,
    }));

  } catch (error) {
    console.error("Error generating mock test:", error);
    throw new Error("Failed to generate mock test. Please try again.");
  }
};