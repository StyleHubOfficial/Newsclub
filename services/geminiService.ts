import { GoogleGenAI, Chat, GenerateContentResponse, Modality } from "@google/genai";
import type { SearchResult } from '../types';

function getAiClient() {
    let apiKey: string | undefined;

    // 1. Check for Vite environment variable (Vercel support)
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
        apiKey = import.meta.env.VITE_API_KEY;
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

    // 4. Hardcoded fallback (Ensures app works immediately if env vars aren't set yet)
    if (!apiKey) {
        apiKey = "AIzaSyDK05MRQw7TzLytLbLFUGiBOBPHjGec1bY";
    }

    // 5. Validation
    if (!apiKey) {
        throw new Error("API Key is missing. On Vercel, set the environment variable as 'VITE_API_KEY'.");
    }

    return new GoogleGenAI({ apiKey });
}

let chatInstance: Chat | null = null;

function getChatInstance(): Chat {
    if (!chatInstance) {
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

export async function getShortSummary(text: string): Promise<string> {
    try {
        const ai = getAiClient();
        // Using gemini-2.5-flash for basic text tasks ensures high reliability
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
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `Provide a deep, insightful analysis of the following article. Consider the technological, ethical, and societal implications. Break it down into sections with clear headings:\n\n---\n${text}`,
            config: {
                thinkingConfig: { thinkingBudget: 32768 },
            }
        });
        return response.text || "Analysis unavailable.";
    } catch (error) {
        console.error("Deep analysis generation failed:", error);
        return "Sorry, I couldn't generate a deep analysis at this time.";
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
    message: string,
    onChunk: (chunk: string) => void
): Promise<void> {
    try {
        const chat = getChatInstance();
        const responseStream = await chat.sendMessageStream({ message });
        for await (const chunk of responseStream) {
            if (chunk.text) {
                onChunk(chunk.text);
            }
        }
    } catch (error) {
        console.error("Chat streaming failed:", error);
        onChunk("Sorry, an error occurred. Please try again.");
    }
}

export async function generateImageFromPrompt(prompt: string): Promise<string> {
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return `data:image/png;base64,${base64ImageBytes}`;
            }
        }
        throw new Error("No image data found in response.");
    } catch (error) {
        console.error("Image generation failed:", error);
        throw new Error("Could not generate the image. Please try a different prompt.");
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
        return null;
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
                        prebuiltVoiceConfig: { voiceName: 'Kore' }, // A standard male voice
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return base64Audio || null;
    } catch (error) {
        console.error("Single-speaker speech generation failed:", error);
        return null;
    }
}