import React, { useState } from 'react';
import { OutputBox } from '../common/OutputBox';
import { TreeView } from '../common/TreeView';
import { useHistory } from '../../contexts/HistoryContext';

interface JsonViewerToolProps {
  darkMode: boolean;
  copied: boolean;
  copyToClipboard: (text: string) => void;
  setError: (error: string) => void;
}

export function JsonViewerTool({ darkMode, copied, copyToClipboard, setError }: JsonViewerToolProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [viewMode, setViewMode] = useState<'tree' | 'formatted' | 'minified'>('formatted');
  const [parsedData, setParsedData] = useState<any>(null);
  const { addToHistory } = useHistory();

  const inputClass = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';

  const processJson = () => {
    setError('');
    if (!input.trim()) {
      setError('JSON input is required');
      return;
    }

    try {
      const parsed = JSON.parse(input);
      setParsedData(parsed);
      let result = '';

      switch (viewMode) {
        case 'formatted':
          result = JSON.stringify(parsed, null, 2);
          break;
        case 'minified':
          result = JSON.stringify(parsed);
          break;
        case 'tree':
          result = 'Tree view displayed below';
          break;
      }

      setOutput(result);
      addToHistory(result, `JSON Viewer (${viewMode})`);
    } catch (error) {
      setError(`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setParsedData(null);
    }
  };

  const generateTreeView = (obj: any, indent = 0): string => {
    const spaces = '  '.repeat(indent);
    
    if (obj === null) return 'null';
    if (typeof obj === 'boolean') return obj.toString();
    if (typeof obj === 'number') return obj.toString();
    if (typeof obj === 'string') return `"${obj}"`;
    
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      let result = '[\n';
      obj.forEach((item, index) => {
        result += `${spaces}  [${index}] ${generateTreeView(item, indent + 1)}`;
        if (index < obj.length - 1) result += ',';
        result += '\n';
      });
      result += `${spaces}]`;
      return result;
    }
    
    if (typeof obj === 'object') {
      const keys = Object.keys(obj);
      if (keys.length === 0) return '{}';
      let result = '{\n';
      keys.forEach((key, index) => {
        result += `${spaces}  ${key}: ${generateTreeView(obj[key], indent + 1)}`;
        if (index < keys.length - 1) result += ',';
        result += '\n';
      });
      result += `${spaces}}`;
      return result;
    }
    
    return String(obj);
  };

  const sampleJson = `{
  "name": "John Doe",
  "age": 30,
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "zipCode": "10001"
  },
  "hobbies": ["reading", "swimming", "coding"],
  "isActive": true,
  "balance": 1250.50,
  "metadata": null
}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Left Column - Input */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            JSON Input
          </h3>
          <button
            onClick={() => setInput(sampleJson)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              darkMode ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-600 hover:bg-gray-100'
            }`}
          >
            Load Sample
          </button>
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className={`w-full h-80 border rounded-lg p-3 font-mono text-sm resize-none ${inputClass}`}
          placeholder="Paste your JSON here..."
        />

        <div className="flex gap-2 flex-wrap">
          {[
            { id: 'formatted', label: 'Formatted' },
            { id: 'minified', label: 'Minified' },
            { id: 'tree', label: 'Tree View' }
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id as any)}
              className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${
                viewMode === mode.id
                  ? 'bg-blue-600 text-white'
                  : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <button
          onClick={processJson}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
        >
          View JSON
        </button>
      </div>

      {/* Right Column - Output */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Output ({viewMode})
          </h3>
          {output && (
            <button
              onClick={() => copyToClipboard(output)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                copied
                  ? 'bg-green-600 text-white'
                  : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
        </div>

        <div className={`w-full h-80 border rounded-lg overflow-auto ${
          darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-300'
        }`}>
          {viewMode === 'tree' && parsedData ? (
            <div className="p-3">
              <TreeView data={parsedData} darkMode={darkMode} />
            </div>
          ) : output ? (
            <pre className={`p-3 whitespace-pre-wrap ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {output}
            </pre>
          ) : (
            <div className={`text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'} mt-32`}>
              Processed JSON will appear here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}