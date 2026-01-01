import React, { useState } from 'react';
import { Brain, CheckCircle, XCircle, ArrowRight, ArrowLeft, RotateCcw, Award, Target, BookText, Sparkles } from 'lucide-react';
import { generateMockTest } from '../services/geminiService';
import { Difficulty, Question, QuizConfig } from '../types';
import { Button } from './Button';

interface MockTestGeneratorProps {
  onBack: () => void;
}

type TestPhase = 'config' | 'loading' | 'active' | 'review';

const POPULAR_EXAMS = ["UPSC CSE", "JEE Mains", "NEET", "SSC CGL", "CAT", "GMAT", "SAT", "General Academic"];
const POPULAR_SUBJECTS = ["History", "Geography", "Polity", "Economics", "Physics", "Chemistry", "Biology", "Mathematics", "Ethics", "Current Affairs"];

export const MockTestGenerator: React.FC<MockTestGeneratorProps> = ({ onBack }) => {
  const [phase, setPhase] = useState<TestPhase>('config');
  const [config, setConfig] = useState<QuizConfig>({
    topic: '',
    exam: 'UPSC CSE',
    subject: 'General Studies',
    difficulty: Difficulty.MEDIUM,
    questionCount: 5,
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]); 
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.topic.trim()) return;

    setPhase('loading');
    setError(null);
    try {
      const generatedQuestions = await generateMockTest(config);
      setQuestions(generatedQuestions);
      setSelectedAnswers(new Array(generatedQuestions.length).fill(-1));
      setCurrentQuestionIndex(0);
      setPhase('active');
    } catch (err) {
      setError("Failed to generate test. Please try again.");
      setPhase('config');
    }
  };

  const handleAnswerSelect = (optionIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      calculateScore();
      setPhase('review');
    }
  };

  const calculateScore = () => {
    let newScore = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswerIndex) {
        newScore++;
      }
    });
    setScore(newScore);
  };

  const resetTest = () => {
    setPhase('config');
    setQuestions([]);
    setScore(0);
    setCurrentQuestionIndex(0);
  };

  if (phase === 'config') {
    return (
      <div className="max-w-3xl mx-auto">
         <div className="mb-6 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
            <ArrowLeft className="w-5 h-5 mr-1" /> Back
          </button>
          <h2 className="text-2xl font-bold text-indigo-900 dark:text-indigo-300 flex items-center">
            <Brain className="w-6 h-6 mr-2 text-indigo-600 dark:text-indigo-400" />
            Exam-Level Mock Test
          </h2>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800">
          <form onSubmit={handleStart} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  <Target className="w-4 h-4 mr-2 text-indigo-500 dark:text-indigo-400" /> Target Exam
                </label>
                <div className="relative">
                  <select
                    value={config.exam}
                    onChange={(e) => setConfig({ ...config, exam: e.target.value })}
                    className="w-full rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border p-3 text-slate-900 dark:text-white appearance-none"
                  >
                    {POPULAR_EXAMS.map(e => <option key={e} value={e}>{e}</option>)}
                    <option value="Other">Custom/Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  <BookText className="w-4 h-4 mr-2 text-indigo-500 dark:text-indigo-400" /> Subject
                </label>
                <select
                  value={config.subject}
                  onChange={(e) => setConfig({ ...config, subject: e.target.value })}
                  className="w-full rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border p-3 text-slate-900 dark:text-white"
                >
                  {POPULAR_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  <option value="General">General/Mix</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Topic / Chapter</label>
              <input
                type="text"
                required
                value={config.topic}
                onChange={(e) => setConfig({ ...config, topic: e.target.value })}
                placeholder="e.g. Fundamental Rights, Organic Reactions, Laws of Motion"
                className="w-full rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border p-3 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Difficulty</label>
                <select
                  value={config.difficulty}
                  onChange={(e) => setConfig({ ...config, difficulty: e.target.value as Difficulty })}
                  className="w-full rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border p-3 text-slate-900 dark:text-white"
                >
                  {Object.values(Difficulty).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Question Count</label>
                <select
                  value={config.questionCount}
                  onChange={(e) => setConfig({ ...config, questionCount: Number(e.target.value) })}
                  className="w-full rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border p-3 text-slate-900 dark:text-white"
                >
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                  <option value={20}>20 Questions</option>
                </select>
              </div>
            </div>

            {error && <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>}

            <Button type="submit" className="w-full py-4 text-lg font-bold shadow-indigo-200 dark:shadow-indigo-900/20 shadow-lg">
              Start {config.exam} Mock Test
            </Button>
          </form>
        </div>
        <p className="mt-4 text-center text-slate-400 dark:text-slate-500 text-xs italic">
          * Tests are generated using Gemini 3 Pro for higher accuracy and pattern matching.
        </p>
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="relative w-24 h-24 mb-6">
           <svg className="animate-spin w-full h-full text-indigo-600 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Crafting {config.exam} Questions</h2>
        <p className="text-slate-500 dark:text-slate-400 text-center max-w-sm">Designing high-quality assessment for {config.subject}: {config.topic}...</p>
      </div>
    );
  }

  if (phase === 'active') {
    const question = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">
            <span className="bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded text-indigo-700 dark:text-indigo-300">{config.exam} - {config.subject}</span>
            <span>Question {currentQuestionIndex + 1} / {questions.length}</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5">
            <div className="bg-indigo-600 dark:bg-indigo-500 h-2.5 rounded-full transition-all duration-300 shadow-sm shadow-indigo-200 dark:shadow-indigo-900/40" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-8">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 leading-relaxed">{question.question}</h3>
          
          <div className="space-y-3">
            {question.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswerSelect(idx)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex items-center group ${
                  selectedAnswers[currentQuestionIndex] === idx
                    ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-900 dark:text-indigo-100 ring-2 ring-indigo-200 dark:ring-indigo-900/40'
                    : 'border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center mr-4 flex-shrink-0 text-sm font-bold ${
                   selectedAnswers[currentQuestionIndex] === idx ? 'border-indigo-600 bg-indigo-600 dark:border-indigo-400 dark:bg-indigo-400 text-white' : 'border-slate-300 dark:border-slate-700 group-hover:border-indigo-400 text-slate-400 dark:text-slate-500'
                }`}>
                  {String.fromCharCode(65 + idx)}
                </div>
                <span className="text-lg">{option}</span>
              </button>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <Button 
              onClick={handleNext} 
              disabled={selectedAnswers[currentQuestionIndex] === -1}
              className="px-10"
            >
              {currentQuestionIndex === questions.length - 1 ? 'Finish Test' : 'Next Question'} <ArrowRight className="ml-2 w-4 h-4"/>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'review') {
    const percentage = Math.round((score / questions.length) * 100);
    let feedback = '';
    if (percentage >= 90) feedback = `Excellent! You are definitely ready for the ${config.exam}.`;
    else if (percentage >= 70) feedback = 'Solid performance. Keep refining your weak areas.';
    else if (percentage >= 50) feedback = 'Decent effort. More structured revision needed.';
    else feedback = 'Practice makes perfect. Try generating more focused notes.';

    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-4 shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20">
            <Award className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Analysis Complete!</h2>
          <div className="flex justify-center gap-4 text-sm font-bold mb-4">
             <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded text-slate-600 dark:text-slate-400">Exam: {config.exam}</span>
             <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded text-slate-600 dark:text-slate-400">Subject: {config.subject}</span>
          </div>
          <p className="text-2xl text-slate-700 dark:text-slate-300 mb-1">Score: <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{score}</span> / {questions.length}</p>
          <p className="text-slate-500 dark:text-slate-400 font-medium">{feedback}</p>
        </div>

        <div className="space-y-6">
          {questions.map((q, idx) => {
            const isCorrect = selectedAnswers[idx] === q.correctAnswerIndex;
            return (
              <div key={q.id} className={`bg-white dark:bg-slate-900 rounded-xl border-l-8 p-6 shadow-sm border-slate-200 dark:border-slate-800 ${isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white pr-4">
                    <span className="text-slate-400 dark:text-slate-600 mr-2">{idx + 1}.</span> {q.question}
                  </h3>
                  {isCorrect ? (
                    <span className="flex items-center text-green-700 dark:text-green-400 text-xs font-bold bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full uppercase">
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Correct
                    </span>
                  ) : (
                    <span className="flex items-center text-red-700 dark:text-red-400 text-xs font-bold bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded-full uppercase">
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Incorrect
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  {q.options.map((opt, optIdx) => {
                    let style = "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400";
                    if (optIdx === q.correctAnswerIndex) {
                      style = "border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400 font-bold ring-1 ring-green-200 dark:ring-green-900/40";
                    } else if (optIdx === selectedAnswers[idx] && !isCorrect) {
                      style = "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 font-bold ring-1 ring-red-200 dark:ring-red-900/40";
                    }
                    return (
                      <div key={optIdx} className={`p-4 border rounded-lg text-sm flex items-center ${style}`}>
                        <span className="mr-3 opacity-60 font-mono">{String.fromCharCode(65 + optIdx)}.</span>
                        {opt}
                      </div>
                    );
                  })}
                </div>

                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-lg border border-indigo-100 dark:border-indigo-800">
                  <h4 className="font-bold text-indigo-900 dark:text-indigo-200 text-sm uppercase tracking-wider mb-2 flex items-center">
                    <Sparkles className="w-4 h-4 mr-2" /> Explanation
                  </h4>
                  <p className="text-indigo-800 dark:text-indigo-300 leading-relaxed text-sm">
                    {q.explanation}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center pb-16">
          <Button onClick={resetTest} variant="outline" className="px-12 py-4 text-lg">
            <RotateCcw className="w-5 h-5 mr-2" /> Try Another Test
          </Button>
        </div>
      </div>
    );
  }

  return null;
};