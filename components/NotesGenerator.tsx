import React, { useState } from 'react';
import { BookOpen, Copy, Check, ArrowLeft, RefreshCw, Sparkles, Info, X } from 'lucide-react';
import { generateStudyNotes } from '../services/geminiService';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Button } from './Button';

interface NotesGeneratorProps {
  onBack: () => void;
}

export const NotesGenerator: React.FC<NotesGeneratorProps> = ({ onBack }) => {
  const [topic, setTopic] = useState('');
  const [isUPSCDepth, setIsUPSCDepth] = useState(false);
  const [showUPSCTip, setShowUPSCTip] = useState(false);
  const [notes, setNotes] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);
    setNotes(null);

    try {
      const result = await generateStudyNotes(topic, isUPSCDepth);
      setNotes(result);
    } catch (err) {
      setError("Something went wrong while generating notes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (notes) {
      navigator.clipboard.writeText(notes);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleUPSCDepth = () => {
    const newVal = !isUPSCDepth;
    setIsUPSCDepth(newVal);
    if (newVal) {
      setShowUPSCTip(true);
    } else {
      setShowUPSCTip(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          Back to Home
        </button>
        <h2 className="text-2xl font-bold text-indigo-900 dark:text-indigo-300 flex items-center">
          <BookOpen className="w-6 h-6 mr-2 text-indigo-600 dark:text-indigo-400" />
          AI Note Taker
        </h2>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-8">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What do you want to learn? (e.g., Artificial Intelligence, Gupta Empire)"
              className="flex-1 rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-3 text-slate-900 dark:text-white"
              disabled={loading}
            />
            <Button type="submit" isLoading={loading} disabled={!topic.trim()} className="px-8">
              Generate Notes
            </Button>
          </div>
          
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <label className="flex items-center cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={isUPSCDepth}
                    onChange={toggleUPSCDepth}
                  />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${isUPSCDepth ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isUPSCDepth ? 'translate-x-4' : ''}`}></div>
                </div>
                <div className="ml-3 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                  UPSC Level Depth
                  <button 
                    type="button"
                    onClick={(e) => { e.preventDefault(); setShowUPSCTip(!showUPSCTip); }}
                    className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    title="What is UPSC Depth?"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  {isUPSCDepth && <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />}
                </div>
              </label>
              <span className="text-xs text-slate-400 italic hidden sm:inline">
                (Adds critical analysis and GS-paper structure)
              </span>
            </div>

            {isUPSCDepth && showUPSCTip && (
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg p-4 relative animate-in fade-in slide-in-from-top-1 duration-200 shadow-sm max-w-2xl">
                <button 
                  type="button"
                  onClick={() => setShowUPSCTip(false)}
                  className="absolute top-3 right-3 text-indigo-400 hover:text-indigo-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex gap-3">
                  <div className="mt-0.5">
                    <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-200 mb-1">UPSC Mains Pattern Activated</h4>
                    <p className="text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed mb-2">
                      Notes are specifically tailored for Civil Services Examination standards:
                    </p>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-indigo-700 dark:text-indigo-400 list-disc ml-4">
                      <li>Multi-dimensional analysis (Social/Economic/Polity)</li>
                      <li>GS-Paper structured formatting</li>
                      <li>Critical analysis of challenges & pros/cons</li>
                      <li>Government initiatives & current context</li>
                      <li>Standardized "Way Forward" conclusions</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>
        {error && <p className="mt-2 text-red-600 dark:text-red-400 text-sm">{error}</p>}
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-bounce mb-4 text-4xl">{isUPSCDepth ? '🏛️' : '📚'}</div>
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">
            {isUPSCDepth ? `Synthesizing UPSC-level analysis on "${topic}"...` : `Researching "${topic}"...`}
          </h3>
          <p className="text-slate-500 dark:text-slate-400">Gemini Pro is compiling comprehensive material for you.</p>
        </div>
      )}

      {notes && !loading && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden mb-12">
          <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
            <div className="flex items-center gap-2 truncate pr-4">
              {isUPSCDepth && <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">UPSC Mode</span>}
              <h3 className="font-semibold text-slate-800 dark:text-white truncate">Notes: {topic}</h3>
            </div>
            <div className="flex gap-2">
               <button
                onClick={handleGenerate}
                className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-colors"
                title="Regenerate"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-md transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
          <div className="p-8 bg-white dark:bg-slate-900 min-h-[500px]">
            <MarkdownRenderer content={notes} />
          </div>
        </div>
      )}
    </div>
  );
};