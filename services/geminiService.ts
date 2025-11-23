
import { GoogleGenAI, Chat, GenerateContentResponse, Modality } from "@google/genai";
import type { SearchResult } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

function getAiClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
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
        const response = await ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
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
            model: 'gemini-flash-lite-latest',
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
            model: 'gemini-2.5-pro',
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

export async function generateVideo(
    params: { 
        prompt?: string; 
        image?: { data: string; mimeType: string }; 
        aspectRatio: '16:9' | '9:16'; 
    },
    onProgress: (msg: string) => void
): Promise<string> {
    // Check for API Key selection for Veo (Paid feature)
    if ((window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await (window as any).aistudio.openSelectKey();
        }
    }

    // Always create a new instance to get the latest key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    onProgress("Sending request to Veo model...");
    
    try {
        const config: any = {
            numberOfVideos: 1,
            resolution: '720p', 
            aspectRatio: params.aspectRatio
        };

        const request: any = {
            model: 'veo-3.1-fast-generate-preview',
            config: config
        };

        if (params.prompt) {
            request.prompt = params.prompt;
        } else if (!params.image) {
             throw new Error("Prompt is required if no image is provided.");
        }

        if (params.image) {
             request.image = {
                imageBytes: params.image.data,
                mimeType: params.image.mimeType
             };
        }

        let operation = await ai.models.generateVideos(request);

        onProgress("Video generation in progress. This may take a minute...");

        // Polling
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            onProgress("Still rendering... " + new Date().toLocaleTimeString());
            operation = await ai.operations.getVideosOperation({operation: operation});
        }
        
        if (operation.error) {
             throw new Error(`Video generation failed: ${operation.error.message}`);
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error("No video URI in response.");
        }

        onProgress("Downloading video...");
        
        const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const videoBlob = await videoResponse.blob();
        return URL.createObjectURL(videoBlob);

    } catch (error: any) {
        console.error("Video generation failed:", error);
        if (error.message && error.message.includes("Requested entity was not found")) {
             // Reset key selection state if possible or just alert user
             if ((window as any).aistudio) {
                 await (window as any).aistudio.openSelectKey();
                 throw new Error("API Key invalid or not selected. Please try again.");
             }
        }
        throw error;
    }
}
