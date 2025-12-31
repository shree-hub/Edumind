import React from 'react';

// A lightweight component to render the markdown-like output from Gemini nicely
// without needing a full markdown parser library dependency in this specific environment.
interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Split by double newline to get paragraphs
  const paragraphs = content.split('\n');

  return (
    <div className="space-y-4 text-slate-800 dark:text-slate-300 leading-relaxed">
      {paragraphs.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <br key={idx} />;

        // Headers
        if (trimmed.startsWith('### ')) {
          return <h3 key={idx} className="text-lg font-bold text-indigo-700 dark:text-indigo-400 mt-6 mb-2">{trimmed.replace('### ', '')}</h3>;
        }
        if (trimmed.startsWith('## ')) {
          return <h2 key={idx} className="text-xl font-bold text-indigo-800 dark:text-indigo-300 mt-8 mb-3 border-b border-indigo-100 dark:border-indigo-900 pb-2">{trimmed.replace('## ', '')}</h2>;
        }
        if (trimmed.startsWith('# ')) {
          return <h1 key={idx} className="text-2xl font-extrabold text-indigo-900 dark:text-indigo-200 mb-4">{trimmed.replace('# ', '')}</h1>;
        }

        // List items
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start ml-4">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2">•</span>
              <span>{parseBold(trimmed.substring(2))}</span>
            </div>
          );
        }
        
        // Numbered lists (simple detection)
        if (/^\d+\.\s/.test(trimmed)) {
           const parts = trimmed.split('. ');
           const num = parts[0];
           const text = parts.slice(1).join('. ');
           return (
             <div key={idx} className="flex items-start ml-4">
               <span className="text-indigo-600 dark:text-indigo-400 font-medium mr-2">{num}.</span>
               <span>{parseBold(text)}</span>
             </div>
           );
        }

        // Regular paragraph
        return <p key={idx}>{parseBold(trimmed)}</p>;
      })}
    </div>
  );
};

// Helper to handle **bold** text
const parseBold = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};