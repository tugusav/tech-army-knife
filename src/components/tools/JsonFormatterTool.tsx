import React, { useState } from 'react';
import { OutputBox } from '../common/OutputBox';
import { useHistory } from '../../contexts/HistoryContext';

interface JsonFormatterToolProps {
  darkMode: boolean;
  copied: boolean;
  copyToClipboard: (text: string) => void;
  setError: (error: string) => void;
}

export function JsonFormatterTool({ darkMode, copied, copyToClipboard, setError }: JsonFormatterToolProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'format' | 'minify'>('format');
  const [indent, setIndent] = useState('2');
  const { addToHistory } = useHistory();

  const inputClass = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';

  const handleFormat = () => {
    setError('');
    try {
      const parsed = JSON.parse(input);
      let result = '';
      if (mode === 'format') {
        result = JSON.stringify(parsed, null, parseInt(indent) || 2);
      } else {
        result = JSON.stringify(parsed);
      }
      setOutput(result);
      addToHistory(result, mode === 'format' ? 'JSON Formatter' : 'JSON Minifier');
    } catch (e: any) {
      setError('Invalid JSON: ' + e.message);
      setOutput('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <button
          onClick={() => setMode('format')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            mode === 'format'
              ? `${darkMode ? 'bg-blue-600' : 'bg-blue-600'} text-white`
              : `${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`
          }`}
        >
          Format
        </button>
        <button
          onClick={() => setMode('minify')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            mode === 'minify'
              ? `${darkMode ? 'bg-blue-600' : 'bg-blue-600'} text-white`
              : `${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`
          }`}
        >
          Minify
        </button>
      </div>

      {mode === 'format' && (
        <div>
          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
            Indentation
          </label>
          <select 
            value={indent} 
            onChange={(e) => setIndent(e.target.value)} 
            className={`w-32 border rounded-lg p-2 ${inputClass}`}
          >
            <option value="0">0</option>
            <option value="2">2</option>
            <option value="4">4</option>
            <option value="8">8</option>
          </select>
        </div>
      )}

      <div>
        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
          JSON Input
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className={`w-full h-64 border rounded-lg p-3 font-mono text-sm ${inputClass}`}
          placeholder='{"key":"value","array":[1,2,3]}'
        />
      </div>

      <button
        onClick={handleFormat}
        className={`w-full ${
          darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'
        } text-white font-medium py-3 rounded-lg transition-colors`}
      >
        {mode === 'format' ? 'Format JSON' : 'Minify JSON'}
      </button>

      {output && (
        <OutputBox 
          darkMode={darkMode} 
          output={output} 
          copied={copied} 
          onCopy={() => copyToClipboard(output)}
          label={mode === 'format' ? 'Formatted Output' : 'Minified Output'}
        />
      )}
    </div>
  );
}