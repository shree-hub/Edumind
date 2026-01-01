import React, { useState, useEffect } from 'react';
import { Book, PenTool, GraduationCap, Moon, Sun, Newspaper } from 'lucide-react';
import { AppView } from './types';
import { NotesGenerator } from './components/NotesGenerator';
import { MockTestGenerator } from './components/MockTestGenerator';
import { DailyCurrentAffairs } from './components/DailyCurrentAffairs';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const renderHome = () => (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl mb-6">
          <GraduationCap className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
          Your Smart Study Companion
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          EduMind leverages Gemini AI to provide personalized study materials, real-time news, and interactive assessments.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <button
          onClick={() => setCurrentView(AppView.AFFAIRS)}
          className="group relative flex flex-col items-start p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-xl dark:hover:shadow-indigo-900/10 border border-slate-200 dark:border-slate-800 transition-all duration-300 text-left"
        >
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg mb-6 group-hover:scale-110 transition-transform duration-300">
            <Newspaper className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Daily Current Affairs</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            Stay updated with the latest news tailored for competitive exams. Multi-language support and audio reading included.
          </p>
          <span className="mt-auto inline-flex items-center text-amber-600 dark:text-amber-400 font-semibold group-hover:translate-x-1 transition-transform">
            Read Today's News &rarr;
          </span>
        </button>

        <button
          onClick={() => setCurrentView(AppView.NOTES)}
          className="group relative flex flex-col items-start p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-xl dark:hover:shadow-indigo-900/10 border border-slate-200 dark:border-slate-800 transition-all duration-300 text-left"
        >
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg mb-6 group-hover:scale-110 transition-transform duration-300">
            < Book className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Study Notes</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            Generate high-quality, structured notes on any topic. UPSC-level depth and analysis available at a click.
          </p>
          <span className="mt-auto inline-flex items-center text-blue-600 dark:text-blue-400 font-semibold group-hover:translate-x-1 transition-transform">
            Create Notes &rarr;
          </span>
        </button>

        <button
          onClick={() => setCurrentView(AppView.TEST)}
          className="group relative flex flex-col items-start p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-xl dark:hover:shadow-emerald-900/10 border border-slate-200 dark:border-slate-800 transition-all duration-300 text-left"
        >
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg mb-6 group-hover:scale-110 transition-transform duration-300">
            <PenTool className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Mock Tests</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            Assess your knowledge with AI-generated quizzes matching your target exam pattern and difficulty.
          </p>
          <span className="mt-auto inline-flex items-center text-emerald-600 dark:text-emerald-400 font-semibold group-hover:translate-x-1 transition-transform">
            Start Test &rarr;
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900 selection:text-indigo-900 dark:selection:text-indigo-100 transition-colors duration-300">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => setCurrentView(AppView.HOME)}
          >
            <GraduationCap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">EduMind</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400 hidden sm:block">
              AI Powered Learning
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === AppView.HOME && renderHome()}
        {currentView === AppView.AFFAIRS && <DailyCurrentAffairs onBack={() => setCurrentView(AppView.HOME)} />}
        {currentView === AppView.NOTES && <NotesGenerator onBack={() => setCurrentView(AppView.HOME)} />}
        {currentView === AppView.TEST && <MockTestGenerator onBack={() => setCurrentView(AppView.HOME)} />}
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 dark:text-slate-500 text-sm">
          <p>&copy; {new Date().getFullYear()} EduMind. Powered by Google Gemini.</p>
        </div>
      </footer>
    </div>
  );
}