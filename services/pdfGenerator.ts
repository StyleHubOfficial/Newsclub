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
        doc.rect(margin, y - 8, pageWidth - margin * 2, lines.length * 11 + 10, 'F');
        
        doc.text(lines, margin + 5, y);
        y += lines.length * 11 + 15;
        doc.setTextColor(0, 0, 0);
    };

    // --- CONTENT GENERATION ---

    addTitle("Gemini Hi-Tech News Hub: Comprehensive Specification");
    
    addText("This document provides a complete 'A to Z' specification for the Gemini Hi-Tech News Hub application. It includes exact configurations, styles, and AI service definitions required to recreate the app perfectly.");

    addSection("1. Configuration & Environment");
    addText("The application requires a specific API Key to access Google Gemini services. This key is hardcoded in the Vite configuration for demo purposes.");
    addCode('API KEY: AIzaSyDK05MRQw7TzLytLbLFUGiBOBPHjGec1bY\n\nFramework: React 19 (via Vite)\nLanguage: TypeScript\nStyling: Tailwind CSS (CDN)\nIcons: Custom SVG Components');

    addSection("2. Visual Identity & Design System");
    addText("The UI follows a 'Cyberpunk/Futuristic' aesthetic with a dark mode base.");
    
    addSubSection("Color Palette (Tailwind)");
    addText("• Background: #020617 (brand-bg) - Deep space blue.");
    addText("• Surface: #0f172a (brand-surface) - Slate for cards/modals.");
    addText("• Primary: #0ea5e9 (brand-primary) - Cyan/Sky blue for active states.");
    addText("• Secondary: #6366f1 (brand-secondary) - Indigo for accents.");
    addText("• Accent: #e11d48 (brand-accent) - Rose/Red for alerts/recording.");
    addText("• Text: #e2e8f0 (brand-text) - Light gray for readability.");
    
    addSubSection("Typography");
    addText("• Headings: 'Orbitron' (Google Fonts) - Geometric, sci-fi feel.");
    addText("• Body: 'Roboto' (Google Fonts) - Clean legibility.");

    addSection("3. UI Interface Description (A-Z)");
    
    addSubSection("App Layout (App.tsx)");
    addText("The root container is a flex-col taking full screen height (h-screen).");
    addText("- Header: Sticky at top.");
    addText("- Main Content: Flexible area showing either 'Grid View' or 'Reels View'.");
    addText("- Floating Action Buttons (FAB): Fixed at bottom-right (z-50).");
    addText("  1. Audio Studio (SoundWaveIcon): Opens AudioGenerationModal.");
    addText("  2. Live Agent (MicIcon): Opens LiveAgent modal (pulses when idle).");
    addText("  3. ChatBot (BoltIcon): Toggles ChatBot popup.");

    addSubSection("Header Component");
    addText("Glassmorphism effect (backdrop-blur). Contains:");
    addText("- Branding: 'G-NEWS' with color accents.");
    addText("- Controls Row:");
    addText("  - Settings (Gear): Personalization.");
    addText("  - Bookmark (Flag): Toggle saved articles.");
    addText("  - View Toggle (Grid/Film): Switch between Grid and Reels.");
    addText("  - PDF Export (Doc): Downloads this spec.");
    addText("- Search Bar: Full width max-md. Rounded full. Spinner appears on right when searching.");

    addSubSection("Main Feed (NewsCard.tsx)");
    addText("Displayed in a responsive grid.");
    addText("- Image: Top section, cover fit. Overlay gradient.");
    addText("- Category Badge: Top-left over image.");
    addText("- Save Button: Top-right over image.");
    addText("- Text Content: Title (Orbitron) and AI-generated summary (Roboto).");
    addText("- Animations: Hover lifts card (-translate-y-1) and glows border.");

    addSubSection("Reels View (ReelCard.tsx)");
    addText("Snap-scrolling vertical feed (TikTok style).");
    addText("- Background: Full screen image.");
    addText("- Overlay: Dark gradient from bottom.");
    addText("- Content: Title and Summary large text at bottom-left.");
    addText("- 'Read More' button: Opens ArticleModal.");

    addSubSection("Article Modal");
    addText("Full-screen overlay with centered content card.");
    addText("- Tabs: Full Text, Summary (Bullet points), Analysis (Deep dive), AI Topic (Custom), Data (Charts).");
    addText("- Audio Player: Bottom sticky bar. Includes AudioVisualizer canvas, Volume slider, Playback Rate (1x, 1.5x, 2x).");
    addText("- Share Menu: Popup with Twitter, Facebook, Email, Copy Link.");
    addText("- Logic: Uses 'gemini-2.5-flash-preview-tts' for reading text.");

    addSubSection("Live Agent Modal");
    addText("Interface for real-time voice conversation.");
    addText("- Center: Scrollable transcript (User vs Cygnus).");
    addText("- Footer: Large AudioVisualizer. Status text (Listening/Thinking/Speaking).");
    addText("- Tech: Connects via WebSocket to Gemini Live API.");

    addSubSection("Audio Studio Modal");
    addText("Dedicated text-to-speech generation interface.");
    addText("- Modes: Text Input, Article Selection, AI Conversation (Topic based).");
    addText("- File Upload: Supports .txt file upload for topic generation.");
    addText("- Output: Plays generated audio with visualization.");

    addSubSection("ChatBot");
    addText("Fixed widget bottom-right.");
    addText("- Header: 'AI Assistant'.");
    addText("- Body: Chat history bubbles.");
    addText("- Input: Text field + Image Generation toggle.");
    addText("- Logic: Streams text responses or generates images via 'gemini-2.5-flash-image'.");

    addSection("4. AI Services & Models");
    addText("All AI calls are centralized in 'services/geminiService.ts'.");
    
    addSubSection("Text Tasks");
    addCode(`// Summarization
model: "gemini-flash-lite-latest"
prompt: "Summarize ... in 2-3 concise sentences"

// Deep Analysis
model: "gemini-3-pro-preview"
config: { thinkingConfig: { thinkingBudget: 32768 } }

// Search Grounding
model: "gemini-2.5-flash"
tools: [{ googleSearch: {} }]`);

    addSubSection("Multimedia Tasks");
    addCode(`// Image Generation
model: "gemini-2.5-flash-image"

// Text-to-Speech (TTS)
model: "gemini-2.5-flash-preview-tts"
voices: "Kore" (Male), "Puck" (Female) for dialogues.

// Live Conversation
model: "gemini-2.5-flash-native-audio-preview-09-2025"
voice: "Zephyr"`);

    addSection("5. Data Structures");
    addCode(`interface NewsArticle {
  id: number;
  title: string;
  summary: string;
  content: string;
  image: string;
  category: string;
  source: string;
  dataPoints?: { label: string; value: number }[];
}`);

    addSection("6. Note on Video Generation");
    addText("Video generation features have been explicitly removed from this version of the application as per user requirements.");

    doc.save("Gemini_News_Hub_Full_Spec.pdf");
};
