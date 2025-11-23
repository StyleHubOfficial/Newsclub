
import { jsPDF } from "jspdf";

export const generateAppDescriptionPDF = () => {
    const doc = new jsPDF({
        unit: "pt",
        format: "a4"
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    let y = 40;
    const lineHeight = 14;

    // Helper functions
    const checkPageBreak = (heightNeeded: number) => {
        if (y + heightNeeded > pageHeight - margin) {
            doc.addPage();
            y = margin;
        }
    };

    const addTitle = (text: string) => {
        checkPageBreak(30);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(14, 165, 233); // Brand Primary
        doc.text(text, margin, y);
        y += 30;
        doc.setTextColor(0, 0, 0);
    };

    const addSection = (text: string) => {
        checkPageBreak(25);
        y += 10;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(99, 102, 241); // Brand Secondary
        doc.text(text, margin, y);
        y += 20;
        doc.setTextColor(0, 0, 0);
    };

    const addSubSection = (text: string) => {
        checkPageBreak(20);
        y += 5;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(text, margin, y);
        y += 16;
        doc.setFont("helvetica", "normal");
    };

    const addText = (text: string, indent = 0) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const maxWidth = pageWidth - (margin * 2) - indent;
        const lines = doc.splitTextToSize(text, maxWidth);
        checkPageBreak(lines.length * lineHeight);
        doc.text(lines, margin + indent, y);
        y += lines.length * lineHeight;
    };

    const addCode = (code: string) => {
        doc.setFont("courier", "normal");
        doc.setFontSize(9);
        doc.setTextColor(50, 50, 50);
        const lines = doc.splitTextToSize(code, pageWidth - (margin * 2) - 10);
        checkPageBreak(lines.length * 11 + 10);
        
        // Background for code
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, y - 5, pageWidth - margin * 2, lines.length * 11 + 10, 'F');
        
        doc.text(lines, margin + 5, y + 5);
        y += lines.length * 11 + 15;
        doc.setTextColor(0, 0, 0);
    };

    // --- CONTENT GENERATION ---

    addTitle("Gemini Hi-Tech News Hub: Comprehensive Specification");
    
    addText("This document provides a complete 'A to Z' specification for the Gemini Hi-Tech News Hub application. It describes the architecture, styling, components, and AI integration details required to reconstruct the application exactly as it is.");

    addSection("1. Configuration & Environment");
    addText("The application uses a specific API Key for Google Gemini services. This key must be hardcoded or configured in the build environment.");
    addCode('API KEY: AIzaSyAaYWax27TqfuuG0m-lyFYe62XPT72w5Ms\n\nEnvironment: Browser-based React Application (Vite)\nPermissions: Microphone (requestFramePermissions in metadata.json)');

    addSection("2. Design System (Tailwind CSS)");
    addText("The application uses a 'Cyberpunk' aesthetic defined in index.html via Tailwind configuration.");
    addSubSection("Color Palette");
    addText("• Background (brand-bg): #020617 (Deep Blue/Black)");
    addText("• Surface (brand-surface): #0f172a (Slate Blue)");
    addText("• Primary (brand-primary): #0ea5e9 (Cyan)");
    addText("• Secondary (brand-secondary): #6366f1 (Indigo)");
    addText("• Accent (brand-accent): #e11d48 (Rose/Red)");
    addText("• Text (brand-text): #e2e8f0 (Light Gray)");
    addSubSection("Typography");
    addText("• Headlines: 'Orbitron' (Google Fonts) - Futuristic, wide.");
    addText("• Body: 'Roboto' (Google Fonts) - Clean, standard.");
    addSubSection("Animations");
    addText("• fade-in: Simple opacity transition.");
    addText("• slide-up: Translates Y from 20px to 0.");
    addText("• pulse-glow: Box shadow oscillation between Primary and Secondary colors.");

    addSection("3. Application Architecture (App.tsx)");
    addText("The root component manages the global state and layout.");
    addSubSection("State Management");
    addCode(`const [selectedArticle, setSelectedArticle] = useState(null);
const [isChatOpen, setChatOpen] = useState(false);
const [isLiveAgentOpen, setLiveAgentOpen] = useState(false);
const [isAudioGenOpen, setAudioGenOpen] = useState(false);
const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'reels'
const [savedArticles, setSavedArticles] = useState(Set); // Persisted to localStorage`);
    addSubSection("Core Layout");
    addText("1. Header (Sticky top)");
    addText("2. Main Content Area (Grid or Reels view)");
    addText("3. Floating Action Buttons (Bottom Right): Audio Studio, Live Agent, ChatBot.");
    addText("4. Modals (Rendered conditionally): ArticleModal, SearchResultsModal, PersonalizationModal, AudioGenerationModal, LiveAgent.");

    addSection("4. Component Specifications");

    addSubSection("4.1 Header.tsx");
    addText("A sticky glass-morphism bar.");
    addText("• Left: Logo 'G-NEWS' (Orbitron).");
    addText("• Center/Right Controls:");
    addText("  - Settings Icon: Opens PersonalizationModal.");
    addText("  - Bookmark Icon: Toggles 'Show Saved Only'.");
    addText("  - Grid/Reels Icon: Toggles viewMode.");
    addText("  - Document Icon: Triggers this PDF export.");
    addText("• Search Bar: Input field that calls `searchWithGoogle`. Displays spinner when searching.");

    addSubSection("4.2 NewsCard.tsx (Grid Item)");
    addText("• Structure: Image top (h-56), Content bottom.");
    addText("• Image Overlay: Gradient black-to-transparent. Category badge (Primary color). Save button (top right).");
    addText("• Content: Title (Orbitron), Summary (Roboto).");
    addText("• Behavior: Hover scales up slightly and glows. Clicking opens ArticleModal.");

    addSubSection("4.3 ReelsView.tsx & ReelCard.tsx");
    addText("• Layout: Full-screen height (calc(100vh - 68px)). CSS Scroll Snap (snap-y snap-mandatory).");
    addText("• Card Style: Background image covers entire screen. Gradient overlay. Text anchored at bottom left. Large typography.");

    addSubSection("4.4 ArticleModal.tsx");
    addText("Detailed view of an article.");
    addText("• Header: Title and Close button.");
    addText("• Tabs System:");
    addText("  1. Full Text: Displays raw article content.");
    addText("  2. Summary: Calls `getFastSummary` (Bullet points).");
    addText("  3. Analysis: Calls `getDeepAnalysis` (Thinking model).");
    addText("  4. AI Topic: Custom text input for generation.");
    addText("  5. Data: Renders `InteractiveChart` if data exists.");
    addText("• Footer: Language selector (English, Hindi, Hinglish), Share menu, Save toggle, and 'Read Aloud' button.");
    addText("• Audio Player: When 'Read Aloud' is active, shows AudioVisualizer canvas, volume slider, and playback rate controls.");

    addSubSection("4.5 ChatBot.tsx");
    addText("Floating fixed chat window.");
    addText("• Messages: List of user/bot bubbles. Supports markdown text and images.");
    addText("• Input Area: Text input + Send button. Toggle button for 'Image Mode'.");
    addText("• AI Logic: Uses `streamChatResponse` (gemini-2.5-flash) for text, `generateImageFromPrompt` (gemini-2.5-flash-image) for images.");

    addSubSection("4.6 LiveAgent.tsx");
    addText("Real-time voice interface.");
    addText("• Visuals: Center modal. Large AudioVisualizer. Status indicators (Listening, Thinking, Speaking).");
    addText("• Transcript: Shows scrolling history of User vs Cygnus (AI).");
    addText("• Tech: Uses `ai.live.connect` with WebSocket. Handles raw PCM audio encoding/decoding.");

    addSubSection("4.7 AudioGenerationModal.tsx");
    addText("Dedicated studio for audio.");
    addText("• Modes: Text-to-Speech, Article Broadcast, AI Conversation.");
    addText("• Logic: Generates multi-speaker scripts using `generateNewsBroadcastSpeech` then synthesizing audio via `gemini-2.5-flash-preview-tts`.");

    addSection("5. Service Layer (geminiService.ts)");
    addText("This layer handles all interactions with the Google GenAI SDK.");
    
    addCode(`
// 1. Initialization
const ai = new GoogleGenAI({ apiKey: "AIzaSyAaYWax27TqfuuG0m-lyFYe62XPT72w5Ms" });

// 2. Short Summary
// Model: gemini-flash-lite-latest
// Task: 2-3 sentence summary.

// 3. Deep Analysis
// Model: gemini-2.5-pro
// Config: { thinkingConfig: { thinkingBudget: 32768 } }
// Task: Detailed analysis with headers.

// 4. Search Grounding
// Model: gemini-2.5-flash
// Tool: { googleSearch: {} }
// Returns: Text answer + source URLs.

// 5. Image Generation
// Model: gemini-2.5-flash-image
// Config: { responseModalities: [Modality.IMAGE] }

// 6. Live Interaction
// Model: gemini-2.5-flash-native-audio-preview-09-2025
// Config: SpeechConfig with voice 'Zephyr'.

// 7. Text-to-Speech (TTS)
// Model: gemini-2.5-flash-preview-tts
// Config: Multi-speaker (Orion=Kore, Celeste=Puck) or Single (Kore).
`);

    addSection("6. Data Structure");
    addCode(`
interface NewsArticle {
    id: number;
    title: string;
    summary: string; // AI generated
    content: string; // Full text
    image: string; // URL
    category: string;
    source: string;
    dataPoints?: { label: string, value: number }[]; // For charts
}

// Sample Categories: Cybernetics, Artificial Intelligence, Energy, Space.
`);

    addSection("7. Build & Deploy");
    addText("• Build Tool: Vite");
    addText("• Language: TypeScript");
    addText("• Styling: Tailwind CSS (via CDN/Config in HTML)");
    addText("• PDF Generation: jsPDF (Client-side)");

    doc.save("Gemini_News_Hub_Full_Spec.pdf");
};
