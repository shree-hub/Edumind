
import React, { useState, useEffect, useRef } from 'react';
import { Newspaper, RefreshCw, ExternalLink, Globe, Calendar, AlertCircle, Volume2, Square, Languages, Loader2, ArrowLeft, CheckCircle2, Star } from 'lucide-react';
import { getDailyCurrentAffairs, generateCurrentAffairsSpeech } from '../services/geminiService.ts';
import { MarkdownRenderer } from './MarkdownRenderer.tsx';

const LANGUAGES = [
  { code: "Kannada", label: "ಕನ್ನಡ", sublabel: "Kannada", flag: "📜", primary: true },
  { code: "English", label: "English", sublabel: "International", flag: "🇬🇧", primary: false },
  { code: "Hindi", label: "हिन्दी", sublabel: "Hindi", flag: "🇮🇳", primary: false },
  { code: "Spanish", label: "Español", sublabel: "Spanish", flag: "🇪🇸", primary: false },
  { code: "French", label: "Français", sublabel: "French", flag: "🇫🇷", primary: false }
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
      setError("ವಾರ್ತೆಗಳನ್ನು ಪಡೆಯಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ. (Unable to sync news). Please try again.");
      setPhase('selection');
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
      source.onended = () => setIsPlaying(false);
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
      <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in duration-500">
        <div className="text-center mb-12">
          <button 
            onClick={onBack}
            className="mb-8 inline-flex items-center text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-all font-medium group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>
          
          <div className="inline-flex items-center justify-center p-5 bg-indigo-100 dark:bg-indigo-900/30 rounded-3xl mb-8 shadow-sm">
            <Languages className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
          </div>
          
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
             ಸುದ್ದಿ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-2 font-medium">Choose your primary news language</p>
          <div className="h-1.5 w-24 bg-indigo-500 mx-auto rounded-full mb-10"></div>
        </div>

        {error && (
          <div className="mb-10 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl p-5 flex items-center gap-4 text-red-700 dark:text-red-400 animate-in slide-in-from-top-4 duration-300">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <p className="font-bold">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageSelect(lang.code)}
              className={`group relative flex flex-col items-center justify-center p-10 rounded-[2.5rem] border-4 transition-all duration-500 transform hover:-translate-y-2 ${
                lang.primary 
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 shadow-xl shadow-indigo-100 dark:shadow-none' 
                : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'
              } hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-2xl`}
            >
              {lang.primary && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-indigo-600 text-white text-xs font-black rounded-full uppercase tracking-widest shadow-lg flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> Main Language
                </div>
              )}
              
              <span className="text-6xl mb-8 group-hover:scale-110 transition-transform duration-300">{lang.flag}</span>
              <span className="text-3xl font-black text-slate-900 dark:text-white mb-2">{lang.label}</span>
              <span className="text-xs text-slate-400 font-black uppercase tracking-[0.2em]">{lang.sublabel}</span>
              
              <div className="mt-8 bg-indigo-600 text-white text-xs font-bold px-6 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                Continue &rarr;
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div className="max-w-5xl mx-auto py-32 flex flex-col items-center justify-center">
        <div className="relative w-28 h-28 mb-12">
          <div className="absolute inset-0 border-[6px] border-indigo-100 dark:border-indigo-900/30 rounded-full"></div>
          <div className="absolute inset-0 border-[6px] border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
             <Globe className="w-12 h-12 text-indigo-600 animate-pulse" />
          </div>
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 text-center">
          {selectedLanguage === 'Kannada' ? 'ಕ್ಷಣ ಕ್ಷಣದ ಮಾಹಿತಿ ಪಡೆಯಲಾಗುತ್ತಿದೆ...' : `Curating ${selectedLanguage} coverage...`}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 animate-pulse text-lg font-bold tracking-tight">Syncing with global news sources via Gemini AI</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <button 
            onClick={() => setPhase('selection')}
            className="flex items-center px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 transition-all font-black text-xs shadow-sm hover:border-indigo-200 dark:hover:border-indigo-900 group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            {selectedLanguage === 'Kannada' ? 'ಭಾಷೆ ಬದಲಿಸಿ' : 'Switch Language'}
          </button>
          <div className="h-8 w-1 bg-slate-200 dark:bg-slate-800 hidden sm:block rounded-full"></div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center tracking-tight">
            <Newspaper className="w-7 h-7 mr-3 text-indigo-600 dark:text-indigo-400" />
            {selectedLanguage === 'Kannada' ? 'ಇಂದಿನ ಮುಖ್ಯಾಂಶಗಳು' : 'Daily Spotlight'}
          </h2>
        </div>
        
        <div className="flex items-center gap-3 text-xs font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/40 px-5 py-2.5 rounded-2xl border-2 border-indigo-100 dark:border-indigo-800/50 shadow-sm">
          <Calendar className="w-4 h-4" />
          {new Date().toLocaleDateString(selectedLanguage === 'Kannada' ? 'kn-IN' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl">
        <div className="bg-slate-50 dark:bg-slate-800/50 px-8 py-8 border-b-2 border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white dark:bg-slate-950 rounded-[1.5rem] flex items-center justify-center text-4xl shadow-inner border-2 border-slate-100 dark:border-slate-800">
              {LANGUAGES.find(l => l.code === selectedLanguage)?.flag}
            </div>
            <div>
              <span className="block text-lg font-black text-slate-900 dark:text-white uppercase tracking-[0.1em]">
                {selectedLanguage === 'Kannada' ? 'ಕನ್ನಡ ಆವೃತ್ತಿ' : `${selectedLanguage} Edition`}
              </span>
              <span className="text-sm text-slate-500 font-bold opacity-80">AI Verified Content • Real-time Sync</span>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full lg:w-auto">
            <button
              onClick={handleReadAloud}
              disabled={isAudioLoading}
              className={`flex-1 lg:flex-none flex items-center justify-center gap-4 px-10 py-4 rounded-[1.5rem] text-sm font-black transition-all duration-300 shadow-xl ${
                isPlaying 
                ? 'bg-red-500 text-white hover:bg-red-600 hover:scale-105' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 active:scale-95 shadow-indigo-200 dark:shadow-none'
              } disabled:opacity-50`}
            >
              {isAudioLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isPlaying ? (
                <Square className="w-5 h-5 fill-current" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
              {isAudioLoading ? 'Processing...' : isPlaying ? (selectedLanguage === 'Kannada' ? 'ನಿಲ್ಲಿಸಿ' : 'Stop Reading') : (selectedLanguage === 'Kannada' ? 'ಸುದ್ದಿ ಕೇಳಿ' : 'Listen Now')}
            </button>

            <button 
              onClick={() => fetchAffairs()}
              className="p-4 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded-[1.5rem] transition-all text-indigo-600 dark:text-indigo-400 border-2 border-indigo-50 dark:border-indigo-900/50 shadow-sm"
              title="Refresh Content"
            >
              <RefreshCw className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="p-10 lg:p-16 min-h-[500px]">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-16">
            <div className="lg:col-span-3">
              {isPlaying && (
                <div className="mb-10 flex items-center gap-5 px-8 py-5 bg-indigo-50 dark:bg-indigo-900/30 rounded-[2rem] border-2 border-indigo-100 dark:border-indigo-800 animate-pulse">
                  <div className="flex gap-2.5">
                    <div className="w-2 h-8 bg-indigo-600 rounded-full animate-[bounce_1s_infinite_0s]"></div>
                    <div className="w-2 h-8 bg-indigo-600 rounded-full animate-[bounce_1s_infinite_0.2s]"></div>
                    <div className="w-2 h-8 bg-indigo-600 rounded-full animate-[bounce_1s_infinite_0.4s]"></div>
                  </div>
                  <span className="text-lg font-black text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">
                    {selectedLanguage === 'Kannada' ? 'ಸುದ್ದಿ ವಾಚನ ನಡೆಯುತ್ತಿದೆ...' : 'Audio narration in progress...'}
                  </span>
                </div>
              )}
              <div className="prose prose-xl prose-indigo dark:prose-invert max-w-none">
                <MarkdownRenderer content={data?.text || ''} />
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <div className="sticky top-28">
                <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                  <Globe className="w-5 h-5" /> 
                  Citations & Sources
                </h3>
                <div className="space-y-5">
                  {data?.sources && data.sources.length > 0 ? (
                    data.sources.slice(0, 5).map((chunk: any, i: number) => (
                      <a 
                        key={i}
                        href={chunk.web?.uri || '#'} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block group p-5 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-800 transition-all border-2 border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-xl"
                      >
                        <div className="text-sm font-black text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-2 leading-relaxed mb-3">
                          {chunk.web?.title || 'External Report'}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 uppercase font-black tracking-tighter">
                          Official Outlet <ExternalLink className="w-3.5 h-3.5" />
                        </div>
                      </a>
                    ))
                  ) : (
                    <div className="p-6 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800/30 border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
                      <p className="text-xs text-slate-400 italic font-bold">Verified via Gemini Search</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-12 p-8 bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-[2rem] text-white shadow-2xl shadow-indigo-200 dark:shadow-none">
                  <div className="flex items-center gap-3 mb-4">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    <h4 className="text-xs font-black uppercase tracking-[0.2em]">Prep Challenge</h4>
                  </div>
                  <p className="text-sm font-bold leading-relaxed opacity-95">
                    {selectedLanguage === 'Kannada' 
                      ? 'ಓದಿದ ಮೇಲೆ, ಈ ವಿಷಯಗಳ ಬಗ್ಗೆ ಮಾಕ್ ಟೆಸ್ಟ್ ತೆಗೆದುಕೊಳ್ಳಲು ಸಿದ್ಧರಾಗಿ!' 
                      : 'Mastered today\'s news? Test your retention with a dynamic mock test!'}
                  </p>
                  <button 
                    onClick={onBack}
                    className="mt-6 w-full py-3 bg-white/10 hover:bg-white/20 border-2 border-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                  >
                    Go to Mock Test
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
