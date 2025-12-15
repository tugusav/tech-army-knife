import React, { useState } from 'react';
import { OutputBox } from '../common/OutputBox';
import { jsonToXml, xmlToJson } from '../../utils/xmlUtils';
import { useHistory } from '../../contexts/HistoryContext';

interface JsonXmlToolProps {
  darkMode: boolean;
  copied: boolean;
  copyToClipboard: (text: string) => void;
  setError: (error: string) => void;
}

export function JsonXmlTool({ darkMode, copied, copyToClipboard, setError }: JsonXmlToolProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'json-to-xml' | 'xml-to-json'>('json-to-xml');
  const { addToHistory } = useHistory();

  const inputClass = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';

  const handleConvert = () => {
    setError('');
    try {
      let result = '';
      if (mode === 'json-to-xml') {
        const parsed = JSON.parse(input);
        result = jsonToXml(parsed);
      } else {
        const json = xmlToJson(input);
        result = JSON.stringify(json, null, 2);
      }
      setOutput(result);
      addToHistory(result, mode === 'json-to-xml' ? 'JSON to XML' : 'XML to JSON');
    } catch (e: any) {
      setError('Invalid input format: ' + e.message);
      setOutput('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <button
          onClick={() => setMode('json-to-xml')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            mode === 'json-to-xml'
              ? `${darkMode ? 'bg-blue-600' : 'bg-blue-600'} text-white`
              : `${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`
          }`}
        >
          JSON → XML
        </button>
        <button
          onClick={() => setMode('xml-to-json')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            mode === 'xml-to-json'
              ? `${darkMode ? 'bg-blue-600' : 'bg-blue-600'} text-white`
              : `${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`
          }`}
        >
          XML → JSON
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
          placeholder={mode === 'json-to-xml' ? 'Enter JSON...' : 'Enter XML...'}
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
