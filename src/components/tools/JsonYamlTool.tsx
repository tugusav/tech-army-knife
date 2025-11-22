// src/components/tools/JsonYamlTool.tsx
import React, { useState } from 'react';
import { OutputBox } from '../common/OutputBox';
import { yamlToJson, jsonToYaml } from '../../utils/yamlUtils';

interface JsonYamlToolProps {
  darkMode: boolean;
  copied: boolean;
  copyToClipboard: (text: string) => void;
  setError: (error: string) => void;
}

export function JsonYamlTool({ darkMode, copied, copyToClipboard, setError }: JsonYamlToolProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'json-to-yaml' | 'yaml-to-json'>('json-to-yaml');

  const inputClass = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';

  const handleConvert = () => {
    setError('');
    try {
      if (mode === 'json-to-yaml') {
        const parsed = JSON.parse(input);
        setOutput(jsonToYaml(parsed));
      } else {
        const json = yamlToJson(input);
        setOutput(JSON.stringify(json, null, 2));
      }
    } catch (e: any) {
      setError('Invalid input format: ' + e.message);
      setOutput('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <button
          onClick={() => setMode('json-to-yaml')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            mode === 'json-to-yaml'
              ? `${darkMode ? 'bg-blue-600' : 'bg-blue-600'} text-white`
              : `${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`
          }`}
        >
          JSON → YAML
        </button>
        <button
          onClick={() => setMode('yaml-to-json')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            mode === 'yaml-to-json'
              ? `${darkMode ? 'bg-blue-600' : 'bg-blue-600'} text-white`
              : `${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`
          }`}
        >
          YAML → JSON
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
          placeholder={mode === 'json-to-yaml' ? 'Enter JSON...' : 'Enter YAML...'}
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