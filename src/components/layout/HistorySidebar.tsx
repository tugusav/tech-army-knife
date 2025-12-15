import React from 'react';
import { Clock, Trash2, Copy, X } from 'lucide-react';
import { useHistory, HistoryItem } from '../../contexts/HistoryContext';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  copyToClipboard: (text: string) => void;
}

export function HistorySidebar({ isOpen, onClose, darkMode, copyToClipboard }: HistorySidebarProps) {
  const { history, clearHistory, removeFromHistory } = useHistory();

  const bgClass = darkMode ? 'bg-gray-800 border-l border-gray-700' : 'bg-white border-l border-gray-200';
  const textClass = darkMode ? 'text-white' : 'text-gray-900';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-500';

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-y-0 right-0 w-80 shadow-xl z-50 transform transition-transform duration-300 ${bgClass}`}>
      <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
         <div className="flex items-center gap-2">
            <Clock size={18} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
            <h2 className={`font-bold ${textClass}`}>History</h2>
         </div>
         <div className="flex gap-2">
            {history.length > 0 && (
                <button 
                    onClick={clearHistory}
                    className={`p-1.5 rounded hover:bg-red-100 text-red-500 transition-colors`}
                    title="Clear All"
                >
                    <Trash2 size={16} />
                </button>
            )}
            <button 
                onClick={onClose}
                className={`p-1.5 rounded ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
            >
                <X size={20} />
            </button>
         </div>
      </div>

      <div className="overflow-y-auto h-[calc(100vh-60px)] p-4 space-y-4">
        {history.length === 0 ? (
            <div className={`text-center py-10 ${mutedClass}`}>
                <p>No history yet.</p>
                <p className="text-xs mt-1">Generated values will appear here.</p>
            </div>
        ) : (
            history.map((item) => (
                <div key={item.id} className={`p-3 rounded-lg border ${darkMode ? 'bg-gray-750 border-gray-700' : 'bg-gray-50 border-gray-200'} group relative`}>
                    <div className="flex justify-between items-start mb-2">
                        <span className={`text-xs font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                            {item.toolName}
                        </span>
                        <span className={`text-xs ${mutedClass}`}>
                            {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                    </div>
                    <div className={`text-sm font-mono break-all line-clamp-3 mb-2 ${mutedClass}`}>
                        {item.value}
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                        <button
                            onClick={() => removeFromHistory(item.id)}
                            className={`p-1 rounded text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-900/20`}
                            title="Remove"
                        >
                            <Trash2 size={14} />
                        </button>
                        <button
                            onClick={() => copyToClipboard(item.value)}
                            className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white border shadow-sm hover:bg-gray-50'} transition-colors`}
                        >
                            <Copy size={12} /> Copy
                        </button>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
}
