import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  
  let currentTable: string[][] = [];
  let inTable = false;

  const flushTable = (key: number) => {
    if (currentTable.length === 0) return null;
    
    // Filter out the separator row (e.g., |---|---|)
    const tableData = currentTable.filter(row => !row.every(cell => cell.trim().match(/^-+$/)));
    if (tableData.length === 0) return null;

    const headers = tableData[0];
    const rows = tableData.slice(1);

    const table = (
      <div key={`table-${key}`} className="my-6 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              {headers.map((header, i) => (
                <th key={i} className="px-6 py-4 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {parseBold(header.trim())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                {row.map((cell, j) => (
                  <td key={j} className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300 whitespace-normal">
                    {parseBold(cell.trim())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    currentTable = [];
    return table;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check for table row
    if (line.startsWith('|') && line.endsWith('|')) {
      inTable = true;
      const cells = line.split('|').filter((_, index, array) => index > 0 && index < array.length - 1);
      currentTable.push(cells);
      continue;
    } else if (inTable) {
      const tableComponent = flushTable(i);
      if (tableComponent) elements.push(tableComponent);
      inTable = false;
    }

    if (!line) {
      elements.push(<br key={i} />);
      continue;
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-lg font-bold text-indigo-700 dark:text-indigo-400 mt-6 mb-2">{line.replace('### ', '')}</h3>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-xl font-bold text-indigo-800 dark:text-indigo-300 mt-8 mb-3 border-b border-indigo-100 dark:border-indigo-900 pb-2">{line.replace('## ', '')}</h2>);
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-2xl font-extrabold text-indigo-900 dark:text-indigo-200 mb-4">{line.replace('# ', '')}</h1>);
    }
    // List items
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <div key={i} className="flex items-start ml-4 my-1">
          <span className="text-indigo-500 dark:text-indigo-400 mr-2 font-bold">•</span>
          <span className="text-slate-700 dark:text-slate-300">{parseBold(line.substring(2))}</span>
        </div>
      );
    }
    // Numbered lists
    else if (/^\d+\.\s/.test(line)) {
      const parts = line.split('. ');
      const num = parts[0];
      const text = parts.slice(1).join('. ');
      elements.push(
        <div key={i} className="flex items-start ml-4 my-1">
          <span className="text-indigo-600 dark:text-indigo-400 font-bold mr-2">{num}.</span>
          <span className="text-slate-700 dark:text-slate-300">{parseBold(text)}</span>
        </div>
      );
    }
    // Regular paragraph
    else {
      elements.push(<p key={i} className="my-2">{parseBold(line)}</p>);
    }
  }

  // Final flush in case content ends with a table
  if (inTable) {
    const tableComponent = flushTable(lines.length);
    if (tableComponent) elements.push(tableComponent);
  }

  return <div className="space-y-1">{elements}</div>;
};

const parseBold = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};