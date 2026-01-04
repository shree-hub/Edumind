import React, { useState } from 'react';
import { Globe, ArrowLeft, Copy, Check, RefreshCw, Layout, List, TableProperties, Sparkles } from 'lucide-react';
import { generateStaticGK } from '../services/geminiService';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Button } from './Button';

interface StaticGKGeneratorProps {
  onBack: () => void;
}

const GK_CATEGORIES = [
  "Indian Rivers", "World Capitals", "Inventions & Discoveries", 
  "Historical Dynasties", "National Parks", "Space Missions",
  "Fundamental Rights", "Chemical Elements", "Nobel Prizes"
];

export const StaticGKGenerator: React.FC<StaticGKGeneratorProps> = ({ onBack }) => {
  const [topic, setTopic] = useState('');
  const [format, setFormat] = useState('Fact Sheet');
  const [gkContent, setGkContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);
    setGkContent(null);

    try {
      const result = await generateStaticGK(topic, format);
      setGkContent(result);
    } catch (err) {
      setError("Factual sync failed. Please try a different topic.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (gkContent) {
      navigator.clipboard.writeText(gkContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="mb-6 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          Back to Home
        </button>
        <h2 className="text-2xl font-bold text-indigo-900 dark:text-indigo-300 flex items-center">
          <Globe className="w-6 h-6 mr-2 text-indigo-600 dark:text-indigo-400" />
          Static GK Vault
        </h2>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 mb-8">
        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Topic to Explore</label>
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Major Dams of India, Solar System, Industrial Revolution"
              className="flex-1 rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-4 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Popular Categories</label>
          <div className="flex flex-wrap gap-2">
            {GK_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => { setTopic(cat); }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  topic === cat 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { id: 'Fact Sheet', icon: Layout, label: 'Fact Sheet' },
            { id: 'Timeline', icon: List, label: 'Timeline' },
            { id: 'Comparison Table', icon: TableProperties, label: 'Table View' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFormat(item.id)}
              className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                format === item.id
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-900 dark:text-indigo-100 ring-2 ring-indigo-100 dark:ring-indigo-900/20'
                  : 'border-slate-100 dark:border-slate-800 hover:border-indigo-200 text-slate-600 dark:text-slate-400'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-bold">{item.label}</span>
            </button>
          ))}
        </div>

        <Button 
          onClick={() => handleGenerate()} 
          isLoading={loading} 
          disabled={!topic.trim()} 
          className="w-full py-4 text-lg font-black shadow-lg shadow-indigo-100 dark:shadow-none"
        >
          Generate Knowledge Base
        </Button>
        {error && <p className="mt-4 text-red-600 dark:text-red-400 text-sm font-bold text-center">{error}</p>}
      </div>

      {loading && (
        <div className="text-center py-20 animate-pulse">
          <Globe className="w-16 h-16 text-indigo-600 dark:text-indigo-400 mx-auto mb-4 animate-spin" />
          <h3 className="text-xl font-black text-slate-800 dark:text-white">Synthesizing Verified Data...</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Gemini AI is scanning factual databases for "{topic}"</p>
        </div>
      )}

      {gkContent && !loading && (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border-2 border-slate-100 dark:border-slate-800 overflow-hidden mb-16">
          <div className="bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-100 dark:border-slate-800 px-8 py-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
                 <Sparkles className="w-5 h-5 text-indigo-600" />
               </div>
               <div>
                 <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm">{format}: {topic}</h3>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Static GK Library</span>
               </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleGenerate()}
                className="p-3 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-all"
                title="Regenerate"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-6 py-3 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-lg shadow-indigo-100 dark:shadow-none"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy to Notes'}
              </button>
            </div>
          </div>
          <div className="p-10 lg:p-16">
            <div className="prose prose-indigo dark:prose-invert max-w-none">
              <MarkdownRenderer content={gkContent} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};