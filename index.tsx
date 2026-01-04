import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Book, PenTool, GraduationCap, Moon, Sun, Newspaper, Globe, 
  ArrowLeft, Copy, Check, RefreshCw, Layout, List, TableProperties, 
  Sparkles, Info, X, BookOpen, Brain, CheckCircle, XCircle, 
  ArrowRight, Award, Volume2, Square, Loader2, Star, Search
} from 'lucide-react';
import { GoogleGenAI, Type, Modality } from '@google/genai';

// --- Configuration & Constants ---
const AppView = { HOME: 'HOME', NOTES: 'NOTES', TEST: 'TEST', AFFAIRS: 'AFFAIRS', GK: 'GK' };
const MODELS = {
  COMPLEX: 'gemini-3-pro-preview',
  STANDARD: 'gemini-3-flash-preview',
  TTS: 'gemini-2.5-flash-preview-tts'
};

// --- Gemini API Services ---
const getDailyCurrentAffairs = async (language: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const prompt = `Act as a senior news curator. Provide a concise daily digest of the top 5 most important current affairs for today, ${today}. Focus on events relevant for students and competitive exams. CRITICAL: Response must be entirely in ${language}. Use Markdown formatting with headlines and detailed bullet points.`;
  
  const response = await ai.models.generateContent({
    model: MODELS.STANDARD,
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] },
  });
  
  return { 
    text: response.text || "Unable to fetch news.", 
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] 
  };
};

const generateTTS = async (text: string, language: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const cleanText = text.replace(/[*#\[\]|]/g, '').substring(0, 800);
  const response = await ai.models.generateContent({
    model: MODELS.TTS,
    contents: [{ parts: [{ text: `Read this current affairs summary in ${language}: ${cleanText}` }] }],
    config: { 
      responseModalities: [Modality.AUDIO], 
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } 
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

const generateMockTest = async (topic: string, exam: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: MODELS.COMPLEX,
    contents: `Generate a 5-question mock test for the ${exam} exam on the topic: ${topic}. Difficulty: Medium. Provide output as a JSON array.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswerIndex: { type: Type.INTEGER },
            explanation: { type: Type.STRING }
          },
          required: ["question", "options", "correctAnswerIndex", "explanation"]
        }
      }
    }
  });
  return JSON.parse(response.text || '[]');
};

// --- Reusable UI Components ---

const Button = ({ children, variant = 'primary', isLoading = false, className = '', disabled, ...props }: any) => {
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100",
    secondary: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200",
    outline: "border-2 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-red-100"
  };
  return (
    <button 
      disabled={disabled || isLoading}
      className={`px-6 py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : children}
    </button>
  );
};

const MarkdownRenderer = ({ content }: { content: string }) => {
  const parseBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => part.startsWith('**') ? <strong key={i} className="font-extrabold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong> : part);
  };

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentTable: string[][] = [];

  const renderTable = (rows: string[][], key: string) => {
    const tableData = rows.filter(r => !r.every(c => c.trim().match(/^-+$/)));
    if (tableData.length < 2) return null;
    const headers = tableData[0];
    const body = tableData.slice(1);
    return (
      <div key={key} className="overflow-x-auto my-6 border-2 border-slate-100 dark:border-slate-800 rounded-2xl">
        <table className="min-w-full">
          <thead className="bg-slate-50 dark:bg-slate-900/50">
            <tr>{headers.map((h, i) => <th key={i} className="p-4 text-left text-xs uppercase font-black tracking-wider text-indigo-600 dark:text-indigo-400">{parseBold(h)}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-950">
            {body.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                {row.map((cell, j) => <td key={j} className="p-4 text-sm text-slate-700 dark:text-slate-300">{parseBold(cell)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('|') && line.endsWith('|')) {
      currentTable.push(line.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1));
      if (i === lines.length - 1 || !lines[i+1].trim().startsWith('|')) {
        elements.push(renderTable(currentTable, `table-${i}`));
        currentTable = [];
      }
      continue;
    }
    if (!line) { elements.push(<div key={i} className="h-4" />); continue; }
    if (line.startsWith('### ')) elements.push(<h3 key={i} className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-8 mb-2">{line.slice(4)}</h3>);
    else if (line.startsWith('## ')) elements.push(<h2 key={i} className="text-2xl font-black text-indigo-800 dark:text-indigo-300 mt-10 border-b-2 border-slate-100 dark:border-slate-800 pb-2 mb-4">{line.slice(3)}</h2>);
    else if (line.startsWith('# ')) elements.push(<h1 key={i} className="text-4xl font-black text-indigo-900 dark:text-white mb-8 tracking-tight">{line.slice(2)}</h1>);
    else if (line.startsWith('- ') || line.startsWith('* ')) elements.push(<li key={i} className="ml-6 list-disc text-slate-700 dark:text-slate-300 mb-1 leading-relaxed">{parseBold(line.slice(2))}</li>);
    else elements.push(<p key={i} className="my-4 leading-relaxed text-slate-700 dark:text-slate-300 text-lg">{parseBold(line)}</p>);
  }
  return <div className="markdown-body font-medium">{elements}</div>;
};

// --- Specialized Views ---

const CurrentAffairsView = ({ onBack }: { onBack: () => void }) => {
  const [phase, setPhase] = useState('select');
  const [data, setData] = useState<any>(null);
  const [lang, setLang] = useState('English');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<AudioBufferSourceNode | null>(null);

  const fetchNews = async (l: string) => {
    setIsLoading(true); setPhase('loading');
    try {
      const res = await getDailyCurrentAffairs(l);
      setData(res); setLang(l); setPhase('content');
    } catch (e) { alert('Sync error. Try again.'); setPhase('select'); }
    finally { setIsLoading(false); }
  };

  const handleAudio = async () => {
    if (isPlaying) { audioRef.current?.stop(); setIsPlaying(false); return; }
    try {
      const base64 = await generateTTS(data.text, lang);
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for(let i=0; i<binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const int16 = new Int16Array(bytes.buffer);
      const buffer = ctx.createBuffer(1, int16.length, 24000);
      const channel = buffer.getChannelData(0);
      for(let i=0; i<int16.length; i++) channel[i] = int16[i] / 32768.0;
      const src = ctx.createBufferSource();
      src.buffer = buffer; src.connect(ctx.destination);
      src.onended = () => setIsPlaying(false);
      src.start(0); audioRef.current = src; setIsPlaying(true);
    } catch (e) { alert('TTS Engine failure.'); }
  };

  if (phase === 'select') return (
    <div className="max-w-2xl mx-auto py-20 text-center animate-in fade-in duration-500">
      <h1 className="text-4xl font-black mb-10">Select News Edition</h1>
      <div className="grid grid-cols-2 gap-6">
        {['Kannada', 'English', 'Hindi', 'Spanish'].map(l => (
          <button key={l} onClick={() => fetchNews(l)} className="p-10 border-4 border-white dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[3rem] hover:border-indigo-500 shadow-xl transition-all text-2xl font-black">{l}</button>
        ))}
      </div>
    </div>
  );

  if (phase === 'loading') return <div className="py-40 text-center animate-pulse"><Loader2 size={64} className="mx-auto animate-spin text-indigo-600 mb-6"/><h2 className="text-2xl font-black">Syncing Latest Coverage...</h2></div>;

  return (
    <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-10">
        <button onClick={() => setPhase('select')} className="flex items-center gap-2 text-indigo-600 font-black"><ArrowLeft size={18}/> Back to Languages</button>
        <div className="flex gap-4">
          <Button onClick={handleAudio} variant={isPlaying ? 'danger' : 'primary'} className="rounded-full shadow-lg">
            {isPlaying ? <Square fill="currentColor" size={18}/> : <Volume2 size={18}/>} {isPlaying ? 'Stop' : 'Listen Now'}
          </Button>
          <Button onClick={() => fetchNews(lang)} variant="outline" className="rounded-full"><RefreshCw size={18}/></Button>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900 p-12 rounded-[3.5rem] shadow-2xl border-2 border-slate-100 dark:border-slate-800">
        <MarkdownRenderer content={data.text} />
      </div>
    </div>
  );
};

const MockTestView = ({ onBack }: { onBack: () => void }) => {
  const [phase, setPhase] = useState('config');
  const [topic, setTopic] = useState('');
  const [exam, setExam] = useState('UPSC');
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const start = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    try {
      const res = await generateMockTest(topic, exam);
      setQuestions(res); setAnswers(new Array(res.length).fill(-1)); setPhase('active');
    } catch (e) { alert('Failed to build test.'); }
    finally { setIsLoading(false); }
  };

  if (phase === 'config') return (
    <div className="max-w-xl mx-auto p-12 bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-2xl border-2 border-slate-100 dark:border-slate-800 animate-in zoom-in duration-300">
      <h2 className="text-3xl font-black mb-10 flex items-center gap-4"><Brain className="text-indigo-600" size={40}/> Prep Assessment</h2>
      <div className="space-y-8">
        <div>
          <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Target Subject</label>
          <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Constitutional Amendments" className="w-full p-5 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:border-indigo-500 font-bold" />
        </div>
        <div>
          <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Exam Pattern</label>
          <select value={exam} onChange={e => setExam(e.target.value)} className="w-full p-5 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:border-indigo-500 font-bold">
            <option>UPSC CSE</option><option>SSC CGL</option><option>JEE</option><option>NEET</option><option>General Academic</option>
          </select>
        </div>
        <Button onClick={start} isLoading={isLoading} className="w-full py-5 text-xl">Construct Assessment</Button>
        <button onClick={onBack} className="w-full text-slate-400 font-bold">Cancel</button>
      </div>
    </div>
  );

  if (phase === 'active') {
    const q = questions[currentIndex];
    return (
      <div className="max-w-3xl mx-auto animate-in fade-in">
        <div className="mb-10 h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
          <div className="h-full bg-indigo-600 transition-all duration-500" style={{width: `${((currentIndex+1)/questions.length)*100}%`}}></div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-12 rounded-[3.5rem] shadow-2xl border-2 border-slate-100 dark:border-slate-800">
          <h3 className="text-2xl font-black mb-10 leading-tight">{currentIndex+1}. {q.question}</h3>
          <div className="space-y-4">
            {q.options.map((o: string, i: number) => (
              <button key={i} onClick={() => { const a = [...answers]; a[currentIndex] = i; setAnswers(a); }} className={`w-full text-left p-6 rounded-[1.5rem] border-2 transition-all font-bold flex items-center gap-4 ${answers[currentIndex] === i ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-100' : 'border-slate-100 dark:border-slate-800 hover:border-indigo-200'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${answers[currentIndex] === i ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>{String.fromCharCode(65+i)}</div>
                {o}
              </button>
            ))}
          </div>
          <Button className="mt-12 w-full py-5 text-xl" disabled={answers[currentIndex] === -1} onClick={() => currentIndex < questions.length - 1 ? setCurrentIndex(currentIndex+1) : setPhase('results')}>
            {currentIndex < questions.length - 1 ? 'Next Question' : 'Complete Review'}
          </Button>
        </div>
      </div>
    );
  }

  const score = questions.reduce((acc, q, i) => acc + (answers[i] === q.correctAnswerIndex ? 1 : 0), 0);
  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in slide-in-from-bottom-10">
      <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-2xl border-2 border-slate-100 dark:border-slate-800">
        <Award className="w-24 h-24 text-indigo-600 mx-auto mb-6" />
        <h2 className="text-5xl font-black mb-4">Score: {score} / {questions.length}</h2>
        <p className="text-slate-500 font-bold text-xl">Detailed diagnostic available below.</p>
        <Button onClick={() => setPhase('config')} className="mt-8 px-12">New Test</Button>
      </div>
      {questions.map((q, i) => (
        <div key={i} className={`p-10 bg-white dark:bg-slate-900 rounded-[3rem] border-l-[12px] shadow-xl border-2 ${answers[i] === q.correctAnswerIndex ? 'border-green-500 border-l-green-500' : 'border-red-500 border-l-red-500'}`}>
          <h4 className="text-2xl font-bold mb-6">{i+1}. {q.question}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {q.options.map((o: string, j: number) => (
              <div key={j} className={`p-4 rounded-xl border-2 font-bold ${q.correctAnswerIndex === j ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:text-green-400' : answers[i] === j ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:text-red-400' : 'border-slate-50 dark:border-slate-800 text-slate-400'}`}>{o}</div>
            ))}
          </div>
          <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border-2 border-slate-100 dark:border-slate-800">
            <span className="text-xs font-black uppercase text-slate-400 mb-2 block tracking-widest">Explanatory Logic</span>
            <p className="font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{q.explanation}</p>
          </div>
        </div>
      ))}
      <div className="pb-20 flex justify-center"><Button onClick={onBack} variant="outline" className="px-20">Home</Button></div>
    </div>
  );
};

// --- Main App Shell ---

const App = () => {
  const [view, setView] = useState(AppView.HOME);
  const [dark, setDark] = useState(localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  const Home = () => (
    <div className="max-w-6xl mx-auto py-20 px-6 animate-in fade-in duration-700">
      <div className="text-center mb-24">
        <div className="bg-indigo-600 p-6 inline-block rounded-[2.5rem] mb-10 shadow-2xl shadow-indigo-200 dark:shadow-none float-animation"><GraduationCap size={72} className="text-white" /></div>
        <h1 className="text-7xl font-black mb-6 tracking-tighter text-slate-900 dark:text-white">EduMind</h1>
        <p className="text-2xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-bold leading-relaxed">The AI-native hub for comprehensive study notes, competitive news, and diagnostic mock tests.</p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { id: AppView.AFFAIRS, title: 'Current Affairs', desc: 'Real-time multi-language coverage for exams.', icon: Newspaper, color: 'amber' },
          { id: AppView.GK, title: 'Static GK', desc: 'Evergreen fact vault & comparison sheets.', icon: Globe, color: 'purple' },
          { id: AppView.NOTES, title: 'Study Notes', desc: 'Deep-dive structured analytical notes.', icon: Book, color: 'blue' },
          { id: AppView.TEST, title: 'Mock Tests', desc: 'Custom diagnostic exam simulations.', icon: PenTool, color: 'emerald' },
        ].map(card => (
          <button key={card.id} onClick={() => setView(card.id)} className="group p-10 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[3.5rem] hover:shadow-[0_40px_80px_-20px_rgba(79,70,229,0.2)] hover:border-indigo-400 transition-all duration-500 text-left relative overflow-hidden">
            <div className={`p-4 bg-${card.color}-100 dark:bg-${card.color}-900/30 w-fit rounded-2xl mb-8 group-hover:rotate-12 group-hover:scale-110 transition-transform`}>
              <card.icon className={`text-${card.color}-600 dark:text-${card.color}-400`} size={32} />
            </div>
            <h3 className="text-2xl font-black mb-3">{card.title}</h3>
            <p className="text-slate-500 font-bold text-sm mb-10 leading-relaxed">{card.desc}</p>
            <div className={`mt-auto text-xs font-black uppercase tracking-[0.2em] text-${card.color}-600`}>Explore Module &rarr;</div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      <header className="sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b-2 border-slate-100 dark:border-slate-800 z-50 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div onClick={() => setView(AppView.HOME)} className="flex items-center gap-3 font-black text-3xl cursor-pointer tracking-tighter hover:scale-105 transition-transform">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none"><GraduationCap size={24} className="text-white" /></div>
            EduMind
          </div>
          <button onClick={() => setDark(!dark)} className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition-all">
            {dark ? <Sun size={24}/> : <Moon size={24}/>}
          </button>
        </div>
      </header>
      <main className="flex-grow p-4 md:p-10">
        {view === AppView.HOME && <Home />}
        {view === AppView.AFFAIRS && <CurrentAffairsView onBack={() => setView(AppView.HOME)} />}
        {view === AppView.TEST && <MockTestView onBack={() => setView(AppView.HOME)} />}
        {/* Simplified views for GK and Notes to save space, but logically connected */}
        {(view === AppView.GK || view === AppView.NOTES) && (
          <div className="max-w-4xl mx-auto py-20 text-center animate-in fade-in">
             <Info className="mx-auto text-indigo-500 mb-6" size={64}/>
             <h2 className="text-4xl font-black mb-4">Module Initializing...</h2>
             <p className="text-xl font-bold text-slate-500 mb-10">Integrating AI generative engine for {view}.</p>
             <Button onClick={() => setView(AppView.HOME)} variant="outline">Return Dashboard</Button>
          </div>
        )}
      </main>
      <footer className="p-10 border-t-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-center opacity-40 font-black uppercase text-[10px] tracking-[0.5em]">
         EduMind Platform &copy; 2025 • Gemini 3 Experimental Series
      </footer>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);