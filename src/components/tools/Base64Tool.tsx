import React, { useState } from 'react';
import { OutputBox } from '../common/OutputBox';
import { useHistory } from '../../contexts/HistoryContext';

interface Base64ToolProps {
  darkMode: boolean;
  copied: boolean;
  copyToClipboard: (text: string) => void;
  setError: (error: string) => void;
}

export function Base64Tool({ darkMode, copied, copyToClipboard, setError }: Base64ToolProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const { addToHistory } = useHistory();

  const inputClass = darkMode 
    ? 'bg-gray-700 border-gray-600 text-white' 
    : 'bg-white border-gray-300 text-gray-900';
  
  const buttonClass = darkMode 
    ? 'bg-blue-600 hover:bg-blue-700' 
    : 'bg-blue-600 hover:bg-blue-700';

  const handleConvert = () => {
    setError('');
    try {
      let result = '';
      if (mode === 'encode') {
        result = btoa(input);
      } else {
        result = atob(input);
      }
      setOutput(result);
      addToHistory(result, mode === 'encode' ? 'Base64 Encode' : 'Base64 Decode');
    } catch (e) {
      setError('Invalid input for conversion');
      setOutput('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <button
          onClick={() => setMode('encode')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            mode === 'encode' 
              ? `${buttonClass} text-white` 
              : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Encode
        </button>
        <button
          onClick={() => setMode('decode')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            mode === 'decode' 
              ? `${buttonClass} text-white` 
              : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Decode
        </button>
      </div>

      <div>
        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
          Input
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className={`w-full h-40 border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputClass}`}
          placeholder={mode === 'encode' ? 'Enter text to encode...' : 'Enter base64 to decode...'}
        />
      </div>

      <button 
        onClick={handleConvert} 
        className={`w-full ${buttonClass} text-white font-medium py-3 rounded-lg transition-colors`}
      >
        Convert
      </button>

      {output && (
        <OutputBox 
          darkMode={darkMode} 
          output={output} 
          copied={copied} 
          onCopy={() => copyToClipboard(output)} 
        />
      )}
    </div>
  );
}