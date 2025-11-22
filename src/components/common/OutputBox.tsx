import React from 'react';
import { Copy, Check } from 'lucide-react';

interface OutputBoxProps {
  darkMode: boolean;
  output: string;
  copied: boolean;
  onCopy: () => void;
  label?: string;
}

export function OutputBox({ darkMode, output, copied, onCopy, label = 'Output' }: OutputBoxProps) {
  const inputClass = darkMode 
    ? 'bg-gray-700 border-gray-600 text-white' 
    : 'bg-white border-gray-300 text-gray-900';
  
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {label}
        </label>
        <button
          onClick={onCopy}
          className={`flex items-center gap-2 px-3 py-1 ${
            darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
          } rounded-lg transition-colors text-sm`}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <textarea
        value={output}
        readOnly
        className={`w-full h-40 border rounded-lg p-3 font-mono text-sm ${inputClass}`}
      />
    </div>
  );
}