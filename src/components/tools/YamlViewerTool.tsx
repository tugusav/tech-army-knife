import React, { useState } from 'react';
import { OutputBox } from '../common/OutputBox';
import { TreeView } from '../common/TreeView';
import { useHistory } from '../../contexts/HistoryContext';

interface YamlViewerToolProps {
  darkMode: boolean;
  copied: boolean;
  copyToClipboard: (text: string) => void;
  setError: (error: string) => void;
}

export function YamlViewerTool({ darkMode, copied, copyToClipboard, setError }: YamlViewerToolProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [viewMode, setViewMode] = useState<'formatted' | 'tree' | 'json'>('formatted');
  const [parsedData, setParsedData] = useState<any>(null);
  const [hasProcessed, setHasProcessed] = useState(false);
  const { addToHistory } = useHistory();

  const inputClass = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';

  // Clear output when view mode changes
  const handleViewModeChange = (newMode: 'formatted' | 'tree' | 'json') => {
    setViewMode(newMode);
    setOutput('');
    setHasProcessed(false);
  };

  // Simple YAML parser (improved implementation)
  const parseYaml = (yamlStr: string): any => {
    try {
      const lines = yamlStr.split('\n');
      const result: any = {};
      const stack: { obj: any; indent: number }[] = [{ obj: result, indent: -1 }];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        // Skip empty lines and comments
        if (!trimmed || trimmed.startsWith('#')) continue;
        
        const indent = line.length - line.trimStart().length;
        
        // Pop stack until we find the right parent
        while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
          stack.pop();
        }
        
        const parent = stack[stack.length - 1].obj;
        
        if (trimmed.startsWith('-')) {
          // Array item
          const value = trimmed.substring(1).trim();
          
          // Find the last key in parent to make it an array
          const keys = Object.keys(parent);
          if (keys.length > 0) {
            const lastKey = keys[keys.length - 1];
            if (!Array.isArray(parent[lastKey])) {
              parent[lastKey] = [];
            }
            parent[lastKey].push(parseValue(value));
          }
        } else if (trimmed.includes(':')) {
          // Key-value pair
          const colonIndex = trimmed.indexOf(':');
          const key = trimmed.substring(0, colonIndex).trim();
          const value = trimmed.substring(colonIndex + 1).trim();
          
          if (!value || value === '|' || value === '>') {
            // Object or multiline
            parent[key] = {};
            stack.push({ obj: parent[key], indent });
          } else {
            parent[key] = parseValue(value);
          }
        }
      }
      
      return result;
    } catch (error) {
      throw new Error('Failed to parse YAML structure');
    }
  };

  const parseValue = (value: string): any => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 'null' || value === '~') return null;
    if (value.startsWith('"') && value.endsWith('"')) return value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1);
    if (value.startsWith('[') && value.endsWith(']')) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    
    // Try to parse as number
    const num = Number(value);
    if (!isNaN(num) && value !== '') return num;
    
    return value;
  };

  const formatYaml = (obj: any, indent = 0): string => {
    const spaces = '  '.repeat(indent);
    let result = '';
    
    if (obj === null) return 'null';
    if (typeof obj === 'boolean') return obj.toString();
    if (typeof obj === 'number') return obj.toString();
    if (typeof obj === 'string') return obj.includes('\n') ? `|\n${obj.split('\n').map(line => spaces + '  ' + line).join('\n')}` : obj;
    
    if (Array.isArray(obj)) {
      obj.forEach(item => {
        result += `${spaces}- ${formatYaml(item, indent + 1)}\n`;
      });
      return result.trim();
    }
    
    if (typeof obj === 'object') {
      Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          result += `${spaces}${key}:\n${formatYaml(value, indent + 1)}\n`;
        } else {
          result += `${spaces}${key}: ${formatYaml(value, indent + 1)}\n`;
        }
      });
      return result.trim();
    }
    
    return String(obj);
  };

  const processYaml = () => {
    setError('');
    if (!input.trim()) {
      setError('YAML input is required');
      return;
    }

    try {
      const parsed = parseYaml(input);
      setParsedData(parsed);
      let result = '';

      switch (viewMode) {
        case 'formatted':
          result = formatYaml(parsed);
          break;
        case 'tree':
          result = 'Tree view displayed below';
          break;
        case 'json':
          result = JSON.stringify(parsed, null, 2);
          break;
      }

      setOutput(result);
      setHasProcessed(true);
      addToHistory(result, `YAML Viewer (${viewMode})`);
    } catch (error) {
      setError(`Invalid YAML: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setParsedData(null);
      setOutput('');
      setHasProcessed(false);
    }
  };

  const sampleYaml = `name: John Doe
age: 30
address:
  street: 123 Main St
  city: New York
  zipCode: "10001"
hobbies:
  - reading
  - swimming
  - coding
isActive: true
balance: 1250.50
metadata: null
description: |
  This is a multiline
  description that spans
  multiple lines.`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Left Column - Input */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            YAML Input
          </h3>
          <button
            onClick={() => setInput(sampleYaml)}
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
          className={`w-full h-96 border rounded-lg p-3 font-mono text-sm resize-none ${inputClass}`}
          placeholder="Paste your YAML here..."
        />

        <div className="flex gap-2 flex-wrap justify-center">
          {[
            { id: 'formatted', label: 'Formatted' },
            { id: 'tree', label: 'Tree View' },
            { id: 'json', label: 'As JSON' }
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => handleViewModeChange(mode.id as any)}
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
          onClick={processYaml}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
        >
          View YAML
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

        <div className={`w-full h-96 border rounded-lg overflow-auto ${
          darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-300'
        }`}>
          {viewMode === 'tree' && parsedData && hasProcessed ? (
            <div className="p-3">
              <TreeView data={parsedData} darkMode={darkMode} />
            </div>
          ) : output && hasProcessed ? (
            <pre className={`p-3 whitespace-pre-wrap ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {output}
            </pre>
          ) : (
            <div className={`text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'} mt-40`}>
              {hasProcessed ? 'No output to display' : `Select ${viewMode} mode and click "View YAML" to see the result`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}