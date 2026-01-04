export enum AppView {
  HOME = 'HOME',
  NOTES = 'NOTES',
  TEST = 'TEST',
  AFFAIRS = 'AFFAIRS',
  GK = 'GK'
}

export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard'
}

export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number; // 0-3
  explanation: string;
}

export interface QuizConfig {
  topic: string;
  exam: string;
  subject: string;
  difficulty: Difficulty;
  questionCount: number;
}

export interface QuizResult {
  totalQuestions: number;
  score: number;
  answers: { questionId: number; selectedIndex: number }[];
}

export interface NoteSection {
  title: string;
  content: string;
}

export interface GeneratedNote {
  topic: string;
  content: string; // Markdown string
}