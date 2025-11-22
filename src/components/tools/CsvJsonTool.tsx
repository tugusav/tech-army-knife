// src/components/tools/CsvJsonTool.tsx
import React, { useState } from 'react';
import { OutputBox } from '../common/OutputBox';
import { csvToJson, jsonToCsv } from '../../utils/csvUtils';

interface CsvJsonToolProps {
  darkMode: boolean;
  copied: boolean;
  copyToClipboard: (text: string) => void;
  setError: (error: string) => void;
}

export function CsvJsonTool({ darkMode, copied, copyToClipboard, setError }: CsvJsonToolProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'csv-to-json' | 'json-to-csv'>('csv-to-json');

  const inputClass = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';

  const handleConvert = () => {
    setError('');
    try {
      if (mode === 'csv-to-json') {
        setOutput(csvToJson(input));
      } else {
        setOutput(jsonToCsv(input));
      }
    } catch (e: any) {
      setError('Conversion error: ' + e.message);
      setOutput('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <button
          onClick={() => setMode('csv-to-json')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            mode === 'csv-to-json'
              ? `${darkMode ? 'bg-blue-600' : 'bg-blue-600'} text-white`
              : `${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`
          }`}
        >
          CSV → JSON
        </button>
        <button
          onClick={() => setMode('json-to-csv')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            mode === 'json-to-csv'
              ? `${darkMode ? 'bg-blue-600' : 'bg-blue-600'} text-white`
              : `${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`
          }`}
        >
          JSON → CSV
        </button>
      </div>

      <div>
        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
          Input
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className={`w-full h-64 border rounded-lg p-3 font-mono text-sm ${inputClass}`}
          placeholder={
            mode === 'csv-to-json'
              ? 'name,age,city\nJohn,30,NYC\nJane,25,LA'
              : '[{"name":"John","age":"30","city":"NYC"}]'
          }
        />
      </div>

      <button
        onClick={handleConvert}
        className={`w-full ${
          darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'
        } text-white font-medium py-3 rounded-lg transition-colors`}
      >
        Convert
      </button>

      {output && <OutputBox darkMode={darkMode} output={output} copied={copied} onCopy={() => copyToClipboard(output)} />}
    </div>
  );
}