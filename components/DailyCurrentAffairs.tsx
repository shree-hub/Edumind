import React, { useState, useEffect, useRef } from 'react';
import { Newspaper, RefreshCw, ExternalLink, Globe, Calendar, AlertCircle, Volume2, Square, Languages, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { getDailyCurrentAffairs, generateCurrentAffairsSpeech } from '../services/geminiService';
import { MarkdownRenderer } from './MarkdownRenderer';

const LANGUAGES = [
  { code: "Kannada", label: "ಕನ್ನಡ (Kannada)", flag: "🇰🇳" }, // Note: Using a placeholder emoji or just text
  { code: "English", label: "English", flag: "🇺🇸" },
  { code: "Hindi", label: "हिन्दी (Hindi)", flag: "🇮🇳" },
  { code: "Spanish", label: "Español (Spanish)", flag: "🇪🇸" },
  { code: "French", label: "Français (French)", flag: "🇫🇷" },
  { code: "Japanese", label: "日本語 (Japanese)", flag: "🇯🇵" }
];

interface DailyCurrentAffairsProps {
  onBack: () => void;
}

type ViewPhase = 'selection' | 'loading' | 'content';

export const DailyCurrentAffairs: React.FC<DailyCurrentAffairsProps> = ({ onBack }) => {
  const [phase, setPhase] = useState<ViewPhase>('selection');
  const [data, setData] = useState<{text: string, sources: any[]} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("Kannada");
  
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const fetchAffairs = async (lang: string = selectedLanguage) => {
    setPhase('loading');
    setError(null);
    stopAudio();
    try {
      const result = await getDailyCurrentAffairs(lang);
      setData(result);
      setPhase('content');
    } catch (err) {
      setError("ವಾರ್ತೆಗಳನ್ನು ಪಡೆಯಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ. (Unable to sync with live news.)");
      setPhase('selection'); // Go back to selection on error so they can try again
    }
  };

  useEffect(() => {
    return () => stopAudio();
  }, []);

  const handleLanguageSelect = (langCode: string) => {
    setSelectedLanguage(langCode);
    fetchAffairs(langCode);
  };

  const decodeBase64 = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch(e) {}
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  };

  const handleReadAloud = async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    if (!data?.text) return;

    setIsAudioLoading(true);
    try {
      const audioBase64 = await generateCurrentAffairsSpeech(data.text, selectedLanguage);
      const audioBytes = decodeBase64(audioBase64);
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const buffer = await decodeAudioData(audioBytes, audioContextRef.current);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        setIsPlaying(false);
      };
      
      source.start(0);
      sourceNodeRef.current = source;
      setIsPlaying(true);
    } catch (err) {
      console.error("Audio playback error:", err);
    } finally {
      setIsAudioLoading(false);
    }
  };

  if (phase === 'selection') {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center mb-12">
          <button 
            onClick={onBack}
            className="mb-8 inline-flex items-center text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          <div className="inline-flex items-center justify-center p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl mb-6 shadow-sm">
            <Languages className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
            ಭಾಷೆಯನ್ನು ಆರಿಸಿ / Select Language
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            ಇಂದಿನ ಪ್ರಚಲಿತ ವಿದ್ಯಮಾನಗಳನ್ನು ಓದಲು ನಿಮ್ಮ ನೆಚ್ಚಿನ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆ ಮಾಡಿ.
            (Select your preferred language to read today's current affairs.)
          </p>
        </div>

        {error && (
          <div className="mb-8 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl p-4 flex items-center gap-3 text-red-700 dark:text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageSelect(lang.code)}
              className={`group relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 transition-all duration-300 ${
                selectedLanguage === lang.code 
                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 shadow-lg ring-2 ring-indigo-100 dark:ring-indigo-900/20' 
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md'
              }`}
            >
              {selectedLanguage === lang.code && (
                <div className="absolute top-4 right-4 text-indigo-600 dark:text-indigo-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              )}
              <span className="text-4xl mb-4 group-hover:scale-110 transition-transform">{lang.flag}</span>
              <span className="text-lg font-bold text-slate-800 dark:text-white mb-1">{lang.label}</span>
              <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">{lang.code === 'Kannada' ? 'Primary' : lang.code}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div className="max-w-5xl mx-auto py-20 flex flex-col items-center justify-center">
        <div className="relative w-20 h-20 mb-8">
          <div className="absolute inset-0 border-4 border-indigo-100 dark:border-indigo-900/30 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <Newspaper className="absolute inset-0 m-auto w-8 h-8 text-indigo-600 animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          {selectedLanguage === 'Kannada' ? 'ಸುದ್ದಿಗಳನ್ನು ಸಿದ್ಧಪಡಿಸಲಾಗುತ್ತಿದೆ...' : `Fetching news in ${selectedLanguage}...`}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 animate-pulse">
          Gemini Search is browsing the web for the latest updates.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setPhase('selection')}
            className="flex items-center text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            Change Language
          </button>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
            <Newspaper className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
            {selectedLanguage === 'Kannada' ? 'ಇಂದಿನ ಮುಖ್ಯಾಂಶಗಳು' : 'Today\'s Digest'}
          </h2>
        </div>
        
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800/50 px-3 py-1 rounded-full">
          <Calendar className="w-3.5 h-3.5" />
          {new Date().toLocaleDateString(selectedLanguage === 'Kannada' ? 'kn-IN' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{LANGUAGES.find(l => l.code === selectedLanguage)?.flag}</span>
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
              {selectedLanguage === 'Kannada' ? 'ಕನ್ನಡ ಸುದ್ದಿ ಸಂಚಯ' : `${selectedLanguage} News Edition`}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Read Button */}
            <button
              onClick={handleReadAloud}
              disabled={isAudioLoading}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 shadow-sm ${
                isPlaying 
                ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
              } disabled:opacity-50`}
            >
              {isAudioLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isPlaying ? (
                <Square className="w-4 h-4 fill-current" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
              {isAudioLoading ? (selectedLanguage === 'Kannada' ? 'ಸಿದ್ಧಪಡಿಸಲಾಗುತ್ತಿದೆ...' : 'Synthesizing...') : isPlaying ? (selectedLanguage === 'Kannada' ? 'ನಿಲ್ಲಿಸಿ' : 'Stop') : (selectedLanguage === 'Kannada' ? 'ಕೇಳಿಸಿಕೊಳ್ಳಿ' : 'Listen Now')}
            </button>

            <button 
              onClick={() => fetchAffairs()}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
              title="Refresh news"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="p-6 md:p-10 min-h-[400px]">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            <div className="lg:col-span-3">
              {isPlaying && (
                <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800 animate-pulse">
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-4 bg-indigo-500 rounded-full animate-[bounce_1s_infinite_0s]"></div>
                    <div className="w-1.5 h-4 bg-indigo-500 rounded-full animate-[bounce_1s_infinite_0.2s]"></div>
                    <div className="w-1.5 h-4 bg-indigo-500 rounded-full animate-[bounce_1s_infinite_0.4s]"></div>
                  </div>
                  <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                    {selectedLanguage === 'Kannada' ? 'ಸಿಸ್ಟಮ್ ಸುದ್ದಿಯನ್ನು ಓದುತ್ತಿದೆ...' : 'System is reading the news summary...'}
                  </span>
                </div>
              )}
              <MarkdownRenderer content={data?.text || ''} />
            </div>
            
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5" /> 
                  {selectedLanguage === 'Kannada' ? 'ಮೂಲ ಸುದ್ದಿಗಳು' : 'Verified Sources'}
                </h3>
                <div className="space-y-4">
                  {data?.sources && data.sources.length > 0 ? (
                    data.sources.slice(0, 5).map((chunk: any, i: number) => (
                      <a 
                        key={i}
                        href={chunk.web?.uri || '#'} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block group p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-700"
                      >
                        <div className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-2 leading-snug mb-1">
                          {chunk.web?.title || 'Related News Item'}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 uppercase font-bold tracking-tighter">
                          Official Coverage <ExternalLink className="w-2.5 h-2.5" />
                        </div>
                      </a>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400 italic px-3">Real-time source links verified by Gemini Search.</p>
                  )}
                </div>
                <div className="mt-8 p-6 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                  <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase mb-2">
                    {selectedLanguage === 'Kannada' ? 'ಅಭ್ಯಾಸ ಮಾಡಿ' : 'Practice Mode'}
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed font-medium">
                    {selectedLanguage === 'Kannada' 
                      ? 'ಓದಿದ ನಂತರ, ನಿಮ್ಮ ನೆನಪಿನ ಶಕ್ತಿಯನ್ನು ಪರೀಕ್ಷಿಸಲು ಮಾಕ್ ಟೆಸ್ಟ್ ಸಿದ್ಧಪಡಿಸಿ.' 
                      : 'Finished reading? Test your memory by generating a Mock Test on these current topics.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};