
import { useState, useCallback, useRef, useEffect } from 'react';

// Inline audio utils to fix import issue
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Hook for audio playback using Web Audio API
export const useAudioPlayer = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolumeState] = useState(1);
    const [playbackRate, setPlaybackRateState] = useState(1);
    
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const analyserNodeRef = useRef<AnalyserNode | null>(null);

    const stopAudio = useCallback(() => {
        if (sourceRef.current) {
            sourceRef.current.onended = null; // Prevent onended from firing on manual stop
            sourceRef.current.stop();
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }
        setIsPlaying(false);
    }, []);
    
    const playAudio = useCallback(async (base64Audio: string) => {
        if (isPlaying) {
            stopAudio();
        }

        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            gainNodeRef.current = audioContextRef.current.createGain();
            analyserNodeRef.current = audioContextRef.current.createAnalyser();
            analyserNodeRef.current.fftSize = 256;
            
            // Connect: Source -> Analyser -> Gain -> Destination
            gainNodeRef.current.connect(audioContextRef.current.destination);
        }
        const ctx = audioContextRef.current;
        const gainNode = gainNodeRef.current;
        const analyserNode = analyserNodeRef.current;
        
        if (!gainNode || !analyserNode) return;
        
        try {
            const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            
            // Connect: Source -> Analyser -> Gain -> Destination
            source.connect(analyserNode);
            analyserNode.connect(gainNode);
            
            // Set current volume and playback rate
            gainNode.gain.value = volume;
            source.playbackRate.value = playbackRate;
            
            source.onended = () => {
                setIsPlaying(false);
                sourceRef.current = null;
            };

            source.start(0);
            sourceRef.current = source;
            setIsPlaying(true);
        } catch (error) {
            console.error("Failed to play audio:", error);
            setIsPlaying(false);
        }
    }, [isPlaying, stopAudio, volume, playbackRate]);

    const setVolume = useCallback((level: number) => {
        setVolumeState(level);
        if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = level;
        }
    }, []);

    const setPlaybackRate = useCallback((rate: number) => {
        setPlaybackRateState(rate);
        if (sourceRef.current) {
            sourceRef.current.playbackRate.value = rate;
        }
    }, []);
    
    useEffect(() => {
        // Cleanup on unmount
        return () => {
            stopAudio();
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }
        }
    }, [stopAudio]);

    return { playAudio, stopAudio, isPlaying, volume, setVolume, playbackRate, setPlaybackRate, analyserNode: analyserNodeRef.current };
};
