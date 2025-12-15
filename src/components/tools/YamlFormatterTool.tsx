import React, { useState } from 'react';
import { OutputBox } from '../common/OutputBox';
import { yamlToJson, jsonToYaml } from '../../utils/yamlUtils';
import { useHistory } from '../../contexts/HistoryContext';

interface YamlFormatterToolProps {
  darkMode: boolean;
  copied: boolean;
  copyToClipboard: (text: string) => void;
  setError: (error: string) => void;
}

export function YamlFormatterTool({ darkMode, copied, copyToClipboard, setError }: YamlFormatterToolProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [indent, setIndent] = useState('2');
  const [useTab, setUseTab] = useState(false);
  const { addToHistory } = useHistory();

  const inputClass = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';

  const handleFormat = () => {
    setError('');
    try {
      const json = yamlToJson(input);
      const indentSpaces = parseInt(indent) || 2;
      const result = jsonToYaml(json, indentSpaces, useTab);
      setOutput(result);
      addToHistory(result, 'YAML Formatter');
    } catch (e: any) {
      setError('Invalid YAML: ' + e.message);
      setOutput('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
            Indentation
          </label>
          <select 
            value={indent} 
            onChange={(e) => setIndent(e.target.value)} 
            className={`w-full border rounded-lg p-3 ${inputClass}`}
          >
            <option value="2">2</option>
            <option value="4">4</option>
            <option value="8">8</option>
          </select>
        </div>
        <div>
          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
            Indent Type
          </label>
          <div className="flex gap-3 h-12 items-center">
            <button
              onClick={() => setUseTab(false)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                !useTab
                  ? `${darkMode ? 'bg-blue-600' : 'bg-blue-600'} text-white`
                  : `${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`
              }`}
            >
              Spaces
            </button>
            <button
              onClick={() => setUseTab(true)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                useTab
                  ? `${darkMode ? 'bg-blue-600' : 'bg-blue-600'} text-white`
                  : `${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`
              }`}
            >
              Tabs
            </button>
          </div>
        </div>
      </div>

      <div>
        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
          YAML Input
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className={`w-full h-64 border rounded-lg p-3 font-mono text-sm ${inputClass}`}
          placeholder="key: value&#10;array:&#10;  - item1&#10;  - item2"
        />
      </div>

      <button
        onClick={handleFormat}
        className={`w-full ${
          darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'
        } text-white font-medium py-3 rounded-lg transition-colors`}
      >
        Format YAML
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