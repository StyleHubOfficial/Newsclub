
import { GoogleGenAI, Chat, GenerateContentResponse, Modality, Part } from "@google/genai";
import type { SearchResult, NewsArticle } from '../types';

function getAiClient() {
    let apiKey: string | undefined;

    // 1. Check for Vite environment variable (Vercel support)
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_KEY) {
        apiKey = (import.meta as any).env.VITE_API_KEY;
    }

    // 2. Check for Next.js / Vercel Public variable
    if (!apiKey && typeof process !== 'undefined' && process.env) {
        apiKey = process.env.NEXT_PUBLIC_API_KEY;
    }

    // 3. Safe extraction of the key from process.env (Local/Node fallback)
    if (!apiKey) {
        try {
            apiKey = process.env.API_KEY;
        } catch (e) {
            // process is not defined in the browser environment
        }
    }

    // 4. Validation
    if (!apiKey) {
        throw new Error("API Key is missing. Please set VITE_API_KEY in your environment.");
    }

    return new GoogleGenAI({ apiKey });
}

let chatInstance: Chat | null = null;

function getChatInstance(forceReset: boolean = false): Chat {
    if (forceReset || !chatInstance) {
        const ai = getAiClient();
        chatInstance = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: 'You are a helpful and knowledgeable assistant specializing in high-tech news and scientific concepts. Explain things clearly and concisely.',
            },
        });
    }
    return chatInstance;
}

// Function to force a new chat session (useful when UI resets)
export function resetChat() {
    getChatInstance(true);
}

export async function getShortSummary(text: string): Promise<string> {
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Summarize the following article in 2-3 concise sentences, highlighting the key information:\n\n---\n${text}`,
        });
        return response.text || "No summary available.";
    } catch (error)
    {
        console.error("Short summary generation failed:", error);
        return "Summary could not be generated at this time.";
    }
}

export async function getFastSummary(text: string): Promise<string> {
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Summarize the following article in 3 concise bullet points:\n\n---\n${text}`,
        });
        return response.text || "No summary available.";
    } catch (error) {
        console.error("Fast summary generation failed:", error);
        return "Sorry, I couldn't generate a summary at this time.";
    }
}

export async function getDeepAnalysis(text: string): Promise<string> {
    const ai = getAiClient();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `Provide a deep, insightful analysis of the following article. Consider the technological, ethical, and societal implications. Break it down into sections with clear headings:\n\n---\n${text}`,
            config: {
                thinkingConfig: { thinkingBudget: 16000 },
            }
        });
        return response.text || "Analysis unavailable.";
    } catch (error) {
        console.warn("Deep analysis with Pro model failed, falling back to Flash:", error);
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Provide a detailed analysis of the following article, considering technological and ethical implications. Use clear headings:\n\n---\n${text}`,
            });
            return response.text || "Analysis unavailable.";
        } catch (fallbackError) {
            console.error("Deep analysis fallback failed:", fallbackError);
            return "Sorry, I couldn't generate a deep analysis at this time.";
        }
    }
}

export async function searchWithGoogle(query: string): Promise<SearchResult> {
    try {
        const ai = getAiClient();
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Answer the following question based on up-to-date information from the web: "${query}"`,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources = groundingChunks
            .map((chunk: any) => ({
                uri: chunk.web?.uri || '',
                title: chunk.web?.title || 'Untitled Source',
            }))
            .filter((source: { uri: string; }) => source.uri);
            
        return {
            text: response.text || "No results found.",
            sources: sources,
        };

    } catch (error) {
        console.error("Google Search grounding failed:", error);
        throw new Error("Failed to fetch search results.");
    }
}

export async function streamChatResponse(
    message: string | Part[],
    onChunk: (chunk: string) => void
): Promise<void> {
    try {
        // We use the existing instance. If it needs reset, it should be done via resetChat()
        const chat = getChatInstance(); 
        
        // The SDK expects { message: string | Part[] }
        const responseStream = await chat.sendMessageStream({ message });
        
        for await (const chunk of responseStream) {
            if (chunk.text) {
                onChunk(chunk.text);
            }
        }
    } catch (error) {
        console.error("Chat streaming failed:", error);
        onChunk("Sorry, an error occurred. Please try again or refresh the chat.");
    }
}

export async function generateImageFromPrompt(prompt: string): Promise<string> {
    try {
        const ai = getAiClient();
        
        // Using correct model and configuration for standard image generation
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image', 
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                // Ensure default aspect ratio and size are set for better compatibility
                imageConfig: {
                    aspectRatio: "1:1",
                    imageSize: "1K"
                }
            }
        });

        // Check for safety blocks or refusal
        if (response.candidates && response.candidates[0].finishReason === 'SAFETY') {
            throw new Error("Image generation was blocked by safety filters.");
        }

        // Iterate through all parts to find the image.
        if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    const base64ImageBytes: string = part.inlineData.data;
                    const mimeType = part.inlineData.mimeType || 'image/png';
                    return `data:${mimeType};base64,${base64ImageBytes}`;
                }
            }
        }
        
        // If we got text back instead of an image (model explanation or refusal)
        const textResponse = response.text;
        if (textResponse) {
             throw new Error(`Model returned text: ${textResponse.substring(0, 150)}...`);
        }

        throw new Error("No image data found in response.");

    } catch (error: any) {
        console.error("Image generation failed:", error);
        
        // Systematic Error Formatting
        let userMessage = "Image generation system failure.";
        const msg = error.message || '';

        if (msg.includes('403')) userMessage = "ACCESS DENIED: API Key invalid or lacks permissions.";
        else if (msg.includes('429')) userMessage = "SYSTEM OVERLOAD: Usage quota exceeded. Try later.";
        else if (msg.includes('SAFETY') || msg.includes('blocked')) userMessage = "SAFETY PROTOCOL: Request blocked by content filters.";
        else if (msg.includes('Model returned text')) userMessage = "GENERATION ERROR: Model failed to render visual data.";
        else userMessage = `SYSTEM ERROR: ${msg.substring(0, 50)}`;

        throw new Error(userMessage);
    }
}

export async function generateNewsBroadcastSpeech(
    text: string,
    language: 'English' | 'Hindi' | 'Hinglish'
): Promise<string | null> {
    const ai = getAiClient();

    const languagePrompts = {
        English: `Rewrite the following news article into a natural, conversational script for two news anchors, Orion (male) and Celeste (female). Format it strictly as 'Orion: ...' and 'Celeste: ...' on new lines. Keep it engaging and clear.\n\nARTICLE:\n${text}`,
        Hindi: ` निम्नलिखित समाचार लेख को दो समाचार एंकर, ओरियन (पुरुष) और सेलेस्टे (महिला) के लिए एक स्वाभाविक, संवादी स्क्रिप्ट में फिर से लिखें। इसे सख्ती से 'Orion: ...' और 'Celeste: ...' के रूप में नई पंक्तियों पर प्रारूपित करें। इसे आकर्षक और स्पष्ट रखें।\n\nARTICLE:\n${text}`,
        Hinglish: `Rewrite the following news article into a natural, conversational Hinglish (Hindi + English) script for two news anchors, Orion (male) and Celeste (female). Format it strictly as 'Orion: ...' and 'Celeste: ...' on new lines. Keep it engaging and clear.\n\nARTICLE:\n${text}`,
    };

    try {
        // Step 1: Generate conversational script
        const scriptResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: languagePrompts[language],
        });
        const script = scriptResponse.text;

        if (!script) return null;

        // Step 2: Generate multi-speaker audio from the script
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: script }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    multiSpeakerVoiceConfig: {
                        speakerVoiceConfigs: [
                            { speaker: 'Orion', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                            { speaker: 'Celeste', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } }
                        ]
                    }
                }
            }
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return base64Audio || null;
    } catch (error) {
        console.error("Conversational speech generation failed:", error);
        throw error;
    }
}

export async function generateSpeechFromText(text: string): Promise<string | null> {
    const ai = getAiClient();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return base64Audio || null;
    } catch (error) {
        console.error("Single-speaker speech generation failed:", error);
        throw error;
    }
}

export async function generateFuturisticArticles(count: number = 4): Promise<Omit<NewsArticle, 'id' | 'isSummaryLoading'>[]> {
    try {
        const ai = getAiClient();
        const prompt = `Generate ${count} distinct, creative, and futuristic sci-fi news articles.
        Topics can include AI, Space Colonization, Cybernetics, Biotechnology, Quantum Computing, or Nanotech.
        
        Return the result as a strict JSON array of objects with the following keys:
        - title: string
        - summary: string (2 sentences)
        - content: string (3-4 paragraphs)
        - category: string (One word e.g. 'Cybernetics', 'Space')
        - source: string (Fictional news source name)
        
        Do not use markdown formatting. Just raw JSON.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
            }
        });
        
        const rawText = response.text;
        if (!rawText) return [];

        const articles = JSON.parse(rawText);
        
        return articles.map((article: any, index: number) => ({
            ...article,
            image: `https://picsum.photos/seed/${Date.now() + index + Math.random()}/600/400`,
        }));

    } catch (error) {
        console.error("Failed to generate AI articles:", error);
        return [];
    }
}
