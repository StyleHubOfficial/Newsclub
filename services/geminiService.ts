
import { GoogleGenAI, Chat, GenerateContentResponse, Modality, Part } from "@google/genai";
import type { SearchResult, NewsArticle, AIFeedback } from '../types';

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

/**
 * Adds a "NEWS CLUB" watermark to the bottom-right of an image.
 */
async function addWatermark(base64Image: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                resolve(base64Image); // Fallback if canvas fails
                return;
            }

            // 1. Draw Original Image
            ctx.drawImage(img, 0, 0);

            // 2. Configure Watermark Text
            const text = "NEWS CLUB";
            // Responsive font size based on image width (approx 5%)
            const fontSize = Math.floor(canvas.width * 0.05); 
            ctx.font = `900 ${fontSize}px Orbitron, sans-serif`;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            
            const paddingX = canvas.width * 0.03;
            const paddingY = canvas.height * 0.03;
            const x = canvas.width - paddingX;
            const y = canvas.height - paddingY;

            // 3. Add Drop Shadow / Glow for visibility
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;

            // 4. Create Gradient Fill (Electric Blue -> Neon Teal)
            const gradient = ctx.createLinearGradient(x - ctx.measureText(text).width, y, x, y);
            gradient.addColorStop(0, '#3ABEFE');
            gradient.addColorStop(1, '#28FFD3');
            ctx.fillStyle = gradient;

            // 5. Draw Text
            ctx.fillText(text, x, y);
            
            // 6. Optional: Subtle Stroke
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.strokeText(text, x, y);

            // Return as base64
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = (err) => {
            console.error("Watermark failed, returning original", err);
            resolve(base64Image);
        };
        img.src = base64Image;
    });
}

export async function generateImageFromPrompt(prompt: string): Promise<string> {
    try {
        const ai = getAiClient();
        
        // Enhance prompt to ensure high quality and prevent model refusal on vague prompts
        const enhancedPrompt = `High quality, photorealistic, cinematic lighting, futuristic style: ${prompt}`;

        // Using gemini-2.5-flash-image for speed and stability
        // REMOVED imageSize as it is not supported on flash models and causes 500 errors
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image', 
            contents: [{
                parts: [{ text: enhancedPrompt }],
            }],
            config: {
                imageConfig: {
                    aspectRatio: "1:1",
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
                    const originalBase64 = `data:${mimeType};base64,${base64ImageBytes}`;
                    
                    // Apply Watermark
                    return await addWatermark(originalBase64);
                }
            }
        }
        
        // If we got text back instead of an image (model explanation or refusal)
        const textResponse = response.text;
        if (textResponse) {
             throw new Error(`Model returned text instead of image: ${textResponse.substring(0, 100)}...`);
        }

        throw new Error("No image data found in response.");

    } catch (error: any) {
        console.error("Image generation failed:", error);
        
        // Systematic Error Formatting
        let userMessage = "Image generation system failure.";
        const msg = error.message || '';
        const status = error.status || 0;

        if (msg.includes('403') || status === 403) userMessage = "ACCESS DENIED: API Key invalid or lacks permissions.";
        else if (msg.includes('429') || status === 429) userMessage = "SYSTEM OVERLOAD: Daily usage limit exceeded. Quota typically resets at midnight Pacific Time (PT).";
        else if (msg.includes('500') || status === 500) userMessage = "SERVER ERROR: AI Model temporarily unavailable. Please try again.";
        else if (msg.includes('SAFETY') || msg.includes('blocked')) userMessage = "SAFETY PROTOCOL: Request blocked by content filters.";
        else if (msg.includes('Model returned text')) userMessage = "GENERATION ERROR: Model failed to render visual data.";
        else userMessage = `SYSTEM ERROR: ${msg.substring(0, 60)}`;

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

// --- NEW FUNCTION: Analyze Student Video Submission ---
export async function analyzeStudentVideo(videoFile: File): Promise<AIFeedback> {
    const ai = getAiClient();
    
    // Convert File to Base64
    const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(videoFile);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });

    const prompt = `
        You are an expert news reporting coach. Analyze this student's news reporting video submission.
        Evaluation Criteria:
        1. Pronunciation & Diction
        2. Speaking Speed (Pacing)
        3. Confidence & Body Language
        4. Clarity of Message
        5. Logical Flow
        6. Background Noise Level

        Return a strict JSON object with this structure:
        {
            "pronunciationScore": number (0-100),
            "speedScore": number (0-100, where 50 is ideal, <30 is too slow, >70 is too fast),
            "confidenceScore": number (0-100),
            "clarityScore": number (0-100),
            "tips": ["tip1", "tip2", "tip3"],
            "mistakes": ["mistake1", "mistake2"],
            "strengths": ["strength1", "strength2"]
        }
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    parts: [
                        { text: prompt },
                        { 
                            inlineData: { 
                                mimeType: videoFile.type, 
                                data: base64Data 
                            } 
                        }
                    ]
                }
            ],
            config: {
                responseMimeType: 'application/json'
            }
        });

        if (!response.text) throw new Error("No analysis generated.");
        return JSON.parse(response.text) as AIFeedback;

    } catch (error) {
        console.error("Video analysis failed:", error);
        throw new Error("Failed to analyze video. Ensure the file is valid and under size limits.");
    }
}
